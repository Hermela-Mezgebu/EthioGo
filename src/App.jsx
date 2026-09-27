import { useEffect, useState } from "react"

import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"

import DashboardLayout from "./components/layout/DashboardLayout"

function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  )

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("ethioflight_user")

    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, "", path)
    setCurrentPath(path)
  }

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(
      "ethioflight_user",
      JSON.stringify(loggedInUser)
    )

    setUser(loggedInUser)

    navigate("/dashboard")
  }

  const handleLogout = () => {
    localStorage.removeItem("ethioflight_user")

    setUser(null)

    navigate("/")
  }

  // Landing page
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

  // Login page
  if (currentPath === "/login") {
    return (
      <Login
        onLogin={handleLogin}
        onSignup={() => navigate("/signup")}
        onBack={() => navigate("/")}
      />
    )
  }

  // Signup page
  if (currentPath === "/signup") {
    return (
      <Signup
        onSignup={handleLogin}
        onLogin={() => navigate("/login")}
        onBack={() => navigate("/")}
      />
    )
  }

  // Dashboard
  if (currentPath === "/dashboard") {
    if (!user) {
      navigate("/login")
      return null
    }

    return (
      <DashboardLayout
        currentPath={currentPath}
        user={user}
        onLogout={handleLogout}
      >
        <Dashboard />
      </DashboardLayout>
    )
  }

  // Unknown route
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-neutral">
          Page Not Found
        </h1>

        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default App