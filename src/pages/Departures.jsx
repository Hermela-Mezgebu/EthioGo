import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Plane,
  Printer,
  RefreshCw,
  Search,
  Timer,
  X,
} from "lucide-react"

import { getLiveFlights } from "../services/aviationStack"

const AIRPORT_CODE =
  import.meta.env.VITE_AIRPORT_CODE || "ADD"

const AIRPORT_ICAO =
  import.meta.env.VITE_AIRPORT_ICAO || "HAAB"

const AIRPORT_NAME =
  import.meta.env.VITE_AIRPORT_NAME ||
  "Addis Ababa Bole International Airport"

const AIRPORT_LOCATION =
  import.meta.env.VITE_AIRPORT_LOCATION ||
  "Addis Ababa, Ethiopia"

const ITEMS_PER_PAGE = 8
const AUTO_REFRESH_SECONDS = 30

const TERMINALS = [
  { value: "all", label: "All Terminals" },
  { value: "T1", label: "T1 (Domestic)" },
  { value: "T2", label: "T2 (International)" },
]

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "delayed", label: "Delayed" },
  { value: "landed", label: "Landed" },
  { value: "cancelled", label: "Cancelled" },
]

const TIME_WINDOWS = [
  { value: "all", label: "All Slots" },
  { value: "morning", label: "Morning (06:00 – 12:00)" },
  { value: "afternoon", label: "Afternoon (12:00 – 18:00)" },
  { value: "evening", label: "Evening (18:00 – 24:00)" },
  { value: "night", label: "Night (00:00 – 06:00)" },
]

const API_STATUS_MAP = {
  active: "active",
  scheduled: "scheduled",
  delayed: "delayed",
  landed: "landed",
  cancelled: "cancelled",
}

function getAirportCode(value) {
  if (!value) return "—"

  if (typeof value === "string") {
    return value
  }

  return value.iata || value.icao || "—"
}

function getAirportName(value) {
  if (!value) return "—"

  if (typeof value === "string") {
    return value
  }

  return value.airport || value.name || "—"
}

function getCountry(value) {
  if (!value || typeof value === "string") {
    return ""
  }

  return value.country || ""
}

function getAirlineName(airline) {
  if (!airline) return "—"

  if (typeof airline === "string") {
    return airline
  }

  return airline.name || airline.airline_name || "—"
}

function getAirlineCode(airline) {
  if (!airline) return "—"

  if (typeof airline === "string") {
    return airline
  }

  return airline.iata || airline.icao || "—"
}

function getFlightNumber(flight) {
  if (!flight) return "—"

  if (typeof flight === "string") {
    return flight
  }

  return (
    flight.iata ||
    flight.number ||
    flight.flight_number ||
    flight.icao ||
    "—"
  )
}

function getAircraftModel(aircraft) {
  if (!aircraft) return "—"

  if (typeof aircraft === "string") {
    return aircraft
  }

  return (
    aircraft.model ||
    aircraft.model_text ||
    aircraft.type ||
    "—"
  )
}

function getAircraftRegistration(aircraft) {
  if (!aircraft) return "—"

  if (typeof aircraft === "string") {
    return aircraft
  }

  return (
    aircraft.registration ||
    aircraft.reg ||
    aircraft.tail_number ||
    "—"
  )
}

