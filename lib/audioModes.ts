// 语音识别文本 → 各业务模块的结构化结果 & 洞察文案（纯 TS，服务端可用）

import { DEF_CATS, parseExpenseSentence } from './moneyData';
import { parseTasks } from './timeTasks';

export const AUDIO_MODES = ['money', 'time', 'mood', 'dream'] as const;
export type AudioMode = (typeof AUDIO_MODES)[number];

export function isAudioMode(v: string): v is AudioMode {
  return (AUDIO_MODES as readonly string[]).includes(v);
}

const MONEY_CAT_NAMES: Record<string, string> = {};
DEF_CATS.forEach((c) => {
  MONEY_CAT_NAMES[c.k] = c.n;
});

const TIME_CAT_NAMES: Record<string, string> = {
  work: '工作',
  learn: '学习',
  sport: '运动',
  life: '生活',
  rest: '休息',
};

const MOOD_KW: Record<string, string[]> = {
  喜: ['开心', '高兴', '快乐', '舒服', '踏实', '满足', '幸福', '惊喜', '轻松', '顺利', '喜欢', '温暖'],
  怒: ['生气', '气死', '烦', '无语', '火大', '讨厌', '不爽', '崩溃', '抓狂'],
  哀: ['难过', '伤心', '失落', '想哭', '孤独', '委屈', '焦虑', '压抑', '难受', '累', '疲惫', 'emo'],
  乐: ['好玩', '有趣', '哈哈', '笑', '兴奋', '期待', '爽', '愉快'],
};

function guessMood(text: string): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const k of Object.keys(MOOD_KW)) {
    let score = 0;
    for (const w of MOOD_KW[k]) {
      if (text.indexOf(w) >= 0) score += w.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

function guessDreamType(text: string): string {
  if (/梦见|梦到|做了个梦|梦里/.test(text)) return '做过的梦';
  if (/想成为|希望自己|变成|以后的我/.test(text)) return '想成为的自己';
  return '奇思妙想';
}

export type MoneyParsed = {
  kind: 'money';
  items: { note: string; amt: number; cat: string; catName: string }[];
  count: number;
  total: number;
};

export type TimeParsed = {
  kind: 'time';
  tasks: { t: string; min: number; cat: string; catName: string; at: number | null }[];
  count: number;
  totalMin: number;
};

export type MoodParsed = {
  kind: 'mood';
  text: string;
  mood: string | null;
};

export type DreamParsed = {
  kind: 'dream';
  text: string;
  type: string;
};

export type ParsedAudio = MoneyParsed | TimeParsed | MoodParsed | DreamParsed;

export function parseByMode(mode: AudioMode, text: string): ParsedAudio {
  const raw = String(text || '').trim();

  if (mode === 'money') {
    const items = parseExpenseSentence(raw).map((it) => ({
      ...it,
      catName: MONEY_CAT_NAMES[it.cat] || '其他',
    }));
    const total = items.reduce((s, it) => s + it.amt, 0);
    return {
      kind: 'money',
      items,
      count: items.length,
      total: Math.round(total * 100) / 100,
    };
  }

  if (mode === 'time') {
    const tasks = parseTasks(raw).map((t) => ({
      ...t,
      catName: TIME_CAT_NAMES[t.cat] || '生活',
    }));
    return {
      kind: 'time',
      tasks,
      count: tasks.length,
      totalMin: tasks.reduce((s, t) => s + t.min, 0),
    };
  }

  if (mode === 'mood') {
    return { kind: 'mood', text: raw, mood: guessMood(raw) };
  }

  return { kind: 'dream', text: raw, type: guessDreamType(raw) };
}

/* ---------- 洞察文案 ---------- */

const INSIGHT_SYS: Record<AudioMode, string> = {
  money:
    '你是「光阴的故事」当铺里的掌柜，擅长用温和、克制、有画面感的一句话点评刚刚记下的账目，不评判、不贩卖焦虑。',
  time:
    '你是「光阴的故事」里的时间记录员，擅长用温和、克制、有画面感的一句话点评刚记录的时间安排。',
  mood: '你是「光阴的故事」里的树洞，对用户的倾诉给出一句真诚、不鸡汤的回应。',
  dream:
    '你是「光阴的故事」里的梦想守护者，温柔而坚定地回应刚刚写下的念头。',
};

const INSIGHT_LIMIT: Record<AudioMode, number> = {
  money: 60,
  time: 60,
  mood: 40,
  dream: 60,
};

export function insightPrompt(
  mode: AudioMode,
  text: string,
  parsed: ParsedAudio
): { system: string; user: string } {
  return {
    system:
      INSIGHT_SYS[mode] +
      '只输出一句中文，不要换行、不要 markdown、不要引号。',
    user:
      `用户刚通过语音说：「${text}」\n` +
      `结构化解析结果：${JSON.stringify(parsed)}\n` +
      `请写一句不超过 ${INSIGHT_LIMIT[mode]} 字的点评。`,
  };
}

export function fallbackInsight(mode: AudioMode, parsed: ParsedAudio): string {
  if (parsed.kind === 'money') {
    if (!parsed.count) {
      return '这句里没听出金额；可以说「咖啡 28，外卖 35」，掌柜会自动拆分。';
    }
    const top = parsed.items.slice().sort((a, b) => b.amt - a.amt)[0];
    if (parsed.count === 1) {
      return `已记下「${top.note}」¥${top.amt}。`;
    }
    return `已记下 ${parsed.count} 笔，共 ¥${parsed.total}；最贵的是「${top.note}」¥${top.amt}。`;
  }

  if (parsed.kind === 'time') {
    if (!parsed.count) {
      return '没听出具体安排；可以说「写了四十分钟周报，跑了半小时步」。';
    }
    const top = parsed.tasks.slice().sort((a, b) => b.min - a.min)[0];
    return `已记下 ${parsed.count} 件事，约 ${parsed.totalMin} 分钟；${top.catName}占得最多。`;
  }

  if (parsed.kind === 'mood') {
    return parsed.mood
      ? `这句话里有「${parsed.mood}」的味道，收进树洞了。`
      : '这句话收进树洞了，情绪也是光阴的一部分。';
  }

  return `这个「${parsed.type}」记下了，先为它做一件五分钟就能开始的小事。`;
}
