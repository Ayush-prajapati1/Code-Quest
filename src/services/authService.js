import {
  apiRequest,
  AUTH_TOKEN_STORAGE_KEY,
} from './api.js'

export const AUTH_USER_STORAGE_KEY = 'codequest_auth_user'

function getStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function normalizeUser(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const {
    gameData: _gameData,
    password: _password,
    passwordHash: _passwordHash,
    ...safeUser
  } = value
  const rawId = safeUser.id ?? safeUser._id

  if (rawId !== undefined && rawId !== null) {
    safeUser.id = String(rawId)
  }

  return safeUser
}

function normalizeAuthResponse(payload) {
  const source = payload?.data && typeof payload.data === 'object'
    ? payload.data
    : payload
  const token = typeof source?.token === 'string' ? source.token.trim() : ''
  const user = normalizeUser(source?.user)

  if (!token || !user) {
    throw new Error('The server returned an invalid authentication response.')
  }

  return { token, user }
}

function persistSession(session) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  try {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token)
    storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user))
  } catch {
    // Authentication still works in memory when browser storage is unavailable.
  }
}

export function getToken() {
  const storage = getStorage()

  try {
    const token = storage?.getItem(AUTH_TOKEN_STORAGE_KEY)
    return typeof token === 'string' && token.trim() ? token.trim() : null
  } catch {
    return null
  }
}

export function getCurrentUser() {
  const storage = getStorage()

  try {
    const serializedUser = storage?.getItem(AUTH_USER_STORAGE_KEY)
    return serializedUser ? normalizeUser(JSON.parse(serializedUser)) : null
  } catch {
    return null
  }
}

export async function registerUser(credentials) {
  const payload = await apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: credentials,
  })
  const session = normalizeAuthResponse(payload)
  persistSession(session)
  return session
}

export async function loginUser(credentials) {
  const payload = await apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: credentials,
  })
  const session = normalizeAuthResponse(payload)
  persistSession(session)
  return session
}

export function logoutUser() {
  const storage = getStorage()

  try {
    storage?.removeItem(AUTH_TOKEN_STORAGE_KEY)
    storage?.removeItem(AUTH_USER_STORAGE_KEY)
  } catch {
    // In-memory auth state is still cleared by AuthContext.
  }
}

export async function loadCurrentUser(token = getToken(), { signal } = {}) {
  if (!token) {
    return null
  }

  const payload = await apiRequest('/auth/me', { token, signal })
  const source = payload?.data && typeof payload.data === 'object'
    ? payload.data
    : payload
  const user = normalizeUser(source?.user ?? source)

  if (!user) {
    throw new Error('The server returned an invalid user profile.')
  }

  persistSession({ token, user })
  return user
}
