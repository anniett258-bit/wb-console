import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByUser } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'WB-1024';
  const limit = Number(searchParams.get('limit') || 20);
  const orders = await getOrdersByUser(userId, limit);
  return NextResponse.json({ orders });
}
