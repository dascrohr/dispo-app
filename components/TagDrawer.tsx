import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  const day = url.searchParams.get('day');
  const technikerId = url.searchParams.get('technikerId');

  if (!year || !month || !day || !technikerId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const ymdStr = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

  // Ensure planungsmonat exists
  let pm = await client.from('planungsmonat')
    .select('*').eq('jahr', y).eq('monat', m).maybeSingle();
  if (pm.error && pm.error.code !== 'PGRST116') {
    return NextResponse.json({ error: pm.error.message }, { status: 500 });
  }
  if (!pm.data) {
    const insPm = await client.from('planungsmonat').insert({
      jahr: y, monat: m, freitag_nachzuegler: true, feierabend_global: '17:00'
    }).select('*').single();
    if (insPm.error) return NextResponse.json({ error: insPm.error.message }, { status: 500 });
    pm = insPm;
  }
  const planungsmonatId = pm.data.id;

  // Ensure tag exists for this date
  let tag = await client.from('tag').select('*').eq('datum', ymdStr).maybeSingle();
  if (tag.error && tag.error.code !== 'PGRST116') {
    return NextResponse.json({ error: tag.error.message }, { status: 500 });
  }
  if (!tag.data) {
    const insTag = await client.from('tag').insert({
      planungsmonat_id: planungsmonatId,
      datum: ymdStr
    }).select('*').single();
    if (insTag.error) return NextResponse.json({ error: insTag.error.message }, { status: 500 });
    tag = insTag;
  }

  const tagId = tag.data.id;

  // Fetch jobs for this techniker and tag
  const jobs = await client.from('job').select('*').eq('techniker_id', technikerId).eq('tag_id', tagId);

  // Fetch additional data for dropdowns
  const aufgaben = await client.from('aufgabe').select('*');
  const objekte = await client.from('objekt').select('*');
  const orte = await client.from('ort').select('*');
  const techniker = await client.from('techniker').select('*');

  // Fetch status for this techniker and tag
  const statusRes = await client.from('status').select('*').eq('techniker_id', technikerId).eq('tag_id', tagId).maybeSingle();

  return NextResponse.json({
    tagId,
    status: statusRes.data?.status,
    jobs: jobs.data,
    aufgaben: aufgaben.data,
    objekte: objekte.data,
    orte: orte.data,
    techniker: techniker.data,
  });
}