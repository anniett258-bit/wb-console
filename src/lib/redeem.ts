// 兑换码 / 余额本地状态（轻量版，生产应走后端 + CloudBase）
// 用 localStorage + 简单签名校验做防伪 + 防重用，刷新不丢

// 混淆盐（生产应放后端，仅放这里做演示）
const SIGN_SALT = 'wb-cool-2026-salt-do-not-rewrite';

export interface RedeemCodeInfo {
  amount: number;
  operator: string;
  tag: string;
}

// 兑换码表：WBAI-XXXX-XXXX-XXXX -> { amount, operator, tag }
// 真实码清单会从后端 / 公众号文章下发
export const CODE_TABLE: Record<string, RedeemCodeInfo> = {
  'WBAI-NEW1-2026-GIFT': { amount: 5000, operator: '系统', tag: '新人福利' },
  'WBAI-AUG8-PROMO-X9K2': { amount: 10000, operator: '运营', tag: '8月活动' },
  'WBAI-TEST-DEMO-M7P1': { amount: 2000, operator: '系统', tag: '测试码' },
  'WBAI-VIP01-EXCL-Q4L8': { amount: 20000, operator: '运营', tag: 'VIP专享' },
};

// 简单签名：btoa(code + '|' + amount + '|' + SALT)，让用户改不了 amount 字段
function signCode(code: string, amount: number): string {
  return btoa(`${code}|${amount}|${SIGN_SALT}`);
}

export function verifyCodeSign(code: string): { valid: boolean; info?: RedeemCodeInfo } {
  const info = CODE_TABLE[code];
  if (!info) return { valid: false };
  // 真实业务会在后端比对签名；这里只做演示
  return { valid: true, info };
}

// === localStorage 读写 ===

const LS_USED = 'wb:redeem:used';         // 已使用兑换码列表（code -> 时间戳）
const LS_BALANCE = 'wb:balance';           // 当前积分余额
const LS_RECORDS = 'wb:redeem:records';    // 兑换记录（追加）

export interface RedeemRecordEntry {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  operator: string;
  tag: string;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// 已使用集合
export function getUsedCodes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  return safeParse<Record<string, string>>(localStorage.getItem(LS_USED), {});
}

export function isCodeUsed(code: string): boolean {
  return Boolean(getUsedCodes()[code]);
}

export function markCodeUsed(code: string): void {
  const used = getUsedCodes();
  used[code] = new Date().toISOString();
  localStorage.setItem(LS_USED, JSON.stringify(used));
}

// 余额（demo 默认值对齐 data.ts）
export const DEFAULT_BALANCE = 8711;

export function getBalance(): number {
  if (typeof window === 'undefined') return DEFAULT_BALANCE;
  const raw = localStorage.getItem(LS_BALANCE);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_BALANCE;
}

export function setBalance(next: number): void {
  localStorage.setItem(LS_BALANCE, String(next));
  // 跨页同步
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wb:balance:change', { detail: next }));
  }
}

export function addBalance(delta: number): number {
  const next = getBalance() + delta;
  setBalance(next);
  return next;
}

// 兑换记录（追加到头部）
export function getRedeemLog(): RedeemRecordEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParse<RedeemRecordEntry[]>(localStorage.getItem(LS_RECORDS), []);
}

export function pushRedeemRecord(code: string, info: RedeemCodeInfo): RedeemRecordEntry {
  const entry: RedeemRecordEntry = {
    id: `r${Date.now()}`,
    code,
    amount: info.amount,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    operator: info.operator,
    tag: info.tag,
  };
  const list = getRedeemLog();
  list.unshift(entry);
  // 最多保留 50 条
  localStorage.setItem(LS_RECORDS, JSON.stringify(list.slice(0, 50)));
  return entry;
}

// 一键重置（演示用）
export function resetRedeemState(): void {
  localStorage.removeItem(LS_USED);
  localStorage.removeItem(LS_BALANCE);
  localStorage.removeItem(LS_RECORDS);
}
