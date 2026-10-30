// 本地数据层：与原生逻辑共用同一个 localStorage key

const KEY = 'gsdg_story_v5';

export type TimeItem = { t: string; min: number; cat: string };
export type TimeEntry = {
  id: string;
  date: string;
  plan: TimeItem[];
  actual: TimeItem[];
};

export type StoryDB = {
  ai?: { voice?: string };
  time?: TimeEntry[];
  [k: string]: unknown;
};

export function readStory(): StoryDB | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoryDB) : null;
  } catch {
    return null;
  }
}

export function writeStory(db: StoryDB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* 存储不可用时静默失败 */
  }
}

export function getVoiceMode(): string {
  return readStory()?.ai?.voice || 'auto';
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 把解析出的任务写入某天的计划 / 实际 */
export function addTimeTasks(
  date: string,
  kind: 'plan' | 'actual',
  items: TimeItem[]
): boolean {
  const db = readStory();
  if (!db) return false;
  const list: TimeEntry[] = Array.isArray(db.time) ? db.time : (db.time = []);
  let entry = list.find((x) => x.date === date);
  if (!entry) {
    entry = { id: uid(), date, plan: [], actual: [] };
    list.push(entry);
  }
  if (!Array.isArray(entry[kind])) entry[kind] = [];
  items.forEach((it) => entry![kind].push(it));
  writeStory(db);
  return true;
}
