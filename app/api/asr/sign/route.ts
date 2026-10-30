import { NextResponse } from 'next/server';
import { createHmac, randomInt, randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 腾讯云实时语音识别（WebSocket）握手地址签名。
// SecretKey 只在服务端使用，前端拿到的是带签名、限时 1 小时的 wss 地址。
export async function GET() {
  const appid = process.env.TENCENT_APP_ID;
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!appid || !secretId || !secretKey) {
    return NextResponse.json(
      { error: 'asr_not_configured', message: '缺少腾讯云 APPID / SecretId / SecretKey' },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string> = {
    secretid: secretId,
    timestamp: String(timestamp),
    expired: String(timestamp + 3600),
    nonce: String(randomInt(100000, 999999999)),
    engine_model_type: '16k_zh',
    voice_id: randomUUID().replace(/-/g, ''),
    voice_format: '1',
    needvad: '1',
    vad_silence_time: '1000',
    filter_dirty: '1',
    convert_num_mode: '1',
  };

  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const signStr = `asr.cloud.tencent.com/asr/v2/${appid}?${query}`;
  const signature = createHmac('sha1', secretKey).update(signStr).digest('base64');

  return NextResponse.json({
    url: `wss://asr.cloud.tencent.com/asr/v2/${appid}?${query}&signature=${encodeURIComponent(signature)}`,
  });
}
