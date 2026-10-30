// 客户端写 records：所有 Supabase 操作都在服务端完成，这里只带 session_id 调接口。
// 本地 localStorage 仍是主数据源，写库失败只告警、不打断用户操作。

import { getSessionId, sessionHeaders } from './session';

export type RecordMode = 'money' | 'time' | 'mood' | 'dream';

export type SaveRecordInput = {
  asr_text: string;
  parsed_data?: unknown;
  insight_text?: string | null;
  audio_url?: string | null;
};

export async function saveRecord(
  mode: RecordMode,
  input: SaveRecordInput
): Promise<string | null> {
  const text = input.asr_text.trim();
  if (!text || !getSessionId()) return null;

  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
      body: JSON.stringify({ mode, ...input, asr_text: text }),
    });
    if (!res.ok) {
      console.warn('[records] save failed', res.status);
      return null;
    }
    const data = await res.json();
    return data?.record?.id ?? null;
  } catch (e) {
    console.warn('[records] save failed', e);
    return null;
  }
}
