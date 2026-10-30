// 心情模块的数据计算（纯 TS，供 React 组件使用）

import { addDays, cnDate, isoOf, todayISO, weekStart, daysBetween } from './moneyData';
import { readStory, writeStory } from './storyStore';

export type MoodEntry = {
  id: string;
  date: string;
  text: string;
  mood: string;
  photo: string;
};

export type MoodCat = { k: string; c: string };

export const DEF_MOODS: MoodCat[] = [
  { k: '喜', c: '#F0D394' },
  { k: '怒', c: '#F0997B' },
  { k: '哀', c: '#9BA8F0' },
  { k: '乐', c: '#8FD8C4' },
];

export const MOOD_EXTRA_COLORS = [
  '#F2A9BC',
  '#BFA3E8',
  '#7EC8E8',
  '#E4BC72',
  '#F0C882',
];

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function moodCatList(db: any): MoodCat[] {
  return DEF_MOODS.map((m) => ({ k: m.k, c: m.c })).concat(
    ((db && db.catMoodExtra) || []).map((m: MoodCat) => ({ k: m.k, c: m.c }))
  );
}

export function moodColor(db: any, k: string): string {
  const hit = moodCatList(db).find((m) => m.k === k);
  return hit ? hit.c : '#BFA3E8';
}

export function moodDays(db: any, n: number) {
  const out: { date: string; e: MoodEntry[] }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(todayISO(), -i);
    out.push({ date: d, e: ((db && db.mood) || []).filter((m: MoodEntry) => m.date === d) });
  }
  return out;
}

const RANGE_LABELS: Record<string, string> = {
  day: '今日',
  week: '本周',
  month: '本月',
  quarter: '本季度',
};

export function moodRange(db: any) {
  const r = (db && db.moodRangeSel) || { kind: 'month' };
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
  const list: MoodEntry[] = ((db && db.mood) || []).filter(
    (e: MoodEntry) => e.date >= from && e.date <= to
  );
  const label =
    r.kind === 'custom'
      ? `${cnDate(from)} — ${cnDate(to)}`
      : RANGE_LABELS[r.kind] || '本月';
  return { from, to, days, list, label, kind: r.kind };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ECHO = [
  '我记下了。有些情绪说出口就已经轻了一半。',
  '收到。今天你对自己很诚实，这本身就值得记一笔。',
  '我把这句话放进树洞了。很久以后你回来看，会觉得现在的自己很可爱。',
  '不用急着好起来。情绪也是光阴的一部分，它来过，就该被记着。',
  '记下了。愿你今晚睡得比昨天安稳一点。',
  '有些日子没有结论，只有天气。今天就是这样的天气。',
];

export function moodEcho(p: { seed: string; mood?: string }): string {
  return (
    ECHO[hash(p.seed) % ECHO.length] +
    (p.mood ? `（我猜这算「${p.mood}」——猜错了就当没说。）` : '')
  );
}

/* ---------- 写入 ---------- */
export function addMood(entry: MoodEntry) {
  const db: any = readStory();
  if (!db) return;
  if (!Array.isArray(db.mood)) db.mood = [];
  db.mood.push(entry);
  writeStory(db);
}

export function deleteMood(id: string) {
  const db: any = readStory();
  if (!db) return;
  db.mood = (db.mood || []).filter((e: MoodEntry) => e.id !== id);
  if (db.echo) delete db.echo[id];
  writeStory(db);
}

export function saveEcho(id: string, text: string) {
  const db: any = readStory();
  if (!db) return;
  db.echo = db.echo || {};
  db.echo[id] = text;
  writeStory(db);
}

export function addMoodCat(k: string) {
  const db: any = readStory();
  if (!db) return;
  db.catMoodExtra = db.catMoodExtra || [];
  db.catMoodExtra.push({
    k,
    c: MOOD_EXTRA_COLORS[db.catMoodExtra.length % MOOD_EXTRA_COLORS.length],
  });
  writeStory(db);
}

export function deleteMoodCat(k: string) {
  const db: any = readStory();
  if (!db) return;
  db.catMoodExtra = (db.catMoodExtra || []).filter((m: MoodCat) => m.k !== k);
  writeStory(db);
}

export function renameMoodCat(oldK: string, nextK: string) {
  const db: any = readStory();
  if (!db) return;
  (db.catMoodExtra || []).forEach((m: MoodCat) => {
    if (m.k === oldK) m.k = nextK;
  });
  (db.mood || []).forEach((m: MoodEntry) => {
    if (m.mood === oldK) m.mood = nextK;
  });
  writeStory(db);
}
