// 语音输入入口：优先腾讯云实时语音识别，其次浏览器 SpeechRecognition，最后模拟文案兜底

import { recordWithTencentASR } from './asr';
import { getVoiceMode } from './storyStore';

export type VoiceKind = 'plan' | 'actual' | 'money' | 'mood' | 'dream' | 'mem';

const MOCK: Record<VoiceKind, string[]> = {
  plan: [
    '今天打算写周报40分钟，看30页书，再跑半小时步',
    '上午写方案两小时，下午开会，晚上看一小时书',
    '打算背单词半小时，健身一小时，早点睡',
  ],
  actual: [
    '写了周报但是花了快一个小时，然后刷了会儿手机，跟朋友吃了个饭，书只看了几页',
    '方案写到一半被拉去开会，晚上加班，书没看',
    '背了单词，健身去了，但是又追剧到十二点',
  ],
  money: [
    '早上咖啡 28，中午外卖 35，晚上和朋友吃饭 AA80',
    '打车 26，超市买菜 64，奶茶 18',
    '买了本书 59，健身房月卡 299，地铁 6 块',
  ],
  mood: [
    '今天有点累，但把该做的事都做完了，心里还算踏实',
    '下午被一句话刺到了，到现在还没缓过来',
    '晚饭后散了会儿步，风吹着很舒服，忽然就没那么烦了',
  ],
  dream: [
    '想在海边开一间只卖一本书的小书店',
    '想学会弹吉他，在某个夏天弹给一个人听',
    '想一个人坐一次很慢的火车，去很远的地方',
  ],
  mem: [
    '今天一起去了那家很小的面馆，他把最后一颗卤蛋夹给我',
    '吵了一架，但是回去的路上他还是牵了我的手',
  ],
};

function mockText(kind: VoiceKind): string {
  const arr = MOCK[kind] || MOCK.mood;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 浏览器原生识别兜底；失败或没听清都返回 ''，不再自动填入模拟文案 */
function browserListen(): Promise<string> {
  return new Promise((resolve) => {
    let settled = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const finish = (t: string) => {
      if (settled) return;
      settled = true;
      if (watchdog) clearTimeout(watchdog);
      resolve(t);
    };

    watchdog = setTimeout(() => finish(''), 6000);

    const SR =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (SR) {
      try {
        const r = new (SR as new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
        })();
        r.lang = 'zh-CN';
        r.interimResults = false;
        r.maxAlternatives = 1;
        r.onresult = (e) => finish(e.results[0][0].transcript);
        r.onerror = () => finish('');
        r.onend = () => finish('');
        r.start();
        return;
      } catch {
        finish('');
      }
    }
    finish('');
  });
}

export async function listen(
  kind: VoiceKind,
  onPartial?: (text: string) => void
): Promise<string> {
  if (typeof window === 'undefined') return '';

  // 设置里手动选了「模拟」时，保持原来的演示行为
  if (getVoiceMode() === 'mock') {
    await new Promise((r) => setTimeout(r, 1200));
    return mockText(kind);
  }

  let asrErr: unknown = null;
  try {
    return await recordWithTencentASR(onPartial);
  } catch (e) {
    asrErr = e;
  }

  // 腾讯云链路失败时退回浏览器自带识别；再失败就把真实原因抛给界面
  const fallback = await browserListen();
  if (fallback) return fallback;

  throw asrErr instanceof Error
    ? asrErr
    : new Error('语音识别失败，请再说一次（也可以直接打字）');
}
