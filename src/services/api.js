const LOCAL_API_URL = 'http://localhost:5000/api'
const PRODUCTION_API_URL = 'https://code-quest-u7vu.onrender.com/api'

const DEFAULT_API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || LOCAL_API_URL
  : PRODUCTION_API_URL

export const AUTH_TOKEN_STORAGE_KEY = 'codequest_auth_token'

function normalizeBaseUrl(value) {
  const candidate = typeof value === 'string' ? value.trim() : ''
  return (candidate || DEFAULT_API_URL).replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeBaseUrl(DEFAULT_API_URL)

function readStoredToken() {
  try {
    const token = globalThis.localStorage?.getItem(AUTH_TOKEN_STORAGE_KEY)
    return typeof token === 'string' && token.trim() ? token.trim() : null
  } catch {
    return null
  }
}

function parseResponseBody(text, contentType) {
  if (!text) {
    return null
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload, fallback) {
  if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
    return payload.message
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallback
}

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, {
  method = 'GET',
  body,
  headers = {},
  token,
  auth = true,
  signal,
} = {}) {
  const requestPath = String(path ?? '').startsWith('/') ? String(path) : `/${path}`
  const requestHeaders = new Headers(headers)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const resolvedToken = token || readStoredToken()

  if (auth && resolvedToken) {
    requestHeaders.set('Authorization', `Bearer ${resolvedToken}`)
  }

  if (body !== undefined && body !== null && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  requestHeaders.set('Accept', 'application/json')

  let response

  try {
    response = await fetch(`${API_BASE_URL}${requestPath}`, {
      method,
      headers: requestHeaders,
      body: body === undefined || body === null || isFormData
        ? body
        : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new ApiError(
      'Unable to reach the CodeQuest server. Check your connection and try again.',
      { cause: error },
    )
  }

  const text = response.status === 204 ? '' : await response.text()
  const payload = parseResponseBody(text, response.headers.get('content-type') ?? '')

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
      { status: response.status, data: payload },
    )
  }

  return payload
}

function unwrapGameData(payload, fallback) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload.gameData && typeof payload.gameData === 'object') {
      return payload.gameData
    }

    if (payload.progress && typeof payload.progress === 'object') {
      return payload.progress
    }

    if (payload.data && typeof payload.data === 'object') {
      return payload.data.gameData ?? payload.data.progress ?? payload.data
    }

    return payload
  }

  return fallback
}

export async function getPlayerProgress(token, { signal } = {}) {
  if (!token) {
    throw new ApiError('Authentication is required to load cloud progress.', { status: 401 })
  }

  const payload = await apiRequest('/player/progress', { token, signal })
  const gameData = unwrapGameData(payload, null)

  if (!gameData || typeof gameData !== 'object' || Array.isArray(gameData)) {
    throw new ApiError('The server returned invalid player progress data.')
  }

  return gameData
}

export async function savePlayerProgress(token, player, { signal } = {}) {
  if (!token) {
    throw new ApiError('Authentication is required to save cloud progress.', { status: 401 })
  }

  if (!player || typeof player !== 'object' || Array.isArray(player)) {
    throw new TypeError('Player progress must be an object.')
  }

  const payload = await apiRequest('/player/progress', {
    method: 'PUT',
    token,
    signal,
    body: { gameData: player },
  })

  return unwrapGameData(payload, player)
}
