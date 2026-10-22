import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ApiError } from '../services/api.js'
import {
  getCurrentUser,
  getToken,
  loadCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken())
  const [user, setUser] = useState(() => getCurrentUser())
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    logoutUser()
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const refreshUser = useCallback(async ({ signal } = {}) => {
    const activeToken = getToken()

    if (!activeToken) {
      logout()
      return null
    }

    try {
      const refreshedUser = await loadCurrentUser(activeToken, { signal })
      setToken(activeToken)
      setUser(refreshedUser)
      return refreshedUser
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
      }

      throw error
    }
  }, [logout])

  useEffect(() => {
    const controller = new AbortController()
    const storedToken = getToken()
    const cachedUser = getCurrentUser()

    async function restoreSession() {
      if (!storedToken) {
        setToken(null)
        setUser(null)
        setLoading(false)
        return
      }

      setToken(storedToken)
      setUser(cachedUser)

      try {
        const refreshedUser = await loadCurrentUser(storedToken, {
          signal: controller.signal,
        })
        setUser(refreshedUser)
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          logoutUser()
          setToken(null)
          setUser(null)
        } else if (!cachedUser) {
          setUser(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    restoreSession()
    return () => controller.abort()
  }, [])

  const register = useCallback(async (credentials) => {
    const session = await registerUser(credentials)
    setToken(session.token)
    setUser(session.user)
    setLoading(false)
    return session
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await loginUser(credentials)
    setToken(session.token)
    setUser(session.user)
    setLoading(false)
    return session
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    register,
    login,
    logout,
    refreshUser,
  }), [loading, login, logout, refreshUser, register, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
