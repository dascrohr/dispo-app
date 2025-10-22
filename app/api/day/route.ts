import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const y = Number(searchParams.get('year'));
  const m = Number(searchParams.get('month'));
  const d = Number(searchParams.get('day'));
  const technikerId = String(searchParams.get('technikerId'));
  const client = supabaseServer();

  // Planungsmonat + Tag holen
  const pm = await client.from('planungsmonat')
    .select('*').eq('jahr', y).eq('monat', m).maybeSingle();
  if (pm.error) return NextResponse.json({ error: pm.error.message }, { status: 500 });
  if (!pm.data) return NextResponse.json({ error: 'Planungsmonat fehlt' }, { status: 404 });

  const ymd = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const tag = await client.from('tag').select('*').eq('datum', ymd).maybeSingle();
  if (tag.error) return NextResponse.json({ error: tag.error.message }, { status: 500 });

  const tagId = tag.data?.id;
  const feierabend = (tag.data?.feierabend_uebersteuerung || pm.data.feierabend_global) as string;

  // Stammdaten für Dropdowns
  const [aufg, obj, orte, techs] = await Promise.all([
    client.from('aufgabe').select('id, code').order('code', { ascending: true }),
    client.from('objekt').select('id, code').order('code', { ascending: true }),
    client.from('ort').select('id, plz, ort').limit(5000),
    client.from('techniker').select('id, name').eq('aktiv', true).order('name')
  ]);
  for (const r of [aufg, obj, orte, techs]) if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });

  // Status für den Tag
  let status: string | null = null;
  if (tagId) {
    const st = await client.from('tag_status').select('status')
      .eq('tag_id', tagId).eq('techniker_id', technikerId).maybeSingle();
    if (st.error && st.error.code !== 'PGRST116') return NextResponse.json({ error: st.error.message }, { status: 500 });
    status = st.data?.status ?? 'verfuegbar';
  }

  // Jobs für den Tag/Techniker
  const jobs = tagId ? await client.from('job')
    .select('id, meldungsnummer, von, bis, dauer_min, aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung')
    .eq('tag_id', tagId).eq('techniker_id', technikerId).order('von') : { data: [] as any[] };

  if ('error' in jobs && jobs.error) return NextResponse.json({ error: jobs.error.message }, { status: 500 });

  return NextResponse.json({
    tagId, feierabend, status,
    aufgaben: aufg.data, objekte: obj.data, orte: orte.data, techniker: techs.data,
    jobs: jobs.data
  });
}