function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const variants = {
    primary:
      "bg-primary text-white shadow-sm hover:bg-primary-dark focus:ring-primary/20",

    secondary:
      "bg-secondary text-neutral hover:bg-secondary/90 focus:ring-secondary/20",

    tertiary:
      "bg-tertiary text-white shadow-sm hover:bg-tertiary/90 focus:ring-tertiary/20",

    outline:
      "border border-border bg-surface text-neutral hover:bg-background hover:border-primary/30 focus:ring-primary/10",

    ghost:
      "bg-transparent text-neutral-light hover:bg-primary-light hover:text-primary focus:ring-primary/10",

    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20",
  }

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
  }

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        font-medium
        transition-all
        duration-200
        focus:outline-none
        focus:ring-4
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button