import { NextRequest, NextResponse } from 'next/server';
import { addPoints, getOrderById, updateOrder } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/recharge/mock-pay
 * 沙箱模式专用：模拟"已扫码支付成功"，方便用户测试
 * 生产环境禁用（env.NODE_ENV === 'production' && WECHAT_MCH_ID 已配置 时返回 403）
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { orderId?: string };
    if (!body.orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    // 生产环境 + 真实微信已配置时拒绝
    if (process.env.NODE_ENV === 'production' && process.env.WECHAT_MCH_ID) {
      return NextResponse.json({ error: 'mock-pay disabled in production' }, { status: 403 });
    }

    const order = await getOrderById(body.orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'paid') {
      return NextResponse.json({ ok: true, message: 'already paid', orderId: order.id });
    }

    await updateOrder(order.id, {
      status: 'paid',
      transactionId: `MOCK-${Date.now()}`,
      paidAt: new Date().toISOString(),
    });
    await addPoints(order.userId, order.points, `mock-recharge:${order.id}`);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      points: order.points,
      paidAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
