// Cliente HTTP mínimo + manejo de PINs guardados en el navegador

const ADMIN_KEY = 'buzon:adminPin';
const areaKey = (id: string) => `buzon:areaPin:${id}`;

function safeGet(key: string) {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: se pedirá el PIN otra vez */
  }
}

export const auth = {
  adminPin: () => safeGet(ADMIN_KEY),
  setAdminPin: (pin: string | null) => safeSet(ADMIN_KEY, pin),
  areaPin: (id: string) => safeGet(areaKey(id)),
  setAreaPin: (id: string, pin: string | null) => safeSet(areaKey(id), pin),
  adminHeaders: (): Record<string, string> => ({ 'x-admin-pin': safeGet(ADMIN_KEY) }),
  areaHeaders: (id: string): Record<string, string> => ({ 'x-area-pin': safeGet(areaKey(id)) }),
};

async function request<T>(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string, headers?: Record<string, string>) => request<T>('GET', url, undefined, headers),
  post: <T>(url: string, body: unknown, headers?: Record<string, string>) => request<T>('POST', url, body, headers),
  put: <T>(url: string, body: unknown, headers?: Record<string, string>) => request<T>('PUT', url, body, headers),
  patch: <T>(url: string, body: unknown, headers?: Record<string, string>) => request<T>('PATCH', url, body, headers),
  del: <T>(url: string, headers?: Record<string, string>) => request<T>('DELETE', url, undefined, headers),
};
