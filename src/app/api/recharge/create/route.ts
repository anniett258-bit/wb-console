import { NextRequest, NextResponse } from 'next/server';
import { getPlanById, calcPoints } from '@/lib/plans';
import { createOrder, ensureUser, generateOrderId } from '@/lib/store';
import { createNativeOrder, isMockMode } from '@/lib/wechat-pay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/recharge/create
 * body: { planId, method, userId? }
 * return: { orderId, codeUrl, mock, amount, points, expiredAt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      planId?: string;
      method?: 'wechat' | 'h5' | 'alipay';
      userId?: string;
    };

    const planId = body.planId;
    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: 'Invalid planId' }, { status: 400 });

    const method = body.method || 'wechat';
    if (!['wechat', 'h5', 'alipay'].includes(method)) {
      return NextResponse.json({ error: 'method only support wechat/h5/alipay' }, { status: 400 });
    }

    const userId = body.userId || 'WB-1024';
    await ensureUser(userId);

    const outTradeNo = generateOrderId();
    const points = calcPoints(plan);
    const amountFen = plan.amount * 100;

    // 微信：method=wechat 走 native (PC扫码), method=h5 走 H5 (手机浏览器)
    // 支付宝本期先返回 placeholder
    let codeUrl = '';
    let mock = false;
    let payMode: 'native' | 'h5' | 'jsapi' | 'alipay' = 'native';
    if (method === 'wechat') {
      const r = await createNativeOrder(
        {
          outTradeNo,
          description: `wb-console 充值 ${plan.amount}元`,
          amountFen,
          attach: `${userId}|${points}`,
        },
        'native'
      );
      codeUrl = r.codeUrl;
      mock = r.mock || false;
      payMode = 'native';
    } else if (method === 'h5') {
      const r = await createNativeOrder(
        {
          outTradeNo,
          description: `wb-console 充值 ${plan.amount}元 (H5)`,
          amountFen,
          attach: `${userId}|${points}|h5`,
        },
        'h5'
      );
      codeUrl = r.codeUrl;
      mock = r.mock || false;
      payMode = 'h5';
    } else {
      codeUrl = `https://qr.alipay.com/mock?outTradeNo=${outTradeNo}`;
      mock = true;
    }

    const order = await createOrder({
      id: outTradeNo,
      outTradeNo,
      userId,
      amount: plan.amount,
      points,
      method,
      payMode,
      status: 'pending',
      codeUrl,
    });

    return NextResponse.json({
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      codeUrl: order.codeUrl,
      payMode,
      mock,
      amount: plan.amount,
      points,
      expiredAt: order.expiredAt,
      method,
      isMockMode: isMockMode(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
