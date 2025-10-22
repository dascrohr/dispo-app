import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function minutesBetween(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}
function ymd(year:number, month:number, day:number) {
  const mm = String(month).padStart(2,'0');
  const dd = String(day).padStart(2,'0');
  return `${year}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') || new Date().getFullYear());
  const month = Number(searchParams.get('month') || (new Date().getMonth()+1)); // 1-12
  const client = supabaseServer();

  // Techniker
  const techRes = await client.from('techniker').select('id,name,aktiv').eq('aktiv', true).order('name', { ascending: true });
  if (techRes.error) return NextResponse.json({ error: techRes.error.message }, { status: 500 });
  const technicians = techRes.data || [];

  // Planungsmonat
  const pmRes = await client.from('planungsmonat').select('*').eq('jahr', year).eq('monat', month).maybeSingle();
  if (pmRes.error && pmRes.error.code !== 'PGRST116') return NextResponse.json({ error: pmRes.error.message }, { status: 500 });
  const pm = pmRes.data;
  const feierabendGlobal = pm?.feierabend_global || '17:00:00';
  const freitagNachzuegler = pm?.freitag_nachzuegler ?? true;

  // Tage des Monats (String-Range, TZ-sicher)
  const dim = new Date(year, month, 0).getDate();
  const start = ymd(year, month, 1);
  const end = ymd(year, month, dim);
  const tagRes = await client.from('tag').select('id,datum,feierabend_uebersteuerung').gte('datum', start).lte('datum', end);
  if (tagRes.error) return NextResponse.json({ error: tagRes.error.message }, { status: 500 });
  const tage = tagRes.data || [];

  // Indizes
  const tagByDate: Record<string, any> = {};
  for (const t of tage) tagByDate[t.datum] = t;

  const dayMeta: Record<string, { feierabendMin:number; isFriday:boolean; tagId?:string }> = {};
  for (let d=1; d<=dim; d++) {
    const ymdStr = ymd(year, month, d);
    const jsDate = new Date(year, month-1, d);         // nur für Wochentag
    const tag = tagByDate[ymdStr];
    const feierabend = tag?.feierabend_uebersteuerung || feierabendGlobal;
    const feierabendMin = minutesBetween('08:00:00', feierabend);
    const isFriday = jsDate.getDay() === 5 && !!freitagNachzuegler;
    dayMeta[ymdStr] = { feierabendMin, isFriday, tagId: tag?.id };
  }

  // Status-Index (techniker|ymd) -> {status, hinweis}
  const statusIndex = new Map<string, {status:string; hinweis:string|null}>();
  if (tage.length) {
    const statusRes = await client.from('tag_status')
      .select('tag_id,techniker_id,status,hinweis')
      .in('tag_id', tage.map(t=>t.id));
    if (statusRes.error) return NextResponse.json({ error: statusRes.error.message }, { status: 500 });
    const tagIdToDate = new Map<string, string>(tage.map(t => [t.id, t.datum]));
    for (const s of statusRes.data as any[]) {
      const dateStr = tagIdToDate.get(s.tag_id);
      if (!dateStr) continue;
      statusIndex.set(`${s.techniker_id}|${dateStr}`, { status: s.status, hinweis: s.hinweis ?? null });
    }
  }

  // Jobs aggregieren (nur Tage dieses Monats)
  const totals: Record<string, number> = {};
  if (tage.length) {
    const tagIds = tage.map(t => t.id);
    const jobsRes = await client
      .from('job')
      .select('tag_id, techniker_id, von, bis, dauer_min')
      .in('tag_id', tagIds);
    if (jobsRes.error) return NextResponse.json({ error: jobsRes.error.message }, { status: 500 });
    const tagIdToDate = new Map<string, string>(tage.map(t => [t.id, t.datum]));
    for (const j of jobsRes.data as any[]) {
      const dateStr = tagIdToDate.get(j.tag_id);
      if (!dateStr) continue;
      const key = `${j.techniker_id}|${dateStr}`;
      const add = typeof j.dauer_min === 'number' ? j.dauer_min : minutesBetween(j.von, j.bis);
      totals[key] = (totals[key] || 0) + add;
    }
  }

  // Antwort
  const resp: any = { year, month, technicians: technicians.map(t => ({ id: t.id, name: t.name })), data: {} };
  for (const t of technicians) {
    resp.data[t.id] = {};
    for (let d=1; d<=dim; d++) {
      const ymdStr = ymd(year, month, d);
      const meta = dayMeta[ymdStr];
      const key = `${t.id}|${ymdStr}`;
      const totalMin = totals[key] || 0;
      const stObj = statusIndex.get(key);
      const st = stObj?.status || 'verfuegbar';
      const closed = stObj?.hinweis === 'closed';
      resp.data[t.id][ymdStr] = {
        status: st,
        totalMin,
        feierabendMin: meta?.feierabendMin ?? 9*60,
        isFriday: meta?.isFriday ?? false,
        closed
      };
    }
  }

  return NextResponse.json(resp);
}