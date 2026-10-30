// 腾讯云实时语音识别 —— 基于官方 SDK（tencentcloud-speech-sdk-js）
// 录音、PCM 转换、WebSocket 推流全部交给 SDK；
// 鉴权地址由 /api/asr/sign 在服务端签名，SecretKey 不进入前端。

const SDK_SRC = '/vendor/tencent-speech-sdk.js';
const SILENCE_STOP_MS = 1800; // 一句话结束后静音多久收尾
const NO_SPEECH_MS = 8000; // 一直没开口就结束
const MAX_MS = 30000; // 单次最长录音
const END_WAIT_MS = 2500; // 发送 end 后等待最终结果

let sdkLoading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  const w = window as any;
  if (w.WebAudioSpeechRecognizer && w.SpeechRecognizer) return Promise.resolve();
  if (!sdkLoading) {
    sdkLoading = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SDK_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('speech sdk load failed'));
      document.head.appendChild(s);
    });
  }
  return sdkLoading;
}

async function signUrl(): Promise<string | null> {
  try {
    const res = await fetch('/api/asr/sign', { cache: 'no-store' });
    if (!res.ok) {
      console.warn('[asr] sign failed', res.status);
      return null;
    }
    const j = await res.json();
    return j && j.url ? String(j.url) : null;
  } catch (e) {
    console.warn('[asr] sign error', e);
    return null;
  }
}

/** 把 SDK 五花八门（DOMException / 字符串 / CloseEvent / 服务端 message）的错误翻成人话 */
function describeError(err: any): string {
  const name = (err && err.name) || '';
  const msg = String((err && (err.message || err.reason)) || err || '');
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return '麦克风权限被拒绝：请在地址栏允许麦克风后再试';
  if (
    name === 'NotFoundError' ||
    name === 'OverconstrainedError' ||
    name === 'NotReadableError'
  )
    return '麦克风不可用：' + (msg || name);
  if (/鉴权|签名|4001|4002|4003/.test(msg)) return '识别服务鉴权失败：' + msg;
  if (/连接|WebSocket|1006/i.test(msg)) return '识别服务连接失败：' + msg;
  if (/录音|webAudio|浏览器/.test(msg)) return '录音初始化失败：' + msg;
  return msg ? '语音识别失败：' + msg : '语音识别失败';
}

/** 识别成功返回文本；没听清返回 ''；失败抛出带原因的 Error */
export async function recordWithTencentASR(
  onPartial?: (text: string) => void
): Promise<string> {
  if (typeof window === 'undefined') throw new Error('当前环境不支持录音');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    throw new Error('当前浏览器不支持麦克风录音');

  const wss = await signUrl();
  if (!wss) throw new Error('语音签名服务不可用，请检查 /api/asr/sign 配置');

  try {
    await loadSdk();
  } catch {
    throw new Error('语音组件加载失败');
  }

  const w = window as any;
  const SR = w.SpeechRecognizer;
  const WR = w.WebAudioSpeechRecognizer;
  if (!SR || !WR) throw new Error('语音组件未就绪');

  // SDK 会在地址前补 wss://
  const endpoint = wss.replace(/^wss:\/\//, '');

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let stable = '';
    let live = '';
    let results = 0;
    let lastEnd = Date.now();
    let stopSent = false;
    const startedAt = Date.now();
    let endTimer: ReturnType<typeof setTimeout> | undefined;
    let ticker: ReturnType<typeof setInterval> | undefined;

    const text = () => (stable + live).trim();

    // appid / secretid 只用于拼 URL 占位，真正的带签名地址由 getUrl 覆盖返回
    const sr = new SR({
      appid: 'server-signed',
      secretid: 'server-signed',
      engine_model_type: '16k_zh',
    });
    sr.getUrl = async () => endpoint;

    const rec = new WR({ engine_model_type: '16k_zh' });

    const cleanup = () => {
      if (ticker) clearInterval(ticker);
      if (endTimer) clearTimeout(endTimer);
      if (errTimer) clearTimeout(errTimer);
      try {
        if (rec.recorder) rec.recorder.stop();
      } catch {}
      try {
        if (sr.socket) sr.socket.close();
      } catch {}
    };

    const finish = (v: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(v);
    };
    const fail = (e: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e instanceof Error ? e : new Error(describeError(e)));
    };

    rec.OnSentenceBegin = (res: any) => {
      live = (res && res.voice_text_str) || '';
      if (onPartial) onPartial(text());
    };
    rec.OnRecognitionResultChange = (res: any) => {
      live = (res && res.voice_text_str) || '';
      if (onPartial) onPartial(text());
    };
    rec.OnSentenceEnd = (res: any) => {
      stable += (res && res.voice_text_str) || '';
      live = '';
      results += 1;
      lastEnd = Date.now();
      if (onPartial) onPartial(text());
    };
    rec.OnRecognitionComplete = () => finish(text());
    // SDK 在录音设备失败时会先 stop()（触发「连接未建立」的 socket 错误），
    // 再把真正的设备错误抛出来。连接类错误延迟一拍，让设备错误优先。
    let pendingErr: any = null;
    let errTimer: ReturnType<typeof setTimeout> | undefined;
    const isConnErr = (e: any) =>
      typeof e === 'string' && /连接未建立或连接已关闭/.test(e);
    rec.OnError = (err: any) => {
      console.warn('[asr] sdk error', err && (err.message || err.reason || err), err);
      if (results) {
        finish(text());
        return;
      }
      if (!isConnErr(err)) {
        fail(err);
        return;
      }
      if (!pendingErr) {
        pendingErr = err;
        errTimer = setTimeout(() => {
          const e = pendingErr;
          pendingErr = null;
          fail(e);
        }, 200);
      }
    };

    const stop = () => {
      if (stopSent || settled) return;
      stopSent = true;
      try {
        rec.stop();
      } catch {}
      endTimer = setTimeout(() => finish(text()), END_WAIT_MS);
    };

    ticker = setInterval(() => {
      const now = Date.now();
      if (!results) {
        if (now - startedAt > NO_SPEECH_MS) stop();
      } else if (now - lastEnd > SILENCE_STOP_MS || now - startedAt > MAX_MS) {
        stop();
      }
    }, 200);

    rec.speechRecognizer = sr;
    try {
      rec.start();
    } catch (e) {
      fail(e);
      return;
    }

    // SDK 的 WebRecorder.stop() 只 suspend 不 close，AudioContext 会累积到浏览器上限；
    // 而先 close 再被 SDK 内部二次 stop 又会抛 InvalidStateError。
    // 这里替换成幂等版本：停轨 + 仅关闭未关闭的 AudioContext。
    const r: any = rec.recorder;
    if (r) {
      r.stop = () => {
        try {
          if (r.stream) {
            r.stream.getTracks().forEach((t: any) => t.stop());
            r.stream = null;
          }
        } catch {}
        try {
          const ac = r.audioContext;
          if (ac && ac.state !== 'closed') ac.close().catch(() => {});
        } catch {}
      };
    }
  });
}
