export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...buttonProps
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
