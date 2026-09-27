import { useEffect, useMemo, useState } from "react"

import {
  Bell,
  CheckCircle2,
  LogOut,
  Menu,
  Moon,
  Plane,
  Search,
  Sun,
  User,
  XCircle,
} from "lucide-react"

import { searchFlight } from "../../services/aviationStack"


function Header({
  currentPath = "/",
  user,
  onLogout,
  onMenuClick,
}) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [searchResult, setSearchResult] = useState(null)

  const [apiConnected, setApiConnected] = useState(false)

  const [darkMode, setDarkMode] = useState(false)

  const [profileOpen, setProfileOpen] = useState(false)


  // --------------------------------------------------
  // Current user information
  // --------------------------------------------------

  const userName = user?.name?.trim() || "User"

  const userEmail = user?.email?.trim() || ""

  const userInitials = useMemo(() => {
    if (!userName) {
      return "U"
    }

    const parts = userName
      .split(" ")
      .filter(Boolean)

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase()
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }, [userName])


  // --------------------------------------------------
  // Theme
  // --------------------------------------------------

  useEffect(() => {
    const storedTheme =
      localStorage.getItem("aerotrack-theme")

    if (storedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])


  const toggleTheme = () => {
    const nextValue = !darkMode

    setDarkMode(nextValue)

    localStorage.setItem(
      "aerotrack-theme",
      nextValue ? "dark" : "light"
    )

    if (nextValue) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }


  // --------------------------------------------------
  // Flight search
  // --------------------------------------------------

  const handleSearch = async (event) => {
    event.preventDefault()

    const value = query.trim().toUpperCase()

    if (!value) {
      setSearchError("Enter a flight number.")
      setSearchResult(null)
      return
    }

    setSearching(true)
    setSearchError("")
    setSearchResult(null)

    try {
      const response = await searchFlight(value)

      if (response?.data?.length) {
        setSearchResult(response.data[0])
        setApiConnected(true)
      } else {
        setSearchError(
          `No live flight result found for ${value}.`
        )

        setApiConnected(true)
      }
    } catch (error) {
      console.error(
        "AviationStack search error:",
        error
      )

      setSearchError(
        error?.message ||
          "Unable to connect to AviationStack."
      )

      setApiConnected(false)
    } finally {
      setSearching(false)
    }
  }


  const closeSearchResult = () => {
    setSearchResult(null)
    setSearchError("")
  }


  const handleLogout = () => {
    setProfileOpen(false)

    if (onLogout) {
      onLogout()
    }
  }


  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatAirport = (airport) => {
    if (!airport) {
      return "Unknown"
    }

    return (
      airport.iata ||
      airport.icao ||
      airport.airport ||
      "Unknown"
    )
  }


  const getFlightStatus = (flight) => {
    if (!flight?.flight_status) {
      return "Unknown"
    }

    return flight.flight_status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  }


  // --------------------------------------------------
  // Header
  // --------------------------------------------------

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 h-[72px] border-b border-border bg-surface lg:left-[240px]">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">

          {/* ---------------------------------------- */}
          {/* Left */}
          {/* ---------------------------------------- */}

          <div className="flex min-w-0 items-center gap-3">

            {/* Mobile menu */}
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg p-2 text-neutral-light hover:bg-background lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>


            {/* Desktop breadcrumb */}
            <div className="hidden items-center gap-2 text-sm md:flex">

              <Plane
                size={17}
                className="text-primary"
              />

              <span className="text-neutral-muted">
                Operations
              </span>

              <span className="text-neutral-muted">
                /
              </span>

              <span className="font-semibold text-neutral">
                {currentPath === "/"
                  ? "Flight Matrix"
                  : "AeroTrack"}
              </span>
            </div>


            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Plane size={16} />
              </div>

              <span className="font-bold text-neutral">
                AeroTrack
              </span>
            </div>
          </div>


          {/* ---------------------------------------- */}
          {/* Search */}
          {/* ---------------------------------------- */}

          <form
            onSubmit={handleSearch}
            className="relative hidden w-full max-w-[360px] lg:block"
          >
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search flight, airport or airline..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-border
                bg-background
                pl-10
                pr-10
                text-sm
                text-neutral
                outline-none
                transition
                placeholder:text-neutral-muted
                focus:border-primary
                focus:ring-4
                focus:ring-primary/10
              "
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  closeSearchResult()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral"
                aria-label="Clear search"
              >
                <XCircle size={17} />
              </button>
            )}
          </form>


          {/* ---------------------------------------- */}
          {/* Right */}
          {/* ---------------------------------------- */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* API connection */}
            <div
              className={`
                hidden
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1.5
                sm:flex
                ${
                  apiConnected
                    ? "border-primary/20 bg-primary-light"
                    : "border-border bg-background"
                }
              `}
            >
              <span className="relative flex h-2 w-2">

                {apiConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                )}

                <span
                  className={`
                    relative
                    h-2
                    w-2
                    rounded-full
                    ${
                      apiConnected
                        ? "bg-primary"
                        : "bg-neutral-muted"
                    }
                  `}
                />
              </span>

              <span
                className={`
                  text-[11px]
                  font-medium
                  ${
                    apiConnected
                      ? "text-primary"
                      : "text-neutral-light"
                  }
                `}
              >
                {apiConnected
                  ? "AviationStack Connected"
                  : "AviationStack"}
              </span>
            </div>


            {/* Notifications */}
            <button
              type="button"
              className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>


            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>


            {/* -------------------------------------- */}
            {/* User profile */}
            {/* -------------------------------------- */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setProfileOpen((open) => !open)
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white transition hover:opacity-90"
                title={userName}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                {userInitials}
              </button>


              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">

                  {/* User information */}
                  <div className="border-b border-border p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {userInitials}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-neutral">
                          {userName}
                        </p>

                        {userEmail && (
                          <p className="truncate text-xs text-neutral-muted">
                            {userEmail}
                          </p>
                        )}

                      </div>
                    </div>
                  </div>


                  {/* Profile */}
                  <div className="p-2">

                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-light transition hover:bg-background hover:text-neutral"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <User size={17} />

                      <span>
                        My Profile
                      </span>
                    </button>


                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={17} />

                      <span>
                        Logout
                      </span>
                    </button>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>


      {/* -------------------------------------------- */}
      {/* Search Result Dropdown */}
      {/* -------------------------------------------- */}

      {(searchResult ||
        searchError ||
        searching) && (
        <div className="fixed left-4 right-4 top-[82px] z-50 mx-auto max-w-[360px] lg:left-auto lg:right-6 lg:mx-0">

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xl">

            {/* Searching */}
            {searching && (
              <div className="flex items-center gap-3">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />

                <span className="text-sm text-neutral-light">
                  Searching AviationStack...
                </span>

              </div>
            )}


            {/* Search result */}
            {!searching && searchResult && (
              <div>

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="font-mono text-lg font-bold text-neutral">
                      {searchResult.flight?.iata ||
                        searchResult.flight?.icao ||
                        "Unknown"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-muted">
                      {searchResult.airline?.name ||
                        "Unknown airline"}
                    </p>

                  </div>


                  <span className="rounded-full bg-primary-light px-2 py-1 text-[11px] font-semibold text-primary">
                    {getFlightStatus(
                      searchResult
                    )}
                  </span>

                </div>


                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-lg bg-background p-3">

                    <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                      Departure
                    </p>

                    <p className="mt-1 font-mono text-sm font-bold text-neutral">
                      {formatAirport(
                        searchResult.departure
                      )}
                    </p>

                  </div>


                  <div className="rounded-lg bg-background p-3">

                    <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                      Arrival
                    </p>

                    <p className="mt-1 font-mono text-sm font-bold text-neutral">
                      {formatAirport(
                        searchResult.arrival
                      )}
                    </p>

                  </div>

                </div>


                <div className="mt-3 flex items-center gap-2 text-xs text-primary">

                  <CheckCircle2 size={15} />

                  Live result received from AviationStack

                </div>

              </div>
            )}


            {/* Search error */}
            {!searching && searchError && (
              <div className="flex gap-3">

                <XCircle
                  size={19}
                  className="shrink-0 text-red-600"
                />

                <div>

                  <p className="text-sm font-semibold text-neutral">
                    Flight search
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    {searchError}
                  </p>

                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}


export default Header