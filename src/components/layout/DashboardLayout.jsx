
import { useState } from "react"

import Sidebar from "./Sidebar"
import Header from "./Header"

function DashboardLayout({
  children,
  currentPath = "/",
  user,
  onLogout,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

  const handleNavigation = (path) => {
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
        onClose={() => setMobileSidebarOpen(false)}
        onNavigate={handleNavigation}
      />

      {/* Header */}
      <Header
        currentPath={currentPath}
        user={user}
        onLogout={onLogout}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Main application area */}
      <main className="min-h-screen pt-[72px] lg:pl-[240px]">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout