// 客户端上传图片：页面先把照片压成 dataURL，再交给服务端落到 Supabase images 桶。
// 本地仍是主数据源，上传失败只告警、返回 null，不打断保存。

import { getSessionId, sessionHeaders } from './session';

const MAX_DATA_URL_CHARS = 8 * 1024 * 1024;

export async function uploadImage(dataUrl: string): Promise<string | null> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.length > MAX_DATA_URL_CHARS) return null;
  if (!getSessionId()) return null;

  try {
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) {
      console.warn('[media] upload failed', res.status);
      return null;
    }
    const data = await res.json();
    return typeof data?.url === 'string' ? data.url : null;
  } catch (e) {
    console.warn('[media] upload failed', e);
    return null;
  }
}
