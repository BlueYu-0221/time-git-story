// 时间模块的数据计算（纯 TS，供 React 组件使用）

import {
  EXTRA_COLORS,
  addDays,
  cnDate,
  daysBetween,
  isoOf,
  todayISO,
  weekStart,
} from './moneyData';
import { guessTimeCat } from './timeTasks';

export type TimeItem = { t: string; min: number; cat?: string; at?: number };
export type TimeEntry = {
  id: string;
  date: string;
  plan: TimeItem[];
  actual: TimeItem[];
};
export type TimeCat = { k: string; n: string; c: string };

export const DEF_TIME_CATS = [
  { k: 'work', n: '工作' },
  { k: 'learn', n: '学习' },
  { k: 'sport', n: '运动' },
  { k: 'life', n: '生活' },
  { k: 'rest', n: '休息' },
];

export const TIME_CAT_C: Record<string, string> = {
  work: '#F0D394',
  learn: '#7EC8E8',
  sport: '#8FD8C4',
  life: '#F0997B',
  rest: '#BFA3E8',
};

export const RANGE_NAME: Record<string, string> = {
  week: '本周',
  month: '本月',
  quarter: '本季',
  year: '今年',
};

export const RANGE_UNIT: Record<string, string> = {
  week: '周',
  month: '月',
  quarter: '季',
  year: '年',
};

export function timeCatList(db: any): TimeCat[] {
  const names = (db && db.catTime && db.catTime.names) || {};
  return DEF_TIME_CATS.map((c) => ({
    k: c.k,
    n: names[c.k] || c.n,
    c: TIME_CAT_C[c.k],
  })).concat(
    ((db && db.catTimeExtra) || []).map((c: TimeCat) => ({
      k: c.k,
      n: c.n,
      c: c.c,
    }))
  );
}

export function timeCatOf(db: any, k: string): TimeCat {
  const l = timeCatList(db);
  return l.find((x) => x.k === k) || l[l.length - 1];
}

export function newTimeCat(name: string, index: number): TimeCat {
  return {
    k: 'tx' + Math.random().toString(36).slice(2, 9),
    n: name,
    c: EXTRA_COLORS[index % EXTRA_COLORS.length],
  };
}

/* ---------- 区间 ---------- */
export function rangeStart(kind: string): string {
  const d = new Date();
  if (kind === 'week') return weekStart(todayISO());
  if (kind === 'month') {
    d.setDate(1);
    return isoOf(d);
  }
  if (kind === 'quarter') {
    d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
    return isoOf(d);
  }
  if (kind === 'year') {
    d.setMonth(0, 1);
    return isoOf(d);
  }
  return addDays(todayISO(), -6);
}

export function prevRange(kind: string): { from: string; to: string } {
  const st = rangeStart(kind);
  const len = Math.max(7, daysBetween(st, todayISO()) + 1);
  const pe = addDays(st, -1);
  const ps = addDays(pe, -(len - 1));
  return { from: ps, to: pe };
}

/* ---------- 相似度 ---------- */
export function sim(a: string | number, b: string | number): number {
  const x = String(a).replace(/[的了呢啊吧呀哦，,.。!！?？\s]/g, '');
  const y = String(b).replace(/[的了呢啊吧呀哦，,.。!！?？\s]/g, '');
  if (!x || !y) return 0;
  if (x.includes(y) || y.includes(x)) return 0.9;
  const grams: Record<string, number> = {};
  let n = 0;
  for (let i = 0; i < x.length - 1; i++) {
    grams[x.substr(i, 2)] = 1;
    n++;
  }
  let m = 0;
  for (let j = 0; j < y.length - 1; j++) {
    if (grams[y.substr(j, 2)]) m++;
  }
  return n ? m / Math.max(n, y.length - 1) : 0;
}

/* ---------- 统计 ---------- */
export type Stats = {
  from: string;
  to: string;
  days: number;
  planN: number;
  actN: number;
  done: number;
  missN: number;
  rate: number;
  pct: number;
  planH: number;
  actH: number;
  extraN: number;
  extraPct: number;
  top: string;
  cats: { k: string; n: string; c: string; h: number }[];
  prev?: Stats;
  hasPrev?: boolean;
  kind?: string;
  unit?: string;
};

