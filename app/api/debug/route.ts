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
  const technikerId = String(searchParams.get('technikerId') || '');
  const client = supabaseServer();

  if (!y || !m || !d || !technikerId) {
    return NextResponse.json({ error: 'Missing params (year, month, day, technikerId)' }, { status: 400 });
  }
  const ymdStr = ymd(y,m,d);

  // Tage im Monat
  const tags = await client.from('tag').select('id,datum,planungsmonat_id').gte('datum', ymd(y,m,1)).lte('datum', ymd(y,m,new Date(y,m,0).getDate()));
  if (tags.error) return NextResponse.json({ error: tags.error.message }, { status: 500 });
  const forDay = (tags.data || []).find(t => t.datum === ymdStr);

  // Status für diesen Tag+Techniker
  let statusRow: any = null;
  if (forDay) {
    const st = await client.from('tag_status').select('tag_id,techniker_id,status,hinweis,updated_at').eq('tag_id', forDay.id).eq('techniker_id', technikerId).maybeSingle();
    if (!st.error) statusRow = st.data;
  }

  // Jobs an dem Tag
  let jobs: any[] = [];
  if (forDay) {
    const jr = await client.from('job').select('id, techniker_id, von, bis, dauer_min, meldungsnummer').eq('tag_id', forDay.id);
    if (!jr.error) jobs = jr.data || [];
  }

  return NextResponse.json({
    query: { y, m, d, technikerId, ymdStr },
    tagForDay: forDay || null,
    statusRow: statusRow || null,
    jobs
  });
}