function getDateValue(value) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatTime(value) {
  const date = getDateValue(value)

  if (!date) return "—"

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatDateTime(value) {
  const date = getDateValue(value)

  if (!date) return "—"

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()

  if (value === "active") return "Active"
  if (value === "scheduled") return "Scheduled"
  if (value === "delayed") return "Delayed"
  if (value === "landed") return "Landed"
  if (value === "cancelled") return "Cancelled"
  if (value === "canceled") return "Cancelled"

  return status || "Unknown"
}

function normalizeFlight(item, index) {
  const departure = item?.departure || {}
  const arrival = item?.arrival || {}
  const airline = item?.airline || {}
  const aircraft = item?.aircraft || {}
  const flight = item?.flight || {}

  const scheduled =
    departure.scheduled ||
    item?.scheduled_departure ||
    item?.departure_time ||
    null

  const estimated =
    departure.estimated ||
    item?.estimated_departure ||
    item?.departure_estimated ||
    null

  const actual =
    departure.actual ||
    item?.actual_departure ||
    item?.departure_actual ||
    null

  const delayedMinutes =
    departure.delay ??
    item?.departure_delay ??
    item?.delay ??
    null

  const terminal =
    departure.terminal ||
    item?.terminal ||
    null

  const gate =
    departure.gate ||
    item?.gate ||
    null

  return {
    id:
      item?.id ||
      flight?.iata ||
      `${flight?.icao || "flight"}-${index}`,

    flightNumber:
      getFlightNumber(flight) !== "—"
        ? getFlightNumber(flight)
        : item?.flight_number || "—",

    airlineName:
      getAirlineName(airline) !== "—"
        ? getAirlineName(airline)
        : item?.airline_name || "—",

    airlineCode:
      getAirlineCode(airline) !== "—"
        ? getAirlineCode(airline)
        : item?.airline_code || "—",

    destinationName:
      getAirportName(arrival) !== "—"
        ? getAirportName(arrival)
        : item?.destination || "—",

    destinationCode:
      getAirportCode(arrival) !== "—"
        ? getAirportCode(arrival)
        : item?.destination_code || "—",

    destinationCountry:
      getCountry(arrival) ||
      item?.destination_country ||
      "",

    aircraftModel:
      getAircraftModel(aircraft) !== "—"
        ? getAircraftModel(aircraft)
        : item?.aircraft_model || "—",

    registration:
      getAircraftRegistration(aircraft) !== "—"
        ? getAircraftRegistration(aircraft)
        : item?.tail_number || "—",

    scheduled,
    estimated,
    actual,

    terminal,
    gate,

    delay: delayedMinutes,

    status: normalizeStatus(
      item?.flight_status || item?.status
    ),

    departureAirport:
      getAirportName(departure),

    departureCode:
      getAirportCode(departure),

    raw: item,
  }
}

function getStatusKey(status) {
  const value = String(status || "").toLowerCase()

  if (value.includes("delay")) return "delayed"
  if (value.includes("cancel")) return "cancelled"
  if (value.includes("land")) return "landed"
  if (value.includes("active")) return "active"
  if (value.includes("schedule")) return "scheduled"

  return value
}

function getStatusClasses(status) {
  const key = getStatusKey(status)

  switch (key) {
    case "active":
      return "bg-primary-fixed text-on-primary-fixed"

    case "delayed":
      return "bg-secondary-fixed text-on-secondary-fixed"

    case "cancelled":
      return "bg-error-container text-on-error-container"

    case "landed":
      return "bg-surface-container-high text-on-surface"

    case "scheduled":
    default:
      return "bg-tertiary-fixed text-on-tertiary-fixed"
  }
}

function getStatusDot(status) {
  const key = getStatusKey(status)

  switch (key) {
    case "active":
      return "bg-primary"

    case "delayed":
      return "bg-secondary"

    case "cancelled":
      return "bg-error"

    case "landed":
      return "bg-outline"

    default:
      return "bg-tertiary"
  }
}

function getTimeWindow(dateValue) {
  const date = getDateValue(dateValue)

  if (!date) return "unknown"

  const hour = date.getHours()

  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 24) return "evening"

  return "night"
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass = "text-primary",
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6f7a70]">
          {label}
        </span>

        <span className="mt-1 text-[22px] font-bold leading-7 text-[#131e19]">
          {value}
        </span>

        {description && (
          <span className="mt-0.5 text-xs text-[#6f7a70]">
            {description}
          </span>
        )}
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf7ee] ${iconClass}`}
      >
        <Icon size={20} />
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
        status
      )}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
          status
        )}`}
      />

      {status}
    </span>
  )
}

