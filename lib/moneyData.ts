// 金钱模块的数据计算（纯 TS，供 React 组件使用）

import { cnNorm } from './timeTasks';
import { readStory, writeStory } from './storyStore';

export type MoneyEntry = {
  id: string;
  date: string;
  amt: number;
  note: string;
  cat: string;
};

export type Cat = { k: string; n: string; c: string };

export const STYLES: Record<string, string> = {
  default: '温柔叙事',
  lyric: '歌词风',
  poem: '古诗词风',
  net: '网络用语风',
};

export const DEF_CATS: Cat[] = [
  { k: 'food', n: '餐饮', c: '#F0C882' },
  { k: 'drink', n: '饮品', c: '#7EC8E8' },
  { k: 'move', n: '交通', c: '#9BA8F0' },
  { k: 'buy', n: '购物', c: '#F0997B' },
  { k: 'home', n: '居家日用', c: '#8FD8C4' },
  { k: 'fun', n: '娱乐', c: '#BFA3E8' },
  { k: 'heal', n: '健康', c: '#F2A9BC' },
  { k: 'learn', n: '学习', c: '#A8D8A1' },
  { k: 'peo', n: '人情往来', c: '#E4BC72' },
  { k: 'social', n: '社交', c: '#8FB8F8' },
  { k: 'love', n: '恋爱脑', c: '#FF9FB2' },
  { k: 'junk', n: '热量炸弹', c: '#FFB26B' },
  { k: 'etc', n: '其他', c: '#9A94B8' },
];

export const EXTRA_COLORS = [
  '#F0997B', '#7EC8E8', '#BFA3E8', '#8FD8C4',
  '#F2A9BC', '#E4BC72', '#9BA8F0',
];

const CAT_KW: Record<string, string> = {
  food: '吃饭 午饭 晚饭 早餐 外卖 餐厅 小龙虾 食堂 便当 水果 面包 面条 拉面 盖饭 饺子 包子 喝粥 火锅外卖',
  drink: '咖啡 奶茶 可乐 果汁 饮料 酸奶 牛奶 啤酒 红酒 美式 拿铁 果茶 柠檬茶 气泡水',
  junk: '火锅 烧烤 炸鸡 汉堡 披萨 甜品 蛋糕 薯片 零食 宵夜 夜宵 冰淇淋 炸串 麻辣烫',
  move: '地铁 公交 打车 滴滴 高铁 火车 机票 加油 停车 单车 共享单车 出租车 车票 通勤',
  buy: '衣服 鞋 包 裤子 化妆品 数码 手机 电脑 耳机 买 淘宝 京东 拼多多 快递 网购 帽子 首饰 口红 T恤 t恤 卫衣',
  home: '房租 水电 物业 燃气 宽带 超市 日用品 纸巾 洗衣 家具 米 油 清洁 收纳',
  fun: '电影 游戏 演出 门票 KTV 旅行 旅游 酒店 剧本杀 演唱会 展 会员 充值 按摩',
  heal: '药 医院 看病 体检 健身 药店 牙 挂号 保险 维生素 医美',
  learn: '书 课程 网课 培训 考试 学费 文具 报名 知识付费 学习 证书 教材 打印 资料',
  social: 'aa AA 朋友 聚餐 聚会 请客 桌游 应酬',
  love: '鲜花 玫瑰 礼物 情侣 约会 纪念日 巧克力 对戒 惊喜',
  peo: '红包 份子 生日 婚礼 随礼 送 年货 长辈',
};

