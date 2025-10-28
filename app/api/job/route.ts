import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// always serve fresh (no cache)
export const dynamic = 'force-dynamic';

// Helper to normalize HH:MM to HH:MM:SS
function normalizeTime(t?: string) {
  if (!t) return t;
  return t.length === 5 ? `${t}:00` : t;
}

// Helper to compute duration in minutes
function minutesBetween(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

// Round minutes to nearest 15
function round15(mins: number) {
  return Math.round(mins / 15) * 15;
}

// POST – create new job
export async function POST(req: Request) {
  const client = supabaseServer();
  const body = await req.json();
  const { tagId, technikerId, meldungsnummer, von, bis,
          aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung } = body;

  console.log('[JOB POST]', { tagId, technikerId, von, bis, meldungsnummer });

  const missing: string[] = [];
  if (!tagId) missing.push('tagId');
  if (!technikerId) missing.push('technikerId');
  if (!von) missing.push('von');
  if (!bis) missing.push('bis');
  if (missing.length) {
    return NextResponse.json(
      { error: `Pflichtfelder fehlen: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const vVon = normalizeTime(von);
  const vBis = normalizeTime(bis);
  const dauer = round15(minutesBetween(vVon!, vBis!));

  const ins = await client
    .from('job')
    .insert({
      tag_id: tagId,
      techniker_id: technikerId,
      meldungsnummer,
      von: vVon,
      bis: vBis,
      dauer_min: dauer,
      aufgabe_id,
      objekt_id,
      ort_id,
      plz,
      helfer_id,
      bemerkung
    })
    .select('*')
    .single();

  if (ins.error) {
    console.error('Error inserting job:', ins.error);
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job: ins.data });
}

// PATCH – update job
export async function PATCH(req: Request) {
  const client = supabaseServer();
  const body = await req.json();
  const { id, meldungsnummer, von, bis,
          aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung } = body;

  if (!id) {
    return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  }

  const updates: any = { meldungsnummer, aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung };
  if (von && bis) {
    const vVon = normalizeTime(von);
    const vBis = normalizeTime(bis);
    updates.von = vVon;
    updates.bis = vBis;
    updates.dauer_min = round15(minutesBetween(vVon!, vBis!));
  }

  const up = await client
    .from('job')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (up.error) {
    console.error('Error updating job:', up.error);
    return NextResponse.json({ error: up.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job: up.data });
}

// DELETE – remove job
export async function DELETE(req: Request) {
  const client = supabaseServer();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  }

  const del = await client.from('job').delete().eq('id', id);
  if (del.error) {
    console.error('Error deleting job:', del.error);
    return NextResponse.json({ error: del.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}