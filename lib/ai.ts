// AI 调用层（React 侧）：请求服务端 /api/ai 代理，Key 不进入浏览器

export type AIResult = { text: string; mock: boolean };

export async function aiCall(
  system: string,
  user: string,
  fallback: () => string,
  style = 'default'
): Promise<AIResult> {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 30000);
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user, style }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const text = j?.text;
    if (!text) throw new Error('empty');
    return { text: String(text).trim(), mock: false };
  } catch {
    return { text: fallback(), mock: true };
  } finally {
    clearTimeout(to);
  }
}
