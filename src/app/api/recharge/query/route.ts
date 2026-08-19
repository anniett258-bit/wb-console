import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/lib/store';
import { queryOrder } from '@/lib/wechat-pay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/recharge/query?orderId=xxx
 * return: { orderId, status, amount, points, paidAt, mock }
 *
 * 沙箱模式：返回 status=pending 等待 mock-pay 触发
 * 真实模式：主动调微信 query API 查询状态，成功时写库更新
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 已支付直接返回
    if (order.status === 'paid') {
      return NextResponse.json({
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        points: order.points,
        paidAt: order.paidAt,
        mock: false,
      });
    }

    // 过期检查
    if (new Date(order.expiredAt).getTime() < Date.now() && order.status === 'pending') {
      await updateOrder(order.id, { status: 'closed' });
      return NextResponse.json({
        orderId: order.id,
        status: 'closed',
        amount: order.amount,
        points: order.points,
        mock: false,
      });
    }

    // 真实模式主动查询
    if (order.codeUrl && !order.codeUrl.includes('mock') && order.method === 'wechat') {
      try {
        const wx = await queryOrder(order.outTradeNo);
        if (wx.tradeState === 'SUCCESS' && wx.transactionId) {
          await updateOrder(order.id, {
            status: 'paid',
            transactionId: wx.transactionId,
            paidAt: wx.paidAt || new Date().toISOString(),
          });
          return NextResponse.json({
            orderId: order.id,
            status: 'paid',
            amount: order.amount,
            points: order.points,
            paidAt: wx.paidAt,
            mock: false,
          });
        }
      } catch (e) {
        // 微信查询失败不报错（让前端继续轮询）
        console.error('WeChat query error:', e);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      points: order.points,
      mock: order.codeUrl?.includes('mock') || false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
