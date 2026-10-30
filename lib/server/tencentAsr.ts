// 腾讯云「一句话识别」服务端调用（录音文件识别，适配外部硬件上传的 wav）
// 使用 TC3-HMAC-SHA256 签名，只在服务端执行，SecretKey 不下发。

import { createHash, createHmac, randomBytes } from 'crypto';

const HOST = 'asr.tencentcloudapi.com';
const SERVICE = 'asr';
const ACTION = 'SentenceRecognition';
const VERSION = '2019-06-14';
const TIMEOUT_MS = 30_000;

export type AsrResult = {
  text: string;
  durationSec: number;
  requestId: string;
};

export class AsrError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 502, code = 'asr_error') {
    super(message);
    this.name = 'AsrError';
    this.status = status;
    this.code = code;
  }
}

const sha256 = (s: string) =>
  createHash('sha256').update(s, 'utf8').digest('hex');

const hmac = (key: string | Buffer, s: string) =>
  createHmac('sha256', key).update(s, 'utf8').digest();

function signedHeaders(
  payload: string,
  secretId: string,
  secretKey: string,
  region: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const canonicalHeaders =
    'content-type:application/json; charset=utf-8\n' +
    `host:${HOST}\n` +
    `x-tc-region:${region}\n`;
  const signed = 'content-type;host;x-tc-region';

  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signed,
    sha256(payload),
  ].join('\n');

  const scope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(timestamp),
    scope,
    sha256(canonicalRequest),
  ].join('\n');

  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, SERVICE);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = hmac(secretSigning, stringToSign).toString('hex');

  return {
    'Content-Type': 'application/json; charset=utf-8',
    Host: HOST,
    'X-TC-Action': ACTION,
    'X-TC-Version': VERSION,
    'X-TC-Timestamp': String(timestamp),
    'X-TC-Region': region,
    Authorization:
      `TC3-HMAC-SHA256 Credential=${secretId}/${scope}, ` +
      `SignedHeaders=${signed}, Signature=${signature}`,
  };
}

/**
 * 识别一段音频（默认 16k 中文，单段 ≤ 60 秒）
 * @param audio 音频二进制
 * @param format wav / mp3 / m4a
 */
export async function recognizeAudio(
  audio: Buffer,
  format: string
): Promise<AsrResult> {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new AsrError(
      '缺少腾讯云 SecretId / SecretKey',
      503,
      'asr_not_configured'
    );
  }

  const region = process.env.TENCENT_ASR_REGION || 'ap-guangzhou';
  const payload = JSON.stringify({
    ProjectId: 0,
    SubServiceType: 2,
    EngSerViceType: '16k_zh',
    SourceType: 1,
    VoiceFormat: format,
    Url: '',
    Data: audio.toString('base64'),
    DataLen: audio.byteLength,
    UsrAudioKey: randomBytes(16).toString('hex'),
    FilterDirty: 1,
    FilterModal: 1,
    ConvertNumMode: 1,
    WordInfo: 0,
  });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://${HOST}/`, {
      method: 'POST',
      signal: ctl.signal,
      headers: signedHeaders(payload, secretId, secretKey, region),
      body: payload,
    });

    const raw = await res.text().catch(() => '');
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    const body = data?.Response;
    if (!body) {
      throw new AsrError(
        `语音识别服务返回异常（HTTP ${res.status}）`,
        502,
        'asr_bad_response'
      );
    }
    if (body.Error) {
      throw new AsrError(
        `语音识别失败：${body.Error.Code || ''} ${body.Error.Message || ''}`.trim(),
        502,
        'asr_upstream_error'
      );
    }

    const text = String(body.Result ?? body.Text ?? '').trim();
    return {
      text,
      durationSec: Number(body.AudioDuration) || 0,
      requestId: String(body.RequestId || ''),
    };
  } catch (e) {
    if (e instanceof AsrError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AsrError('语音识别超时，请稍后重试', 504, 'asr_timeout');
    }
    throw new AsrError('语音识别服务连接失败', 502, 'asr_unreachable');
  } finally {
    clearTimeout(timer);
  }
}
