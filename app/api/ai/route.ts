import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 大模型代理：DeepSeek Key 只存在于服务端环境变量，前端拿到的只有生成结果。
const STYLE_SYS: Record<string, string> = {
  default:
    '你是一个温柔而有洞察力的记录者，语言克制、真诚、有画面感，偶尔带一点幽默。',
  lyric:
    '你擅长写流行歌曲歌词风格的文案：句式长短错落，有重复和副歌感，意象具体，情绪饱满但不矫情。',
  poem:
    '你擅长用中国古诗词的意蕴与节奏写作：可以化用或新拟诗句，语言典雅凝练，意境悠远，适当使用四六句式。',
  net:
    '你擅长当下中文互联网的口语表达：会用"家人们""谁懂啊""属于是""破防""拿捏""真的会谢"等流行语，轻松幽默有梗。',
};

const MAX_USER_LEN = 20000;

// 简单内存限流：单 IP 每分钟最多 10 次（进程内计数，适合 Demo）
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'local';
}

/** 超限时返回需等待的秒数，未超限返回 null */
function checkRateLimit(ip: string): number | null {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const rec = hits.get(ip);
  if (!rec || rec.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT_MAX
    ? Math.ceil((rec.resetAt - now) / 1000)
    : null;
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ai_not_configured', message: '缺少 DEEPSEEK_API_KEY' },
      { status: 503 }
    );
  }

  const retryAfter = checkRateLimit(clientIp(req));
  if (retryAfter) {
    return NextResponse.json(
      { error: 'rate_limited', message: '请求太频繁，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let payload: { system?: unknown; user?: unknown; style?: unknown } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const user = typeof payload?.user === 'string' ? payload.user.trim() : '';
  if (!user) {
    return NextResponse.json(
      { error: 'bad_request', message: '缺少 user 内容' },
      { status: 400 }
    );
  }
  if (user.length > MAX_USER_LEN) {
    return NextResponse.json(
      { error: 'bad_request', message: '输入过长' },
      { status: 413 }
    );
  }

  const system = typeof payload?.system === 'string' ? payload.system : '';
  const styleKey =
    typeof payload?.style === 'string' && STYLE_SYS[payload.style]
      ? payload.style
      : 'default';

  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(
    /\/+$/,
    ''
  );
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
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
        temperature: 1.15,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              system +
              '\n' +
              STYLE_SYS[styleKey] +
              '\n用中文回答。如果系统提示要求输出 JSON，就只输出严格 JSON，不要 markdown、不要代码块；否则直接给出成段文字，不要使用 markdown 标题符号。',
          },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[api/ai] upstream', res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: 'upstream_error', message: '模型服务返回异常' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json(
        { error: 'empty_response', message: '模型未返回内容' },
        { status: 502 }
      );
    }
    return NextResponse.json({ text: String(text).trim() });
  } catch (e) {
    console.error('[api/ai] request failed', e);
    return NextResponse.json(
      { error: 'upstream_unreachable', message: '模型服务连接失败' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
