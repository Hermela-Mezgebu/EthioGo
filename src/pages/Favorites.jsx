import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Info,
  Loader2,
  Moon,
  Plane,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Star,
  Sun,
  Trash2,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import { getLiveFlights } from "../services/aviationStack";
import { useTheme } from "../context/ThemeContext";

/* =========================================================
   CONSTANTS
========================================================= */

const FAVORITES_STORAGE_KEY = "ethioflight-favorite-flights";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "scheduled", label: "Scheduled" },
  { id: "delayed", label: "Delayed" },
];

const SORT_OPTIONS = [
  {
    value: "departure",
    label: "Departure Time (Earliest)",
  },
  {
    value: "flight",
    label: "Flight Number (A-Z)",
  },
  {
    value: "alert",
    label: "Alert Severity",
  },
  {
    value: "aircraft",
    label: "Aircraft Model",
  },
];

/* =========================================================
   API NORMALIZATION
========================================================= */

function normalizeFlights(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

/* =========================================================
   FLIGHT HELPERS
========================================================= */

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.icao ||
    flight?.flight?.number ||
    "Unknown"
  );
}

function getAirlineName(flight) {
  return flight?.airline?.name || "Unknown Airline";
}

function getAirlineCode(flight) {
  return (
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "—"
  );
}

function getStatus(flight) {
  return flight?.flight_status || "unknown";
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
  return flight?.departure?.airport || "Unknown Airport";
}

function getArrivalAirport(flight) {
  return flight?.arrival?.airport || "Unknown Airport";
}

function getAircraftType(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    "Unknown Aircraft"
  );
}

function getRegistration(flight) {
  return flight?.aircraft?.registration || "—";
}

function getAltitude(flight) {
  const altitude = flight?.live?.altitude;

  if (altitude === null || altitude === undefined) {
    return "—";
  }

  return `${Math.round(altitude).toLocaleString()} ft`;
}

function getSpeed(flight) {
  const speed = flight?.live?.speed_horizontal;

  if (speed === null || speed === undefined) {
    return "—";
  }

  return `${Math.round(speed).toLocaleString()} km/h`;
}

function getHeading(flight) {
  const heading = flight?.live?.direction;

  if (heading === null || heading === undefined) {
    return "—";
  }

  const rounded = Math.round(heading);

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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getDelayMinutes(flight) {
  const departureDelay = Number(
    flight?.departure?.delay || 0
  );

  const arrivalDelay = Number(
    flight?.arrival?.delay || 0
  );

  return Math.max(departureDelay, arrivalDelay);
}

function isDelayed(flight) {
  return getDelayMinutes(flight) > 0;
}

function getFlightStatusLabel(flight) {
  const status = getStatus(flight);

  if (isDelayed(flight)) {
    const delay = getDelayMinutes(flight);

    return delay > 0
      ? `Delayed +${delay}m`
      : "Delayed";
  }

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

    default:
      return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Unknown";
  }
}

function getStatusClasses(flight) {
  const status = getStatus(flight);

  if (isDelayed(flight)) {
    return {
      badge:
        "bg-danger/10 text-danger border-danger/30",
      dot: "bg-danger",
    };
  }

  switch (status) {
    case "active":
      return {
        badge:
          "bg-success/10 text-success border-success/30",
        dot: "bg-success",
      };

    case "scheduled":
      return {
        badge:
          "bg-info/10 text-info border-info/30",
        dot: "bg-info",
      };

    case "landed":
      return {
        badge:
          "bg-background text-neutral-light border-border",
        dot: "bg-neutral-muted",
      };

    case "cancelled":
    case "incident":
      return {
        badge:
          "bg-danger/10 text-danger border-danger/30",
        dot: "bg-danger",
      };

    case "diverted":
      return {
        badge:
          "bg-secondary-light text-warning border-warning/30",
        dot: "bg-warning",
      };

    default:
      return {
        badge:
          "bg-background text-neutral-light border-border",
        dot: "bg-neutral-muted",
      };
  }
}

