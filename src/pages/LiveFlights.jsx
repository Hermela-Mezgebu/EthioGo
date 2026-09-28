import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  LocateFixed,
  Minus,
  Moon,
  Plane,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Star,
  Sun,
  X,
} from "lucide-react";

import { getLiveFlights } from "../services/aviationStack";
import { useTheme } from "../context/ThemeContext";

// Reuse the application's existing sidebar.
// If your actual file is different, change only this import.
import Sidebar from "../components/layout/Sidebar";

const REFRESH_INTERVAL = 15000;

/* =========================================================
   FLIGHT HELPERS
========================================================= */

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.icao ||
    flight?.flight?.number ||
    flight?.flight_iata ||
    flight?.callsign ||
    "Unknown"
  );
}

function getAirlineName(flight) {
  return (
    flight?.airline?.name ||
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "Unknown Airline"
  );
}

function getAirlineCode(flight) {
  return (
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "—"
  );
}

function getStatus(flight) {
  const status =
    flight?.flight_status ||
    flight?.status ||
    "unknown";

  return String(status).toLowerCase();
}

function getDepartureCode(flight) {
  return (
    flight?.departure?.iata ||
    flight?.departure?.icao ||
    "—"
  );
}

function getArrivalCode(flight) {
  return (
    flight?.arrival?.iata ||
    flight?.arrival?.icao ||
    "—"
  );
}

function getDepartureAirport(flight) {
  return (
    flight?.departure?.airport ||
    "Unknown Airport"
  );
}

function getArrivalAirport(flight) {
  return (
    flight?.arrival?.airport ||
    "Unknown Airport"
  );
}

function getAircraftType(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    flight?.aircraft?.registration ||
    "Unknown"
  );
}

function getRegistration(flight) {
  return (
    flight?.aircraft?.registration ||
    "—"
  );
}

function getAltitudeNumber(flight) {
  const altitude = flight?.live?.altitude;

  if (
    altitude === null ||
    altitude === undefined ||
    Number.isNaN(Number(altitude))
  ) {
    return null;
  }

  return Number(altitude);
}

function getAltitude(flight) {
  const altitude = getAltitudeNumber(flight);

  if (altitude === null) {
    return "—";
  }

  return `${Math.round(altitude).toLocaleString()} ft`;
}

function getFlightLevel(flight) {
  const altitude = getAltitudeNumber(flight);

  if (altitude === null) {
    return "—";
  }

  return `FL${Math.round(altitude / 100)}`;
}

function getSpeed(flight) {
  const speed = flight?.live?.speed_horizontal;

  if (
    speed === null ||
    speed === undefined ||
    Number.isNaN(Number(speed))
  ) {
    return "—";
  }

  return `${Math.round(Number(speed))} km/h`;
}

function getHeading(flight) {
  const heading = flight?.live?.direction;

  if (
    heading === null ||
    heading === undefined ||
    Number.isNaN(Number(heading))
  ) {
    return "—";
  }

  const rounded = Math.round(Number(heading));

  let direction = "";

  if (rounded >= 337.5 || rounded < 22.5) {
    direction = "N";
  } else if (rounded < 67.5) {
    direction = "NE";
  } else if (rounded < 112.5) {
    direction = "E";
  } else if (rounded < 157.5) {
    direction = "SE";
  } else if (rounded < 202.5) {
    direction = "S";
  } else if (rounded < 247.5) {
    direction = "SW";
  } else if (rounded < 292.5) {
    direction = "W";
  } else {
    direction = "NW";
  }

  return `${rounded}° ${direction}`;
}

function getLatitude(flight) {
  const value = flight?.live?.latitude;

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  return Number(value);
}

function getLongitude(flight) {
  const value = flight?.live?.longitude;

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  return Number(value);
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status) {
  switch (status) {
    case "active":
      return "Airborne";

    case "scheduled":
      return "Scheduled";

    case "landed":
      return "Landed";

    case "cancelled":
      return "Cancelled";

    case "incident":
      return "Incident";

    case "diverted":
      return "Diverted";

    case "en-route":
      return "En Route";

    default:
      return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Unknown";
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "active":
    case "en-route":
      return "bg-success/10 text-success border-success/30";

    case "scheduled":
      return "bg-info/10 text-info border-info/30";

    case "landed":
      return "bg-background text-neutral-light border-border";

    case "cancelled":
    case "incident":
      return "bg-danger/10 text-danger border-danger/30";

    case "diverted":
      return "bg-secondary-light text-warning border-warning/30";

    default:
      return "bg-background text-neutral-light border-border";
  }
}

