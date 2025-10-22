import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Always serve fresh responses (no caching)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const client = supabaseServer();
    const { tagId, technikerId, status, hinweis } = await req.json();

    if (!tagId || !technikerId || !status) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    // Upsert the status record (unique by tag_id + techniker_id)
    const up = await client
      .from('tag_status')
      .upsert(
        {
          tag_id: tagId,
          techniker_id: technikerId,
          status,
          hinweis: (hinweis ?? null) === '' ? null : (hinweis ?? null),
        },
        { onConflict: 'tag_id,techniker_id' }
      )
      .select('*')
      .single();

    if (up.error) {
      console.error('Supabase upsert error:', up.error);
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }

    // Return the updated/inserted record
    return NextResponse.json({ ok: true, data: up.data });
  } catch (err: any) {
    console.error('Status route error:', err);
    return NextResponse.json(
      { error: err.message || 'Unbekannter Fehler in /api/status' },
      { status: 500 }
    );
  }
}