export function statsRange(db: any, from: string, to: string): Stats {
  const es: TimeEntry[] = ((db && db.time) || []).filter(
    (e: TimeEntry) => (!from || e.date >= from) && (!to || e.date <= to)
  );
  let planN = 0;
  let actN = 0;
  let done = 0;
  let planMin = 0;
  let actMin = 0;
  let extraMin = 0;
  let extraN = 0;
  const miss: string[] = [];
  const catH: Record<string, number> = {};

  es.forEach((e) => {
    (e.plan || []).forEach((p) => {
      planN++;
      planMin += parseFloat(String(p.min)) || 0;
    });
    (e.actual || []).forEach((a) => {
      actN++;
      const mm = parseFloat(String(a.min)) || 0;
      actMin += mm;
      const c = a.cat || guessTimeCat(a.t);
      catH[c] = (catH[c] || 0) + mm;
      let hit = false;
      (e.plan || []).forEach((p) => {
        if (sim(p.t, a.t) >= 0.34) hit = true;
      });
      if (!hit) {
        extraN++;
        extraMin += mm;
      }
    });
    (e.plan || []).forEach((p) => {
      let ok = false;
      (e.actual || []).forEach((a) => {
        if (sim(p.t, a.t) >= 0.34) ok = true;
      });
      if (ok) done++;
      else miss.push(p.t);
    });
  });

  const rate = planN ? done / planN : 0;
  const mc: Record<string, number> = {};
  miss.forEach((t) => {
    mc[t] = (mc[t] || 0) + 1;
  });
  let top = '';
  Object.keys(mc).forEach((k) => {
    if (mc[k] > (mc[top] || 0)) top = k;
  });
  const cats = Object.keys(catH)
    .map((k) => {
      const c = timeCatOf(db, k);
      return { k, n: c.n, c: c.c, h: catH[k] / 60 };
    })
    .sort((a, b) => b.h - a.h);

  return {
    from,
    to,
    days: es.length,
    planN,
    actN,
    done,
    missN: planN - done,
    rate,
    pct: Math.round(rate * 100),
    planH: +(planMin / 60).toFixed(1),
    actH: +(actMin / 60).toFixed(1),
    extraN,
    extraPct: actMin ? Math.round((extraMin / actMin) * 100) : 0,
    top,
    cats,
  };
}

export function timeStats(db: any, kind: string): Stats {
  const from = rangeStart(kind);
  const cur = statsRange(db, from, todayISO());
  const pr = prevRange(kind);
  const prev = statsRange(db, pr.from, pr.to);
  return {
    ...cur,
    prev,
    hasPrev: prev.days > 0,
    kind,
    unit: RANGE_UNIT[kind],
    from,
  };
}

/* ---------- 对账单区间 ---------- */
export function timeRange(db: any) {
  const r = (db && db.timeRange) || { kind: 'week' };
  const now = new Date();
  let to = todayISO();
  let from: string;
  if (r.kind === 'day') from = to;
  else if (r.kind === 'week') from = rangeStart('week');
  else if (r.kind === 'month') from = isoOf(new Date(now.getFullYear(), now.getMonth(), 1));
  else if (r.kind === 'quarter') from = addDays(to, -89);
  else if (r.kind === 'custom' && r.from && r.to) {
    from = r.from;
    to = r.to;
  } else from = rangeStart('week');
  if (from > to) {
    const t0 = from;
    from = to;
    to = t0;
  }
  const days = daysBetween(from, to) + 1;
  const pTo = addDays(from, -1);
  const pFrom = addDays(pTo, -(days - 1));
  const list: TimeEntry[] = (db.time || []).filter(
    (e: TimeEntry) => e.date >= from && e.date <= to
  );
  const prev: TimeEntry[] = (db.time || []).filter(
    (e: TimeEntry) => e.date >= pFrom && e.date <= pTo
  );
  const label =
    r.kind === 'day'
      ? '今日'
      : r.kind === 'week'
        ? '本周'
        : r.kind === 'month'
          ? '本月'
          : r.kind === 'quarter'
            ? '本季度'
            : `${cnDate(from)} — ${cnDate(to)}`;
  return { from, to, days, list, prev, label, kind: r.kind };
}

