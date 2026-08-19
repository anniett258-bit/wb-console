/**
 * 充值套餐配置
 * 梯度赠送：50+ 送 10%, 100+ 送 20%
 */
export interface RechargePlan {
  id: string;
  amount: number; // 元
  points: number; // 积分
  bonus: number; // 赠送积分
  tag?: string; // 推荐/热门
  desc: string;
}

export const RECHARGE_PLANS: RechargePlan[] = [
  { id: 'p10',   amount: 10,  points: 100,  bonus: 0,   desc: '100 积分 · 体验装' },
  { id: 'p30',   amount: 30,  points: 300,  bonus: 20,  desc: '320 积分 · 入门装' },
  { id: 'p50',   amount: 50,  points: 500,  bonus: 50,  tag: '推荐', desc: '550 积分 · 进阶装' },
  { id: 'p100',  amount: 100, points: 1000, bonus: 200, tag: '热门', desc: '1200 积分 · 畅享装' },
  { id: 'p200',  amount: 200, points: 2000, bonus: 500, desc: '2500 积分 · 专业装' },
  { id: 'p500',  amount: 500, points: 5000, bonus: 1500, desc: '6500 积分 · 团队装' },
];

export function getPlanById(id: string): RechargePlan | null {
  return RECHARGE_PLANS.find((p) => p.id === id) || null;
}

export function calcPoints(plan: RechargePlan): number {
  return plan.points + plan.bonus;
}
