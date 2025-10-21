
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

function minutesBetween(a: string, b: string) {
  const [ah, am, as='0'] = a.split(':').map(Number);
  const [bh, bm, bs='0'] = b.split(':').map(Number);
  return (bh*60+bm) - (ah*60+am);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') || new Date().getFullYear());
  const month = Number(searchParams.get('month') || (new Date().getMonth()+1)); // 1-12
  const client = supabaseServer();

  const techRes = await client.from('techniker').select('id,name,aktiv').eq('aktiv', true).order('name', { ascending: true });
  if (techRes.error) return NextResponse.json({ error: techRes.error.message }, { status: 500 });
  const technicians = techRes.data || [];

  const pmRes = await client.from('planungsmonat').select('*').eq('jahr', year).eq('monat', month).maybeSingle();
  if (pmRes.error && pmRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: pmRes.error.message }, { status: 500 });
  }
  const pm: any = pmRes.data;
  const feierabendGlobal: string = pm?.feierabend_global || '17:00:00';
  const freitagNachzuegler: boolean = pm?.freitag_nachzuegler ?? true;

  const start = new Date(Date.UTC(year, month-1, 1)).toISOString().slice(0,10);
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0,10);
  const tagRes = await client.from('tag').select('id,datum,feierabend_uebersteuerung').gte('datum', start).lte('datum', end);
  if (tagRes.error) return NextResponse.json({ error: tagRes.error.message }, { status: 500 });
  const tage: any[] = tagRes.data || [];

  const tagByDate: Record<string, any> = {};
  for (const t of tage) tagByDate[t.datum] = t;

  const dayMeta: Record<string, { feierabendMin:number, isFriday:boolean, tagId?:string }> = {};
  for (let d=1; d<=31; d++) {
    const dt = new Date(Date.UTC(year, month-1, d));
    if (dt.getUTCMonth() !== month-1) continue;
    const ymd = dt.toISOString().slice(0,10);
    const tag = tagByDate[ymd];
    const feierabend = tag?.feierabend_uebersteuerung || feierabendGlobal; // 'HH:MM:SS'
    const feierabendMin = minutesBetween('08:00:00', feierabend);
    const isFriday = dt.getUTCDay() === 5 && !!freitagNachzuegler;
    dayMeta[ymd] = { feierabendMin, isFriday, tagId: tag?.id };
  }

  let statusRes: any = { data: [] };
  if (tage.length) {
    const tagIds = tage.map(t => t.id);
    statusRes = await client.from('tag_status').select('tag_id,techniker_id,status').in('tag_id', tagIds);
    if (statusRes.error) return NextResponse.json({ error: statusRes.error.message }, { status: 500 });
  }
  const statusIndex = new Map<string, string>();
  const tagIdToDate = new Map<string, string>();
  for (const t of tage) tagIdToDate.set(t.id, t.datum);
  for (const s of statusRes.data as any[]) {
    const ymd = tagIdToDate.get(s.tag_id as string);
    if (!ymd) continue;
    statusIndex.set(`${s.techniker_id}|${ymd}`, s.status as string);
  }

  let jobsRes: any = { data: [] };
  if (tage.length) {
    jobsRes = await client.from('job').select('tag_id, techniker_id, von, bis, dauer_min');
    if (jobsRes.error) return NextResponse.json({ error: jobsRes.error.message }, { status: 500 });
  }

  const totals: Record<string, number> = {};
  for (const j of jobsRes.data as any[]) {
    const ymd = tagIdToDate.get(j.tag_id as string);
    if (!ymd) continue;
    const key = `${j.techniker_id}|${ymd}`;
    const add = typeof j.dauer_min === 'number' ? j.dauer_min : minutesBetween(j.von as string, j.bis as string);
    totals[key] = (totals[key] || 0) + add;
  }

  const resp: any = { year, month, technicians: technicians.map(t => ({ id: t.id, name: t.name })), data: {} };
  for (const t of technicians) {
    resp.data[t.id] = {};
    for (let d=1; d<=31; d++) {
      const dt = new Date(Date.UTC(year, month-1, d));
      if (dt.getUTCMonth() !== month-1) continue;
      const ymd = dt.toISOString().slice(0,10);
      const meta = dayMeta[ymd];
      const key = `${t.id}|${ymd}`;
      const totalMin = totals[key] || 0;
      const st = (statusIndex.get(key) as any) || 'verfuegbar';
      resp.data[t.id][ymd] = {
        status: st,
        totalMin,
        feierabendMin: meta?.feierabendMin ?? 9*60,
        isFriday: meta?.isFriday ?? false,
      };
    }
  }

  return NextResponse.json(resp);
}
