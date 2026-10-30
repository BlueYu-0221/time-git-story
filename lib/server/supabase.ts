// 服务端 Supabase 访问层：使用 service_role key，仅在 route handler / 服务端代码中引用。
// 浏览器端拿不到 service_role key，所有 records 表的读写都必须经过这里。

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const RECORD_MODES = ['money', 'time', 'mood', 'dream'] as const;
export type RecordMode = (typeof RECORD_MODES)[number];

export function isRecordMode(v: unknown): v is RecordMode {
  return typeof v === 'string' && (RECORD_MODES as readonly string[]).includes(v);
}

export type RecordRow = {
  id: string;
  mode: RecordMode;
  session_id: string | null;
  audio_url: string | null;
  asr_text: string | null;
  parsed_data: unknown;
  insight_text: string | null;
  created_at: string;
};

export type NewRecord = {
  session_id: string;
  mode: RecordMode;
  audio_url?: string | null;
  asr_text?: string | null;
  parsed_data?: unknown;
  insight_text?: string | null;
};

const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;

/** 校验前端生成并放在 x-session-id 请求头里的设备串 */
export function isSessionId(v: string | null | undefined): v is string {
  return typeof v === 'string' && SESSION_ID_RE.test(v);
}

export function readSessionId(req: Request): string | null {
  const raw = req.headers.get('x-session-id')?.trim() ?? '';
  return isSessionId(raw) ? raw : null;
}

let cached: SupabaseClient | null | undefined;

/** 未配置 URL / service_role key 时返回 null，调用方按 503 处理 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return cached;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'guangyin-story/server' } },
  });
  return cached;
}

export async function createRecord(input: NewRecord): Promise<RecordRow> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('supabase_not_configured');

  const { data, error } = await db
    .from('records')
    .insert({
      session_id: input.session_id,
      mode: input.mode,
      audio_url: input.audio_url ?? null,
      asr_text: input.asr_text ?? null,
      parsed_data: input.parsed_data ?? null,
      insight_text: input.insight_text ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as RecordRow;
}

export type ListOptions = {
  mode?: RecordMode;
  limit?: number;
};

export async function listRecords(
  sessionId: string,
  opts: ListOptions = {}
): Promise<RecordRow[]> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('supabase_not_configured');

  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);

  let query = db
    .from('records')
    .select('id, mode, session_id, audio_url, asr_text, parsed_data, insight_text, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.mode) query = query.eq('mode', opts.mode);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as RecordRow[];
}
