import { NextResponse } from 'next/server';
import {
  createRecord,
  isRecordMode,
  listRecords,
  readSessionId,
  type RecordMode,
} from '@/lib/server/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// records 表只允许服务端读写；前端凭 x-session-id 设备串做数据隔离。

function bad(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

export async function GET(req: Request) {
  const sessionId = readSessionId(req);
  if (!sessionId) {
    return bad('missing_session', '缺少或非法的 x-session-id 请求头', 400);
  }

  const { searchParams } = new URL(req.url);
  const modeRaw = searchParams.get('mode');
  let mode: RecordMode | undefined;
  if (modeRaw) {
    if (!isRecordMode(modeRaw)) {
      return bad('unsupported_mode', 'mode 仅支持 money / time / mood / dream', 400);
    }
    mode = modeRaw;
  }

  const limitRaw = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50;

  try {
    const records = await listRecords(sessionId, { mode, limit });
    return NextResponse.json({ ok: true, records });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message === 'supabase_not_configured') {
      return bad('supabase_not_configured', '缺少 Supabase URL / service_role key', 503);
    }
    console.error('[api/records] list failed', e);
    return bad('records_error', '读取记录失败', 502);
  }
}

export async function POST(req: Request) {
  const sessionId = readSessionId(req);
  if (!sessionId) {
    return bad('missing_session', '缺少或非法的 x-session-id 请求头', 400);
  }

  let payload: {
    mode?: unknown;
    audio_url?: unknown;
    asr_text?: unknown;
    parsed_data?: unknown;
    insight_text?: unknown;
  } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  if (!isRecordMode(payload?.mode)) {
    return bad('unsupported_mode', 'mode 仅支持 money / time / mood / dream', 400);
  }

  const asrText = typeof payload?.asr_text === 'string' ? payload.asr_text.trim() : null;
  if (!asrText) {
    return bad('missing_text', '缺少 asr_text', 400);
  }
  if (asrText.length > 5000) {
    return bad('text_too_long', 'asr_text 过长', 413);
  }

  try {
    const record = await createRecord({
      session_id: sessionId,
      mode: payload.mode,
      audio_url: typeof payload.audio_url === 'string' ? payload.audio_url : null,
      asr_text: asrText,
      parsed_data: payload.parsed_data ?? null,
      insight_text:
        typeof payload.insight_text === 'string' ? payload.insight_text.trim() : null,
    });
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message === 'supabase_not_configured') {
      return bad('supabase_not_configured', '缺少 Supabase URL / service_role key', 503);
    }
    console.error('[api/records] create failed', e);
    return bad('records_error', '写入记录失败', 502);
  }
}
