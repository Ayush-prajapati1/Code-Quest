import { useEffect, useId, useRef } from 'react'

export default function Modal({
  children,
  open,
  onClose,
  title,
  description,
  actions,
  variant = 'default',
  dismissible = true,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const focusFirst = () => {
      panelRef.current?.querySelector(focusableSelector)?.focus()
    }
    const frame = window.requestAnimationFrame(focusFirst)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (dismissible) {
          onClose?.()
        }
        return
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll(focusableSelector)]

        if (focusable.length === 0) {
          event.preventDefault()
          return
        }

        const first = focusable[0]
        const last = focusable.at(-1)

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [dismissible, onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={dismissible ? onClose : undefined}
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal-panel modal-${variant}`}
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
      >
        {dismissible ? (
          <button
            aria-label="Close dialog"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        ) : null}
        <header className="modal-header">
          <p className="page-eyebrow">SYSTEM MESSAGE</p>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-actions">{actions}</footer>}
      </section>
    </div>
  )
}
