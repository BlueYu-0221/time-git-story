import { NextResponse } from 'next/server';
import {
  isAudioMode,
  parseByMode,
  insightPrompt,
  fallbackInsight,
} from '@/lib/audioModes';
import { AsrError, recognizeAudio } from '@/lib/server/tencentAsr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 外部硬件上传 wav → 识别文本 → 结构化结果 → 洞察文案
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function detectFormat(name: string, type: string): string {
  const n = name.toLowerCase();
  const t = type.toLowerCase();
  if (n.endsWith('.mp3') || t.includes('mpeg')) return 'mp3';
  if (n.endsWith('.m4a') || n.endsWith('.mp4') || t.includes('mp4')) return 'm4a';
  return 'wav';
}

function bad(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

/** 生成洞察文案；未配置 Key 或调用失败时返回 null，由调用方兜底 */
async function askAI(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(
    /\/+$/,
    ''
  );
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20_000);
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.9,
        max_tokens: 200,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text ? String(text).trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  if (!process.env.TENCENT_SECRET_ID || !process.env.TENCENT_SECRET_KEY) {
    return bad('asr_not_configured', '缺少腾讯云 SecretId / SecretKey', 503);
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return bad('bad_request', '请使用 multipart/form-data 上传', 400);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad('bad_request', '无法解析表单数据', 400);
  }

  const modeRaw = String(form.get('mode') ?? '').trim().toLowerCase();
  const mode = modeRaw || 'money';
  if (!isAudioMode(mode)) {
    return bad('unsupported_mode', 'mode 仅支持 money / time / mood / dream', 400);
  }

  const file = form.get('audio');
  if (!file || typeof file === 'string') {
    return bad('missing_audio', '缺少 audio 音频文件', 400);
  }
  if (file.size === 0) {
    return bad('empty_audio', 'audio 音频文件为空', 400);
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return bad('audio_too_large', '音频过大（上限 5MB / 60 秒）', 413);
  }

  const audio = Buffer.from(await file.arrayBuffer());
  const format = detectFormat(file.name || '', file.type || '');

  let text = '';
  let durationSec = 0;
  try {
    const asr = await recognizeAudio(audio, format);
    text = asr.text;
    durationSec = asr.durationSec;
  } catch (e) {
    if (e instanceof AsrError) return bad(e.code, e.message, e.status);
    return bad('asr_error', '语音识别失败', 502);
  }

  if (!text) {
    return bad('no_speech', '没有识别到语音内容，请说得清楚一些', 422);
  }

  const parsed = parseByMode(mode, text);
  const prompt = insightPrompt(mode, text, parsed);
  const aiText = await askAI(prompt.system, prompt.user);

  return NextResponse.json({
    ok: true,
    mode,
    text,
    parsed,
    insight: aiText || fallbackInsight(mode, parsed),
    meta: {
      audioFormat: format,
      audioBytes: audio.byteLength,
      durationSec,
      insightSource: aiText ? 'ai' : 'fallback',
      elapsedMs: Date.now() - startedAt,
    },
  });
}
