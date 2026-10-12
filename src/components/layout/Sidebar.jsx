
import {
  Activity,
  Building2,
  LayoutDashboard,
  LogOut,
  Map,
  Plane,
  Search,
  Settings,
  X,
} from "lucide-react";

const navigationGroups = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    title: "FLIGHT TRACKING",
    items: [
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
        label: "Live Flight Map",
        icon: Map,
        path: "/map",
      },
    ],
  },
  {
    title: "AVIATION DIRECTORY",
    items: [
      {
        label: "Airports",
        icon: Building2,
        path: "/airports",
      },
      {
        label: "Airlines",
        icon: Plane,
        path: "/airlines",
      },
    ],
  },
];

function Sidebar({
  currentPath = "/dashboard",
  mobileOpen = false,
  onClose,
  onNavigate,
  onLogout,
}) {
  const isActive = (path) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard";
    }

    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`)
    );
  };

  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    onClose?.();
  };

  const handleLogout = () => {
    onClose?.();

    if (onLogout) {
      onLogout();
      return;
    }

    // Fallback only: connect your actual authentication
    // logout function through the onLogout prop.
    console.warn(
      "Logout is not connected. Pass an onLogout callback to Sidebar."
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[250px] flex-col
          overflow-hidden
          border-r border-border
          bg-background text-foreground
          shadow-sm
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-5">
          <button
            type="button"
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center gap-3"
            aria-label="Go to dashboard"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary">
              <img
                src="/images/aerotrack-logo.png"
                alt="EthioGo"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <Plane
                size={22}
                strokeWidth={2}
                className="absolute text-primary-foreground"
              />
            </div>

            <div className="text-left">
              <p className="text-[17px] font-bold leading-tight tracking-tight text-foreground">
                EthioGo
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Global Aviation
              </p>
            </div>
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto px-3 py-6"
        >
          <div className="space-y-7">
            {navigationGroups.map((group) => (
              <section key={group.title}>
                <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
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
                          group flex min-h-[44px] w-full
                          items-center gap-3 rounded-lg
                          px-3.5 text-left
                          transition-all duration-150
                          ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }
                        `}
                      >
                        <Icon
                          size={19}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={`
                            shrink-0 transition-colors
                            ${
                              active
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground"
                            }
                          `}
                        />

                        <span
                          className={`
                            flex-1 text-[13px] leading-none
                            ${
                              active
                                ? "font-semibold"
                                : "font-medium"
                            }
                          `}
                        >
                          {item.label}
                        </span>

                        {item.live && (
                          <span
                            className="relative ml-auto flex h-2 w-2 shrink-0"
                            aria-label="Live flights"
                            title="Live flights"
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-border px-3 pb-4 pt-3">
          {/* Settings */}
          <button
            type="button"
            onClick={() => handleNavigation("/settings")}
            aria-current={
              isActive("/settings") ? "page" : undefined
            }
            className={`
              flex min-h-[44px] w-full items-center gap-3
              rounded-lg px-3.5 text-left
              transition-colors
              ${
                isActive("/settings")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }
            `}
          >
            <Settings
              size={19}
              strokeWidth={isActive("/settings") ? 2.2 : 1.8}
            />

            <span className="text-[13px] font-medium">
              Settings
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="
              mt-1 flex min-h-[44px] w-full
              items-center gap-3 rounded-lg
              px-3.5 text-left
              text-muted-foreground
              transition-colors
              hover:bg-destructive/10
              hover:text-destructive
            "
          >
            <LogOut size={19} strokeWidth={1.8} />

            <span className="text-[13px] font-medium">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
