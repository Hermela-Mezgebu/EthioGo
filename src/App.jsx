import { useEffect, useState } from "react"

import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import FlightSearch from "./pages/FlightSearch"
import Arrivals from "./pages/Arrivals"
import DashboardLayout from "./components/layout/DashboardLayout"
import Departures from "./pages/Departures"
import Airlines from "./pages/Airlines"
function App() {
  // ============================================
  // CURRENT PATH
  // ============================================

  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  )

  // ============================================
  // CURRENT USER
  // ============================================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(
      "ethioflight_user"
    )

    if (!savedUser) {
      return null
    }

    try {
      return JSON.parse(savedUser)
    } catch (error) {
      localStorage.removeItem("ethioflight_user")
      return null
    }
  })

  // ============================================
  // HANDLE BROWSER BACK / FORWARD
  // ============================================

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener(
      "popstate",
      handlePopState
    )

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      )
    }
  }, [])

  // ============================================
  // NAVIGATION
  // ============================================

  const navigate = (path) => {
    if (window.location.pathname === path) {
      return
    }

    window.history.pushState({}, "", path)

    setCurrentPath(path)
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  const handleAuthenticated = (authenticatedUser) => {
    localStorage.setItem(
      "ethioflight_user",
      JSON.stringify(authenticatedUser)
    )

    setUser(authenticatedUser)

    navigate("/dashboard")
  }

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = () => {
    localStorage.removeItem("ethioflight_user")

    setUser(null)

    navigate("/")
  }

  // ============================================
  // LANDING PAGE
  // ============================================

  if (currentPath === "/") {
    return (
      <LandingPage
        user={user}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
        onDashboard={() => navigate("/dashboard")}
      />
    )
  }

  // ============================================
  // LOGIN
  // ============================================

  if (currentPath === "/login") {
    return (
      <Login
        onLogin={handleAuthenticated}
        onSignup={() => navigate("/signup")}
        onBack={() => navigate("/")}
      />
    )
  }

  // ============================================
  // SIGN UP
  // ============================================

  if (currentPath === "/signup") {
    return (
      <Signup
        onSignup={handleAuthenticated}
        onLogin={() => navigate("/login")}
        onBack={() => navigate("/")}
      />
    )
  }

  // ============================================
  // PROTECTED DASHBOARD PAGES
  // ============================================

  const protectedPaths = [
    "/dashboard",
    "/flights",
    "/live-map",
    "/departures",
    "/arrivals",
    "/routes",
    "/airports",
    "/airlines",
    "/map",
    "/settings",
  ]

  const isProtectedPage =
    protectedPaths.includes(currentPath)

  if (isProtectedPage) {
    // --------------------------------------------
    // User is not logged in
    // --------------------------------------------

    if (!user) {
      return (
        <Login
          onLogin={handleAuthenticated}
          onSignup={() => navigate("/signup")}
          onBack={() => navigate("/")}
        />
      )
    }

    // --------------------------------------------
    // User is logged in
    // --------------------------------------------

    return (
      <DashboardLayout
        currentPath={currentPath}
        user={user}
        onLogout={handleLogout}
      >
        {/* ========================================
            DASHBOARD
        ======================================== */}

        {currentPath === "/dashboard" && (
          <Dashboard />
        )}

        {/* ========================================
            FLIGHTS
        ======================================== */}

        {currentPath === "/flights" && (
          <FlightSearch />
        )}

        {currentPath === "/departures" && (
          <Departures />
        )}

        {/* ========================================
            FUTURE PAGES
        ======================================== */}

        {currentPath === "/live-map" && (
          <div className="p-6">
            Live Flights page coming soon.
          </div>
        )}

        

        {currentPath === "/arrivals" && (
        <Arrivals />
      )}

        {currentPath === "/routes" && (
          <div className="p-6">
            Routes page coming soon.
          </div>
        )}

        {currentPath === "/airports" && (
          <div className="p-6">
            Airports page coming soon.
          </div>
        )}

        {currentPath === "/airlines" && (
          <Airlines />
        )}

        {currentPath === "/map" && (
          <div className="p-6">
            Live Map page coming soon.
          </div>
        )}

        {currentPath === "/settings" && (
          <div className="p-6">
            Settings page coming soon.
          </div>
        )}
      </DashboardLayout>
    )
  }

  // ============================================
  // UNKNOWN PAGE
  // ============================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-neutral">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm text-neutral/60">
          The page you are looking for does not exist.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default App