import { NextResponse } from 'next/server';
import { readSessionId } from '@/lib/server/supabase';
import { IMAGE_BUCKET, objectPath, uploadPublic } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 浏览器把照片压成 dataURL 后传到这里，服务端解码后落到 images 桶。
const MAX_DATA_URL_CHARS = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function bad(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

export async function POST(req: Request) {
  const sessionId = readSessionId(req);
  if (!sessionId) {
    return bad('missing_session', '缺少或非法的 x-session-id 请求头', 400);
  }

  let payload: { dataUrl?: unknown } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const dataUrl = typeof payload?.dataUrl === 'string' ? payload.dataUrl : '';
  if (!dataUrl) {
    return bad('missing_image', '缺少 dataUrl', 400);
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    return bad('image_too_large', '图片过大', 413);
  }

  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    return bad('bad_image', 'dataUrl 格式不正确', 400);
  }
  const mime = /^data:(image\/(?:jpeg|png|webp));base64$/.exec(dataUrl.slice(0, comma))?.[1];
  if (!mime) {
    return bad('unsupported_image', '仅支持 jpeg / png / webp', 415);
  }

  const bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  if (bytes.byteLength === 0) {
    return bad('empty_image', '图片为空', 400);
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return bad('image_too_large', '图片过大', 413);
  }

  try {
    const url = await uploadPublic(IMAGE_BUCKET, objectPath(sessionId, EXT[mime]), bytes, mime);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message === 'supabase_not_configured') {
      return bad('supabase_not_configured', '缺少 Supabase URL / service_role key', 503);
    }
    console.error('[api/media] upload failed', e);
    return bad('upload_error', '图片上传失败', 502);
  }
}
