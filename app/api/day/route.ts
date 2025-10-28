import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function ymd(year:number, month:number, day:number) {
  const mm = String(month).padStart(2,'0');
  const dd = String(day).padStart(2,'0');
  return `${year}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const y = Number(searchParams.get('year'));
  const m = Number(searchParams.get('month'));
  const d = Number(searchParams.get('day'));
  const technikerId = String(searchParams.get('technikerId'));
  const client = supabaseServer();

  if (!y || !m || !d || !technikerId) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  const ymdStr = ymd(y,m,d);

  // 1) Ensure planungsmonat exists (create if missing)
  let pm = await client.from('planungsmonat')
    .select('*').eq('jahr', y).eq('monat', m).maybeSingle();
  if (pm.error && pm.error.code !== 'PGRST116') {
    return NextResponse.json({ error: pm.error.message }, { status: 500 });
  }
  if (!pm.data) {
    const inserted = await client.from('planungsmonat').insert({
      jahr: y, monat: m, freitag_nachzuegler: true, feierabend_global: '17:00'
    }).select('*').single();
    if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
    pm = inserted;
  }

// 2) Ensure tag (day) exists (create if missing) — SCOPED TO THIS PLANUNGSMONAT
let tag = await client
  .from('tag')
  .select('*')
  .eq('datum', ymdStr)
  .eq('planungsmonat_id', pm.data.id)   // <— wichtig
  .maybeSingle();

if (tag.error && tag.error.code !== 'PGRST116') {
  return NextResponse.json({ error: tag.error.message }, { status: 500 });
}
if (!tag.data) {
  const inserted = await client.from('tag').insert({
    planungsmonat_id: pm.data.id,
    datum: ymdStr
  }).select('*').single();
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  tag = inserted;
}

  const tagId = tag.data.id as string;
  const feierabend = (tag.data.feierabend_uebersteuerung || pm.data.feierabend_global) as string;

  // 3) Dropdown master data
  const [aufg, obj, orte, techs] = await Promise.all([
    client.from('aufgabe').select('id, code').order('code', { ascending: true }),
    client.from('objekt').select('id, code').order('code', { ascending: true }),
    client.from('ort').select('id, plz, ort').limit(5000),
    client.from('techniker').select('id, name').eq('aktiv', true).order('name')
  ]);
  for (const r of [aufg, obj, orte, techs]) {
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
  }

  // 4) Status for this techniker/day (may be empty -> default 'verfuegbar')
  const st = await client.from('tag_status').select('status, hinweis')
    .eq('tag_id', tagId).eq('techniker_id', technikerId).maybeSingle();
  if (st.error && st.error.code !== 'PGRST116') return NextResponse.json({ error: st.error.message }, { status: 500 });
  const status = st.data?.status ?? 'verfuegbar';

  // 5) Jobs for this techniker/day
  const jobs = await client.from('job')
    .select('id, meldungsnummer, von, bis, dauer_min, aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung')
    .eq('tag_id', tagId).eq('techniker_id', technikerId).order('von');
  if (jobs.error) return NextResponse.json({ error: jobs.error.message }, { status: 500 });

  return NextResponse.json({
    tagId,
    feierabend,
    status,
    statusHinweis: st.data?.hinweis ?? null,
    closed: (st.data?.hinweis ?? null) === 'closed',
    aufgaben: aufg.data,
    objekte: obj.data,
    orte: orte.data,
    techniker: techs.data,
    jobs: jobs.data
  });
}