function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-neutral"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`
          w-full
          rounded-lg
          border
          bg-surface
          px-4
          py-2.5
          text-sm
          text-neutral
          outline-none
          transition-all
          duration-200
          placeholder:text-neutral-muted
          focus:border-primary
          focus:ring-4
          focus:ring-primary/10
          disabled:cursor-not-allowed
          disabled:bg-background
          disabled:opacity-60
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              : "border-border"
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="mt-1.5 text-xs text-neutral-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Input