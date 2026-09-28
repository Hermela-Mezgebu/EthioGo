"use client";

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

// Change this import path if your reusable Sidebar is located elsewhere.
import Sidebar from "../components/layout/Sidebar";

/* =========================================================
   HELPERS
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

  return [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load live flight data."
  );
}

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

function getAircraftType(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    flight?.aircraft?.registration ||
    "Aircraft"
  );
}

function getRegistration(flight) {
  return flight?.aircraft?.registration || "—";
}

function getStatus(flight) {
  return flight?.flight_status || "unknown";
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

    default:
      return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Unknown";
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "active":
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

function getMapCoordinates(flight) {
  const latitude = Number(flight?.live?.latitude);
  const longitude = Number(flight?.live?.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

/*
 * Converts real latitude/longitude into positions on our
 * East African / global corridor visualization.
 *
 * This is a visualization layer, not a geographic map library.
 */
function coordinatesToPosition(latitude, longitude) {
  const minLongitude = -20;
  const maxLongitude = 80;

  const minLatitude = -40;
  const maxLatitude = 45;

  const x =
    ((longitude - minLongitude) /
      (maxLongitude - minLongitude)) *
    100;

  const y =
    (1 -
      (latitude - minLatitude) /
        (maxLatitude - minLatitude)) *
    100;

  return {
    left: `${Math.min(97, Math.max(3, x))}%`,
    top: `${Math.min(97, Math.max(3, y))}%`,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Map() {
  const { theme, toggleTheme } = useTheme();

  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [zoom, setZoom] = useState(1);

  const [lastUpdated, setLastUpdated] = useState(null);

  const [showLayers, setShowLayers] = useState(false);

  const [layers, setLayers] = useState({
    aircraft: true,
    airports: true,
    routes: true,
  });

  const ThemeIcon = theme === "dark" ? Sun : Moon;

  /* =======================================================
     LOAD REAL AVIATIONSTACK DATA
  ======================================================= */

  const loadFlights = useCallback(async (isRefresh = false) => {
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

      const realFlights = normalizeFlights(response);

      setFlights(realFlights);
      setLastUpdated(new Date());

      if (realFlights.length > 0) {
        setSelectedFlight((current) => {
          if (!current) {
            return realFlights.find(
              (flight) => getStatus(flight) === "active"
            ) || realFlights[0];
          }

          const currentNumber = getFlightNumber(current);

          return (
            realFlights.find(
              (flight) =>
                getFlightNumber(flight) === currentNumber
            ) || realFlights[0]
          );
        });
      } else {
        setSelectedFlight(null);
      }
    } catch (err) {
      console.error("Live flights error:", err);

      setError(getErrorMessage(err));
      setFlights([]);
      setSelectedFlight(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();

    const interval = setInterval(() => {
      loadFlights(true);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [loadFlights]);

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredFlights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return flights.filter((flight) => {
      const status = getStatus(flight);

      const searchableText = [
        getFlightNumber(flight),
        getAirlineName(flight),
        getAirlineCode(flight),
        getDepartureCode(flight),
        getArrivalCode(flight),
        getDepartureAirport(flight),
        getArrivalAirport(flight),
        getAircraftType(flight),
        getRegistration(flight),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [flights, search, statusFilter]);

  /* =======================================================
     METRICS
  ======================================================= */

  const activeFlights = useMemo(
    () =>
      flights.filter(
        (flight) => getStatus(flight) === "active"
      ),
    [flights]
  );

  const scheduledFlights = useMemo(
    () =>
      flights.filter(
        (flight) => getStatus(flight) === "scheduled"
      ),
    [flights]
  );

  const delayedFlights = useMemo(
    () =>
      flights.filter((flight) => {
        const status = getStatus(flight);

        return (
          status === "incident" ||
          status === "diverted"
        );
      }),
    [flights]
  );

  const flightsWithCoordinates = useMemo(
    () =>
      filteredFlights.filter(
        (flight) => getMapCoordinates(flight)
      ),
    [filteredFlights]
  );

  /* =======================================================
     SELECTED FLIGHT
  ======================================================= */

  const selectedCoordinates = selectedFlight
    ? getMapCoordinates(selectedFlight)
    : null;

  /* =======================================================
     MAP ZOOM
  ======================================================= */

  const increaseZoom = () => {
    setZoom((current) =>
      Math.min(1.5, Number((current + 0.1).toFixed(1)))
    );
  };

  const decreaseZoom = () => {
    setZoom((current) =>
      Math.max(0.8, Number((current - 0.1).toFixed(1)))
    );
  };

  const resetZoom = () => {
    setZoom(1);
  };

  /* =======================================================
     LAYER TOGGLE
  ======================================================= */

  const toggleLayer = (key) => {
    setLayers((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* ===================================================
          REUSABLE SIDEBAR
      =================================================== */}

      <Sidebar activeItem="Map" />

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="fixed left-0 right-0 top-0 z-40 h-[72px] border-b border-border bg-surface lg:left-[240px]">
        <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
          {/* Breadcrumb */}
          <div className="hidden items-center gap-3 text-sm md:flex">
            <Radar className="h-5 w-5 text-neutral-light" />

            <span className="text-neutral-muted">
              Operations
            </span>

            <span className="text-neutral-muted">
              /
            </span>

            <span className="font-semibold text-neutral">
              Flight Map
            </span>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-[380px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-muted" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search flight, airport or airline..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-neutral outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Connection */}
            <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />

              <span className="text-xs font-semibold text-success">
                AviationStack Connected
              </span>
            </div>

            {/* Notification */}
            <button
              type="button"
              className="rounded-xl p-2 text-neutral-light transition hover:bg-background hover:text-neutral"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 text-neutral-light transition hover:bg-background hover:text-neutral"
              title="Toggle theme"
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            {/* Profile */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              H
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="min-h-screen bg-background">
        <div className="w-full px-4 py-5 md:px-6 lg:px-8">
          <div className="flex flex-col gap-6">

            {/* =============================================
                PAGE HEADER
            ============================================= */}

            <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Live Flight Map
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-neutral md:text-3xl">
                  Flight Operations Map
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-light">
                  Monitor real-time aircraft positions, flight
                  routes, altitude, speed and operational status
                  using live AviationStack flight data.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
                <MetricCard
                  label="TOTAL"
                  value={flights.length}
                  icon={Activity}
                />

                <MetricCard
                  label="AIRBORNE"
                  value={activeFlights.length}
                  icon={Plane}
                  positive
                />

                <MetricCard
                  label="SCHEDULED"
                  value={scheduledFlights.length}
                  icon={CheckCircle2}
                />

                <MetricCard
                  label="ALERTS"
                  value={delayedFlights.length}
                  icon={AlertCircle}
                  danger={delayedFlights.length > 0}
                />
              </div>
            </section>

            {/* =============================================
                ERROR
            ============================================= */}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-danger">
                    Unable to load live flight data
                  </p>

                  <p className="mt-1 text-sm text-neutral-light">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadFlights(true)}
                  className="shrink-0 rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            )}

            {/* =============================================
                MAP + DETAILS
            ============================================= */}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

              {/* ===========================================
                  MAP
              =========================================== */}

              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

                {/* Map toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral">
                      Live Airspace
                    </h2>

                    <p className="mt-0.5 text-xs text-neutral-muted">
                      {flightsWithCoordinates.length} aircraft
                      with available coordinates
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    {/* Layers */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowLayers((value) => !value)
                        }
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-neutral-light transition hover:text-neutral"
                      >
                        <Radar className="h-4 w-4" />
                        Layers
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      {showLayers && (
                        <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-border bg-surface p-3 shadow-xl">
                          <LayerToggle
                            label="Aircraft"
                            checked={layers.aircraft}
                            onChange={() =>
                              toggleLayer("aircraft")
                            }
                          />

                          <LayerToggle
                            label="Airports"
                            checked={layers.airports}
                            onChange={() =>
                              toggleLayer("airports")
                            }
                          />

                          <LayerToggle
                            label="Routes"
                            checked={layers.routes}
                            onChange={() =>
                              toggleLayer("routes")
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Refresh */}
                    <button
                      type="button"
                      onClick={() => loadFlights(true)}
                      disabled={refreshing}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-neutral-light transition hover:text-neutral disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          refreshing
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                      Refresh
                    </button>
                  </div>
                </div>

                {/* Map */}
                <div className="relative h-[560px] overflow-hidden bg-[#0b1713]">

                  {/* Grid */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(126,217,158,0.12) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(126,217,158,0.12) 1px, transparent 1px)
                      `,
                      backgroundSize: "48px 48px",
                    }}
                  />

                  {/* Radar rings */}
                  <div className="absolute left-1/2 top-1/2 aspect-square w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

                  <div className="absolute left-1/2 top-1/2 aspect-square w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

                  <div className="absolute left-1/2 top-1/2 aspect-square w-[25%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />

                  {/* Crosshair */}
                  <div className="absolute left-1/2 top-1/2 h-[70%] w-px -translate-x-1/2 -translate-y-1/2 bg-primary/10" />

                  <div className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 -translate-y-1/2 bg-primary/10" />

                  {/* Simplified geographic region */}
                  <div
                    className="absolute inset-0 transition-transform duration-300"
                    style={{
                      transform: `scale(${zoom})`,
                    }}
                  >
                    {/* East Africa region */}
                    <div className="absolute left-[42%] top-[42%] h-[26%] w-[16%] rounded-[45%] border border-primary/20 bg-primary/5" />

                    {/* Horn of Africa */}
                    <div className="absolute left-[48%] top-[38%] h-[18%] w-[12%] rotate-[20deg] rounded-[50%] border border-primary/20 bg-primary/5" />

                    {/* Red Sea corridor */}
                    <div className="absolute left-[44%] top-[15%] h-[34%] w-[3%] rotate-[8deg] rounded-full bg-danger/5" />

                    {/* Africa / Europe labels */}
                    {layers.airports && (
                      <>
                        <MapLabel
                          left="45%"
                          top="54%"
                          label="ADD"
                        />

                        <MapLabel
                          left="51%"
                          top="45%"
                          label="NBO"
                        />

                        <MapLabel
                          left="46%"
                          top="37%"
                          label="CAI"
                        />

                        <MapLabel
                          left="40%"
                          top="32%"
                          label="IST"
                        />

                        <MapLabel
                          left="56%"
                          top="30%"
                          label="DXB"
                        />
                      </>
                    )}

                    {/* Route lines */}
                    {layers.routes && (
                      <>
                        <div className="absolute left-[45%] top-[52%] h-[1px] w-[16%] rotate-[-25deg] bg-primary/30" />

                        <div className="absolute left-[45%] top-[52%] h-[1px] w-[15%] rotate-[-48deg] bg-primary/20" />

                        <div className="absolute left-[45%] top-[52%] h-[1px] w-[14%] rotate-[-75deg] bg-secondary/20" />
                      </>
                    )}

                    {/* Real aircraft */}
                    {layers.aircraft &&
                      flightsWithCoordinates.map(
                        (flight, index) => {
                          const coordinates =
                            getMapCoordinates(flight);

                          if (!coordinates) {
                            return null;
                          }

                          const position =
                            coordinatesToPosition(
                              coordinates.latitude,
                              coordinates.longitude
                            );

                          const isSelected =
                            selectedFlight &&
                            getFlightNumber(
                              selectedFlight
                            ) ===
                              getFlightNumber(flight);

                          const status =
                            getStatus(flight);

                          return (
                            <button
                              type="button"
                              key={`${getFlightNumber(
                                flight
                              )}-${index}`}
                              onClick={() =>
                                setSelectedFlight(flight)
                              }
                              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                                isSelected
                                  ? "z-20 scale-125"
                                  : "hover:z-20 hover:scale-110"
                              }`}
                              style={position}
                              title={`${getFlightNumber(
                                flight
                              )} · ${getDepartureCode(
                                flight
                              )} → ${getArrivalCode(
                                flight
                              )}`}
                            >
                              <span
                                className={`absolute inset-[-8px] rounded-full ${
                                  status === "active"
                                    ? "animate-ping bg-primary/20"
                                    : ""
                                }`}
                              />

                              <span
                                className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-secondary bg-secondary text-[#0b1713]"
                                    : status ===
                                      "active"
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-neutral-muted bg-[#17211d] text-neutral-light"
                                }`}
                              >
                                <Plane
                                  className="h-4 w-4"
                                  style={{
                                    transform: `rotate(${
                                      flight?.live
                                        ?.direction || 0
                                    }deg)`,
                                  }}
                                />
                              </span>
                            </button>
                          );
                        }
                      )}
                  </div>

                  {/* Empty state */}
                  {!loading &&
                    flightsWithCoordinates.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-2xl border border-primary/20 bg-[#0b1713]/90 p-6 text-center backdrop-blur">
                          <Radar className="mx-auto h-10 w-10 text-primary" />

                          <h3 className="mt-3 font-semibold text-white">
                            No aircraft coordinates available
                          </h3>

                          <p className="mt-1 max-w-sm text-sm text-[#aab8b0]">
                            The API returned flight records, but
                            no usable live latitude and longitude
                            are available for the current results.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Loading */}
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0b1713]/60 backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />

                        <p className="mt-3 text-sm font-medium text-white">
                          Loading live aircraft...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Coordinates */}
                  {selectedCoordinates && (
                    <div className="absolute bottom-4 left-4 rounded-lg border border-primary/20 bg-[#0b1713]/90 px-3 py-2 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-wider text-[#7f9187]">
                        Selected Position
                      </p>

                      <p className="mt-1 font-mono text-xs text-primary">
                        {selectedCoordinates.latitude.toFixed(
                          4
                        )}
                        °,{" "}
                        {selectedCoordinates.longitude.toFixed(
                          4
                        )}
                        °
                      </p>
                    </div>
                  )}

                  {/* Zoom controls */}
                  <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-xl border border-primary/20 bg-[#0b1713]/90 shadow-lg backdrop-blur">
                    <button
                      type="button"
                      onClick={increaseZoom}
                      className="p-2.5 text-[#aab8b0] transition hover:bg-white/10 hover:text-white"
                      title="Zoom in"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <div className="border-y border-primary/10 px-2 py-1 text-center font-mono text-[10px] text-[#7f9187]">
                      {Math.round(zoom * 100)}%
                    </div>

                    <button
                      type="button"
                      onClick={decreaseZoom}
                      className="p-2.5 text-[#aab8b0] transition hover:bg-white/10 hover:text-white"
                      title="Zoom out"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={resetZoom}
                      className="border-t border-primary/10 p-2.5 text-[#aab8b0] transition hover:bg-white/10 hover:text-white"
                      title="Reset map"
                    >
                      <LocateFixed className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Map footer */}
                <div className="flex flex-col gap-3 border-t border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-light">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Airborne
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      Selected
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-neutral-muted" />
                      Other
                    </div>
                  </div>

                  <div className="text-xs text-neutral-muted">
                    {lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )}`
                      : "Waiting for data"}
                  </div>
                </div>
              </div>

              {/* ===========================================
                  SELECTED FLIGHT PANEL
              =========================================== */}

              <aside className="flex flex-col gap-4">

                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                        Selected Aircraft
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-neutral">
                        {selectedFlight
                          ? getFlightNumber(
                              selectedFlight
                            )
                          : "—"}
                      </h2>
                    </div>

                    {selectedFlight && (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          getStatus(selectedFlight)
                        )}`}
                      >
                        {getStatusLabel(
                          getStatus(selectedFlight)
                        )}
                      </span>
                    )}
                  </div>

                  {selectedFlight ? (
                    <>
                      <div className="mt-5 rounded-xl bg-background p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-sm font-bold text-primary">
                            {getAirlineCode(
                              selectedFlight
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral">
                              {getAirlineName(
                                selectedFlight
                              )}
                            </p>

                            <p className="truncate text-xs text-neutral-light">
                              {getAircraftType(
                                selectedFlight
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="mt-4 rounded-xl bg-background p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Current Route
                        </p>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xl font-bold text-neutral">
                              {getDepartureCode(
                                selectedFlight
                              )}
                            </p>

                            <p className="mt-1 text-xs text-neutral-light">
                              {getDepartureAirport(
                                selectedFlight
                              )}
                            </p>
                          </div>

                          <div className="flex flex-1 items-center gap-2">
                            <div className="h-px flex-1 bg-border" />

                            <Plane className="h-4 w-4 shrink-0 text-primary" />

                            <div className="h-px flex-1 bg-border" />
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-neutral">
                              {getArrivalCode(
                                selectedFlight
                              )}
                            </p>

                            <p className="mt-1 text-xs text-neutral-light">
                              {getArrivalAirport(
                                selectedFlight
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Telemetry */}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Telemetry
                          label="ALTITUDE"
                          value={getAltitude(
                            selectedFlight
                          )}
                        />

                        <Telemetry
                          label="SPEED"
                          value={getSpeed(
                            selectedFlight
                          )}
                        />

                        <Telemetry
                          label="HEADING"
                          value={getHeading(
                            selectedFlight
                          )}
                        />

                        <Telemetry
                          label="REGISTRATION"
                          value={getRegistration(
                            selectedFlight
                          )}
                        />
                      </div>

                      {/* Times */}
                      <div className="mt-4 rounded-xl bg-background p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Schedule
                        </p>

                        <div className="space-y-3">
                          <InfoRow
                            label="Departure"
                            value={formatTime(
                              selectedFlight
                                ?.departure
                                ?.scheduled
                            )}
                          />

                          <InfoRow
                            label="Arrival"
                            value={formatTime(
                              selectedFlight
                                ?.arrival
                                ?.scheduled
                            )}
                          />

                          <InfoRow
                            label="Last Updated"
                            value={formatTime(
                              selectedFlight?.live
                                ?.updated
                            )}
                          />
                        </div>
                      </div>

                      {/* Position */}
                      {selectedCoordinates && (
                        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <div className="flex items-center gap-2">
                            <LocateFixed className="h-4 w-4 text-primary" />

                            <p className="text-xs font-semibold text-primary">
                              Live Position
                            </p>
                          </div>

                          <div className="mt-2 font-mono text-xs text-neutral-light">
                            Latitude:{" "}
                            {selectedCoordinates.latitude.toFixed(
                              5
                            )}
                          </div>

                          <div className="mt-1 font-mono text-xs text-neutral-light">
                            Longitude:{" "}
                            {selectedCoordinates.longitude.toFixed(
                              5
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                      >
                        <Activity className="h-4 w-4" />
                        View Full Telemetry
                      </button>
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <Plane className="mx-auto h-10 w-10 text-neutral-muted" />

                      <p className="mt-3 text-sm font-medium text-neutral">
                        Select an aircraft
                      </p>

                      <p className="mt-1 text-xs text-neutral-muted">
                        Click an aircraft marker on the map to
                        inspect its telemetry.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            </section>

            {/* =============================================
                FILTER BAR
            ============================================= */}

            <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex flex-wrap items-center gap-2">
                  <FilterButton
                    active={statusFilter === "all"}
                    onClick={() =>
                      setStatusFilter("all")
                    }
                  >
                    All ({flights.length})
                  </FilterButton>

                  <FilterButton
                    active={statusFilter === "active"}
                    onClick={() =>
                      setStatusFilter("active")
                    }
                  >
                    Active ({activeFlights.length})
                  </FilterButton>

                  <FilterButton
                    active={statusFilter === "scheduled"}
                    onClick={() =>
                      setStatusFilter("scheduled")
                    }
                  >
                    Scheduled ({scheduledFlights.length})
                  </FilterButton>

                  <FilterButton
                    active={
                      statusFilter === "incident"
                    }
                    onClick={() =>
                      setStatusFilter("incident")
                    }
                  >
                    Incidents ({delayedFlights.length})
                  </FilterButton>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-muted">
                    Showing {filteredFlights.length} of{" "}
                    {flights.length} flights
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </section>

            {/* =============================================
                FLIGHT LIST
            ============================================= */}

            <section className="rounded-2xl border border-border bg-surface shadow-sm">

              <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-neutral">
                    Aircraft List
                  </h2>

                  <p className="mt-1 text-xs text-neutral-muted">
                    Live flights returned by AviationStack.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  Live monitoring
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="py-16 text-center">
                  <Search className="mx-auto h-9 w-9 text-neutral-muted" />

                  <p className="mt-3 font-semibold text-neutral">
                    No flights found
                  </p>

                  <p className="mt-1 text-sm text-neutral-muted">
                    Try changing your search or filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead>
                      <tr className="border-b border-border bg-background text-left">
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Flight
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Route
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Aircraft
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Altitude
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Speed
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Status
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-divider">
                      {filteredFlights.map(
                        (flight, index) => {
                          const flightNumber =
                            getFlightNumber(flight);

                          const isSelected =
                            selectedFlight &&
                            getFlightNumber(
                              selectedFlight
                            ) === flightNumber;

                          return (
                            <tr
                              key={`${flightNumber}-${index}`}
                              onClick={() =>
                                setSelectedFlight(
                                  flight
                                )
                              }
                              className={`cursor-pointer transition ${
                                isSelected
                                  ? "bg-primary/5"
                                  : "hover:bg-background"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                                    {getAirlineCode(
                                      flight
                                    )}
                                  </div>

                                  <div>
                                    <p className="font-semibold text-neutral">
                                      {flightNumber}
                                    </p>

                                    <p className="mt-0.5 text-xs text-neutral-muted">
                                      {getAirlineName(
                                        flight
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-neutral">
                                  <span>
                                    {getDepartureCode(
                                      flight
                                    )}
                                  </span>

                                  <Plane className="h-3.5 w-3.5 text-primary" />

                                  <span>
                                    {getArrivalCode(
                                      flight
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm text-neutral">
                                  {getAircraftType(
                                    flight
                                  )}
                                </p>

                                <p className="mt-0.5 text-xs text-neutral-muted">
                                  {getRegistration(
                                    flight
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4 font-mono text-xs text-neutral">
                                {getAltitude(flight)}
                              </td>

                              <td className="px-5 py-4 font-mono text-xs text-neutral">
                                {getSpeed(flight)}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                    getStatus(flight)
                                  )}`}
                                >
                                  {getStatusLabel(
                                    getStatus(flight)
                                  )}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    setSelectedFlight(
                                      flight
                                    );
                                  }}
                                  className="rounded-lg p-2 text-neutral-muted transition hover:bg-primary-light hover:text-primary"
                                  title="View aircraft"
                                >
                                  <LocateFixed className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* =============================================
                INFO BANNER
            ============================================= */}

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Radar className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral">
                      Real-Time Flight Monitoring
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-light">
                      Aircraft markers are positioned using
                      latitude and longitude returned by the
                      AviationStack live-flight response. The
                      dashboard automatically refreshes the
                      flight data every 15 seconds.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadFlights(true)}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-neutral transition hover:border-primary hover:text-primary"
                >
                  <RefreshCw className="h-4 w-4" />
                  Update Now
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function MetricCard({
  label,
  value,
  icon: Icon,
  positive = false,
  danger = false,
}) {
  return (
    <div className="min-w-[100px] rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold tracking-wider text-neutral-muted">
          {label}
        </span>

        <Icon
          className={`h-4 w-4 ${
            danger
              ? "text-danger"
              : positive
              ? "text-success"
              : "text-neutral-muted"
          }`}
        />
      </div>

      <p
        className={`mt-1 text-xl font-bold ${
          danger
            ? "text-danger"
            : positive
            ? "text-success"
            : "text-neutral"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Telemetry({ label, value }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <p className="text-[9px] font-semibold tracking-wider text-neutral-muted">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-xs font-bold text-neutral">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-neutral-muted">
        {label}
      </span>

      <span className="font-mono text-xs font-semibold text-neutral">
        {value}
      </span>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-background text-neutral-light hover:text-neutral"
      }`}
    >
      {children}
    </button>
  );
}

function LayerToggle({
  label,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral transition hover:bg-background"
    >
      <span>{label}</span>

      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
          checked
            ? "justify-end bg-primary"
            : "justify-start bg-neutral-muted/40"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}

function MapLabel({ left, top, label }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left,
        top,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />

        <span className="font-mono text-[9px] font-semibold tracking-wider text-primary/70">
          {label}
        </span>
      </div>
    </div>
  );
}