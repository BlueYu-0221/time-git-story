// 服务端 Supabase Storage：图片 / 音频分别落到 images、audio 两个公开桶。
// 写入统一用 service_role（仅服务端可见），读走 public URL，不需要签名。

import { getSupabaseAdmin } from './supabase';

export const IMAGE_BUCKET = process.env.SUPABASE_BUCKET_IMAGES || 'images';
export const AUDIO_BUCKET = process.env.SUPABASE_BUCKET_AUDIO || 'audio';

/** {sessionId}/{yyyyMM}/{随机串}.{ext}：按设备归档，且不会同名覆盖 */
export function objectPath(sessionId: string, ext: string): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const rand = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `${sessionId}/${ym}/${rand}.${ext}`;
}

/** 上传到公开桶并返回可直接访问的 URL；失败时抛错，由调用方决定是否降级 */
export async function uploadPublic(
  bucket: string,
  path: string,
  data: Blob | ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('supabase_not_configured');

  const { error } = await db.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: false,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);

  const { data: pub } = db.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}
