function Card({
  children,
  padding = "md",
  hover = false,
  className = "",
  ...props
}) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  }

  return (
    <div
      className={`
        rounded-xl
        border
        border-border
        bg-surface
        shadow-sm
        transition-all
        duration-200
        ${paddings[padding]}
        ${
          hover
            ? "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
            : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card