/* ---------- 近 N 天轨迹 ---------- */
export function timeTraj(db: any, n: number) {
  const out: { label: string; v: number; v2: number }[] = [];
  let mx = 1;
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(todayISO(), -i);
    const e: TimeEntry | undefined = (db.time || []).find(
      (x: TimeEntry) => x.date === d
    );
    let p = 0;
    let a = 0;
    if (e) {
      (e.plan || []).forEach((x) => {
        p += parseFloat(String(x.min)) || 0;
      });
      (e.actual || []).forEach((x) => {
        a += parseFloat(String(x.min)) || 0;
      });
    }
    p /= 60;
    a /= 60;
    mx = Math.max(mx, p, a);
    out.push({ label: d.slice(5).replace('-', '/'), v: +a.toFixed(1), v2: +p.toFixed(1) });
  }
  return { days: out, mx: Math.ceil(mx * 1.15 * 10) / 10 };
}

/* ---------- 时间线分桶 ---------- */
export const VT_ZONES = [
  { n: '早上', s: 420, e: 750 },
  { n: '中午', s: 750, e: 840 },
  { n: '下午', s: 840, e: 1140 },
  { n: '晚上', s: 1140, e: 1440 },
];

export function zoneName(h: number): string {
  for (const z of VT_ZONES) {
    if (h >= z.s && h < z.e) return z.n;
  }
  return '晚上';
}

export function dayAssign(items: TimeItem[]) {
  const out: { p: TimeItem; start: number }[] = [];
  let cur = 480;
  (items || []).forEach((p) => {
    const min = parseFloat(String(p.min)) || 30;
    let start = typeof p.at === 'number' ? p.at : cur;
    if (start < 420) start = 420;
    if (start > 1425 - (min > 0 ? min : 30)) start = Math.max(420, 1425 - (min > 0 ? min : 30));
    out.push({ p, start: Math.round(start) });
    cur = start + min + 10;
  });
  return out;
}

export type HourBucket = { h: number; items: { p: TimeItem; min: number }[]; min: number };

export function hourBuckets(items: TimeItem[]): HourBucket[] {
  const as = dayAssign(items || []);
  const spans = as.map((o) => {
    const m = parseFloat(String(o.p.min)) || 30;
    return { p: o.p, start: o.start, end: o.start + m, m };
  });
  let s = 1e9;
  let e = -1;
  spans.forEach((o) => {
    s = Math.min(s, o.start);
    e = Math.max(e, o.end);
  });
  if (!spans.length || s > e) return [];
  const h0 = Math.max(420, Math.floor(s / 60) * 60);
  const h1 = Math.min(1440, Math.ceil(e / 60) * 60);
  const out: HourBucket[] = [];
  for (let h = h0; h < h1; h += 60) {
    const arr: { p: TimeItem; min: number }[] = [];
    spans.forEach((o) => {
      const ov = Math.min(o.end, h + 60) - Math.max(o.start, h);
      if (ov > 0) arr.push({ p: o.p, min: Math.round(ov) });
    });
    out.push({ h, items: arr, min: arr.reduce((a, b) => a + b.min, 0) });
  }
  return out;
}

export function zoneBuckets(items: TimeItem[]) {
  const as = dayAssign(items || []);
  return VT_ZONES.map((z) => {
    const arr = as.filter((o) => {
      const mid = o.start + (parseFloat(String(o.p.min)) || 30) / 2;
      return mid >= z.s && mid < z.e;
    });
    return {
      n: z.n,
      items: arr,
      min: arr.reduce((s, o) => s + (parseFloat(String(o.p.min)) || 0), 0),
    };
  });
}

/* ---------- 每天的计划/实际概况 ---------- */
export function dayCompare(db: any, date: string) {
  const e: TimeEntry | undefined = (db.time || []).find((x: TimeEntry) => x.date === date);
  let ph = 0;
  let ah = 0;
  let nn = 0;
  if (e) {
    (e.plan || []).forEach((p) => {
      ph += parseFloat(String(p.min)) || 0;
    });
    (e.actual || []).forEach((a) => {
      ah += parseFloat(String(a.min)) || 0;
    });
    (e.plan || []).forEach((p) => {
      (e.actual || []).forEach((a) => {
        if (sim(p.t, a.t) >= 0.34) nn++;
      });
    });
  }
  const planN = (e && e.plan && e.plan.length) || 0;
  return {
    entry: e,
    ph,
    ah,
    planN,
    actualN: (e && e.actual && e.actual.length) || 0,
    rate: planN ? Math.round((nn / planN) * 100) : 0,
  };
}
