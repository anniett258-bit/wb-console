export interface User {
  id: string;
  nickname: string;
  avatar: string;
  balance: number; // 积分余额
  totalSpent: number;
  totalTokens: number;
  createdAt: string;
}

export type ModelLine = 'workbuddy' | 'codebuddy';

export interface Model {
  id: string;
  name: string;
  line: ModelLine;
  scene: string; // 适合场景
  maxInput: string; // 最大输入
  maxOutput: string; // 最大输出
  toolUse: boolean; // 工具调用
  vision: boolean; // 视觉
  reasoning: boolean; // 推理
  price: string; // 价格文字 e.g. "210积分"
  status: 'available' | 'unavailable' | 'coming';
  tags?: string[];
}

export interface RedeemRecord {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  operator: string;
}

export interface RechargeRecord {
  id: string;
  amount: number;
  method: 'wechat' | 'alipay' | 'admin';
  createdAt: string;
  orderId: string;
}

export interface UsageRecord {
  id: string;
  model: string;
  line: ModelLine;
  inputTokens: number;
  outputTokens: number;
  cost: number; // 消耗积分
  createdAt: string;
  key: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  cover: string;
  url: string;
}

// === 用户 ===
export const currentUser: User = {
  id: 'WB-1024',
  nickname: 'AI开发者',
  avatar: '',
  balance: 8711,
  totalSpent: 43200,
  totalTokens: 85_600_000,
  createdAt: '2026-06-15',
};

