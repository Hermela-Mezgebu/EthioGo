import { useEffect, useState } from "react"

import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import FlightSearch from "./pages/FlightSearch"
import Arrivals from "./pages/Arrivals"
import Departures from "./pages/Departures"
import Airlines from "./pages/Airlines"
import Settings from "./pages/Settings"
import LiveFlights from "./pages/LiveFlights"
import Favorites from "./pages/Favorites"

import DashboardLayout from "./components/layout/DashboardLayout"
import Map from "./pages/Map"
import HelpSupport from "./pages/HelpSupport"

function App() {
  // =========================================================
  // AEROTRACK USER STORAGE KEY
  // =========================================================

  const USER_STORAGE_KEY = "aerotrack_user"

  // =========================================================
  // CURRENT PATH
  // =========================================================

  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  )

  // =========================================================
  // CURRENT USER
  // =========================================================

  const [user, setUser] = useState(() => {
    /*
      Try the new AeroTrack storage key first.
    */

    let savedUser = localStorage.getItem(
      USER_STORAGE_KEY
    )

    /*
      Temporary fallback for users who logged in
      before the project was renamed from EthioFlight.
    */

    if (!savedUser) {
      savedUser = localStorage.getItem(
        "ethioflight_user"
      )

      if (savedUser) {
        localStorage.setItem(
          USER_STORAGE_KEY,
          savedUser
        )

        localStorage.removeItem(
          "ethioflight_user"
        )
      }
    }

    if (!savedUser) {
      return null
    }

    try {
      return JSON.parse(savedUser)
    } catch (error) {
      localStorage.removeItem(
        USER_STORAGE_KEY
      )

      return null
    }
  })

  // =========================================================
  // HANDLE BROWSER BACK / FORWARD
  // =========================================================

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(
        window.location.pathname
      )
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

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigate = (path) => {
    if (
      window.location.pathname === path
    ) {
      return
    }

    window.history.pushState(
      {},
      "",
      path
    )

    setCurrentPath(path)

    /*
      Scroll to the top when navigating
      between pages.
    */

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const handleAuthenticated = (
    authenticatedUser
  ) => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(authenticatedUser)
    )

    setUser(authenticatedUser)

    navigate("/dashboard")
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      USER_STORAGE_KEY
    )

    setUser(null)

    navigate("/")
  }

  // =========================================================
  // LANDING PAGE
  // =========================================================

  if (currentPath === "/") {
    return (
      <div className="min-h-screen bg-background text-neutral">
        <LandingPage
          user={user}
          onLogin={() => navigate("/login")}
          onSignup={() => navigate("/signup")}
          onDashboard={() =>
            navigate("/dashboard")
          }
        />
      </div>
    )
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (currentPath === "/login") {
    return (
      <div className="min-h-screen bg-background text-neutral">
        <Login
          onLogin={handleAuthenticated}
          onSignup={() => navigate("/signup")}
          onBack={() => navigate("/")}
        />
      </div>
    )
  }

  // =========================================================
  // SIGN UP
  // =========================================================

  if (currentPath === "/signup") {
    return (
      <div className="min-h-screen bg-background text-neutral">
        <Signup
          onSignup={handleAuthenticated}
          onLogin={() => navigate("/login")}
          onBack={() => navigate("/")}
        />
      </div>
    )
  }

  // =========================================================
  // PROTECTED DASHBOARD PAGES
  // =========================================================

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
    "/favorites",
    "/support"
  ]

  const isProtectedPage =
    protectedPaths.includes(currentPath)

  // =========================================================
  // PROTECTED PAGE HANDLING
  // =========================================================

  if (isProtectedPage) {
    // -------------------------------------------------------
    // USER IS NOT LOGGED IN
    // -------------------------------------------------------

    if (!user) {
      return (
        <div className="min-h-screen bg-background text-neutral">
          <Login
            onLogin={handleAuthenticated}
            onSignup={() =>
              navigate("/signup")
            }
            onBack={() => navigate("/")}
          />
        </div>
      )
    }

    // -------------------------------------------------------
    // USER IS LOGGED IN
    // -------------------------------------------------------

    return (
      <div className="min-h-screen bg-background text-neutral">
        <DashboardLayout
          currentPath={currentPath}
          user={user}
          onLogout={handleLogout}
        >
          {/* =================================================
              DASHBOARD
          ================================================= */}

          {currentPath === "/dashboard" && (
            <div className="min-h-full bg-background">
              <Dashboard />
            </div>
          )}

          {/* =================================================
              FLIGHT SEARCH
          ================================================= */}

          {currentPath === "/flights" && (
            <div className="min-h-full bg-background">
              <FlightSearch />
            </div>
          )}

          {/* =================================================
              DEPARTURES
          ================================================= */}

          {currentPath === "/departures" && (
            <div className="min-h-full bg-background">
              <Departures />
            </div>
          )}

          {/* =================================================
              ARRIVALS
          ================================================= */}

          {currentPath === "/arrivals" && (
            <div className="min-h-full bg-background">
              <Arrivals />
            </div>
          )}

          {/* =================================================
              AIRLINES
          ================================================= */}

          {currentPath === "/airlines" && (
            <div className="min-h-full bg-background">
              <Airlines />
            </div>
          )}

          {currentPath === "/support" && (
            <div className="min-h-full bg-background">
              <HelpSupport />
            </div>
          )}



          {/* =================================================
              LIVE FLIGHTS
          ================================================= */}

          {currentPath === "/live-map" && (
            <div className="min-h-full bg-background">
             <LiveFlights />
            </div>
          )}

          {/* =================================================
              ROUTES
          ================================================= */}

          {currentPath === "/routes" && (
            <div className="min-h-full bg-background">
              <div className="flex min-h-[500px] items-center justify-center p-6">
                <div className="app-card w-full max-w-lg p-8 text-center">
                  <h1 className="text-lg font-bold text-neutral">
                    Routes
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-neutral-light">
                    Flight route exploration will be
                    available here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              AIRPORTS
          ================================================= */}

          {currentPath === "/airports" && (
            <div className="min-h-full bg-background">
              <div className="flex min-h-[500px] items-center justify-center p-6">
                <div className="app-card w-full max-w-lg p-8 text-center">
                  <h1 className="text-lg font-bold text-neutral">
                    Airports
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-neutral-light">
                    Airport exploration and airport
                    details will be available here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              LIVE MAP
          ================================================= */}

          {currentPath === "/map" && (
            <div className="min-h-full bg-background">
              <Map />
            </div>
          )}

          {currentPath === "/favorites" && (
            <div className="min-h-full bg-background">
              <Favorites />
            </div>
          )}

          {/* =================================================
              SETTINGS
          ================================================= */}

          {currentPath === "/settings" && (
            <div className="min-h-full bg-background">
              <Settings />
            </div>
          )}
        </DashboardLayout>
      </div>
    )
  }

  // =========================================================
  // UNKNOWN PAGE
  // =========================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-neutral">
      <div className="app-card w-full max-w-md p-8 text-center">

        {/* Logo mark */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
          <span className="text-xl font-bold">
            A
          </span>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">
          AeroTrack
        </p>

        <h1 className="mt-2 text-2xl font-bold text-neutral">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-light">
          The page you are looking for does not
          exist or may have been moved.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="primary-button mt-6 w-full"
        >
          Go to AeroTrack
        </button>
      </div>
    </div>
  )
}

export default App