function LoadingRows() {
  return Array.from({ length: ITEMS_PER_PAGE }).map(
    (_, index) => (
      <tr key={index} className="animate-pulse">
        {Array.from({ length: 10 }).map(
          (_, cellIndex) => (
            <td key={cellIndex} className="px-4 py-4">
              <div className="h-4 rounded bg-[#e4f1e9]" />
            </td>
          )
        )}
      </tr>
    )
  )
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <tr>
      <td colSpan={10} className="px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7ee] text-[#005932]">
            <Plane size={22} />
          </div>

          <h3 className="mt-4 text-base font-semibold text-[#131e19]">
            {hasFilters
              ? "No departures match your filters"
              : "No departure flights returned"}
          </h3>

          <p className="mt-1 text-sm text-[#6f7a70]">
            {hasFilters
              ? "Try changing your search, terminal, status, or time window."
              : "AviationStack did not return any departure records for this airport."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="mt-4 rounded-lg bg-[#005932] px-4 py-2 text-sm font-medium text-white hover:bg-[#087443]"
            >
              Reset filters
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function FlightDetailsModal({ flight, onClose }) {
  if (!flight) return null

  const departureDate =
    flight.actual ||
    flight.estimated ||
    flight.scheduled

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between border-b border-[#d9e6dd] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6f7a70]">
              Flight details
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#131e19]">
              {flight.flightNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#6f7a70] hover:bg-[#e4f1e9] hover:text-[#131e19]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between rounded-xl bg-[#eaf7ee] p-4">
            <div>
              <p className="text-xs text-[#6f7a70]">
                Airline
              </p>

              <p className="mt-1 font-semibold text-[#131e19]">
                {flight.airlineName}
              </p>
            </div>

            <StatusBadge status={flight.status} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="Destination"
              value={`${flight.destinationName}${
                flight.destinationCode !== "—"
                  ? ` (${flight.destinationCode})`
                  : ""
              }`}
            />

            <DetailItem
              label="Country"
              value={
                flight.destinationCountry || "—"
              }
            />

            <DetailItem
              label="Scheduled departure"
              value={formatDateTime(
                flight.scheduled
              )}
            />

            <DetailItem
              label="Estimated departure"
              value={formatDateTime(
                flight.estimated
              )}
            />

            <DetailItem
              label="Actual departure"
              value={formatDateTime(
                flight.actual
              )}
            />

            <DetailItem
              label="Aircraft"
              value={flight.aircraftModel}
            />

            <DetailItem
              label="Registration"
              value={flight.registration}
            />

            <DetailItem
              label="Terminal"
              value={flight.terminal || "—"}
            />

            <DetailItem
              label="Gate"
              value={flight.gate || "—"}
            />

            <DetailItem
              label="Departure airport"
              value={`${flight.departureAirport} (${flight.departureCode})`}
            />

            <DetailItem
              label="Delay"
              value={
                flight.delay !== null &&
                flight.delay !== undefined
                  ? `${flight.delay} minutes`
                  : "—"
              }
            />

            <DetailItem
              label="Observed time"
              value={formatDateTime(
                departureDate
              )}
            />
          </div>

          <div className="rounded-xl border border-[#d9e6dd] bg-[#f7f9fb] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6f7a70]">
              Data source
            </p>

            <p className="mt-1 text-sm text-[#3f4941]">
              Live flight data returned by
              AviationStack for {AIRPORT_CODE}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-[#d9e6dd] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6f7a70]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#131e19]">
        {value || "—"}
      </p>
    </div>
  )
}

export default function Departures() {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastSyncedAt, setLastSyncedAt] =
    useState(null)

  const [search, setSearch] = useState("")
  const [terminal, setTerminal] =
    useState("all")
  const [status, setStatus] = useState("all")
  const [timeWindow, setTimeWindow] =
    useState("all")

  const [page, setPage] = useState(1)
  const [countdown, setCountdown] = useState(
    AUTO_REFRESH_SECONDS
  )

  const [selectedFlight, setSelectedFlight] =
    useState(null)

  const loadDepartures = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true)
      }

      setError("")

      try {
        const response = await getLiveFlights({
          depIata: AIRPORT_CODE,
          limit: 100,
        })

        const data = Array.isArray(response?.data)
          ? response.data
          : []

        const normalized = data.map(
          normalizeFlight
        )

        setFlights(normalized)
        setLastSyncedAt(new Date())
        setCountdown(AUTO_REFRESH_SECONDS)
        setPage(1)
      } catch (requestError) {
        console.error(
          "Departures request failed:",
          requestError
        )

        setError(
          requestError?.message ||
            "Unable to load departure flights."
        )

        if (!silent) {
          setFlights([])
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    loadDepartures()
  }, [loadDepartures])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          loadDepartures({ silent: true })
          return AUTO_REFRESH_SECONDS
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadDepartures])

  const filteredFlights = useMemo(() => {
    const query = search.trim().toLowerCase()

    return flights.filter((flight) => {
      const matchesSearch =
        !query ||
        [
          flight.flightNumber,
          flight.airlineName,
          flight.airlineCode,
          flight.destinationName,
          flight.destinationCode,
          flight.destinationCountry,
          flight.aircraftModel,
          flight.registration,
          flight.terminal,
          flight.gate,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)

      const matchesTerminal =
        terminal === "all" ||
        String(flight.terminal || "").toUpperCase() ===
          terminal

      const statusKey = getStatusKey(
        flight.status
      )

      const matchesStatus =
        status === "all" ||
        statusKey === status

      const matchesTime =
        timeWindow === "all" ||
        getTimeWindow(flight.scheduled) ===
          timeWindow

      return (
        matchesSearch &&
        matchesTerminal &&
        matchesStatus &&
        matchesTime
      )
    })
  }, [
    flights,
    search,
    terminal,
    status,
    timeWindow,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFlights.length / ITEMS_PER_PAGE
    )
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedFlights = useMemo(() => {
    const start =
      (page - 1) * ITEMS_PER_PAGE

    return filteredFlights.slice(
      start,
      start + ITEMS_PER_PAGE
    )
  }, [filteredFlights, page])

  const metrics = useMemo(() => {
    const total = flights.length

    const delayed = flights.filter(
      (flight) =>
        getStatusKey(flight.status) === "delayed"
    ).length

    const active = flights.filter(
      (flight) =>
        getStatusKey(flight.status) === "active"
    ).length

    const scheduled = flights.filter(
      (flight) =>
        getStatusKey(flight.status) === "scheduled"
    ).length

    const cancelled = flights.filter(
      (flight) =>
        getStatusKey(flight.status) ===
        "cancelled"
    ).length

    return {
      total,
      delayed,
      active,
      scheduled,
      cancelled,
    }
  }, [flights])

  const resetFilters = () => {
    setSearch("")
    setTerminal("all")
    setStatus("all")
    setTimeWindow("all")
    setPage(1)
  }

  const handleExportCsv = () => {
    if (!filteredFlights.length) return

    const headers = [
      "Flight",
      "Airline",
      "Destination",
      "Destination IATA",
      "Country",
      "Aircraft",
      "Registration",
      "Scheduled",
      "Estimated",
      "Actual",
      "Terminal",
      "Gate",
      "Status",
      "Delay Minutes",
    ]

    const rows = filteredFlights.map(
      (flight) => [
        flight.flightNumber,
        flight.airlineName,
        flight.destinationName,
        flight.destinationCode,
        flight.destinationCountry,
        flight.aircraftModel,
        flight.registration,
        flight.scheduled || "",
        flight.estimated || "",
        flight.actual || "",
        flight.terminal || "",
        flight.gate || "",
        flight.status,
        flight.delay ?? "",
      ]
    )

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(
              value ?? ""
            )

            return `"${stringValue.replaceAll(
              '"',
              '""'
            )}"`
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)

    const anchor =
      document.createElement("a")

    anchor.href = url
    anchor.download = `departures-${AIRPORT_CODE}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const visibleStart =
    filteredFlights.length === 0
      ? 0
      : (page - 1) * ITEMS_PER_PAGE + 1

  const visibleEnd = Math.min(
    page * ITEMS_PER_PAGE,
    filteredFlights.length
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#131e19]">
      {/* Airport operational header */}
      <section className="border-b border-[#d9e6dd] bg-white px-4 py-4 shadow-sm sm:px-6 xl:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#005932] text-white shadow-sm">
              <span className="text-sm font-bold tracking-wider">
                {AIRPORT_CODE}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-[#131e19]">
                  {AIRPORT_NAME}
                </h1>

                <span className="rounded-full bg-[#d9e6dd] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#3f4941]">
                  {AIRPORT_ICAO} /{" "}
                  {AIRPORT_CODE}
                </span>

                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005932] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#005932]" />
                </span>
              </div>

              <p className="mt-0.5 text-xs text-[#6f7a70]">
                Departure Operations ·{" "}
                {AIRPORT_LOCATION}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-[#eaf7ee] px-3 py-2">
              <Timer
                size={17}
                className="text-[#005932]"
              />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6f7a70]">
                  Station Clock
                </p>

                <p className="font-mono text-xs font-semibold text-[#131e19]">
                  {new Date().toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#becabe] bg-[#eaf7ee] px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#087443]" />

              <span className="text-[11px] font-semibold text-[#087443]">
                AviationStack Connected
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="px-4 py-5 sm:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
          {/* Data-backed KPI cards */}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Departures Returned"
              value={metrics.total}
              description="Current AviationStack response"
              icon={Plane}
            />

            <MetricCard
              label="Active"
              value={metrics.active}
              description="Active flight records"
              icon={Activity}
            />

            <MetricCard
              label="Scheduled"
              value={metrics.scheduled}
              description="Scheduled departure records"
              icon={Timer}
            />

            <MetricCard
              label="Delayed"
              value={metrics.delayed}
              description={`${metrics.cancelled} cancelled`}
              icon={RefreshCw}
              iconClass={
                metrics.delayed > 0
                  ? "text-[#7a5900]"
                  : "text-[#005932]"
              }
            />
          </section>

          {/* Error */}
          {error && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#ffdad6] bg-[#fff5f4] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#93000a]">
                  Unable to load departure data
                </p>

                <p className="mt-1 text-sm text-[#93000a]">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadDepartures()
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#005932] px-4 py-2 text-sm font-medium text-white hover:bg-[#087443]"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          )}

          {/* Filter control station */}
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                {/* Search */}
                <div className="relative min-w-0 flex-1 xl:max-w-xl">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7a70]"
                  />

                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(
                        event.target.value
                      )
                      setPage(1)
                    }}
                    className="h-10 w-full rounded-lg bg-[#eaf7ee] pl-10 pr-4 text-sm text-[#131e19] outline-none transition focus:ring-2 focus:ring-[#005932]/20"
                    placeholder="Search flight number, city, IATA code, or carrier..."
                  />
                </div>

                {/* Terminal filters */}
                <div className="flex flex-wrap items-center rounded-lg bg-[#e4f1e9] p-1">
                  {TERMINALS.map((item) => {
                    const active =
                      terminal === item.value

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setTerminal(
                            item.value
                          )
                          setPage(1)
                        }}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? "bg-white text-[#131e19] shadow-sm"
                            : "text-[#3f4941] hover:text-[#131e19]"
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                {/* Refresh */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-[#eaf7ee] px-3 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005932] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#005932]" />
                    </span>

                    <span className="text-[11px] text-[#3f4941]">
                      Auto-sync in{" "}
                      <strong className="font-mono text-[#131e19]">
                        {countdown}s
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      loadDepartures()
                    }
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#eaf7ee] px-3.5 text-xs font-semibold text-[#131e19] shadow-sm hover:bg-[#e4f1e9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={
                        loading
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Sync
                  </button>
                </div>
              </div>

              {/* Status + time window */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#e4f1e9] p-1">
                  {STATUS_FILTERS.map((item) => {
                    const active =
                      status === item.value

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setStatus(
                            item.value
                          )
                          setPage(1)
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? "bg-white text-[#131e19] shadow-sm"
                            : "text-[#3f4941] hover:text-[#131e19]"
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6f7a70]">
                    Window:
                  </span>

                  {TIME_WINDOWS.map((item) => {
                    const active =
                      timeWindow === item.value

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setTimeWindow(
                            item.value
                          )
                          setPage(1)
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? "bg-[#005932] text-white"
                            : "bg-[#eaf7ee] text-[#3f4941] hover:bg-[#e4f1e9]"
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Departures matrix */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse text-left">
                <thead>
                  <tr className="h-10 bg-[#eaf7ee] text-[11px] uppercase tracking-wider text-[#3f4941]">
                    <th className="px-4 py-2 font-semibold">
                      Flight
                    </th>

                    <th className="px-4 py-2 font-semibold">
                      Carrier
                    </th>

                    <th className="px-4 py-2 font-semibold">
                      Destination
                    </th>

                    <th className="px-4 py-2 font-semibold">
                      Equipment / Reg
                    </th>

                    <th className="px-4 py-2 text-right font-semibold">
                      Scheduled
                    </th>

                    <th className="px-4 py-2 text-right font-semibold">
                      Estimate / Actual
                    </th>

                    <th className="px-4 py-2 text-center font-semibold">
                      Terminal · Gate
                    </th>

                    <th className="px-4 py-2 font-semibold">
                      Check-In
                    </th>

                    <th className="px-4 py-2 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-2 text-right font-semibold">
                      Telemetry
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e4f1e9]">
                  {loading ? (
                    <LoadingRows />
                  ) : paginatedFlights.length === 0 ? (
                    <EmptyState
                      hasFilters={
                        Boolean(search) ||
                        terminal !== "all" ||
                        status !== "all" ||
                        timeWindow !== "all"
                      }
                      onReset={resetFilters}
                    />
                  ) : (
                    paginatedFlights.map(
                      (flight) => {
                        const displayedTime =
                          flight.actual ||
                          flight.estimated

                        const hasDelay =
                          flight.delay !== null &&
                          flight.delay !== undefined &&
                          Number(flight.delay) > 0

                        return (
                          <tr
                            key={flight.id}
                            className="group h-16 transition-colors hover:bg-[#eaf7ee]/60"
                          >
                            {/* Flight */}
                            <td className="px-4 py-2">
                              <span className="font-mono text-sm font-bold text-[#005932]">
                                {flight.flightNumber}
                              </span>
                            </td>

                            {/* Airline */}
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#087443] text-[9px] font-bold text-white">
                                  {flight.airlineCode?.slice(
                                    0,
                                    3
                                  )}
                                </div>

                                <span className="max-w-[150px] truncate text-sm font-medium text-[#131e19]">
                                  {
                                    flight.airlineName
                                  }
                                </span>
                              </div>
                            </td>

                            {/* Destination */}
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-[#131e19]">
                                    {
                                      flight.destinationName
                                    }
                                  </span>

                                  {flight.destinationCode !==
                                    "—" && (
                                    <span className="rounded bg-[#d9e6dd] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#3f4941]">
                                      {
                                        flight.destinationCode
                                      }
                                    </span>
                                  )}
                                </div>

                                {flight.destinationCountry && (
                                  <span className="text-xs text-[#6f7a70]">
                                    {
                                      flight.destinationCountry
                                    }
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Equipment */}
                            <td className="px-4 py-2">
                              <div className="flex flex-col font-mono text-xs">
                                <span className="font-semibold text-[#131e19]">
                                  {
                                    flight.aircraftModel
                                  }
                                </span>

                                <span className="text-[11px] text-[#6f7a70]">
                                  {
                                    flight.registration
                                  }
                                </span>
                              </div>
                            </td>

                            {/* Scheduled */}
                            <td className="px-4 py-2 text-right">
                              <span className="font-mono text-sm font-semibold text-[#131e19]">
                                {formatTime(
                                  flight.scheduled
                                )}
                              </span>
                            </td>

                            {/* Estimate / Actual */}
                            <td className="px-4 py-2 text-right">
                              <div className="flex flex-col items-end">
                                <span
                                  className={`font-mono text-sm font-semibold ${
                                    hasDelay
                                      ? "text-[#7a5900]"
                                      : "text-[#005932]"
                                  }`}
                                >
                                  {formatTime(
                                    displayedTime
                                  )}
                                </span>

                                <span
                                  className={`text-[11px] font-medium ${
                                    hasDelay
                                      ? "text-[#7a5900]"
                                      : "text-[#6f7a70]"
                                  }`}
                                >
                                  {flight.actual
                                    ? "Actual"
                                    : flight.estimated
                                      ? "Estimated"
                                      : "—"}

                                  {hasDelay &&
                                    ` · +${flight.delay}m`}
                                </span>
                              </div>
                            </td>

                            {/* Terminal / Gate */}
                            <td className="px-4 py-2 text-center">
                              <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#e4f1e9] px-2.5 py-1">
                                <span className="text-[11px] font-medium text-[#6f7a70]">
                                  {flight.terminal ||
                                    "—"}
                                </span>

                                <span className="text-[#6f7a70]">
                                  |
                                </span>

                                <span className="font-mono text-xs font-bold text-[#131e19]">
                                  {flight.gate ||
                                    "—"}
                                </span>
                              </div>
                            </td>

                            {/* Check-in */}
                            <td className="px-4 py-2">
                              <span className="rounded bg-[#f7f9fb] px-2 py-1 font-mono text-[11px] font-medium text-[#6f7a70]">
                                —
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-2">
                              <StatusBadge
                                status={
                                  flight.status
                                }
                              />
                            </td>

                            {/* Action */}
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFlight(
                                    flight
                                  )
                                }
                                className="rounded bg-[#eaf7ee] px-3 py-1.5 text-[11px] font-semibold text-[#131e19] shadow-sm transition hover:bg-[#005932] hover:text-white"
                              >
                                View Flight
                              </button>
                            </td>
                          </tr>
                        )
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-[#d9e6dd] bg-[#eaf7ee] p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6f7a70]">
                <span>
                  Showing{" "}
                  <strong className="font-mono font-bold text-[#131e19]">
                    {visibleStart}
                    {filteredFlights.length
                      ? `–${visibleEnd}`
                      : ""}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-mono font-bold text-[#131e19]">
                    {filteredFlights.length}
                  </strong>{" "}
                  departures
                </span>

                <span className="hidden text-[#6f7a70] sm:inline">
                  ·
                </span>

                <span className="flex items-center gap-1.5">
                  <Activity
                    size={14}
                    className="text-[#005932]"
                  />

                  Feed Sync:{" "}
                  <span className="font-mono text-[#131e19]">
                    {lastSyncedAt
                      ? lastSyncedAt.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          }
                        )
                      : "—"}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={
                      !filteredFlights.length
                    }
                    className="rounded-lg p-2 text-[#6f7a70] hover:bg-white hover:text-[#131e19] disabled:opacity-40"
                    title="Export CSV"
                  >
                    <Download size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-lg p-2 text-[#6f7a70] hover:bg-white hover:text-[#131e19]"
                    title="Print flight board"
                  >
                    <Printer size={17} />
                  </button>
                </div>

                <span className="mr-1 font-mono text-[11px] text-[#6f7a70]">
                  Page {page} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6f7a70] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                {Array.from(
                  {
                    length: Math.min(
                      totalPages,
                      5
                    ),
                  },
                  (_, index) => {
                    let pageNumber

                    if (totalPages <= 5) {
                      pageNumber = index + 1
                    } else if (page <= 3) {
                      pageNumber = index + 1
                    } else if (
                      page >=
                      totalPages - 2
                    ) {
                      pageNumber =
                        totalPages - 4 + index
                    } else {
                      pageNumber =
                        page - 2 + index
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() =>
                          setPage(pageNumber)
                        }
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[11px] font-semibold shadow-sm ${
                          page === pageNumber
                            ? "bg-[#005932] text-white"
                            : "bg-white text-[#131e19] hover:bg-[#e4f1e9]"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  }
                )}

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6f7a70] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>

          {/* Data-backed operational summary */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#131e19]">
                  Departure Status
                </h2>

                <Activity
                  size={18}
                  className="text-[#005932]"
                />
              </div>

              <p className="mt-1 text-xs text-[#6f7a70]">
                Distribution of statuses in the
                current AviationStack response.
              </p>

              <div className="mt-4 space-y-3">
                <ProgressRow
                  label="Active"
                  value={metrics.active}
                  total={metrics.total}
                  className="bg-[#005932]"
                />

                <ProgressRow
                  label="Scheduled"
                  value={metrics.scheduled}
                  total={metrics.total}
                  className="bg-[#145ae2]"
                />

                <ProgressRow
                  label="Delayed"
                  value={metrics.delayed}
                  total={metrics.total}
                  className="bg-[#febf27]"
                />

                <ProgressRow
                  label="Cancelled"
                  value={metrics.cancelled}
                  total={metrics.total}
                  className="bg-[#ba1a1a]"
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#131e19]">
                  Terminal Distribution
                </h2>

                <Plane
                  size={18}
                  className="text-[#005932]"
                />
              </div>

              <p className="mt-1 text-xs text-[#6f7a70]">
                Departure records grouped by terminal.
              </p>

              <div className="mt-4 space-y-3">
                <TerminalSummary
                  terminal="T1"
                  flights={flights}
                />

                <TerminalSummary
                  terminal="T2"
                  flights={flights}
                />

                <TerminalSummary
                  terminal="Unknown"
                  flights={flights}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#131e19]">
                  Data Availability
                </h2>

                <Timer
                  size={18}
                  className="text-[#005932]"
                />
              </div>

              <p className="mt-1 text-xs text-[#6f7a70]">
                Fields shown here are based only on
                the returned flight records.
              </p>

              <div className="mt-4 space-y-2">
                <AvailabilityRow
                  label="Flight numbers"
                  available={flights.filter(
                    (item) =>
                      item.flightNumber !== "—"
                  ).length}
                  total={flights.length}
                />

                <AvailabilityRow
                  label="Aircraft data"
                  available={flights.filter(
                    (item) =>
                      item.aircraftModel !==
                      "—"
                  ).length}
                  total={flights.length}
                />

                <AvailabilityRow
                  label="Terminal / gate"
                  available={flights.filter(
                    (item) =>
                      item.terminal ||
                      item.gate
                  ).length}
                  total={flights.length}
                />

                <AvailabilityRow
                  label="Actual departure"
                  available={flights.filter(
                    (item) => item.actual
                  ).length}
                  total={flights.length}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <FlightDetailsModal
        flight={selectedFlight}
        onClose={() =>
          setSelectedFlight(null)
        }
      />
    </div>
  )
}

function ProgressRow({
  label,
  value,
  total,
  className,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-[#131e19]">
          {label}
        </span>

        <span className="font-mono text-[#6f7a70]">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#e4f1e9]">
        <div
          className={`h-full rounded-full ${className}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  )
}

function TerminalSummary({
  terminal,
  flights,
}) {
  const value =
    terminal === "Unknown"
      ? flights.filter(
          (flight) => !flight.terminal
        ).length
      : flights.filter(
          (flight) =>
            String(flight.terminal || "")
              .toUpperCase() === terminal
        ).length

  return (
    <div className="flex items-center justify-between rounded-lg bg-[#eaf7ee] p-2.5">
      <span className="text-xs font-semibold text-[#131e19]">
        {terminal}
      </span>

      <span className="font-mono text-xs font-bold text-[#005932]">
        {value} departures
      </span>
    </div>
  )
}

function AvailabilityRow({
  label,
  available,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round((available / total) * 100)
      : 0

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#d9e6dd] px-3 py-2">
      <span className="text-xs text-[#3f4941]">
        {label}
      </span>

      <span className="font-mono text-xs font-semibold text-[#131e19]">
        {available}/{total} ({percentage}%)
      </span>
    </div>
  )
}