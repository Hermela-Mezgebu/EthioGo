function Badge({
  children,
  status = "active",
  size = "md",
  dot = true,
}) {
  const styles = {
    active: {
      container: "bg-primary-light text-primary",
      dot: "bg-primary",
    },

    scheduled: {
      container: "bg-tertiary-light text-tertiary",
      dot: "bg-tertiary",
    },

    delayed: {
      container: "bg-secondary-light text-[#8A6800]",
      dot: "bg-secondary",
    },

    boarding: {
      container: "bg-purple-50 text-purple-700",
      dot: "bg-purple-600",
    },

    cancelled: {
      container: "bg-red-50 text-red-700",
      dot: "bg-red-600",
    },

    landed: {
      container: "bg-slate-100 text-slate-700",
      dot: "bg-slate-500",
    },

    neutral: {
      container: "bg-background text-neutral-light",
      dot: "bg-neutral-muted",
    },
  }

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }

  const currentStyle = styles[status] || styles.neutral

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        font-medium
        ${currentStyle.container}
        ${sizes[size]}
      `}
    >
      {dot && (
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${currentStyle.dot}
          `}
        />
      )}

      {children}
    </span>
  )
}

export default Badge