/* ---------- 日期 ---------- */
export function isoOf(d: Date): string {
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${dd < 10 ? '0' : ''}${dd}`;
}

export function todayISO(): string {
  return isoOf(new Date());
}

export function addDays(s: string, n: number): string {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

export function weekStart(s: string): string {
  const d = new Date(s + 'T00:00:00');
  const w = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - w);
  return isoOf(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() -
      new Date(a + 'T00:00:00').getTime()) /
      86400000
  );
}

export function cnDate(s: string): string {
  if (!s) return '';
  const p = s.split('-');
  return `${p[1].replace(/^0/, '')}月${p[2].replace(/^0/, '')}日`;
}

export function num(n: number): string {
  return String(Math.round(n));
}

/* ---------- 分类 ---------- */
export function catList(db: any): Cat[] {
  const names: Record<string, string> = (db && db.catName) || {};
  return DEF_CATS.map((c) => ({ k: c.k, n: names[c.k] || c.n, c: c.c })).concat(
    (db && db.catExtra) || []
  );
}

export function catOf(db: any, k: string): Cat {
  const list = catList(db);
  return list.find((c) => c.k === k) || { k, n: '其他', c: '#9A94B8' };
}

/* ---------- 解析 ---------- */
export function classify(s: string): string {
  let best = 'etc';
  let bestScore = 0;
  for (const k of Object.keys(CAT_KW)) {
    let score = 0;
    for (const w of CAT_KW[k].split(' ')) {
      if (w && s.indexOf(w) >= 0) score += w.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

export function parseAmount(s: string): number | null {
  const s2 = cnNorm(s);
  const m = s2.match(/(\d+(?:\.\d+)?)\s*(?:块钱|块|元|rmb|RMB|¥)/i);
  if (m) return parseFloat(m[1]);
  const all = s2.match(/\d+(?:\.\d+)?/g);
  if (!all) return null;
  if (all.length === 1) return parseFloat(all[0]);
  return parseFloat(all.sort((a, b) => parseFloat(b) - parseFloat(a))[0]);
}

export function cleanNote(seg: string): string {
  const n = String(seg)
    .replace(/\d+(?:\.\d+)?\s*(?:块钱|块|元|rmb|¥)/gi, '')
    .replace(/aa/gi, '')
    .replace(/\d+(?:\.\d+)?/g, '')
    .replace(/^(今天|昨天|明天|早上|早晨|上午|中午|下午|晚上|夜里|深夜|刚才|刚刚|今晚|今早)/, '')
    .replace(/(花了|花去|花费)/, '')
    .replace(/^[\s的了，,。.、：:]+|[\s，,。.、：:]+$/g, '');
  return n || String(seg).trim();
}

export type ParsedExpense = { note: string; amt: number; cat: string };

export function parseExpenseSentence(text: string): ParsedExpense[] {
  const segs = String(text)
    .split(/[，,、;；。\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s);
  const items: ParsedExpense[] = [];
  segs.forEach((seg) => {
    const amt = parseAmount(seg);
    if (amt && amt > 0) items.push({ note: cleanNote(seg), amt, cat: classify(seg) });
  });
  if (!items.length) {
    const a = parseAmount(text);
    if (a && a > 0) items.push({ note: cleanNote(text), amt: a, cat: classify(text) });
  }
  return items;
}

/* ---------- 统计 ---------- */
const sum = (list: MoneyEntry[]) => list.reduce((s, x) => s + x.amt, 0);

export function moneyStats(db: any) {
  const money: MoneyEntry[] = db?.money || [];
  const ws = weekStart(todayISO());
  const prevStart = addDays(ws, -7);
  const cur = money.filter((m) => m.date >= ws);
  const prev = money.filter((m) => m.date >= prevStart && m.date < ws);
  const by: Record<string, number> = {};
  const byP: Record<string, number> = {};
  cur.forEach((m) => (by[m.cat] = (by[m.cat] || 0) + m.amt));
  prev.forEach((m) => (byP[m.cat] = (byP[m.cat] || 0) + m.amt));
  const arr = Object.keys(by)
    .map((k) => {
      const c = catOf(db, k);
      return { k, n: c.n, c: c.c, v: by[k], pv: byP[k] || 0 };
    })
    .sort((a, b) => b.v - a.v);
  const maxE = cur.slice().sort((a, b) => b.amt - a.amt)[0];
  const ct = sum(cur);
  const pt = sum(prev);
  return {
    cur: ct,
    prev: pt,
    diff: ct - pt,
    arr,
    total: ct || 1,
    top1: arr[0] ? arr[0].n : '—',
    max: maxE ? maxE.amt : 0,
    maxNote: maxE ? maxE.note : '',
    ws,
    hasPrev: prev.length > 0,
  };
}

export function moneyMonthStats(db: any) {
  const now = new Date();
  const curS = isoOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevS = isoOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const money: MoneyEntry[] = db?.money || [];
  const cur = money.filter((m) => m.date >= curS);
  const prev = money.filter((m) => m.date >= prevS && m.date < curS);
  const by: Record<string, number> = {};
  const byP: Record<string, number> = {};
  cur.forEach((m) => (by[m.cat] = (by[m.cat] || 0) + m.amt));
  prev.forEach((m) => (byP[m.cat] = (byP[m.cat] || 0) + m.amt));
  const arr = Object.keys(by)
    .map((k) => {
      const c = catOf(db, k);
      return { k, n: c.n, c: c.c, v: by[k], pv: byP[k] || 0 };
    })
    .sort((a, b) => b.v - a.v);
  const ct = sum(cur);
  const pt = sum(prev);
  return { cur: ct, prev: pt, diff: ct - pt, arr, total: ct || 1, hasPrev: prev.length > 0 };
}

export function moneyTraj(db: any, n: number) {
  const money: MoneyEntry[] = db?.money || [];
  const out: { label: string; v: number }[] = [];
  let mx = 1;
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(todayISO(), -i);
    const s = money.filter((x) => x.date === d).reduce((a, x) => a + x.amt, 0);
    mx = Math.max(mx, s);
    out.push({ label: d.slice(5).replace('-', '/'), v: Math.round(s) });
  }
  return { days: out, mx: Math.ceil(mx * 1.15) };
}

export function moneyRange(db: any) {
  const r = db?.moneyRange || { kind: 'month' };
  let to = todayISO();
  let from: string;
  if (r.kind === 'day') from = to;
  else if (r.kind === 'week') from = weekStart(to);
  else if (r.kind === 'quarter') from = addDays(to, -89);
  else if (r.kind === 'custom' && r.from && r.to) {
    from = r.from;
    to = r.to;
  } else {
    const d = new Date();
    from = isoOf(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  if (from > to) {
    const t0 = from;
    from = to;
    to = t0;
  }
  const days = daysBetween(from, to) + 1;
  const pTo = addDays(from, -1);
  const pFrom = addDays(pTo, -(days - 1));
  const money: MoneyEntry[] = db?.money || [];
  const list = money.filter((e) => e.date >= from && e.date <= to);
  const prev = money.filter((e) => e.date >= pFrom && e.date <= pTo);
  const label =
    r.kind === 'day'
      ? '今日'
      : r.kind === 'week'
        ? '本周'
        : r.kind === 'quarter'
          ? '近一季度'
          : r.kind === 'custom'
            ? `${cnDate(from)} — ${cnDate(to)}`
            : '本月';
  return { from, to, days, list, prev, label, kind: r.kind };
}

export function rangeSum(list: MoneyEntry[]): number {
  return sum(list);
}

/* ---------- 写入 ---------- */
export function persist(db: any) {
  writeStory(db);
}

export function addMoney(entries: ParsedExpense[]): number {
  const db: any = readStory();
  if (!db) return 0;
  if (!Array.isArray(db.money)) db.money = [];
  const date = todayISO();
  let total = 0;
  entries.forEach((it) => {
    db.money.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      date,
      amt: it.amt,
      note: it.note,
      cat: it.cat,
    });
    total += it.amt;
  });
  writeStory(db);
  return total;
}

export function deleteMoney(id: string) {
  const db: any = readStory();
  if (!db) return;
  db.money = (db.money || []).filter((e: MoneyEntry) => e.id !== id);
  writeStory(db);
}

export function reload(): any {
  return readStory();
}