// === 模型（按 line 分组） ===
export const models: Model[] = [
  // WorkBuddy — 通用对话 / Agent
  { id: 'auto', name: 'auto', line: 'workbuddy', scene: '不想手动选模型/希望自动匹配最优模型', maxInput: '动态', maxOutput: '动态', toolUse: true, vision: false, reasoning: true, price: '—', status: 'available' },
  { id: 'glm-5.2', name: 'glm-5.2', line: 'workbuddy', scene: '大型项目级编程、超长文档与 Agent 长轨迹', maxInput: '256K', maxOutput: '128K', toolUse: true, vision: false, reasoning: true, price: '280积分', status: 'available' },
  { id: 'glm-5.1', name: 'glm-5.1', line: 'workbuddy', scene: '长程编程、复杂工程任务', maxInput: '200K', maxOutput: '128K', toolUse: true, vision: false, reasoning: true, price: '210积分', status: 'available' },
  { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', line: 'workbuddy', scene: '实时高频调用、成本敏感批量任务', maxInput: '256K', maxOutput: '64K', toolUse: true, vision: false, reasoning: false, price: '140积分', status: 'available' },
  { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro', line: 'workbuddy', scene: '复杂推理、Agentic Coding', maxInput: '256K', maxOutput: '64K', toolUse: true, vision: false, reasoning: true, price: '210积分', status: 'available' },
  { id: 'minimax-m3', name: 'minimax-m3', line: 'workbuddy', scene: '编程/Agent、图文与视频理解', maxInput: '1000K', maxOutput: '131K', toolUse: true, vision: true, reasoning: true, price: '140积分', status: 'available' },
  { id: 'kimi-k2.7-code', name: 'kimi-k2.7-code', line: 'workbuddy', scene: '复杂推理、长上下文编程', maxInput: '256K', maxOutput: '64K', toolUse: true, vision: false, reasoning: true, price: '210积分', status: 'available' },
  { id: 'step-3.7-flash', name: 'step-3.7-flash', line: 'workbuddy', scene: 'Agent、代码、图文与视频理解', maxInput: '256K', maxOutput: '64K', toolUse: true, vision: true, reasoning: false, price: '50积分', status: 'available' },
  { id: 'glm-5-turbo', name: 'glm-5-turbo', line: 'workbuddy', scene: '命令驱动 Agent、定时/持续性长任务', maxInput: '200K', maxOutput: '128K', toolUse: true, vision: false, reasoning: true, price: '280积分', status: 'available' },

  // CodeBuddy — IDE 内代码补全
  { id: 'auto-cb', name: 'auto', line: 'codebuddy', scene: '不想手动选模型/希望自动匹配最优模型', maxInput: '动态', maxOutput: '动态', toolUse: true, vision: false, reasoning: true, price: '—', status: 'available' },
  { id: 'codebuddy-fast', name: 'codebuddy-fast', line: 'codebuddy', scene: '低延迟代码补全、行内建议', maxInput: '64K', maxOutput: '8K', toolUse: false, vision: false, reasoning: false, price: '30积分', status: 'available' },
  { id: 'codebuddy-pro', name: 'codebuddy-pro', line: 'codebuddy', scene: '复杂代码生成、重构、单元测试', maxInput: '128K', maxOutput: '16K', toolUse: true, vision: false, reasoning: true, price: '90积分', status: 'available' },
  { id: 'codebuddy-ultra', name: 'codebuddy-ultra', line: 'codebuddy', scene: '超大仓库理解、跨文件重构', maxInput: '256K', maxOutput: '32K', toolUse: true, vision: false, reasoning: true, price: '160积分', status: 'available' },
];

// === 记录 ===
export const rechargeRecords: RechargeRecord[] = [
  { id: 'c001', amount: 10000, method: 'wechat', createdAt: '2026-08-12 14:30', orderId: 'wx_20260812143012' },
  { id: 'c002', amount: 5000, method: 'wechat', createdAt: '2026-08-10 09:15', orderId: 'wx_20260810091534' },
  { id: 'c003', amount: 2000, method: 'admin', createdAt: '2026-08-05 18:20', orderId: 'admin_bonus' },
  { id: 'c004', amount: 5000, method: 'wechat', createdAt: '2026-07-28 11:08', orderId: 'wx_20260728110802' },
];

export const redeemRecords: RedeemRecord[] = [
  { id: 'd001', code: 'WBAI-XXXX-X9K2', amount: 10000, createdAt: '2026-08-12 14:30', operator: '系统' },
  { id: 'd002', code: 'WBAI-XXXX-M7P1', amount: 5000, createdAt: '2026-08-08 20:42', operator: '系统' },
  { id: 'd003', code: 'SUMMER-2026-A001', amount: 2000, createdAt: '2026-07-20 12:00', operator: '运营' },
  { id: 'd004', code: 'WBAI-XXXX-Q4L8', amount: 1000, createdAt: '2026-07-05 09:11', operator: '系统' },
];

export const usageRecords: UsageRecord[] = [
  { id: 'u001', model: 'glm-5.2', line: 'workbuddy', inputTokens: 12500, outputTokens: 3800, cost: 56, createdAt: '2026-08-13 14:22', key: 'sk-prod-****1a2b' },
  { id: 'u002', model: 'codebuddy-pro', line: 'codebuddy', inputTokens: 4200, outputTokens: 1800, cost: 14, createdAt: '2026-08-13 13:50', key: 'sk-prod-****1a2b' },
  { id: 'u003', model: 'minimax-m3', line: 'workbuddy', inputTokens: 8600, outputTokens: 2400, cost: 28, createdAt: '2026-08-13 12:10', key: 'sk-prod-****1a2b' },
  { id: 'u004', model: 'step-3.7-flash', line: 'workbuddy', inputTokens: 22000, outputTokens: 6400, cost: 32, createdAt: '2026-08-13 11:30', key: 'sk-test-****9c8d' },
  { id: 'u005', model: 'codebuddy-fast', line: 'codebuddy', inputTokens: 12000, outputTokens: 1800, cost: 9, createdAt: '2026-08-13 10:45', key: 'sk-prod-****1a2b' },
  { id: 'u006', model: 'glm-5.1', line: 'workbuddy', inputTokens: 15600, outputTokens: 4200, cost: 62, createdAt: '2026-08-12 22:15', key: 'sk-prod-****1a2b' },
  { id: 'u007', model: 'deepseek-v4-pro', line: 'workbuddy', inputTokens: 9800, outputTokens: 2600, cost: 36, createdAt: '2026-08-12 18:01', key: 'sk-test-****9c8d' },
  { id: 'u008', model: 'kimi-k2.7-code', line: 'workbuddy', inputTokens: 7600, outputTokens: 1900, cost: 28, createdAt: '2026-08-12 16:30', key: 'sk-prod-****1a2b' },
];

// === 常见问题 ===
export const faqItems: FAQItem[] = [
  { id: 'faq1', question: '积分是怎么消耗的？', answer: '调用模型时按输入、输出的 token 累积扣积分，14-18 点点高峰期按 2 倍扣除。1 积分 = 0.001 元。', category: '计费' },
  { id: 'faq2', question: '支持哪些模型？', answer: 'WorkBuddy 提供 9 个通用/Agent 模型（auto、glm-5.x、deepseek-v4、minimax-m3、kimi-k2.7-code、step-3.7-flash 等），CodeBuddy 提供 4 个 IDE 代码补全模型。', category: '模型' },
  { id: 'faq3', question: '报错「自定义模型错误」该如何解决？', answer: '请检查模型名是否拼写正确，或参考控制台「模型配置」页面的官方模型名列表。模型名区分大小写。', category: '技术' },
  { id: 'faq4', question: '可以用在哪些客户端？', answer: '任何兼容 OpenAI 接口的客户端（WorkBuddy、CodeBuddy、ChatBox、NextChat 等），填入同样的 Base URL 和 API Key 即可。', category: '使用' },
  { id: 'faq5', question: '一键配置脚本失败怎么办？', answer: '请改用左侧「WorkBuddy → 手动配置」，在 WorkBuddy 设置里手动填写 Base URL、API Key 和模型名。', category: '技术' },
  { id: 'faq6', question: 'API Key 在哪里查看？', answer: '进入「模型配置」页面即可查看、复制或重置你的 API Key。建议定期轮换，不要在前端代码中硬编码。', category: '使用' },
  { id: 'faq7', question: '如何获得更多积分？', answer: '可通过微信支付自助充值，或使用兑换码（公众号「阿彤木很酷」活动期间发放）。', category: '充值' },
  { id: 'faq8', question: '余额不足会怎样？', answer: 'API 请求会返回 402 错误并停止响应。建议在「控制台」开启余额预警，低于阈值时自动提醒。', category: '计费' },
  { id: 'faq9', question: '支持团队多人协作吗？', answer: '当前为单用户版本。企业版/团队版正在规划中，支持多成员共享额度、成员用量统计。', category: '使用' },
  { id: 'faq10', question: '数据是否安全？', answer: '全链路 HTTPS 加密传输，API Key 加盐哈希存储；不保留对话内容，仅保留 30 天调用日志用于计费。', category: '安全' },
  { id: 'faq11', question: '可以开发票吗？', answer: '企业用户累计充值满 100 元可联系客服开具增值税普通发票，需提供企业抬头和税号。', category: '充值' },
  { id: 'faq12', question: '如何联系人工客服？', answer: '工作日 9:00-18:00 可点击页面右下角「联系客服」按钮，企业微信消息实时响应。', category: '使用' },
];

// === 视频教程（占位） ===
// TODO 后期替换为真实视频 URL + 缩略图；当前以 emoji + 标题占位
export const videoTutorials: VideoTutorial[] = [
  { id: 'v1', title: 'WorkBuddy 一键配置教程', duration: '02:35', cover: '🎬', url: '#' },
  { id: 'v2', title: 'CodeBuddy IDE 接入指南', duration: '03:12', cover: '🎬', url: '#' },
  { id: 'v3', title: 'API Key 创建与权限设置', duration: '01:48', cover: '🎬', url: '#' },
  { id: 'v4', title: '余额预警与自动充值', duration: '02:20', cover: '🎬', url: '#' },
];

export const lineNames: Record<ModelLine, string> = {
  workbuddy: 'WorkBuddy',
  codebuddy: 'CodeBuddy',
};

export const methodNames: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  admin: '系统调账',
};
