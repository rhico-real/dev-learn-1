const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SESSION_STORAGE_KEY = 'runhop.session';

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message && typeof data.message === 'string'
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(', ')
          : 'Request failed';

    throw new Error(message);
  }

  return data;
}

export function login(payload) {
  return request('/auth/login', payload);
}

export function register(payload) {
  return request('/auth/register', payload);
}

export function saveSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession() {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
