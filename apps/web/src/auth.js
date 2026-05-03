const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SESSION_STORAGE_KEY = 'runhop.session';

function unwrapData(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload.data && typeof payload.data === 'object' ? payload.data : payload;
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const displayName =
    typeof user.displayName === 'string' ? user.displayName.trim() : '';

  if (!displayName) {
    return null;
  }

  return {
    ...user,
    displayName,
  };
}

function normalizeSession(session) {
  const data = unwrapData(session);

  if (!data || typeof data !== 'object') {
    return null;
  }

  const accessToken =
    typeof data.accessToken === 'string' ? data.accessToken.trim() : '';
  const refreshToken =
    typeof data.refreshToken === 'string' ? data.refreshToken.trim() : '';
  const user = normalizeUser(data.user);

  if (!accessToken || !refreshToken || !user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

function getErrorMessage(data) {
  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return 'Request failed';
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const { method = 'GET', payload, token } = options;
  const headers = {};

  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(getErrorMessage(data));
    error.status = response.status;
    throw error;
  }

  return data;
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    payload,
  });
}

export function register(payload) {
  return request('/auth/register', {
    method: 'POST',
    payload,
  });
}

export async function getCurrentUser(accessToken) {
  const data = await request('/users/me', {
    method: 'GET',
    token: accessToken,
  });

  const user = normalizeUser(unwrapData(data));

  if (!user) {
    throw new Error('Invalid user payload');
  }

  return user;
}

export function saveSession(session) {
  const normalizedSession = normalizeSession(session);

  if (!normalizedSession) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizedSession));
  return normalizedSession;
}

export function loadSession() {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalizedSession = normalizeSession(parsed);

    if (!normalizedSession) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return normalizedSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function restoreSession(session = loadSession()) {
  const normalizedSession = normalizeSession(session);

  if (!normalizedSession) {
    clearSession();
    return null;
  }

  try {
    const user = await getCurrentUser(normalizedSession.accessToken);
    const refreshedSession = {
      ...normalizedSession,
      user,
    };

    saveSession(refreshedSession);
    return refreshedSession;
  } catch (error) {
    if (error instanceof Error && error.status === 401) {
      clearSession();
      return null;
    }

    throw error;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
