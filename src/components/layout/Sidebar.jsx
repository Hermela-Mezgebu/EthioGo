import {
  Activity,
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  Map,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";

const navigationItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Live Flights",
    icon: Activity,
    path: "/live-map",
    live: true,
  },
  {
    label: "Flight Search",
    icon: Search,
    path: "/flights",
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
    label: "Airports",
    icon: Map,
    path: "/airports",
  },
  {
    label: "Airlines",
    icon: BarChart3,
    path: "/airlines",
  },
  {
    label: "Map",
    icon: Map,
    path: "/map",
  },
  {
    label: "Favorites",
    icon: Star,
    path: "/favorites",
  },
];

function Sidebar({
  currentPath = "/dashboard",
  mobileOpen = false,
  onClose,
  onNavigate,
}) {
  /*
   * Determine whether a navigation item is active.
   */
  const isActive = (path) => {
    if (path === "/dashboard") {
      return (
        currentPath === "/dashboard" ||
        currentPath === "/"
      );
    }

    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`)
    );
  };

  /*
   * Handle navigation.
   *
   * Uses the application's onNavigate callback when
   * available. Otherwise falls back to browser history.
   */
  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, "", path);

      window.dispatchEvent(
        new PopStateEvent("popstate")
      );
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* ============================================================
          MOBILE BACKDROP
      ============================================================ */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* ============================================================
          SIDEBAR
      ============================================================ */}
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
          overflow-hidden
          border-r
          border-white/[0.06]
          bg-[#0B1713]
          text-white
          shadow-xl
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
        {/* ========================================================
            BRAND HEADER
        ======================================================== */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <button
            type="button"
            onClick={() =>
              handleNavigation("/dashboard")
            }
            className="flex items-center gap-3"
          >
            {/* Logo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#087A47] shadow-sm">
              <img
                src="/images/aerotrack-logo.png"
                alt="AeroTrack"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

              {/* Fallback icon */}
              <Plane
                size={22}
                strokeWidth={2}
                className="absolute text-white"
              />
            </div>

            {/* Brand text */}
            <div className="text-left">
              <p className="text-[17px] font-bold leading-tight tracking-tight text-white">
                EthioGo
              </p>

              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Aviation Intelligence
              </p>
            </div>
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================
            NAVIGATION
        ======================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    handleNavigation(item.path)
                  }
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`
                    group
                    flex
                    min-h-[44px]
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3.5
                    text-left
                    transition-all
                    duration-150
                    ${
                      active
                        ? "bg-[#087A47] text-white shadow-sm"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }
                  `}
                >
                  {/* Icon */}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`
                      shrink-0
                      transition-colors
                      ${
                        active
                          ? "text-white"
                          : "text-white/50 group-hover:text-white/80"
                      }
                    `}
                  />

                  {/* Label */}
                  <span
                    className={`
                      text-[13px]
                      font-medium
                      leading-none
                      ${
                        active
                          ? "text-white"
                          : "text-white/65 group-hover:text-white"
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Live indicator */}
                  {item.live && (
                    <span
                      className={`
                        relative
                        ml-auto
                        flex
                        h-2
                        w-2
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          active
                            ? "bg-white"
                            : "bg-[#0A9B5B]"
                        }
                      `}
                    >
                      {!active && (
                        <span className="absolute h-full w-full animate-ping rounded-full bg-[#0A9B5B] opacity-40" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ========================================================
            BOTTOM AREA
        ======================================================== */}
        <div className="shrink-0 border-t border-white/[0.06] px-3 pb-4 pt-3">
          {/* Settings */}
          <button
            type="button"
            onClick={() =>
              handleNavigation("/settings")
            }
            className={`
              flex
              min-h-[44px]
              w-full
              items-center
              gap-3
              rounded-lg
              px-3.5
              text-left
              transition-colors
              ${
                isActive("/settings")
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white"
              }
            `}
          >
            <Settings
              size={19}
              strokeWidth={1.8}
            />

            <span className="text-[13px] font-medium">
              Settings
            </span>
          </button>

          {/* Help & Support */}
          <button
            type="button"
            onClick={() =>
              handleNavigation("/support")
            }
            className={`
              mt-1
              flex
              min-h-[44px]
              w-full
              items-center
              gap-3
              rounded-lg
              px-3.5
              text-left
              transition-colors
              ${
                isActive("/support")
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white"
              }
            `}
          >
            <HelpCircle
              size={19}
              strokeWidth={1.8}
            />

            <span className="text-[13px] font-medium">
              Help &amp; Support
            </span>
          </button>

          {/* ======================================================
              DEVELOPER PROFILE
          ====================================================== */}
          <div className="mt-3 flex min-h-[58px] items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.045] px-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#26352F]">
              <span className="text-base">
                👨🏽‍💻
              </span>
            </div>

            {/* Profile information */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-white">
                Hermela
              </p>

              <p className="mt-1 truncate text-[10px] text-white/40">
                Frontend Developer
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;