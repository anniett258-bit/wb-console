import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface UserData {
  id: string;
  nickname: string;
  avatar: string;
  balance: number;
  totalSpent: number;
  totalTokens: number;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'closed' | 'refunded';
export type OrderMethod = 'wechat' | 'alipay' | 'admin';

export interface Order {
  id: string;
  outTradeNo: string;
  userId: string;
  amount: number;
  points: number;
  method: OrderMethod;
  status: OrderStatus;
  codeUrl?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  expiredAt: string;
}

export interface RedeemCode {
  code: string;
  points: number;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
  source: 'manual' | 'activity' | 'system';
}

export interface SystemData {
  users: Record<string, UserData>;
  orders: Order[];
  redeemCodes: RedeemCode[];
}

const locks = new Map<string, Promise<unknown>>();

async function withLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(file) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(file, next.catch(() => undefined));
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, defaultValue: T): Promise<T> {
  await ensureDir();
  const fp = path.join(DATA_DIR, file);
  try {
    const buf = await fs.readFile(fp, 'utf-8');
    return JSON.parse(buf) as T;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await fs.writeFile(fp, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    throw e;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  const fp = path.join(DATA_DIR, file);
  const tmp = `${fp}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, fp);
}

function getDefaultData(): SystemData {
  return {
    users: {
      'WB-1024': {
        id: 'WB-1024',
        nickname: 'AI开发者',
        avatar: '',
        balance: 8711,
        totalSpent: 43200,
        totalTokens: 85_600_000,
        createdAt: '2026-06-15T00:00:00.000Z',
      },
    },
    orders: [],
    redeemCodes: [
      { code: 'WELCOME-100-2026', points: 100, createdAt: '2026-06-15T00:00:00.000Z', source: 'system' },
      { code: 'SUMMER-500-NEW',   points: 500, createdAt: '2026-07-01T00:00:00.000Z', source: 'activity' },
    ],
  };
}

export async function loadData(): Promise<SystemData> {
  return withLock('system.json', () => readJson<SystemData>('system.json', getDefaultData()));
}

export async function saveData(data: SystemData): Promise<void> {
  return withLock('system.json', () => writeJson('system.json', data));
}

export async function getUser(userId: string): Promise<UserData | null> {
  const data = await loadData();
  return data.users[userId] || null;
}

export async function ensureUser(userId: string): Promise<UserData> {
  const data = await loadData();
  if (data.users[userId]) return data.users[userId];
  data.users[userId] = {
    id: userId,
    nickname: 'AI开发者',
    avatar: '',
    balance: 0,
    totalSpent: 0,
    totalTokens: 0,
    createdAt: new Date().toISOString(),
  };
  await saveData(data);
  return data.users[userId];
}

export async function getOrdersByUser(userId: string, limit = 50): Promise<Order[]> {
  const data = await loadData();
  return data.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const data = await loadData();
  return data.orders.find((o) => o.id === id || o.outTradeNo === id) || null;
}

export async function createOrder(order: Omit<Order, 'createdAt' | 'expiredAt'>): Promise<Order> {
  const data = await loadData();
  const now = new Date();
  const expired = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const full: Order = {
    ...order,
    createdAt: now.toISOString(),
    expiredAt: expired.toISOString(),
  };
  data.orders.unshift(full);
  if (data.orders.length > 500) data.orders = data.orders.slice(0, 500);
  await saveData(data);
  return full;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | null> {
  const data = await loadData();
  const idx = data.orders.findIndex((o) => o.id === id || o.outTradeNo === id);
  if (idx === -1) return null;
  const current = data.orders[idx];
  if (!current) return null;
  const next: Order = { ...current, ...patch };
  data.orders[idx] = next;
  await saveData(data);
  return next;
}

export async function addPoints(userId: string, points: number, reason: string): Promise<UserData> {
  const data = await loadData();
  const u = data.users[userId];
  if (!u) throw new Error(`User ${userId} not found`);
  u.balance += points;
  await saveData(data);
  return u;
}

export async function consumePoints(userId: string, points: number): Promise<UserData> {
  const data = await loadData();
  const u = data.users[userId];
  if (!u) throw new Error(`User ${userId} not found`);
  if (u.balance < points) throw new Error('Insufficient balance');
  u.balance -= points;
  u.totalSpent += points;
  await saveData(data);
  return u;
}

export function generateOrderId(): string {
  const d = new Date();
  const ts =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WB${ts}${rand}`;
}
