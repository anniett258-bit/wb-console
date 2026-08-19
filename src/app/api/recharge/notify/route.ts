import { NextRequest, NextResponse } from 'next/server';
import { addPoints, getOrderById, updateOrder } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/recharge/notify
 * 微信支付 V3 异步回调
 * 验签 + AES-256-GCM 解密 + 幂等更新
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const timestamp = req.headers.get('Wechatpay-Timestamp') || '';
    const nonce = req.headers.get('Wechatpay-Nonce') || '';
    const signature = req.headers.get('Wechatpay-Signature') || '';
    const serial = req.headers.get('Wechatpay-Serial') || '';

    if (!timestamp || !nonce || !signature) {
      return NextResponse.json({ code: 'FAIL', message: 'missing headers' }, { status: 400 });
    }

    // 解析 body 拿 resource
    const body = JSON.parse(raw) as {
      resource?: { ciphertext: string; associated_data: string; nonce: string };
    };
    if (!body.resource) {
      return NextResponse.json({ code: 'FAIL', message: 'no resource' }, { status: 400 });
    }

    // 验签 + 解密（生产环境需要；沙箱模式直接 mock 验签）
    let decrypted: { out_trade_no: string; transaction_id: string; success_time?: string; attach?: string };
    if (process.env.WECHAT_PLATFORM_CERT && process.env.WECHAT_API_V3_KEY) {
      // 真实验签解密（用 wechatpay-node-v3 或自实现）
      const { verifyAndDecryptNotify } = await import('@/lib/wechat-pay');
      decrypted = verifyAndDecryptNotify(
        timestamp,
        nonce,
        raw,
        signature,
        body.resource.ciphertext,
        body.resource.associated_data,
        body.resource.nonce
      ) as typeof decrypted;
    } else {
      // 沙箱跳过验签
      decrypted = JSON.parse(Buffer.from(body.resource.ciphertext, 'base64').toString('utf8'));
    }

    if (!decrypted.out_trade_no || !decrypted.transaction_id) {
      return NextResponse.json({ code: 'FAIL', message: 'invalid payload' }, { status: 400 });
    }

    // 幂等：查订单
    const order = await getOrderById(decrypted.out_trade_no);
    if (!order) {
      return NextResponse.json({ code: 'FAIL', message: 'order not found' }, { status: 404 });
    }
    if (order.status === 'paid') {
      return NextResponse.json({ code: 'SUCCESS', message: 'already paid' });
    }

    // 更新订单
    await updateOrder(order.id, {
      status: 'paid',
      transactionId: decrypted.transaction_id,
      paidAt: decrypted.success_time || new Date().toISOString(),
    });

    // 加积分
    const [userId] = (decrypted.attach || '').split('|');
    if (userId && order.points > 0) {
      await addPoints(userId, order.points, `recharge:${order.id}`);
    }

    return NextResponse.json({ code: 'SUCCESS', message: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('notify error:', msg);
    return NextResponse.json({ code: 'FAIL', message: msg }, { status: 500 });
  }
}
