const BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

async function authRequest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  loginWithGoogle: (credential) => authRequest('POST', '/auth/google', { credential }),
  logout: () => authRequest('POST', '/auth/logout'),
  getMe: () => authRequest('GET', '/auth/me'),
  sendMessage: (message, history = []) => authRequest('POST', '/chat', { message, history }),
};
