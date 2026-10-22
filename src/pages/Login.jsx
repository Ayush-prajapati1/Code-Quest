import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../components/auth/Auth.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getDestination(location) {
  const from = location.state?.from

  if (!from || typeof from.pathname !== 'string') {
    return '/dashboard'
  }

  if (from.pathname === '/login' || from.pathname === '/register') {
    return '/dashboard'
  }

  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
}

export default function Login() {
  const { isAuthenticated, loading, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const destination = getDestination(location)

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading" role="status">Restoring your session…</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  function validate() {
    const nextErrors = {}
    const email = form.email.trim()

    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error?.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-intro">
          <span className="auth-sector terminal-text">SECURE PLAYER ACCESS</span>
          <span className="auth-orbit" aria-hidden="true">{'</>'}</span>
          <h1 id="login-title">Return to the quest.</h1>
          <p>Sign in to restore your cloud save and continue from any device.</p>
          <div className="auth-signal" aria-hidden="true">
            <span />
            <span>ACCOUNT SYNC ONLINE</span>
          </div>
        </div>

        <div className="auth-card">
          <header className="auth-card-header">
            <p className="page-eyebrow terminal-text">PLAYER LOGIN</p>
            <h2>Access your campaign</h2>
            <p>Your progress is tied to your private CodeQuest account.</p>
          </header>

          {serverError ? <div className="auth-alert" role="alert">{serverError}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                disabled={submitting}
                placeholder="player@example.com"
              />
              {errors.email ? <span className="auth-field-error" id="login-email-error">{errors.email}</span> : null}
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <span>8+ characters</span>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                disabled={submitting}
              />
              {errors.password ? <span className="auth-field-error" id="login-password-error">{errors.password}</span> : null}
            </div>

            <Button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'CONNECTING…' : 'LOGIN'}
            </Button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/register" state={location.state}>Register</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