function getStatusDot(status) {
  switch (status) {
    case "active":
    case "en-route":
      return "bg-success";

    case "scheduled":
      return "bg-info";

    case "cancelled":
    case "incident":
      return "bg-danger";

    case "diverted":
      return "bg-warning";

    default:
      return "bg-neutral-muted";
  }
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function normalizeFlights(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.flights)) {
    return response.flights;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
}

function isQuotaError(error) {
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "";

  return /quota|limit|monthly|rate|usage|429/i.test(
    String(message)
  );
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load live flight data."
  );
}

/* =========================================================
   MAP POSITION
========================================================= */

/*
 * Geographic area used for the tactical visualization.
 *
 * This is not a full geographic map. It simply converts
 * real AviationStack latitude/longitude coordinates into
 * positions inside the radar panel.
 */
const MAP_BOUNDS = {
  minLongitude: 25,
  maxLongitude: 60,
  minLatitude: -10,
  maxLatitude: 25,
};

function getMapPosition(flight) {
  const latitude = getLatitude(flight);
  const longitude = getLongitude(flight);

  if (
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  const rawX =
    ((longitude - MAP_BOUNDS.minLongitude) /
      (MAP_BOUNDS.maxLongitude -
        MAP_BOUNDS.minLongitude)) *
    100;

  const rawY =
    (1 -
      (latitude - MAP_BOUNDS.minLatitude) /
        (MAP_BOUNDS.maxLatitude -
          MAP_BOUNDS.minLatitude)) *
    100;

  const x = Math.max(
    5,
    Math.min(95, rawX)
  );

  const y = Math.max(
    7,
    Math.min(93, rawY)
  );

  return {
    x,
    y,
  };
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LiveFlights() {
  const { theme, toggleTheme } = useTheme();

  const [flights, setFlights] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [airlineFilter, setAirlineFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [altitudeFilter, setAltitudeFilter] =
    useState("all");

  const [selectedFlight, setSelectedFlight] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [mapLayer, setMapLayer] =
    useState("IFR High");

  const [showFir, setShowFir] =
    useState(true);

  const [showAirways, setShowAirways] =
    useState(true);

  const [mapZoom, setMapZoom] =
    useState(1);

  /* =====================================================
     LOAD REAL AVIATIONSTACK DATA
  ===================================================== */

  const loadFlights = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getLiveFlights({
            limit: 100,
            offset: 0,
          });

        const incomingFlights =
          normalizeFlights(response);

        setFlights(incomingFlights);

        setLastUpdated(new Date());

        /*
         * Keep the currently selected flight
         * selected after refresh when possible.
         */
        setSelectedFlight((current) => {
          if (!current) {
            return incomingFlights[0] || null;
          }

          const currentNumber =
            getFlightNumber(current);

          return (
            incomingFlights.find(
              (flight) =>
                getFlightNumber(flight) ===
                currentNumber
            ) ||
            incomingFlights[0] ||
            null
          );
        });
      } catch (err) {
        console.error(
          "Live flights error:",
          err
        );

        setError(
          isQuotaError(err)
            ? "AviationStack has reached its API quota or rate limit. Please try again later."
            : getErrorMessage(err)
        );

        /*
         * Do not replace real data with fake data.
         */
        setFlights([]);
        setSelectedFlight(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadFlights();

    const interval = setInterval(() => {
      loadFlights(true);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadFlights]);

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const airlines = useMemo(() => {
    const names = flights
      .map((flight) =>
        getAirlineName(flight)
      )
      .filter(Boolean);

    return [...new Set(names)].sort();
  }, [flights]);

  const statuses = useMemo(() => {
    const values = flights
      .map((flight) =>
        getStatus(flight)
      )
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [flights]);

  /* =====================================================
     FILTERED FLIGHTS
  ===================================================== */

  const filteredFlights = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return flights.filter((flight) => {
      const flightNumber =
        getFlightNumber(flight)
          .toLowerCase();

      const airline =
        getAirlineName(flight)
          .toLowerCase();

      const departure =
        getDepartureCode(flight)
          .toLowerCase();

      const arrival =
        getArrivalCode(flight)
          .toLowerCase();

      const matchesSearch =
        !query ||
        flightNumber.includes(query) ||
        airline.includes(query) ||
        departure.includes(query) ||
        arrival.includes(query);

      const matchesAirline =
        airlineFilter === "all" ||
        getAirlineName(flight) ===
          airlineFilter;

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(flight) ===
          statusFilter;

      const altitude =
        getAltitudeNumber(flight);

      let matchesAltitude = true;

      if (altitudeFilter === "high") {
        matchesAltitude =
          altitude !== null &&
          altitude >= 30000;
      }

      if (altitudeFilter === "medium") {
        matchesAltitude =
          altitude !== null &&
          altitude >= 15000 &&
          altitude < 30000;
      }

      if (altitudeFilter === "low") {
        matchesAltitude =
          altitude !== null &&
          altitude < 15000;
      }

      if (altitudeFilter === "unknown") {
        matchesAltitude =
          altitude === null;
      }

      return (
        matchesSearch &&
        matchesAirline &&
        matchesStatus &&
        matchesAltitude
      );
    });
  }, [
    flights,
    search,
    airlineFilter,
    statusFilter,
    altitudeFilter,
  ]);

  /* =====================================================
     FLIGHT COUNTS
  ===================================================== */

  const activeFlights = useMemo(
    () =>
      flights.filter((flight) => {
        const status =
          getStatus(flight);

        return (
          status === "active" ||
          status === "en-route"
        );
      }),
    [flights]
  );

  const mapFlights = useMemo(
    () =>
      activeFlights
        .map((flight) => ({
          flight,
          position:
            getMapPosition(flight),
        }))
        .filter(
          (item) => item.position !== null
        )
        .slice(0, 30),
    [activeFlights]
  );

  const selected =
    selectedFlight ||
    activeFlights[0] ||
    flights[0] ||
    null;

  /* =====================================================
     FILTER ACTIONS
  ===================================================== */

  const clearFilters = () => {
    setSearch("");
    setAirlineFilter("all");
    setStatusFilter("all");
    setAltitudeFilter("all");
  };

  const hasFilters =
    search.trim() !== "" ||
    airlineFilter !== "all" ||
    statusFilter !== "all" ||
    altitudeFilter !== "all";

  const ThemeIcon =
    theme === "dark" ? Sun : Moon;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* =================================================
          REUSABLE SIDEBAR
      ================================================= */}

      <Sidebar activeItem="live-flights" />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="fixed left-0 right-0 top-0 z-40 h-[72px] border-b border-border bg-surface shadow-sm">
        <div className="flex h-full items-center justify-between px-5 lg:pl-[10px] lg:pr-6">
          {/* Breadcrumb */}

          <div className="hidden items-center gap-2 text-xs font-semibold md:flex">
            <Radar className="h-4 w-4 text-primary" />

            <span className="text-neutral-muted">
              Operations
            </span>

            <span className="text-neutral-muted">
              /
            </span>

            <span className="text-neutral">
              Live Flights
            </span>
          </div>

          {/* Search */}

          <div className="mx-4 flex h-10 w-full max-w-[380px] items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search className="h-[18px] w-[18px] text-neutral-muted" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search flight, airport or airline..."
              className="w-full bg-transparent text-sm text-neutral outline-none placeholder:text-neutral-muted"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="rounded-md p-1 text-neutral-muted transition-colors hover:bg-surface hover:text-neutral"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Header actions */}

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-primary-light px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />

              <span className="text-xs font-semibold text-success">
                AviationStack Connected
              </span>
            </div>

            <button
              type="button"
              title="Notifications"
              className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              aria-label="Toggle theme"
              className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary-dark text-sm font-bold text-white sm:flex">
              H
            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-screen bg-background ">
        <div className="mx-auto max-w-[1400px] p-4 md:p-6">
          <div className="flex flex-col gap-5">
            {/* ============================================
                TITLE
            ============================================ */}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Activity className="h-4 w-4" />

                  Live Operations
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-neutral md:text-3xl">
                  Live Flight Matrix
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-neutral-light">
                  Monitor active aircraft and live aviation
                  activity using real-time AviationStack
                  flight data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-success/30 bg-primary-light px-3 py-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />

                  <span className="text-xs font-semibold text-success">
                    Live Monitoring
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================
                ERROR
            ============================================ */}

            {error && (
              <div className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-danger/10 p-2 text-danger">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-danger">
                      Unable to load live flights
                    </h3>

                    <p className="mt-1 text-sm text-danger">
                      {error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    loadFlights(true)
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-danger/30 bg-surface px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                >
                  <RefreshCw className="h-4 w-4" />

                  Try Again
                </button>
              </div>
            )}

            {/* ============================================
                FILTER TOOLBAR
            ============================================ */}

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3 shadow-sm">
              <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-2">
                {/* Search */}

                <div className="relative flex min-w-[220px] flex-1 items-center">
                  <Search className="absolute left-3 h-4 w-4 text-neutral-muted" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Filter callsign, flight #..."
                    className="h-[38px] w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-neutral outline-none placeholder:text-neutral-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                {/* Airline */}

                <div className="relative">
                  <select
                    value={airlineFilter}
                    onChange={(event) =>
                      setAirlineFilter(
                        event.target.value
                      )
                    }
                    className="h-[38px] appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-xs font-semibold text-neutral outline-none transition-colors focus:border-primary"
                  >
                    <option value="all">
                      All Airlines
                    </option>

                    {airlines.map(
                      (airline) => (
                        <option
                          key={airline}
                          value={airline}
                        >
                          {airline}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-neutral-muted" />
                </div>

                {/* Status */}

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="h-[38px] appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-xs font-semibold text-neutral outline-none transition-colors focus:border-primary"
                  >
                    <option value="all">
                      All Statuses
                    </option>

                    {statuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {getStatusLabel(
                            status
                          )}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-neutral-muted" />
                </div>

                {/* Altitude */}

                <div className="relative">
                  <select
                    value={altitudeFilter}
                    onChange={(event) =>
                      setAltitudeFilter(
                        event.target.value
                      )
                    }
                    className="h-[38px] appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-xs font-semibold text-neutral outline-none transition-colors focus:border-primary"
                  >
                    <option value="all">
                      All Altitudes
                    </option>

                    <option value="high">
                      FL300+
                    </option>

                    <option value="medium">
                      FL150–FL299
                    </option>

                    <option value="low">
                      Below FL150
                    </option>

                    <option value="unknown">
                      Unknown
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-neutral-muted" />
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-primary-dark transition-colors hover:bg-primary-light"
                  >
                    <X className="h-4 w-4" />

                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Count */}

                <div className="flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-neutral">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />

                  {activeFlights.length} Aircraft Monitored
                </div>

                {/* Auto refresh */}

                <div className="hidden items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-[11px] font-semibold text-neutral-light sm:flex">
                  <RefreshCw className="h-3.5 w-3.5" />

                  15s AUTO
                </div>

                {/* Refresh */}

                <button
                  type="button"
                  onClick={() =>
                    loadFlights(true)
                  }
                  disabled={refreshing}
                  className="flex h-[38px] items-center gap-2 rounded-lg bg-primary-dark px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={
                      refreshing
                        ? "h-4 w-4 animate-spin"
                        : "h-4 w-4"
                    }
                  />

                  <span>
                    {refreshing
                      ? "Refreshing..."
                      : "Refresh Now"}
                  </span>
                </button>
              </div>
            </section>

            {/* ============================================
                RADAR
            ============================================ */}

            <section className="relative h-[600px] w-full overflow-hidden rounded-xl bg-[#0c1512] shadow-md md:h-[640px]">
              {/* Radar canvas */}

              <div
                className="absolute inset-0 transition-transform duration-300"
                style={{
                  transform: `scale(${mapZoom})`,
                  transformOrigin: "center",
                }}
              >
                {/* Background grid */}

                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(53,183,126,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(53,183,126,0.10) 1px, transparent 1px)",
                    backgroundSize:
                      "60px 60px",
                  }}
                />

                {/* Radar glow */}

                <div className="absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

                {/* Rings */}

                <RadarRing
                  size="180px"
                  border="border-primary/30"
                />

                <RadarRing
                  size="360px"
                  border="border-primary/25"
                />

                <RadarRing
                  size="540px"
                  border="border-primary/20"
                />

                <RadarRing
                  size="720px"
                  border="border-primary/15"
                />

                {/* Crosshair */}

                <div className="absolute left-0 right-0 top-1/2 h-px bg-primary/15" />

                <div className="absolute bottom-0 left-1/2 top-0 w-px bg-primary/15" />

                {/* FIR */}

                {showFir && (
                  <div className="absolute left-[25%] top-[15%] h-[65%] w-[48%] rotate-[-6deg] rounded-[35%] border border-dashed border-primary/40 bg-primary/5" />
                )}

                {/* Airways */}

                {showAirways && (
                  <>
                    <div className="absolute left-[20%] top-[60%] h-px w-[65%] rotate-[-28deg] border-t border-dashed border-primary/30" />

                    <div className="absolute left-[25%] top-[30%] h-px w-[65%] rotate-[25deg] border-t border-dashed border-primary/25" />

                    <div className="absolute left-[48%] top-[35%] h-[45%] w-px rotate-[12deg] border-l border-dashed border-primary/25" />
                  </>
                )}

                {/* ADD central node */}

                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute -inset-4 rounded-full border border-secondary/30" />

                  <div className="absolute -inset-2 animate-ping rounded-full bg-secondary/10" />

                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary shadow-[0_0_15px_rgba(243,189,49,0.8)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#0c1512]" />
                  </div>

                  <div className="absolute left-6 top-0 whitespace-nowrap text-[10px] font-bold tracking-wider text-secondary">
                    ADD
                  </div>
                </div>

                {/* Real aircraft markers */}

                {mapFlights.map(
                  ({
                    flight,
                    position,
                  }) => {
                    const isSelected =
                      selected &&
                      getFlightNumber(
                        selected
                      ) ===
                        getFlightNumber(
                          flight
                        );

                    return (
                      <button
                        key={`${getFlightNumber(
                          flight
                        )}-${getRegistration(
                          flight
                        )}`}
                        type="button"
                        onClick={() =>
                          setSelectedFlight(
                            flight
                          )
                        }
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                        }}
                        title={`${getFlightNumber(
                          flight
                        )} • ${getDepartureCode(
                          flight
                        )} → ${getArrivalCode(
                          flight
                        )}`}
                      >
                        <span
                          className={`absolute -inset-3 rounded-full ${
                            isSelected
                              ? "animate-ping bg-secondary/20"
                              : "bg-primary/10"
                          }`}
                        />

                        <span
                          className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-secondary bg-secondary text-[#0c1512]"
                              : "border-primary/60 bg-primary text-white"
                          } shadow-lg`}
                        >
                          <Plane
                            className="h-3.5 w-3.5"
                            style={{
                              transform: `rotate(${
                                flight?.live
                                  ?.direction ||
                                0
                              }deg)`,
                            }}
                          />
                        </span>

                        <span className="absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                          {getFlightNumber(
                            flight
                          )}
                        </span>
                      </button>
                    );
                  }
                )}

                {/* No coordinate message */}

                {!loading &&
                  activeFlights.length >
                    0 &&
                  mapFlights.length ===
                    0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-center backdrop-blur-md">
                        <Plane className="mx-auto h-6 w-6 text-primary" />

                        <p className="mt-2 text-sm font-semibold text-white">
                          Live flights detected
                        </p>

                        <p className="mt-1 text-xs text-white/60">
                          Position coordinates are
                          not available for the
                          current API response.
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* ==========================================
                  MAP HEADER
              ========================================== */}

              <div className="absolute left-5 top-5 z-30">
                <div className="rounded-xl bg-black/60 p-1 shadow-md backdrop-blur-md">
                  <div className="flex items-center">
                    {[
                      "IFR High",
                      "VFR Sectional",
                      "Weather Radar",
                    ].map((layer) => (
                      <button
                        key={layer}
                        type="button"
                        onClick={() =>
                          setMapLayer(layer)
                        }
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                          mapLayer === layer
                            ? "bg-primary text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFir(
                        (value) =>
                          !value
                      )
                    }
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm transition-colors ${
                      showFir
                        ? "bg-black/70 text-white"
                        : "bg-black/40 text-white/50"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />

                    FIR HAAA
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAirways(
                        (value) =>
                          !value
                      )
                    }
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm transition-colors ${
                      showAirways
                        ? "bg-black/70 text-white"
                        : "bg-black/40 text-white/50"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />

                    Airways
                  </button>
                </div>
              </div>

              {/* ==========================================
                  MAP INFORMATION
              ========================================== */}

              <div className="absolute left-5 top-[105px] z-20">
                <div className="rounded-lg bg-black/50 px-3 py-2 backdrop-blur-md">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    FIR: HAAA
                  </div>

                  <div className="mt-1 text-[11px] text-white/60">
                    Addis Ababa ACC
                  </div>
                </div>
              </div>

              {/* ==========================================
                  ZOOM
              ========================================== */}

              <div className="absolute bottom-5 left-5 z-30 flex items-center gap-1.5 rounded-xl bg-black/70 p-1.5 shadow-md backdrop-blur-md">
                <button
                  type="button"
                  onClick={() =>
                    setMapZoom(
                      (value) =>
                        Math.min(
                          value + 0.1,
                          1.5
                        )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMapZoom(
                      (value) =>
                        Math.max(
                          value - 0.1,
                          0.7
                        )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-white/20" />

                <button
                  type="button"
                  onClick={() =>
                    setMapZoom(1)
                  }
                  className="flex h-8 items-center gap-1 rounded-lg bg-white/10 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <LocateFixed className="h-3.5 w-3.5 text-secondary" />

                  Re-center ADD
                </button>
              </div>

              {/* ==========================================
                  SELECTED FLIGHT TELEMETRY
              ========================================== */}

              {selected && (
                <div className="absolute right-5 top-5 z-30 w-[340px] max-w-[calc(100%-40px)] rounded-xl bg-surface p-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-neutral">
                          {getFlightNumber(
                            selected
                          )}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClasses(
                            getStatus(
                              selected
                            )
                          )}`}
                        >
                          {getStatusLabel(
                            getStatus(
                              selected
                            )
                          )}
                        </span>
                      </div>

                      <span className="text-xs text-neutral-light">
                        {getAirlineName(
                          selected
                        )}{" "}
                        ·{" "}
                        {getAirlineCode(
                          selected
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFlight(
                          null
                        )
                      }
                      className="rounded-md p-1 text-neutral-muted transition-colors hover:bg-background hover:text-neutral"
                      aria-label="Close flight details"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Aircraft */}

                  <div className="mt-4 rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-primary" />

                      <div>
                        <div className="text-sm font-semibold text-neutral">
                          {getAircraftType(
                            selected
                          )}
                        </div>

                        <div className="font-mono text-[11px] text-neutral-muted">
                          Reg:{" "}
                          {getRegistration(
                            selected
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route */}

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-neutral">
                        {getDepartureCode(
                          selected
                        )}
                      </div>

                      <div className="max-w-[105px] text-[11px] text-neutral-muted">
                        {getDepartureAirport(
                          selected
                        )}
                      </div>

                      <div className="mt-1 text-xs font-medium text-neutral-light">
                        {formatTime(
                          selected
                            ?.departure
                            ?.actual ||
                            selected
                              ?.departure
                              ?.estimated ||
                            selected
                              ?.departure
                              ?.scheduled
                        )}{" "}
                        UTC
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center px-3">
                      <Plane className="h-5 w-5 rotate-90 text-primary" />

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div className="h-full w-[62%] rounded-full bg-primary" />
                      </div>

                      <span className="mt-1 text-[10px] text-neutral-muted">
                        Live position
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-neutral">
                        {getArrivalCode(
                          selected
                        )}
                      </div>

                      <div className="ml-auto max-w-[105px] text-[11px] text-neutral-muted">
                        {getArrivalAirport(
                          selected
                        )}
                      </div>

                      <div className="mt-1 text-xs font-medium text-secondary">
                        {formatTime(
                          selected
                            ?.arrival
                            ?.estimated ||
                            selected
                              ?.arrival
                              ?.scheduled
                        )}{" "}
                        UTC
                      </div>
                    </div>
                  </div>

                  {/* Telemetry */}

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-background p-3 text-center">
                    <TelemetryValue
                      label="ALTITUDE"
                      value={getAltitude(
                        selected
                      )}
                    />

                    <TelemetryValue
                      label="GROUND SPEED"
                      value={getSpeed(
                        selected
                      )}
                    />

                    <TelemetryValue
                      label="HEADING"
                      value={getHeading(
                        selected
                      )}
                    />
                  </div>

                  {/* Coordinates */}

                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-background p-3">
                    <TelemetryValue
                      label="LATITUDE"
                      value={
                        getLatitude(
                          selected
                        ) !== null
                          ? getLatitude(
                              selected
                            ).toFixed(4)
                          : "—"
                      }
                    />

                    <TelemetryValue
                      label="LONGITUDE"
                      value={
                        getLongitude(
                          selected
                        ) !== null
                          ? getLongitude(
                              selected
                            ).toFixed(4)
                          : "—"
                      }
                    />
                  </div>

                  <div className="mt-3 text-center text-[10px] text-neutral-muted">
                    Last live position:{" "}
                    {formatDateTime(
                      selected?.live
                        ?.updated
                    )}
                  </div>

                  <button
                    type="button"
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-dark text-xs font-semibold text-white transition-colors hover:bg-primary"
                  >
                    <Crosshair className="h-4 w-4" />

                    View Full Flight Telemetry
                  </button>

                  <button
                    type="button"
                    className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-background text-xs font-medium text-neutral transition-colors hover:bg-primary-light"
                  >
                    <Star className="h-4 w-4 text-secondary" />

                    Add to Tracked Flights
                  </button>
                </div>
              )}

              {/* Loading overlay */}

              {loading && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <div className="rounded-xl border border-white/10 bg-black/70 px-6 py-5 text-center backdrop-blur-md">
                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-primary" />

                    <p className="mt-3 text-sm font-semibold text-white">
                      Loading live flights
                    </p>

                    <p className="mt-1 text-xs text-white/60">
                      Connecting to AviationStack...
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ============================================
                LIVE TABLE
            ============================================ */}

            <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-primary" />

                  <h2 className="text-base font-bold text-neutral">
                    Addis Ababa FIR Live Transponder Stream
                  </h2>

                  <span className="rounded-full bg-primary-light px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-dark">
                    ADS-B Mode-S
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-muted">
                  <span>
                    Showing{" "}
                    {
                      filteredFlights.length
                    }{" "}
                    flight
                    {filteredFlights.length ===
                    1
                      ? ""
                      : "s"}
                  </span>

                  {lastUpdated && (
                    <span>
                      Updated{" "}
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Empty state */}

              {!loading &&
                filteredFlights.length ===
                  0 && (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-background px-5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
                      <Search className="h-6 w-6 text-primary" />
                    </div>

                    <h3 className="mt-4 font-semibold text-neutral">
                      No flights found
                    </h3>

                    <p className="mt-1 max-w-md text-sm text-neutral-light">
                      {error
                        ? "Live flight data could not be loaded."
                        : "Try changing your search or filters, or refresh the live flight data."}
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                        className="mt-4 rounded-lg bg-primary-dark px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}

              {/* Table */}

              {!loading &&
                filteredFlights.length >
                  0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] border-collapse text-left">
                      <thead>
                        <tr className="h-10 border-b border-border bg-background text-[10px] font-bold uppercase tracking-wide text-neutral-muted">
                          <th className="rounded-l-lg px-3">
                            Callsign / Carrier
                          </th>

                          <th className="px-3">
                            Aircraft
                          </th>

                          <th className="px-3">
                            Route
                          </th>

                          <th className="px-3">
                            Altitude
                          </th>

                          <th className="px-3">
                            Ground Speed
                          </th>

                          <th className="px-3">
                            Heading
                          </th>

                          <th className="px-3">
                            Status
                          </th>

                          <th className="rounded-r-lg px-3 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-divider">
                        {filteredFlights.map(
                          (
                            flight,
                            index
                          ) => (
                            <LiveFlightRow
                              key={`${getFlightNumber(
                                flight
                              )}-${getRegistration(
                                flight
                              )}-${index}`}
                              flight={
                                flight
                              }
                              selected={
                                selected &&
                                getFlightNumber(
                                  selected
                                ) ===
                                  getFlightNumber(
                                    flight
                                  )
                              }
                              onSelect={() =>
                                setSelectedFlight(
                                  flight
                                )
                              }
                            />
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>

            {/* ============================================
                INFORMATION
            ============================================ */}

            <section className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="rounded-lg bg-background p-2 text-neutral-muted">
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold text-neutral">
                  About live flight data
                </h3>

                <p className="mt-1 text-sm leading-6 text-neutral-light">
                  Flight positions, aircraft information,
                  status, altitude, speed and other
                  telemetry shown on this page come from
                  the AviationStack API when live data is
                  available. The page automatically
                  refreshes every 15 seconds.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   RADAR RING
========================================================= */

function RadarRing({
  size,
  border,
}) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${border}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

/* =========================================================
   LIVE FLIGHT ROW
========================================================= */

function LiveFlightRow({
  flight,
  selected,
  onSelect,
}) {
  const status = getStatus(flight);

  return (
    <tr
      onClick={onSelect}
      className={`h-14 cursor-pointer transition-colors ${
        selected
          ? "bg-primary-light"
          : "hover:bg-background"
      }`}
    >
      {/* Callsign */}

      <td className="px-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${getStatusDot(
              status
            )}`}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-neutral">
                {getFlightNumber(
                  flight
                )}
              </span>

              <span className="max-w-[150px] truncate text-xs text-neutral-light">
                {getAirlineName(
                  flight
                )}
              </span>
            </div>

            <span className="text-[10px] text-neutral-muted">
              {getAirlineCode(
                flight
              )}
            </span>
          </div>
        </div>
      </td>

      {/* Aircraft */}

      <td className="px-3 font-mono text-xs text-neutral">
        {getAircraftType(flight)}

        <span className="ml-1 text-neutral-muted">
          ({getRegistration(
            flight
          )})
        </span>
      </td>

      {/* Route */}

      <td className="px-3 font-mono text-xs font-semibold text-neutral">
        {getDepartureCode(
          flight
        )}

        <span className="px-2 font-normal text-neutral-muted">
          →
        </span>

        {getArrivalCode(flight)}
      </td>

      {/* Altitude */}

      <td className="px-3 font-mono text-xs text-neutral">
        {getAltitude(flight)}

        {getFlightLevel(flight) !==
          "—" && (
          <span className="ml-1 font-semibold text-primary">
            (
            {getFlightLevel(
              flight
            )}
            )
          </span>
        )}
      </td>

      {/* Speed */}

      <td className="px-3 font-mono text-xs text-neutral">
        {getSpeed(flight)}
      </td>

      {/* Heading */}

      <td className="px-3 font-mono text-xs text-neutral">
        {getHeading(flight)}
      </td>

      {/* Status */}

      <td className="px-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusClasses(
            status
          )}`}
        >
          {getStatusLabel(status)}
        </span>
      </td>

      {/* Action */}

      <td className="px-3 text-right">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          title="Focus flight"
          className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary-light"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/* =========================================================
   TELEMETRY VALUE
========================================================= */

function TelemetryValue({
  label,
  value,
}) {
  return (
    <div>
      <span className="block text-[9px] font-semibold tracking-wide text-neutral-muted">
        {label}
      </span>

      <span className="font-mono text-xs font-bold text-neutral">
        {value}
      </span>
    </div>
  );
}