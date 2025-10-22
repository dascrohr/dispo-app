import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const client = supabaseServer();
  const { tagId, technikerId, status, hinweis } = await req.json();
  if (!tagId || !technikerId || !status) return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });

  // upsert via unique(tag_id, techniker_id)
  const up = await client.from('tag_status').upsert(
    { tag_id: tagId, techniker_id: technikerId, status, hinweis },
    { onConflict: 'tag_id,techniker_id' }
  );
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}