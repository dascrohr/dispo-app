import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'; // sicherheitshalber
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}