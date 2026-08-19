import { NextRequest, NextResponse } from 'next/server';
import { getUser, ensureUser } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'WB-1024';
  const user = (await getUser(userId)) || (await ensureUser(userId));
  return NextResponse.json({ user });
}
