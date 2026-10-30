// 时间记录：自然语言 → 任务条目（纯 TS，供 React 组件使用）

const TIME_CAT_KW: Record<string, string> = {
  work: '工作 开会 周报 方案 加班 同事 项目 汇报 复盘 邮件',
  learn: '书 读书 看 学习 单词 背 课程 网课 写字 练字 考 复习 学',
  sport: '跑 健身 运动 步 球 游泳 瑜伽 拉伸 锻炼',
  life: '饭 做饭 买菜 超市 收拾 打扫 洗 衣服 电话 家人 逛 散步 朋友',
  rest: '睡 发呆 刷 剧 视频 游戏 休息 咖啡 茶',
};

export type ParsedTask = {
  t: string;
  min: number;
  cat: string;
  at: number | null;
};

export function todayISO(): string {
  const d = new Date();
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${dd < 10 ? '0' : ''}${dd}`;
}

export function cnDate(s: string): string {
  if (!s) return '';
  const p = s.split('-');
  return `${p[1].replace(/^0/, '')}月${p[2].replace(/^0/, '')}日`;
}

export function guessTimeCat(text: string): string {
  let best = 'life';
  let bestScore = 0;
  for (const k of Object.keys(TIME_CAT_KW)) {
    let score = 0;
    for (const w of TIME_CAT_KW[k].split(' ')) {
      if (w && String(text).indexOf(w) >= 0) score += w.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

const CN_DIGIT: Record<string, number> = {
  零: 0, 一: 1, 壹: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
const CN_UNIT: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000 };

function cn2n(s: string): number | null {
  let total = 0;
  let cur = 0;
  let has = false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c in CN_DIGIT) {
      cur = CN_DIGIT[c];
      has = true;
    } else if (c in CN_UNIT) {
      total += (cur || 1) * CN_UNIT[c];
      cur = 0;
      has = true;
    }
  }
  return has ? total + cur : null;
}

export function cnNorm(s: string): string {
  return String(s)
    .replace(/半\s*个?\s*(小时|钟头)/g, '30分钟')
    .replace(/半\s*小时/g, '30分钟')
    .replace(/[零一壹二两三四五六七八九十百千万]+/g, (m) => {
      const n = cn2n(m);
      return n == null ? m : String(n);
    });
}

function parseClock(seg: string): number | null {
  const s = String(seg || '');
  const per = s.match(/(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里)/);
  const hm = s.match(/(\d{1,2})[:：](\d{2})/);
  let h: number;
  let mi = 0;
  if (hm) {
    h = parseInt(hm[1], 10);
    mi = parseInt(hm[2], 10);
  } else {
    const m2 = s.match(/(\d{1,2})\s*点\s*(半)?/);
    if (!m2) return null;
    h = parseInt(m2[1], 10);
    if (m2[2]) mi = 30;
  }
  if (per) {
    const p = per[1];
    if (p === '中午') h = 12;
    else if (p === '下午' || p === '傍晚' || p === '晚上' || p === '夜里') {
      if (h < 12) h += 12;
    } else if (p === '凌晨') {
      if (h >= 12) h -= 12;
    }
  }
  let mins = h * 60 + mi;
  if (mins < 0) mins = 0;
  if (mins > 1439) mins = 1439;
  return mins;
}

export function parseTasks(input: string): ParsedTask[] {
  return cnNorm(input)
    .split(/[，,。;；、\n\r]+|然后|接着|之后|还有|再|and/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .map((seg) => {
      const at = parseClock(seg);
      const m = seg.match(/(\d+(?:\.\d+)?)\s*(个小时|小时|钟头|h|分钟|分)/i);
      let min: number | null = null;
      let txt = seg;
      if (m) {
        min = /小|h/i.test(m[2]) ? parseFloat(m[1]) * 60 : parseFloat(m[1]);
        txt = seg.replace(m[0], ' ').trim();
      }
      return { t: txt || seg, min: min || 30, cat: guessTimeCat(txt || seg), at };
    });
}
