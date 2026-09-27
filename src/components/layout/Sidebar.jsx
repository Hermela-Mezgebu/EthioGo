import {
  Activity,
  Plane,
  BarChart3,
  Globe2,
  LayoutDashboard,
  Map,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  Settings,
  X,
} from "lucide-react"

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
      },
    ],
  },
  {
    title: "Flight Operations",
    items: [
      {
        label: "Flights",
        icon: Plane,
        path: "/flights",
      },
      {
        label: "Live Flights",
        icon: Activity,
        path: "/live-map",
      },
      {
        label: "Departures",
        icon: PlaneTakeoff,
        path: "/departures",
      },
      {
        label: "Arrivals",
        icon: PlaneLanding,
        path: "/arrivals",
      },
      {
        label: "Routes",
        icon: Route,
        path: "/routes",
      },
    ],
  },
  {
    title: "Explore",
    items: [
      {
        label: "Airports",
        icon: Globe2,
        path: "/airports",
      },
      {
        label: "Airlines",
        icon: BarChart3,
        path: "/airlines",
      },
      {
        label: "Live Map",
        icon: Map,
        path: "/map",
      },
    ],
  },
]

function Sidebar({
  currentPath = "/",
  mobileOpen = false,
  onClose,
  onNavigate,
}) {
  const isActive = (path) => {
    if (path === "/") {
      return currentPath === "/"
    }

    return currentPath.startsWith(path)
  }

  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path)
    }

    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-neutral/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[240px]
          flex-col
          border-r
          border-neutral/10
          bg-neutral
          text-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary">
              <img
                src="/images/aerotrack-logo.png"
                alt="AeroTrack"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none"
                }}
              />

              <Plane
                size={20}
                className="text-white"
              />
            </div>

            <div className="text-left">
              <p className="text-base font-bold tracking-tight">
                AeroTrack
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/50">
                Aviation Intelligence
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() =>
                          handleNavigation(item.path)
                        }
                        className={`
                          group
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          font-medium
                          transition-all
                          duration-200
                          ${
                            active
                              ? "bg-primary text-white shadow-sm"
                              : "text-white/65 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          strokeWidth={active ? 2.2 : 1.8}
                        />

                        <span>{item.label}</span>

                        {item.label === "Live Flights" && (
                          <span
                            className={`
                              ml-auto
                              h-1.5
                              w-1.5
                              rounded-full
                              ${
                                active
                                  ? "bg-white"
                                  : "bg-primary"
                              }
                            `}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() =>
              handleNavigation("/settings")
            }
            className={`
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-sm
              font-medium
              transition-colors
              ${
                isActive("/settings")
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <Settings size={18} />

            <span>Settings</span>
          </button>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />

                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>

              <span className="text-[11px] font-semibold text-white/70">
                AviationStack
              </span>
            </div>

            <p className="mt-1 text-[10px] leading-4 text-white/35">
              Global aviation data connection
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar