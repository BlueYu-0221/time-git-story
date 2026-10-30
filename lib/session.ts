// 前端设备标识：首次访问生成一次并存入 localStorage，之后随请求头带给服务端。
// 不需要登录，靠这个随机串隔离不同设备的数据。

const KEY = 'gsdg_session_id';
const RE = /^[A-Za-z0-9_-]{8,128}$/;

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {
    /* 降级到下面的随机串 */
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** 读取已有 session_id；没有或格式不对时生成并持久化 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const cur = localStorage.getItem(KEY);
    if (cur && RE.test(cur)) return cur;
    const id = genId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // 隐私模式等无法写入时，本次仍返回一个临时 id
    return genId();
  }
}

/** 需要服务端识别设备时加到请求头 */
export function sessionHeaders(): Record<string, string> {
  const id = getSessionId();
  return id ? { 'x-session-id': id } : {};
}
