import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../components/auth/Auth.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

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

export default function Register() {
  const { isAuthenticated, loading, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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
    const name = form.name.trim()
    const email = form.email.trim()

    if (!name) {
      nextErrors.name = 'Name is required.'
    } else if (name.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
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
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-shell" aria-labelledby="register-title">
        <div className="auth-intro">
          <span className="auth-sector terminal-text">NEW PLAYER PROFILE</span>
          <span className="auth-orbit" aria-hidden="true">{'{ }'}</span>
          <h1 id="register-title">Begin your legend.</h1>
          <p>Create an account to carry your CodeQuest progress across devices.</p>
          <div className="auth-signal" aria-hidden="true">
            <span />
            <span>CLOUD SAVE READY</span>
          </div>
        </div>

        <div className="auth-card">
          <header className="auth-card-header">
            <p className="page-eyebrow terminal-text">PLAYER REGISTRATION</p>
            <h2>Create your account</h2>
            <p>Your first adventure begins at Level 1 with a fresh cloud save.</p>
          </header>

          {serverError ? <div className="auth-alert" role="alert">{serverError}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="register-name">Name</label>
              <input
                id="register-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                maxLength={50}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
                disabled={submitting}
                placeholder="Player name"
              />
              {errors.name ? <span className="auth-field-error" id="register-name-error">{errors.name}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
                disabled={submitting}
                placeholder="player@example.com"
              />
              {errors.email ? <span className="auth-field-error" id="register-email-error">{errors.email}</span> : null}
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="register-password">Password</label>
                <span>Minimum 8 characters</span>
              </div>
              <input
                id="register-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={128}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'register-password-error' : undefined}
                disabled={submitting}
              />
              {errors.password ? <span className="auth-field-error" id="register-password-error">{errors.password}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password">Confirm password</label>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                maxLength={128}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                disabled={submitting}
              />
              {errors.confirmPassword ? <span className="auth-field-error" id="register-confirm-password-error">{errors.confirmPassword}</span> : null}
            </div>

            <Button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'CREATING PROFILE…' : 'CREATE ACCOUNT'}
            </Button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login" state={location.state}>Login</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
