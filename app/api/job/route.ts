import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

function round15(mins: number) { return Math.round(mins / 15) * 15; }
function minutesBetween(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh*60+bm) - (ah*60+am);
}

export async function POST(req: Request) {
  const client = supabaseServer();
  const body = await req.json();
  const { tagId, technikerId, meldungsnummer, von, bis,
          aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung } = body;

  if (!tagId || !technikerId || !von || !bis) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
  }
  const dauer = round15(minutesBetween(von, bis));
  const ins = await client.from('job').insert({
    tag_id: tagId, techniker_id: technikerId, meldungsnummer,
    von, bis, dauer_min: dauer, aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung
  }).select('id').single();

  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: ins.data.id });
}

export async function DELETE(req: Request) {
  const client = supabaseServer();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });
  const del = await client.from('job').delete().eq('id', id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const client = supabaseServer();
  const body = await req.json();
  const { id, meldungsnummer, von, bis,
          aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung } = body;
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });

  const updates: any = { meldungsnummer, aufgabe_id, objekt_id, ort_id, plz, helfer_id, bemerkung };
  if (von && bis) {
    updates.von = von; updates.bis = bis;
    updates.dauer_min = round15(minutesBetween(von, bis));
  }
  const up = await client.from('job').update(updates).eq('id', id);
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}