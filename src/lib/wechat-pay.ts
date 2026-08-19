/**
 * 微信支付 V3 封装（Native 扫码）
 * 文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml
 *
 * 环境变量：
 *   WECHAT_MCH_ID          商户号
 *   WECHAT_API_V3_KEY      APIv3 密钥（32 位）
 *   WECHAT_APPID           公众号/小程序 AppID（Native 模式必填）
 *   WECHAT_NOTIFY_URL      支付回调地址（公网 https）
 *   WECHAT_SERIAL_NO       商户证书序列号
 *   WECHAT_PRIVATE_KEY     商户私钥（PEM 内容，\n 转真实换行）
 *
 * 沙箱模式（未配置证书时）：createNativeOrder 返回 mock code_url
 */

import crypto from 'node:crypto';

export interface NativeOrderInput {
  outTradeNo: string;
  description: string;
  amountFen: number; // 金额（分）
  attach?: string;
}

export interface NativeOrderResult {
  codeUrl: string;
  prepayId?: string;
  mock?: boolean;
}

const WX_HOST = 'https://api.mch.weixin.qq.com';

function loadPrivateKey(): string {
  // 优先从路径加载（生产推荐）
  const path = process.env.WECHAT_PRIVATE_KEY_PATH;
  if (path) {
    try {
      const fs = require('node:fs') as typeof import('node:fs');
      return fs.readFileSync(path, 'utf8');
    } catch (e) {
      // 静默失败,下面 isConfigured 会拦截
      return '';
    }
  }
  // 备选: 完整 PEM 写在 env 里
  return (process.env.WECHAT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
}

function isConfigured(): boolean {
  return Boolean(
    process.env.WECHAT_MCH_ID &&
      process.env.WECHAT_API_V3_KEY &&
      process.env.WECHAT_SERIAL_NO &&
      (process.env.WECHAT_PRIVATE_KEY_PATH || process.env.WECHAT_PRIVATE_KEY)
  );
}

/**
 * V3 签名：使用商户私钥对 (method + url + timestamp + nonce + body) 签名
 */
function sign(method: string, urlPath: string, body: string, ts: string, nonce: string): string {
  const message = `${method}\n${urlPath}\n${ts}\n${nonce}\n${body}\n`;
  const privateKey = loadPrivateKey();
  const sign_ = crypto.createSign('RSA-SHA256');
  sign_.update(message, 'utf8');
  return sign_.sign(privateKey, 'base64');
}

/**
 * V3 回调验签 + 解密（回调资源 AES-256-GCM）
 */
export function verifyAndDecryptNotify(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  ciphertext: string,
  associatedData: string,
  nonce2: string
): Record<string, unknown> {
  // 1. 验签（生产环境需配 WECHAT_PLATFORM_CERT 平台公钥）
  const urlPath = '/v3/pay/transactions/native';
  const message = `POST\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const platformCert = (process.env.WECHAT_PLATFORM_CERT || '').replace(/\\n/g, '\n');
  if (platformCert) {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message, 'utf8');
    const ok = verify.verify(platformCert, signature, 'base64');
    if (!ok) throw new Error('Invalid signature from WeChat');
  } else {
    console.warn('[wechat-pay] WECHAT_PLATFORM_CERT 未配置, 跳过回调验签 (生产前必须补)');
  }

  // 2. 解密 resource（AES-256-GCM）
  const key = Buffer.from(process.env.WECHAT_API_V3_KEY || '', 'utf8');
  const authTag = nonce2; // 文档里也叫 "nonce" / auth_tag 是同一个
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ciphertext);
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const plain = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

/**
 * 创建 Native 订单
 * 真实模式：调 https://api.mch.weixin.qq.com/v3/pay/transactions/native
 * 沙箱模式：返回 weixin://wxpay/bizpayurl?pr=mockXXXXXX
 */
export async function createNativeOrder(input: NativeOrderInput): Promise<NativeOrderResult> {
  if (!isConfigured()) {
    // 沙箱模式：直接返回 mock 二维码 URL
    return {
      codeUrl: `weixin://wxpay/bizpayurl?pr=WB${Date.now()}${Math.floor(Math.random() * 1000)}`,
      mock: true,
    };
  }

  const urlPath = '/v3/pay/transactions/native';
  const body = JSON.stringify({
    appid: process.env.WECHAT_APPID || '',
    mchid: process.env.WECHAT_MCH_ID,
    description: input.description,
    out_trade_no: input.outTradeNo,
    time_expire: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    attach: input.attach || 'wb-console-recharge',
    notify_url: process.env.WECHAT_NOTIFY_URL || '',
    amount: {
      total: input.amountFen,
      currency: 'CNY',
    },
  });

  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = sign('POST', urlPath, body, ts, nonce);

  const auth = `mchid="${process.env.WECHAT_MCH_ID}",nonce_str="${nonce}",signature="${signature}",timestamp="${ts}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

  const res = await fetch(`${WX_HOST}${urlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `WECHATPAY2-SHA256-RSA2048 ${auth}`,
      'User-Agent': 'wb-console/1.0',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WeChat API ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { code_url?: string; prepay_id?: string };
  if (!json.code_url) throw new Error('WeChat response missing code_url');
  return { codeUrl: json.code_url, prepayId: json.prepay_id };
}

/**
 * 查询订单（v3 主动查询）
 */
export async function queryOrder(outTradeNo: string): Promise<{
  tradeState: string;
  transactionId?: string;
  paidAt?: string;
}> {
  if (!isConfigured()) {
    // 沙箱模式：始终返回未支付
    return { tradeState: 'NOTPAY' };
  }
  const mchId = process.env.WECHAT_MCH_ID;
  const urlPath = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`;
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = sign('GET', urlPath, '', ts, nonce);
  const auth = `mchid="${mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${ts}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

  const res = await fetch(`${WX_HOST}${urlPath}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `WECHATPAY2-SHA256-RSA2048 ${auth}`,
      'User-Agent': 'wb-console/1.0',
    },
  });
  if (!res.ok) throw new Error(`WeChat query ${res.status}`);
  const j = (await res.json()) as {
    trade_state: string;
    transaction_id?: string;
    success_time?: string;
  };
  return {
    tradeState: j.trade_state,
    transactionId: j.transaction_id,
    paidAt: j.success_time,
  };
}

/**
 * 主动模拟支付成功（仅沙箱模式下 admin 触发）
 */
export function isMockMode(): boolean {
  return !isConfigured();
}