function getAirlineInitials(flight) {
  const code = getAirlineCode(flight);

  if (code !== "—") {
    return code.slice(0, 3).toUpperCase();
  }

  const name = getAirlineName(flight);

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getFlightKey(flight) {
  const flightNumber = getFlightNumber(flight);
  const registration = getRegistration(flight);

  return `${flightNumber}-${registration}`;
}

function getDepartureTimestamp(flight) {
  const value =
    flight?.departure?.scheduled ||
    flight?.departure?.estimated ||
    flight?.departure?.actual;

  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? Number.MAX_SAFE_INTEGER
    : timestamp;
}

function getAlertSeverity(flight) {
  const status = getStatus(flight);
  const delay = getDelayMinutes(flight);

  if (
    status === "incident" ||
    status === "cancelled"
  ) {
    return 4;
  }

  if (
    status === "diverted" ||
    delay >= 30
  ) {
    return 3;
  }

  if (delay > 0) {
    return 2;
  }

  if (status === "active") {
    return 1;
  }

  return 0;
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
   FAVORITES STORAGE
========================================================= */

function readFavorites() {
  try {
    const stored = localStorage.getItem(
      FAVORITES_STORAGE_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(keys) {
  try {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(keys)
    );
  } catch {
    // Ignore localStorage errors.
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Favorites() {
  const { theme, toggleTheme } = useTheme();

  const [flights, setFlights] = useState([]);
  const [favoriteKeys, setFavoriteKeys] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("departure");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  /* =======================================================
     LOAD FAVORITES
  ======================================================= */

  useEffect(() => {
    const storedFavorites = readFavorites();

    setFavoriteKeys(storedFavorites);
  }, []);

  /* =======================================================
     LOAD REAL AVIATIONSTACK DATA
  ======================================================= */

  const loadFlights = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getLiveFlights({
          limit: 100,
          offset: 0,
        });

        const normalized =
          normalizeFlights(response);

        setFlights(normalized);

        setLastUpdated(new Date());

        /*
         * If the user has never created favorites,
         * initialize the page with the first four REAL
         * flights returned by AviationStack.
         *
         * After initialization, favorites are controlled
         * entirely by localStorage.
         */
        const existingFavorites =
          readFavorites();

        if (
          existingFavorites.length === 0 &&
          normalized.length > 0
        ) {
          const initialFavorites =
            normalized
              .slice(0, 4)
              .map(getFlightKey);

          setFavoriteKeys(initialFavorites);

          saveFavorites(initialFavorites);
        }
      } catch (err) {
        console.error(
          "Failed to load AviationStack flights:",
          err
        );

        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFlights(false);

    const interval = setInterval(() => {
      loadFlights(true);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [loadFlights]);

  /* =======================================================
     FAVORITE ACTIONS
  ======================================================= */

  const toggleFavorite = useCallback(
    (flight) => {
      const key = getFlightKey(flight);

      setFavoriteKeys((current) => {
        const exists = current.includes(key);

        const updated = exists
          ? current.filter(
              (item) => item !== key
            )
          : [...current, key];

        saveFavorites(updated);

        return updated;
      });
    },
    []
  );

  /* =======================================================
     SEARCH
  ======================================================= */

  const matchesSearch = useCallback(
    (flight, query) => {
      if (!query.trim()) {
        return true;
      }

      const normalizedQuery =
        query.toLowerCase().trim();

      const searchableText = [
        getFlightNumber(flight),
        getAirlineName(flight),
        getAirlineCode(flight),
        getRegistration(flight),
        getDepartureCode(flight),
        getArrivalCode(flight),
        getDepartureAirport(flight),
        getArrivalAirport(flight),
        getAircraftType(flight),
        getStatus(flight),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedQuery
      );
    },
    []
  );

  /* =======================================================
     FILTERED FLIGHTS
  ======================================================= */

  const monitoredFlights = useMemo(() => {
    /*
     * Only show flights that are currently monitored.
     */
    const favorites = flights.filter((flight) =>
      favoriteKeys.includes(
        getFlightKey(flight)
      )
    );

    return favorites;
  }, [flights, favoriteKeys]);

  const filteredFlights = useMemo(() => {
    let result = monitoredFlights.filter(
      (flight) => {
        const status = getStatus(flight);

        let matchesStatus = true;

        if (activeFilter === "active") {
          matchesStatus = status === "active";
        }

        if (activeFilter === "scheduled") {
          matchesStatus =
            status === "scheduled";
        }

        if (activeFilter === "delayed") {
          matchesStatus = isDelayed(flight);
        }

        const matchesText =
          matchesSearch(
            flight,
            searchQuery
          );

        return (
          matchesStatus &&
          matchesText
        );
      }
    );

    result = [...result].sort(
      (a, b) => {
        switch (sortBy) {
          case "flight":
            return getFlightNumber(a).localeCompare(
              getFlightNumber(b)
            );

          case "alert":
            return (
              getAlertSeverity(b) -
              getAlertSeverity(a)
            );

          case "aircraft":
            return getAircraftType(a).localeCompare(
              getAircraftType(b)
            );

          case "departure":
          default:
            return (
              getDepartureTimestamp(a) -
              getDepartureTimestamp(b)
            );
        }
      }
    );

    return result;
  }, [
    monitoredFlights,
    activeFilter,
    searchQuery,
    sortBy,
    matchesSearch,
  ]);

  /* =======================================================
     METRICS
  ======================================================= */

  const metrics = useMemo(() => {
    const tracked = monitoredFlights.length;

    const active = monitoredFlights.filter(
      (flight) =>
        getStatus(flight) === "active"
    ).length;

    const delayed = monitoredFlights.filter(
      (flight) => isDelayed(flight)
    ).length;

    const scheduled = monitoredFlights.filter(
      (flight) =>
        getStatus(flight) === "scheduled"
    ).length;

    return {
      tracked,
      active,
      delayed,
      scheduled,
    };
  }, [monitoredFlights]);

  /* =======================================================
     RECOMMENDED REAL CORRIDORS
  ======================================================= */

  const recommendedCorridors = useMemo(() => {
    const seen = new Set();

    const corridors = [];

    for (const flight of flights) {
      const departure =
        getDepartureCode(flight);

      const arrival =
        getArrivalCode(flight);

      if (
        departure === "—" ||
        arrival === "—"
      ) {
        continue;
      }

      const key = `${departure}-${arrival}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      corridors.push(flight);

      if (corridors.length >= 3) {
        break;
      }
    }

    return corridors;
  }, [flights]);

  /* =======================================================
     HEADER SEARCH
  ======================================================= */

  const handleHeaderSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  /* =======================================================
     THEME ICON
  ======================================================= */

  const ThemeIcon =
    theme === "dark" ? Sun : Moon;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* ===================================================
          EXISTING REUSABLE SIDEBAR
      =================================================== */}

      <Sidebar activeItem="Favorites" />

      {/* ===================================================
          MAIN APPLICATION AREA

          IMPORTANT:
          Sidebar width = 240px
          Main padding = 240px
      =================================================== */}

      <div className="min-h-screen lg:pl-[240px]">
        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header
          className="
            fixed
            left-0
            right-0
            top-0
            z-40
            h-[72px]
            border-b
            border-border
            bg-surface
            lg:left-[240px]
          "
        >
          <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
            {/* Breadcrumb */}

            <div className="hidden items-center gap-3 text-xs font-semibold md:flex">
              <Radio
                size={17}
                className="text-neutral-muted"
              />

              <span className="text-neutral-muted">
                Operations
              </span>

              <span className="text-neutral-muted">
                /
              </span>

              <span className="text-neutral">
                Flight Matrix
              </span>
            </div>

            {/* Global Search */}

            <div className="relative hidden w-[320px] lg:block xl:w-[360px]">
              <Search
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-neutral-muted
                "
              />

              <input
                type="text"
                value={searchQuery}
                onChange={handleHeaderSearch}
                placeholder="Search flight, airport or airline..."
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-border
                  bg-background
                  pl-10
                  pr-3
                  text-sm
                  text-neutral
                  placeholder:text-neutral-muted
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              />
            </div>

            {/* Header Actions */}

            <div className="ml-auto flex items-center gap-2 md:gap-4">
              {/* Connection Status */}

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-success/30
                  bg-success/10
                  px-3
                  py-1.5
                  sm:flex
                "
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="
                      absolute
                      inline-flex
                      h-full
                      w-full
                      animate-ping
                      rounded-full
                      bg-success
                      opacity-60
                    "
                  />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>

                <span className="text-[11px] font-semibold text-success">
                  AviationStack Connected
                </span>
              </div>

              {/* Refresh */}

              <button
                type="button"
                onClick={() =>
                  loadFlights(true)
                }
                disabled={refreshing}
                title="Refresh flight data"
                className="
                  rounded-xl
                  p-2
                  text-neutral-light
                  transition
                  hover:bg-background
                  hover:text-neutral
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={19}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              {/* Notifications */}

              <button
                type="button"
                title="Notifications"
                className="
                  rounded-xl
                  p-2
                  text-neutral-light
                  transition
                  hover:bg-background
                  hover:text-neutral
                "
              >
                <Bell size={20} />
              </button>

              {/* Theme */}

              <button
                type="button"
                onClick={toggleTheme}
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="
                  rounded-xl
                  p-2
                  text-neutral-light
                  transition
                  hover:bg-background
                  hover:text-neutral
                "
              >
                <ThemeIcon size={20} />
              </button>

              {/* Profile */}

              <div
                className="
                  hidden
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-primary
                  text-xs
                  font-bold
                  text-white
                  sm:flex
                "
              >
                H
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="min-h-screen bg-background">
          <div className="w-full px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            <div className="flex w-full flex-col gap-6">
              {/* =================================================
                  PAGE HEADER
              ================================================= */}

              <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className="
                          absolute
                          inline-flex
                          h-full
                          w-full
                          animate-ping
                          rounded-full
                          bg-primary
                          opacity-60
                        "
                      />

                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>

                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                      Telemetry Watchlist
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-neutral md:text-3xl">
                    My Monitored Flights
                  </h1>

                  <p className="max-w-3xl text-sm leading-6 text-neutral-light">
                    Quick real-time telemetry access to
                    flights and aircraft you are monitoring
                    across East African airspace and global
                    corridors.
                  </p>

                  {lastUpdated && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-muted">
                      <Activity size={14} />

                      <span>
                        Last updated{" "}
                        {formatTime(lastUpdated)}
                      </span>

                      <span>•</span>

                      <span>
                        Auto-refreshes every 15 seconds
                      </span>
                    </div>
                  )}
                </div>

                {/* =================================================
                    QUICK METRICS
                ================================================= */}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex">
                  <MetricCard
                    label="TRACKED"
                    value={`${metrics.tracked}`}
                    suffix="Aircraft"
                    icon={<Star size={15} />}
                  />

                  <MetricCard
                    label="ACTIVE EN ROUTE"
                    value={`${metrics.active}`}
                    suffix="Airborne"
                    icon={<Plane size={15} />}
                    valueClass="text-success"
                  />

                  <MetricCard
                    label="SCHEDULED"
                    value={`${metrics.scheduled}`}
                    suffix="Flights"
                    icon={<Clock3 size={15} />}
                    valueClass="text-info"
                  />

                  <MetricCard
                    label="ALERTS"
                    value={`${metrics.delayed}`}
                    suffix="Delayed"
                    icon={<AlertCircle size={15} />}
                    valueClass="text-danger"
                  />
                </div>
              </section>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-danger/30
                    bg-danger/10
                    p-4
                  "
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-danger"
                  />

                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold text-danger">
                      Unable to load live flight data
                    </span>

                    <span className="text-sm text-neutral-light">
                      {error}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      loadFlights(true)
                    }
                    className="
                      rounded-lg
                      border
                      border-danger/30
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-danger
                      transition
                      hover:bg-danger/10
                    "
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* =================================================
                  CONTROLS
              ================================================= */}

              <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* Left */}

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    {/* Search */}

                    <div className="relative w-full lg:w-80">
                      <Search
                        size={17}
                        className="
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-neutral-muted
                        "
                      />

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(
                            event.target.value
                          )
                        }
                        placeholder="Filter monitored flights or tail..."
                        className="
                          h-10
                          w-full
                          rounded-xl
                          border
                          border-border
                          bg-background
                          pl-9
                          pr-3
                          text-sm
                          text-neutral
                          placeholder:text-neutral-muted
                          outline-none
                          transition
                          focus:border-primary
                          focus:ring-2
                          focus:ring-primary/10
                        "
                      />
                    </div>

                    {/* Filters */}

                    <div className="flex w-full overflow-x-auto rounded-xl bg-background p-1 lg:w-auto">
                      {FILTERS.map((filter) => {
                        const isActive =
                          activeFilter ===
                          filter.id;

                        let count = 0;

                        if (
                          filter.id === "all"
                        ) {
                          count =
                            monitoredFlights.length;
                        } else if (
                          filter.id === "active"
                        ) {
                          count =
                            monitoredFlights.filter(
                              (flight) =>
                                getStatus(
                                  flight
                                ) === "active"
                            ).length;
                        } else if (
                          filter.id ===
                          "scheduled"
                        ) {
                          count =
                            monitoredFlights.filter(
                              (flight) =>
                                getStatus(
                                  flight
                                ) === "scheduled"
                            ).length;
                        } else if (
                          filter.id ===
                          "delayed"
                        ) {
                          count =
                            monitoredFlights.filter(
                              (flight) =>
                                isDelayed(
                                  flight
                                )
                            ).length;
                        }

                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() =>
                              setActiveFilter(
                                filter.id
                              )
                            }
                            className={`
                              whitespace-nowrap
                              rounded-lg
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              transition
                              ${
                                isActive
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-neutral-light hover:bg-surface hover:text-neutral"
                              }
                            `}
                          >
                            {filter.label} (
                            {count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right */}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Sort */}

                    <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
                        Sort:
                      </span>

                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(event) =>
                            setSortBy(
                              event.target.value
                            )
                          }
                          className="
                            appearance-none
                            bg-transparent
                            pr-6
                            text-xs
                            font-semibold
                            text-neutral
                            outline-none
                          "
                        >
                          {SORT_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown
                          size={14}
                          className="
                            pointer-events-none
                            absolute
                            right-0
                            top-1/2
                            -translate-y-1/2
                            text-neutral-muted
                          "
                        />
                      </div>
                    </div>

                    {/* Refresh / Track */}

                    <button
                      type="button"
                      onClick={() =>
                        loadFlights(true)
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-primary
                        px-4
                        py-2.5
                        text-xs
                        font-bold
                        text-white
                        shadow-sm
                        transition
                        hover:bg-primary-dark
                        active:scale-[0.98]
                      "
                    >
                      <Plus size={17} />

                      Track New Flight
                    </button>
                  </div>
                </div>
              </section>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <FlightCardSkeleton
                        key={item}
                      />
                    )
                  )}
                </div>
              )}

              {/* =================================================
                  EMPTY
              ================================================= */}

              {!loading &&
                !error &&
                filteredFlights.length ===
                  0 && (
                  <EmptyState
                    hasFlights={
                      monitoredFlights.length >
                      0
                    }
                    searchQuery={searchQuery}
                    activeFilter={activeFilter}
                    onClear={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                  />
                )}

              {/* =================================================
                  FLIGHT CARDS
              ================================================= */}

              {!loading &&
                filteredFlights.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {filteredFlights.map(
                      (flight) => (
                        <FlightCard
                          key={getFlightKey(
                            flight
                          )}
                          flight={flight}
                          isFavorite={favoriteKeys.includes(
                            getFlightKey(
                              flight
                            )
                          )}
                          onToggleFavorite={
                            toggleFavorite
                          }
                        />
                      )
                    )}
                  </div>
                )}

              {/* =================================================
                  ALERTING BANNER
              ================================================= */}

              <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Bell size={21} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-neutral">
                          Flight Monitoring
                        </h2>

                        <span className="rounded-full bg-primary-light px-2 py-1 text-[10px] font-bold text-primary">
                          LOCAL WATCHLIST
                        </span>
                      </div>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-light">
                        Monitored flights are refreshed
                        from AviationStack. Favorite
                        selections are stored locally in
                        your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFavoriteKeys([])
                      }
                      className="
                        rounded-xl
                        border
                        border-border
                        bg-background
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-neutral
                        transition
                        hover:bg-surface
                      "
                    >
                      Clear Watchlist
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        loadFlights(true)
                      }
                      className="
                        rounded-xl
                        bg-primary
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-white
                        transition
                        hover:bg-primary-dark
                      "
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </section>

              {/* =================================================
                  REAL CORRIDORS
              ================================================= */}

              {recommendedCorridors.length >
                0 && (
                <section className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Activity
                        size={19}
                        className="text-secondary"
                      />

                      <h2 className="text-base font-bold text-neutral">
                        Available Ethiopian Air
                        Corridors
                      </h2>
                    </div>

                    <span className="text-xs text-neutral-muted">
                      Based on current AviationStack
                      results
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {recommendedCorridors.map(
                      (flight) => {
                        const key =
                          getFlightKey(
                            flight
                          );

                        const isFavorite =
                          favoriteKeys.includes(
                            key
                          );

                        return (
                          <div
                            key={key}
                            className="
                              flex
                              items-center
                              justify-between
                              rounded-xl
                              border
                              border-border
                              bg-surface
                              p-4
                              shadow-sm
                              transition
                              hover:border-primary/30
                              hover:bg-background
                            "
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light font-mono text-xs font-bold text-primary">
                                {getAirlineInitials(
                                  flight
                                )}
                              </div>

                              <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-bold text-neutral">
                                  {getFlightNumber(
                                    flight
                                  )}
                                </span>

                                <span className="truncate text-xs text-neutral-light">
                                  {getDepartureCode(
                                    flight
                                  )}{" "}
                                  →{" "}
                                  {getArrivalCode(
                                    flight
                                  )}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleFavorite(
                                  flight
                                )
                              }
                              title={
                                isFavorite
                                  ? "Remove from watchlist"
                                  : "Add to watchlist"
                              }
                              className={`
                                rounded-lg
                                p-2
                                transition
                                ${
                                  isFavorite
                                    ? "bg-secondary-light text-secondary"
                                    : "bg-background text-neutral-muted hover:text-secondary"
                                }
                              `}
                            >
                              {isFavorite ? (
                                <Star
                                  size={17}
                                  fill="currentColor"
                                />
                              ) : (
                                <Plus
                                  size={17}
                                />
                              )}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===========================================================
   METRIC CARD
=========================================================== */

function MetricCard({
  label,
  value,
  suffix,
  icon,
  valueClass = "text-neutral",
}) {
  return (
    <div className="flex min-w-[125px] flex-col rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neutral-muted">
        {icon}

        <span>{label}</span>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`text-lg font-bold ${valueClass}`}
        >
          {value}
        </span>

        <span className="text-xs font-medium text-neutral-light">
          {suffix}
        </span>
      </div>
    </div>
  );
}

/* ===========================================================
   FLIGHT CARD
=========================================================== */

function FlightCard({
  flight,
  isFavorite,
  onToggleFavorite,
}) {
  const statusClasses =
    getStatusClasses(flight);

  const status = getStatus(flight);

  const departureCode =
    getDepartureCode(flight);

  const arrivalCode =
    getArrivalCode(flight);

  const departureAirport =
    getDepartureAirport(flight);

  const arrivalAirport =
    getArrivalAirport(flight);

  const departureScheduled =
    flight?.departure?.scheduled;

  const departureActual =
    flight?.departure?.actual;

  const arrivalScheduled =
    flight?.arrival?.scheduled;

  const arrivalEstimated =
    flight?.arrival?.estimated;

  const arrivalActual =
    flight?.arrival?.actual;

  const delayMinutes =
    getDelayMinutes(flight);

  return (
    <article
      className="
        flex
        flex-col
        gap-5
        rounded-xl
        border
        border-border
        bg-surface
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              font-mono
              text-sm
              font-bold
              shadow-inner
              ${
                isDelayed(flight)
                  ? "bg-danger/10 text-danger"
                  : "bg-primary-light text-primary"
              }
            `}
          >
            {getAirlineInitials(
              flight
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-neutral">
                {getFlightNumber(flight)}
              </span>

              {getRegistration(
                flight
              ) !== "—" && (
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-neutral-light">
                  {getRegistration(
                    flight
                  )}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-light">
              <span>
                {getAirlineName(flight)}
              </span>

              <span>•</span>

              <span>
                {getAircraftType(flight)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1
              text-[10px]
              font-bold
              ${statusClasses.badge}
            `}
          >
            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${statusClasses.dot}
                ${
                  status === "active"
                    ? "animate-pulse"
                    : ""
                }
              `}
            />

            {getFlightStatusLabel(
              flight
            )}
          </span>

          <button
            type="button"
            onClick={() =>
              onToggleFavorite(flight)
            }
            title={
              isFavorite
                ? "Remove from Favorites"
                : "Add to Favorites"
            }
            className={`
              rounded-lg
              p-1.5
              transition
              ${
                isFavorite
                  ? "text-secondary hover:bg-secondary-light"
                  : "text-neutral-muted hover:bg-background hover:text-secondary"
              }
            `}
          >
            <Star
              size={20}
              fill={
                isFavorite
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>

      {/* =====================================================
          ROUTE
      ===================================================== */}

      <div className="rounded-xl bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Origin */}

          <div className="min-w-[80px]">
            <div className="text-xl font-bold text-neutral">
              {departureCode}
            </div>

            <div className="mt-0.5 max-w-[120px] truncate text-[11px] text-neutral-light">
              {departureAirport}
            </div>

            <div className="mt-1 font-mono text-xs font-semibold text-primary">
              {formatTime(
                departureActual ||
                  departureScheduled
              )}
            </div>

            {departureActual &&
              departureScheduled && (
                <div className="mt-0.5 text-[10px] text-neutral-muted">
                  Scheduled{" "}
                  {formatTime(
                    departureScheduled
                  )}
                </div>
              )}
          </div>

          {/* Middle */}

          <div className="flex flex-1 flex-col items-center px-2">
            <div className="mb-1 flex w-full items-center justify-between text-[10px] text-neutral-muted">
              <span>
                {status === "active"
                  ? "Live telemetry"
                  : "Flight status"}
              </span>

              <span>
                {getHeading(flight)}
              </span>
            </div>

            <div className="relative flex w-full items-center">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`
                    h-full
                    rounded-full
                    ${
                      isDelayed(flight)
                        ? "bg-danger"
                        : status ===
                          "active"
                        ? "bg-primary"
                        : "bg-neutral-muted"
                    }
                  `}
                  style={{
                    width:
                      status === "active"
                        ? "60%"
                        : "12%",
                  }}
                />
              </div>

              <div
                className={`
                  absolute
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-surface
                  shadow-sm
                  ${
                    isDelayed(flight)
                      ? "text-danger"
                      : "text-primary"
                  }
                `}
                style={{
                  left:
                    status === "active"
                      ? "60%"
                      : "12%",
                  transform:
                    "translateX(-50%)",
                }}
              >
                <Plane
                  size={14}
                  className="rotate-90"
                />
              </div>
            </div>

            <div className="mt-2 text-center text-[10px] text-neutral-muted">
              {status === "active"
                ? "Aircraft currently airborne"
                : isDelayed(flight)
                ? `Delay: ${delayMinutes} minutes`
                : "Current AviationStack status"}
            </div>
          </div>

          {/* Destination */}

          <div className="min-w-[80px] text-right">
            <div className="text-xl font-bold text-neutral">
              {arrivalCode}
            </div>

            <div className="mt-0.5 ml-auto max-w-[120px] truncate text-[11px] text-neutral-light">
              {arrivalAirport}
            </div>

            <div className="mt-1 font-mono text-xs font-semibold text-neutral">
              {formatTime(
                arrivalActual ||
                  arrivalEstimated ||
                  arrivalScheduled
              )}
            </div>

            {arrivalEstimated &&
              arrivalScheduled && (
                <div className="mt-0.5 text-[10px] text-neutral-muted">
                  Scheduled{" "}
                  {formatTime(
                    arrivalScheduled
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* =====================================================
          TELEMETRY
      ===================================================== */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TelemetryItem
          label="ALTITUDE"
          value={getAltitude(flight)}
        />

        <TelemetryItem
          label="GROUND SPD"
          value={getSpeed(flight)}
        />

        <TelemetryItem
          label="HEADING"
          value={getHeading(flight)}
        />

        <TelemetryItem
          label="STATUS"
          value={getStatus(flight)}
        />
      </div>

      {/* =====================================================
          EXTRA INFORMATION
      ===================================================== */}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-background p-3">
          <span className="block text-[10px] font-bold tracking-wider text-neutral-muted">
            DEPARTURE
          </span>

          <span className="mt-1 block text-xs font-semibold text-neutral">
            {formatDateTime(
              departureScheduled
            )}
          </span>
        </div>

        <div className="rounded-lg bg-background p-3">
          <span className="block text-[10px] font-bold tracking-wider text-neutral-muted">
            ARRIVAL
          </span>

          <span className="mt-1 block text-xs font-semibold text-neutral">
            {formatDateTime(
              arrivalEstimated ||
                arrivalScheduled
            )}
          </span>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex flex-col gap-3 border-t border-divider pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={`
            inline-flex
            w-fit
            items-center
            gap-1.5
            rounded-full
            px-2.5
            py-1
            text-[10px]
            font-semibold
            ${
              isDelayed(flight)
                ? "bg-danger/10 text-danger"
                : status === "active"
                ? "bg-success/10 text-success"
                : "bg-background text-neutral-light"
            }
          `}
        >
          {isDelayed(flight) ? (
            <AlertCircle size={14} />
          ) : status === "active" ? (
            <Activity size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}

          <span>
            {isDelayed(flight)
              ? `Delay detected: ${delayMinutes} min`
              : status === "active"
              ? "Live telemetry available"
              : "Flight monitored"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const text = `${getFlightNumber(
                flight
              )} ${getDepartureCode(
                flight
              )} → ${getArrivalCode(
                flight
              )}`;

              navigator.clipboard?.writeText(
                text
              );
            }}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-background
              px-3
              py-1.5
              text-xs
              font-semibold
              text-neutral
              transition
              hover:bg-border
            "
          >
            <ExternalLink size={14} />

            Flight Info
          </button>

          <button
            type="button"
            onClick={() =>
              onToggleFavorite(flight)
            }
            title="Remove from Favorites"
            className="
              rounded-lg
              p-1.5
              text-neutral-muted
              transition
              hover:bg-danger/10
              hover:text-danger
            "
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ===========================================================
   TELEMETRY ITEM
=========================================================== */

function TelemetryItem({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-background p-3">
      <span className="block text-[9px] font-bold tracking-wider text-neutral-muted">
        {label}
      </span>

      <span className="mt-1 block truncate font-mono text-xs font-bold text-neutral">
        {value}
      </span>
    </div>
  );
}

/* ===========================================================
   SKELETON
=========================================================== */

function FlightCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-background" />

        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-32 rounded bg-background" />
          <div className="h-3 w-52 rounded bg-background" />
        </div>
      </div>

      <div className="mt-5 h-24 rounded-xl bg-background" />

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="h-12 rounded-lg bg-background" />
        <div className="h-12 rounded-lg bg-background" />
        <div className="h-12 rounded-lg bg-background" />
        <div className="h-12 rounded-lg bg-background" />
      </div>

      <div className="mt-4 h-8 rounded-lg bg-background" />
    </div>
  );
}

/* ===========================================================
   EMPTY STATE
=========================================================== */

function EmptyState({
  hasFlights,
  searchQuery,
  activeFilter,
  onClear,
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
        {searchQuery ||
        activeFilter !== "all" ? (
          <Search size={25} />
        ) : (
          <Star size={25} />
        )}
      </div>

      <h3 className="mt-4 text-base font-bold text-neutral">
        {hasFlights
          ? "No flights match your filter"
          : "No monitored flights"}
      </h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-neutral-light">
        {hasFlights
          ? "Try changing the search text or status filter to see your monitored flights."
          : "Use the star buttons in the flight list or available corridors to add real AviationStack flights to your watchlist."}
      </p>

      {(searchQuery ||
        activeFilter !== "all") && (
        <button
          type="button"
          onClick={onClear}
          className="
            mt-5
            rounded-xl
            bg-primary
            px-4
            py-2
            text-xs
            font-bold
            text-white
            transition
            hover:bg-primary-dark
          "
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}