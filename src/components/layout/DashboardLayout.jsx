import { useState } from "react"

import Sidebar from "./Sidebar"
import Header from "./Header"


function DashboardLayout({
  children,
  currentPath = "/",
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

  const handleNavigation = (path) => {
    /*
     * This is intentionally simple for now.
     *
     * When you install/configure React Router,
     * replace this with navigate(path).
     */

    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path)

      window.dispatchEvent(
        new PopStateEvent("popstate")
      )
    }

    setMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        mobileOpen={mobileSidebarOpen}
        onClose={() =>
          setMobileSidebarOpen(false)
        }
        onNavigate={handleNavigation}
      />

      {/* Header */}
      <Header
        currentPath={currentPath}
        onMenuClick={() =>
          setMobileSidebarOpen(true)
        }
      />

      {/* Main application area */}
      <main className="min-h-screen pt-[72px] lg:pl-[240px]">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout