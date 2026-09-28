import { useCallback, useEffect, useMemo, useState } from "react"

import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Eye,
  Gauge,
  Grid2X2,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Radar,
  RefreshCw,
  Search,
  Thermometer,
  TrendingUp,
  Wind,
} from "lucide-react"

import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Badge from "../components/ui/Badge"
import Card from "../components/ui/Card"

import { getLiveFlights } from "../services/aviationStack"


/* =========================================================
   CONSTANTS
========================================================= */

const AIRPORT_IATA = "ADD"
const AIRPORT_ICAO = "HAAB"

const REFRESH_INTERVAL = 60 * 1000


/* =========================================================
   DATE / TIME HELPERS
========================================================= */

function getEthiopiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date())
}

function formatEthiopiaTime(value) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function formatEthiopiaDateTime(value) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}


/* =========================================================
   API DATA HELPERS
========================================================= */

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.icao ||
    "—"
  )
}

function getAirlineName(flight) {
  return (
    flight?.airline?.name ||
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "Unknown airline"
  )
}

function getAircraftName(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    flight?.aircraft?.registration ||
    "—"
  )
}

function getDepartureAirport(flight) {
  return (
    flight?.departure?.airport ||
    flight?.departure?.iata ||
    "Unknown"
  )
}

function getArrivalAirport(flight) {
  return (
    flight?.arrival?.airport ||
    flight?.arrival?.iata ||
    "Unknown"
  )
}

function getDepartureCode(flight) {
  return (
    flight?.departure?.iata ||
    flight?.departure?.icao ||
    "—"
  )
}

function getArrivalCode(flight) {
  return (
    flight?.arrival?.iata ||
    flight?.arrival?.icao ||
    "—"
  )
}

function getDepartureScheduled(flight) {
  return (
    flight?.departure?.scheduled ||
    flight?.departure?.estimated ||
    null
  )
}

function getDepartureEstimated(flight) {
  return (
    flight?.departure?.estimated ||
    flight?.departure?.scheduled ||
    null
  )
}

function getArrivalScheduled(flight) {
  return (
    flight?.arrival?.scheduled ||
    flight?.arrival?.estimated ||
    null
  )
}

function getArrivalEstimated(flight) {
  return (
    flight?.arrival?.estimated ||
    flight?.arrival?.scheduled ||
    null
  )
}

function getFlightStatus(flight) {
  return flight?.flight_status || "unknown"
}

function getFlightDelay(flight) {
  const departureDelay =
    Number(flight?.departure?.delay || 0)

  const arrivalDelay =
    Number(flight?.arrival?.delay || 0)

  return Math.max(
    departureDelay,
    arrivalDelay
  )
}

function getFlightStatusLabel(flight) {
  const status = getFlightStatus(flight)
  const delay = getFlightDelay(flight)

  if (status === "cancelled") {
    return "Cancelled"
  }

  if (status === "diverted") {
    return "Diverted"
  }

  if (status === "active") {
    return "Airborne"
  }

  if (status === "landed") {
    return "Landed"
  }

  if (status === "scheduled") {
    if (delay > 0) {
      return `Delayed +${delay}m`
    }

    return "Scheduled"
  }

  return status
}

function getBadgeStatus(flight) {
  const status = getFlightStatus(flight)
  const delay = getFlightDelay(flight)

  if (
    status === "cancelled" ||
    status === "diverted"
  ) {
    return "delayed"
  }

  if (status === "active") {
    return "active"
  }

  if (status === "landed") {
    return "landed"
  }

  if (delay > 0) {
    return "delayed"
  }

  return "scheduled"
}

function getTerminal(flight, type) {
  if (type === "departure") {
    return (
      flight?.departure?.terminal ||
      "—"
    )
  }

  return (
    flight?.arrival?.terminal ||
    "—"
  )
}

function getGate(flight, type) {
  if (type === "departure") {
    return (
      flight?.departure?.gate ||
      "—"
    )
  }

  return (
    flight?.arrival?.gate ||
    "—"
  )
}

function getBaggage(flight) {
  return (
    flight?.arrival?.baggage ||
    "—"
  )
}

function getTrafficHour(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Addis_Ababa",
      hour: "2-digit",
      hour12: false,
    }).format(date)
  )
}


/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeDeparture(flight) {
  return {
    raw: flight,

    flight: getFlightNumber(flight),

    airline: getAirlineName(flight),

    aircraft: getAircraftName(flight),

    destination: getArrivalAirport(flight),

    code: getArrivalCode(flight),

    scheduled: formatEthiopiaTime(
      getDepartureScheduled(flight)
    ),

    estimated: formatEthiopiaTime(
      getDepartureEstimated(flight)
    ),

    gate: getGate(flight, "departure"),

    terminal: getTerminal(
      flight,
      "departure"
    ),

    status: getBadgeStatus(flight),

    statusLabel:
      getFlightStatusLabel(flight),

    delay: getFlightDelay(flight),
  }
}

function normalizeArrival(flight) {
  return {
    raw: flight,

    flight: getFlightNumber(flight),

    airline: getAirlineName(flight),

    aircraft: getAircraftName(flight),

    origin: getDepartureAirport(flight),

    code: getDepartureCode(flight),

    scheduled: formatEthiopiaTime(
      getArrivalScheduled(flight)
    ),

    estimated: formatEthiopiaTime(
      getArrivalEstimated(flight)
    ),

    estimateLabel:
      getArrivalEstimated(flight)
        ? formatEthiopiaTime(
            getArrivalEstimated(flight)
          )
        : "—",

    belt: getBaggage(flight),

    area:
      flight?.arrival?.airport ||
      "—",

    status: getBadgeStatus(flight),

    statusLabel:
      getFlightStatusLabel(flight),

    delay: getFlightDelay(flight),
  }
}


/* =========================================================
   STAT CARD
========================================================= */

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
  iconBackground,
}) {
  return (
    <Card
      padding="none"
      className="h-[116px] px-5 py-4"
    >
      <div className="flex h-full items-center justify-between gap-4">
        <div className="flex h-full flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
            {label}
          </span>

          <span className="text-3xl font-bold tracking-tight text-neutral tabular-nums">
            {value}
          </span>

          <div
            className={`flex items-center gap-1 text-[11px] font-semibold ${iconClassName}`}
          >
            {description}
          </div>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBackground} ${iconClassName}`}
        >
          <Icon
            size={23}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </Card>
  )
}


/* =========================================================
   TRAFFIC CHART
========================================================= */

function TrafficChart({
  departures,
  arrivals,
}) {
  const trafficData = useMemo(() => {
    const hours = [
      0,
      2,
      4,
      6,
      8,
      10,
      12,
      14,
      16,
      18,
      20,
      22,
    ]

    return hours.map((hour) => {
      const departureCount =
        departures.filter(
          (flight) =>
            getTrafficHour(
              flight.raw?.departure?.scheduled
            ) === hour
        ).length

      const arrivalCount =
        arrivals.filter(
          (flight) =>
            getTrafficHour(
              flight.raw?.arrival?.scheduled
            ) === hour
        ).length

      return {
        time: `${String(hour).padStart(
          2,
          "0"
        )}:00`,

        departures: departureCount,

        arrivals: arrivalCount,
      }
    })
  }, [departures, arrivals])

  const maxValue = Math.max(
    1,
    ...trafficData.flatMap(
      (item) => [
        item.departures,
        item.arrivals,
      ]
    )
  )

  return (
    <div className="rounded-xl bg-background/70 p-3">
      <div className="h-24 w-full">
        <div className="flex h-full items-end justify-between gap-2 px-2">
          {trafficData.map((item) => {
            const departureHeight =
              (item.departures /
                maxValue) *
              100

            const arrivalHeight =
              (item.arrivals /
                maxValue) *
              100

            return (
              <div
                key={item.time}
                className="flex h-full flex-1 items-end justify-center gap-1"
              >
                <div
                  title={`${item.time} departures: ${item.departures}`}
                  className="w-2.5 rounded-t-md bg-primary transition-all duration-300 hover:bg-primary-dark sm:w-3"
                  style={{
                    height:
                      `${Math.max(
                        departureHeight,
                        item.departures
                          ? 4
                          : 0
                      )}%`,
                  }}
                />

                <div
                  title={`${item.time} arrivals: ${item.arrivals}`}
                  className="w-2.5 rounded-t-md bg-tertiary transition-all duration-300 hover:bg-tertiary/80 sm:w-3"
                  style={{
                    height:
                      `${Math.max(
                        arrivalHeight,
                        item.arrivals
                          ? 4
                          : 0
                      )}%`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex justify-between px-2 text-[9px] font-medium text-neutral-muted">
        {trafficData.map((item) => (
          <span key={item.time}>
            {item.time}
          </span>
        ))}
      </div>
    </div>
  )
}


/* =========================================================
   FLIGHT TRACKER
========================================================= */

function FlightTracker({
  query,
  setQuery,
  onTrack,
  trackingMessage,
  trackingFlight,
  trackingLoading,
}) {
  const quickSearches = [
    "ET602",
    "ET500",
    "ET908",
    "ET302",
    "KQ404",
  ]

  return (
    <Card
      padding="lg"
      className="flex h-full flex-col justify-between gap-6"
    >
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Radar size={20} />

          <h2 className="text-lg font-semibold text-neutral">
            Track a Flight
          </h2>
        </div>

        <p className="mt-1 text-sm text-neutral-muted">
          Search live flight data from AviationStack
        </p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onTrack()
        }}
      >
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted"
          />

          <Input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value.toUpperCase()
              )
            }
            placeholder="e.g. ET602"
            className="pl-9"
          />
        </div>

        <Button
          type="submit"
          disabled={trackingLoading}
          className="w-full"
        >
          {trackingLoading ? (
            <RefreshCw
              size={17}
              className="animate-spin"
            />
          ) : (
            <Search size={17} />
          )}

          <span>
            {trackingLoading
              ? "Searching..."
              : "Track Flight"}
          </span>
        </Button>
      </form>

      {trackingMessage && (
        <div
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            trackingMessage.type ===
            "success"
              ? "bg-primary-light text-primary"
              : "bg-red-50 text-red-700"
          }`}
        >
          {trackingMessage.message}
        </div>
      )}

      {trackingFlight && (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-neutral">
                {getFlightNumber(
                  trackingFlight
                )}
              </p>

              <p className="mt-0.5 text-xs text-neutral-muted">
                {getAirlineName(
                  trackingFlight
                )}
              </p>
            </div>

            <Badge
              status={getBadgeStatus(
                trackingFlight
              )}
            >
              {getFlightStatusLabel(
                trackingFlight
              )}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                Departure
              </p>

              <p className="mt-1 font-mono text-xs font-bold text-neutral">
                {getDepartureCode(
                  trackingFlight
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                Arrival
              </p>

              <p className="mt-1 font-mono text-xs font-bold text-neutral">
                {getArrivalCode(
                  trackingFlight
                )}
              </p>
            </div>
          </div>

          {trackingFlight?.live && (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                  Altitude
                </p>

                <p className="mt-1 font-mono text-xs font-bold text-neutral">
                  {trackingFlight.live
                    ?.altitude != null
                    ? `${Math.round(
                        trackingFlight.live
                          .altitude
                      )} m`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase text-neutral-muted">
                  Speed
                </p>

                <p className="mt-1 font-mono text-xs font-bold text-neutral">
                  {trackingFlight.live
                    ?.speed_horizontal !=
                  null
                    ? `${Math.round(
                        trackingFlight.live
                          .speed_horizontal
                      )} km/h`
                    : "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
          Popular Quick Searches
        </span>

        <div className="flex flex-wrap gap-1.5">
          {quickSearches.map(
            (flight) => (
              <button
                key={flight}
                type="button"
                onClick={() => {
                  setQuery(flight)
                  onTrack(flight)
                }}
                className="rounded-lg bg-background px-2.5 py-1.5 font-mono text-xs font-semibold text-neutral transition-colors hover:bg-primary-light hover:text-primary"
              >
                {flight}
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-secondary-light/60 p-3">
        <Bell
          size={19}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A6800]">
            Live Flight Data
          </span>

          <p className="mt-1 text-xs font-medium leading-5 text-neutral">
            Search results are retrieved directly from the connected AviationStack flight API.
          </p>
        </div>
      </div>
    </Card>
  )
}


/* =========================================================
   DEPARTURES TABLE
========================================================= */

function DeparturesTable({
  departures,
  highlightedFlight,
  loading,
}) {
  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <PlaneTakeoff size={17} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-neutral">
              Upcoming Departures
            </h2>

            <p className="mt-0.5 text-xs text-neutral-muted">
              Addis Ababa Bole International (ADD)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-neutral-muted sm:inline">
            {departures.length} displayed
          </span>

          <button
            type="button"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            View All Departures

            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-neutral-muted">
              <RefreshCw
                size={17}
                className="animate-spin"
              />
              Loading live departures...
            </div>
          </div>
        ) : departures.length ===
          0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-neutral-muted">
            No departure data is currently available.
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-background text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
                <th className="rounded-l-lg px-4 py-3">
                  Flight
                </th>

                <th className="px-4 py-3">
                  Airline & Equipment
                </th>

                <th className="px-4 py-3">
                  Destination
                </th>

                <th className="px-4 py-3 text-right">
                  Scheduled
                </th>

                <th className="px-4 py-3 text-right">
                  Estimated
                </th>

                <th className="px-4 py-3">
                  Gate / Terminal
                </th>

                <th className="rounded-r-lg px-4 py-3 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {departures.map(
                (flight) => {
                  const highlighted =
                    highlightedFlight ===
                    flight.flight

                  return (
                    <tr
                      key={`${flight.flight}-${flight.raw?.departure?.scheduled || ""}`}
                      id={`row-${flight.flight}`}
                      className={`transition-colors ${
                        highlighted
                          ? "bg-secondary-light/70"
                          : "hover:bg-background"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span className="rounded bg-background px-2 py-1 font-mono text-xs font-bold text-neutral">
                          {flight.flight}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral">
                            {flight.airline}
                          </span>

                          <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-neutral-muted">
                            {flight.aircraft}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral">
                            {flight.destination}
                          </span>

                          <span className="font-mono text-xs text-neutral-muted">
                            · {flight.code}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-xs tabular-nums text-neutral">
                        {flight.scheduled}
                      </td>

                      <td
                        className={`px-4 py-4 text-right font-mono text-xs tabular-nums ${
                          flight.status ===
                          "delayed"
                            ? "font-bold text-secondary"
                            : "font-semibold text-neutral"
                        }`}
                      >
                        {flight.estimated}
                      </td>

                      <td className="px-4 py-4 font-mono text-xs">
                        <span className="font-semibold text-neutral">
                          {flight.gate}
                        </span>

                        <span className="text-neutral-muted">
                          {" "}
                          · {flight.terminal}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <Badge
                          status={
                            flight.status
                          }
                        >
                          {
                            flight.statusLabel
                          }
                        </Badge>
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}


/* =========================================================
   ARRIVALS TABLE
========================================================= */

function ArrivalsTable({
  arrivals,
  loading,
}) {
  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary text-white">
            <PlaneLanding size={17} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-neutral">
              Upcoming Arrivals
            </h2>

            <p className="mt-0.5 text-xs text-neutral-muted">
              Inbound Flights · Bole International Airport (ADD)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-neutral-muted sm:inline">
            {arrivals.length} displayed
          </span>

          <button
            type="button"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            View All Arrivals

            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-neutral-muted">
              <RefreshCw
                size={17}
                className="animate-spin"
              />
              Loading live arrivals...
            </div>
          </div>
        ) : arrivals.length ===
          0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-neutral-muted">
            No arrival data is currently available.
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-background text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
                <th className="rounded-l-lg px-4 py-3">
                  Flight
                </th>

                <th className="px-4 py-3">
                  Airline & Aircraft
                </th>

                <th className="px-4 py-3">
                  Origin
                </th>

                <th className="px-4 py-3 text-right">
                  Scheduled
                </th>

                <th className="px-4 py-3 text-right">
                  Estimated
                </th>

                <th className="px-4 py-3">
                  Terminal / Baggage
                </th>

                <th className="rounded-r-lg px-4 py-3 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {arrivals.map(
                (flight) => (
                  <tr
                    key={`${flight.flight}-${flight.raw?.arrival?.scheduled || ""}`}
                    className="transition-colors hover:bg-background"
                  >
                    <td className="px-4 py-4">
                      <span className="rounded bg-background px-2 py-1 font-mono text-xs font-bold text-neutral">
                        {flight.flight}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral">
                          {flight.airline}
                        </span>

                        <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-neutral-muted">
                          {flight.aircraft}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral">
                          {flight.origin}
                        </span>

                        <span className="font-mono text-xs text-neutral-muted">
                          · {flight.code}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-xs tabular-nums text-neutral">
                      {flight.scheduled}
                    </td>

                    <td
                      className={`px-4 py-4 text-right font-mono text-xs tabular-nums ${
                        flight.status ===
                        "delayed"
                          ? "font-bold text-secondary"
                          : flight.status ===
                            "active"
                          ? "font-semibold text-primary"
                          : "font-semibold text-neutral"
                      }`}
                    >
                      {flight.estimated}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs">
                      <span className="font-semibold text-neutral">
                        {flight.belt}
                      </span>

                      <span className="text-neutral-muted">
                        {" "}
                        · {flight.area}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Badge
                        status={
                          flight.status
                        }
                      >
                        {
                          flight.statusLabel
                        }
                      </Badge>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}


/* =========================================================
   MAIN DASHBOARD
========================================================= */

function Dashboard() {
  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [departures, setDepartures] =
    useState([])

  const [arrivals, setArrivals] =
    useState([])

  const [activeFlights, setActiveFlights] =
    useState([])

  const [delayedFlights, setDelayedFlights] =
    useState([])

  const [departureTotal, setDepartureTotal] =
    useState(0)

  const [arrivalTotal, setArrivalTotal] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [apiError, setApiError] =
    useState(null)

  const [query, setQuery] =
    useState("")

  const [highlightedFlight, setHighlightedFlight] =
    useState(null)

  const [trackingMessage, setTrackingMessage] =
    useState(null)

  const [trackingFlight, setTrackingFlight] =
    useState(null)

  const [trackingLoading, setTrackingLoading] =
    useState(false)


  /* =======================================================
     LIVE CLOCK
  ======================================================= */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        )
      }, 1000)

    return () =>
      clearInterval(timer)
  }, [])


  /* =======================================================
     EAT TIME
  ======================================================= */

  const eatTime = useMemo(() => {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Africa/Addis_Ababa",

        hour: "2-digit",

        minute: "2-digit",

        second: "2-digit",

        hour12: false,
      }
    ).format(currentTime)
  }, [currentTime])


  /* =======================================================
     LOAD LIVE DASHBOARD DATA
  ======================================================= */

  const loadDashboardData =
    useCallback(
      async ({
        showRefreshing = false,
      } = {}) => {
        try {
          if (showRefreshing) {
            setRefreshing(true)
          } else {
            setLoading(true)
          }

          setApiError(null)

          const today =
            getEthiopiaDate()

          /*
           * Request 1:
           * Today's ADD departures
           */
          const departureResponse =
            await getLiveFlights({
              depIata:
                AIRPORT_IATA,

              flightDate:
                today,

              limit: 100,
            })


          /*
           * Request 2:
           * Today's ADD arrivals
           */
          const arrivalResponse =
            await getLiveFlights({
              arrIata:
                AIRPORT_IATA,

              flightDate:
                today,

              limit: 100,
            })


          /*
           * Request 3:
           * Currently airborne flights
           */
          const activeResponse =
            await getLiveFlights({
              flightStatus:
                "active",

              limit: 100,
            })


          /*
           * Request 4:
           * Currently delayed flights
           */
          const delayedResponse =
            await getLiveFlights({
              flightStatus:
                "delayed",

              limit: 100,
            })


          const departureData =
            Array.isArray(
              departureResponse?.data
            )
              ? departureResponse.data
              : []

          const arrivalData =
            Array.isArray(
              arrivalResponse?.data
            )
              ? arrivalResponse.data
              : []

          const activeData =
            Array.isArray(
              activeResponse?.data
            )
              ? activeResponse.data
              : []

          const delayedData =
            Array.isArray(
              delayedResponse?.data
            )
              ? delayedResponse.data
              : []


          /*
           * Sort departures by scheduled time.
           */
          const sortedDepartures =
            [...departureData]
              .sort(
                (a, b) =>
                  new Date(
                    getDepartureScheduled(
                      a
                    ) || 0
                  ) -
                  new Date(
                    getDepartureScheduled(
                      b
                    ) || 0
                  )
              )
              .map(
                normalizeDeparture
              )


          /*
           * Sort arrivals by scheduled time.
           */
          const sortedArrivals =
            [...arrivalData]
              .sort(
                (a, b) =>
                  new Date(
                    getArrivalScheduled(
                      a
                    ) || 0
                  ) -
                  new Date(
                    getArrivalScheduled(
                      b
                    ) || 0
                  )
              )
              .map(
                normalizeArrival
              )


          setDepartures(
            sortedDepartures
          )

          setArrivals(
            sortedArrivals
          )

          setActiveFlights(
            activeData
          )

          setDelayedFlights(
            delayedData
          )


          /*
           * AviationStack returns pagination
           * information. Use total when available.
           */
          setDepartureTotal(
            departureResponse
              ?.pagination
              ?.total ??
              departureData.length
          )

          setArrivalTotal(
            arrivalResponse
              ?.pagination
              ?.total ??
              arrivalData.length
          )
        } catch (error) {
          console.error(
            "Dashboard API error:",
            error
          )

          setApiError(
            error?.message ||
              "Unable to load live AviationStack data."
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      []
    )


  /* =======================================================
     INITIAL API LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboardData()

    const interval =
      setInterval(() => {
        loadDashboardData()
      }, REFRESH_INTERVAL)

    return () =>
      clearInterval(interval)
  }, [loadDashboardData])


  /* =======================================================
     METRICS
  ======================================================= */

  const delayedTodayCount =
    delayedFlights.filter(
      (flight) => {
        const departureDate =
          flight?.departure?.scheduled

        const arrivalDate =
          flight?.arrival?.scheduled

        const today =
          getEthiopiaDate()

        const departureDay =
          departureDate
            ? new Intl.DateTimeFormat(
                "en-CA",
                {
                  timeZone:
                    "Africa/Addis_Ababa",
                }
              ).format(
                new Date(
                  departureDate
                )
              )
            : null

        const arrivalDay =
          arrivalDate
            ? new Intl.DateTimeFormat(
                "en-CA",
                {
                  timeZone:
                    "Africa/Addis_Ababa",
                }
              ).format(
                new Date(
                  arrivalDate
                )
              )
            : null

        return (
          departureDay === today ||
          arrivalDay === today
        )
      }
    ).length


  const averageDelay =
    delayedFlights.length
      ? Math.round(
          delayedFlights.reduce(
            (sum, flight) =>
              sum +
              getFlightDelay(
                flight
              ),
            0
          ) /
            delayedFlights.length
        )
      : 0


  /* =======================================================
     TRACK FLIGHT
  ======================================================= */

  const handleTrackFlight =
    async (quickFlight = null) => {
      const searchValue = (
        quickFlight ||
        query
      )
        .trim()
        .toUpperCase()

      if (!searchValue) {
        setTrackingMessage({
          type: "error",

          message:
            "Enter a flight number or callsign.",
        })

        return
      }

      try {
        setTrackingLoading(true)

        setTrackingMessage(null)

        setTrackingFlight(null)

        const response =
          await getLiveFlights({
            flightNumber:
              searchValue,

            limit: 10,
          })

        const results =
          Array.isArray(
            response?.data
          )
            ? response.data
            : []

        if (!results.length) {
          setTrackingMessage({
            type: "error",

            message:
              `${searchValue} was not found in AviationStack.`,
          })

          return
        }

        const flight =
          results[0]

        setTrackingFlight(
          flight
        )

        setTrackingMessage({
          type: "success",

          message:
            `${getFlightNumber(
              flight
            )} found in live flight data.`,
        })

        const normalizedNumber =
          getFlightNumber(
            flight
          )

        setHighlightedFlight(
          normalizedNumber
        )

        setTimeout(() => {
          document
            .getElementById(
              `row-${normalizedNumber}`
            )
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "center",
            })
        }, 100)

        setTimeout(() => {
          setHighlightedFlight(
            null
          )
        }, 3000)
      } catch (error) {
        console.error(
          "Flight tracking error:",
          error
        )

        setTrackingMessage({
          type: "error",

          message:
            error?.message ||
            "Unable to search AviationStack.",
        })
      } finally {
        setTrackingLoading(
          false
        )
      }
    }


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {
      if (refreshing) {
        return
      }

      await loadDashboardData({
        showRefreshing:
          true,
      })
    }


  /* =======================================================
     AIRPORT STATUS
  ======================================================= */

  const activeAtAddis =
    activeFlights.filter(
      (flight) =>
        flight?.departure?.iata ===
          AIRPORT_IATA ||
        flight?.arrival?.iata ===
          AIRPORT_IATA
    ).length


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">


          {/* =================================================
              TOP GREETING
          ================================================= */}

          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral sm:text-3xl">
                  Good morning
                </h1>

                <span className="rounded-full bg-secondary-light px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A6800]">
                  Hub Ops Live
                </span>
              </div>

              <p className="mt-1 text-sm text-neutral-muted">
                Monitor flights and airport activity across Ethiopia and beyond.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                      apiError
                        ? "bg-red-500"
                        : "bg-primary"
                    } opacity-50`}
                  />

                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      apiError
                        ? "bg-red-500"
                        : "bg-primary"
                    }`}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
                    AviationStack Live Sync
                  </p>

                  <p className="font-mono text-xs font-semibold text-neutral">
                    {apiError
                      ? "Connection Error"
                      : `${eatTime} UTC+3 (EAT)`}
                  </p>
                </div>
              </div>

              <Button
                onClick={
                  handleRefresh
                }
                disabled={
                  refreshing
                }
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span>
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh Data"}
                </span>
              </Button>
            </div>
          </section>


          {/* =================================================
              API ERROR
          ================================================= */}

          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <Activity
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    AviationStack connection error
                  </p>

                  <p className="mt-1">
                    {apiError}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* =================================================
              KEY METRICS
          ================================================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Departures Today"
              value={
                loading
                  ? "..."
                  : departureTotal
              }
              description={
                <>
                  <TrendingUp
                    size={13}
                  />

                  <span>
                    Live ADD departure data
                  </span>
                </>
              }
              icon={
                PlaneTakeoff
              }
              iconClassName="text-primary"
              iconBackground="bg-primary-light"
            />

            <MetricCard
              label="Arrivals Today"
              value={
                loading
                  ? "..."
                  : arrivalTotal
              }
              description={
                <>
                  <CheckCircle2
                    size={13}
                  />

                  <span>
                    Live ADD arrival data
                  </span>
                </>
              }
              icon={
                PlaneLanding
              }
              iconClassName="text-tertiary"
              iconBackground="bg-tertiary-light"
            />

            <MetricCard
              label="Active Airborne"
              value={
                loading
                  ? "..."
                  : activeFlights.length
              }
              description={
                <>
                  <Radar
                    size={13}
                  />

                  <span>
                    {activeAtAddis} involving ADD
                  </span>
                </>
              }
              icon={Plane}
              iconClassName="text-secondary"
              iconBackground="bg-secondary-light"
            />

            <MetricCard
              label="Delayed Flights"
              value={
                loading
                  ? "..."
                  : delayedTodayCount
              }
              description={
                <>
                  <Gauge
                    size={13}
                  />

                  <span>
                    Avg {averageDelay}m delay
                  </span>
                </>
              }
              icon={Gauge}
              iconClassName="text-red-600"
              iconBackground="bg-red-50"
            />
          </section>


          {/* =================================================
              BOLE HUB + FLIGHT TRACKER
          ================================================= */}

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">

            {/* Bole Hub */}

            <Card
              padding="lg"
              className="flex flex-col justify-between gap-6 lg:col-span-8"
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                      <Grid2X2
                        size={20}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-neutral">
                          Bole International Airport
                        </h2>

                        <span className="rounded bg-background px-2 py-0.5 font-mono text-[11px] font-bold text-neutral">
                          {AIRPORT_IATA} ·{" "}
                          {AIRPORT_ICAO}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-muted">
                        Addis Ababa, Ethiopia · Primary East Africa Hub
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
                  >
                    View Airport Hub

                    <ArrowRight
                      size={16}
                    />
                  </button>
                </div>


                {/* Airport operational strip */}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        apiError
                          ? "bg-red-500"
                          : "bg-primary"
                      }`}
                    />

                    <span
                      className={`text-[11px] font-semibold ${
                        apiError
                          ? "text-red-600"
                          : "text-primary"
                      }`}
                    >
                      {apiError
                        ? "API Connection Issue"
                        : "Live Operations Data"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-neutral-muted">
                    <span className="flex items-center gap-1">
                      <PlaneTakeoff
                        size={13}
                      />

                      {departureTotal} departures
                    </span>

                    <span className="flex items-center gap-1">
                      <PlaneLanding
                        size={13}
                      />

                      {arrivalTotal} arrivals
                    </span>

                    <span className="flex items-center gap-1">
                      <Radar
                        size={13}
                      />

                      {activeAtAddis} active near ADD
                    </span>

                    <span className="flex items-center gap-1">
                      <Eye
                        size={13}
                      />

                      Live API
                    </span>
                  </div>
                </div>
              </div>


              {/* Traffic profile */}

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-muted">
                    Hourly Traffic Profile
                  </span>

                  <div className="flex items-center gap-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary" />

                      Departures
                    </span>

                    <span className="flex items-center gap-1 text-tertiary">
                      <span className="h-2 w-2 rounded-full bg-tertiary" />

                      Arrivals
                    </span>
                  </div>
                </div>

                <TrafficChart
                  departures={
                    departures
                  }
                  arrivals={
                    arrivals
                  }
                />
              </div>
            </Card>


            {/* Flight Tracker */}

            <div className="lg:col-span-4">
              <FlightTracker
                query={query}
                setQuery={
                  setQuery
                }
                onTrack={
                  handleTrackFlight
                }
                trackingMessage={
                  trackingMessage
                }
                trackingFlight={
                  trackingFlight
                }
                trackingLoading={
                  trackingLoading
                }
              />
            </div>
          </section>


          {/* =================================================
              DEPARTURES
          ================================================= */}

          <section>
            <DeparturesTable
              departures={
                departures
              }
              highlightedFlight={
                highlightedFlight
              }
              loading={loading}
            />
          </section>


          {/* =================================================
              ARRIVALS
          ================================================= */}

          <section>
            <ArrivalsTable
              arrivals={arrivals}
              loading={loading}
            />
          </section>


          {/* =================================================
              DATA SOURCE
          ================================================= */}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-xs text-neutral-muted shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={15}
                className={
                  apiError
                    ? "text-red-500"
                    : "text-primary"
                }
              />

              <span>
                Data source: AviationStack real-time flight API
              </span>
            </div>

            <span className="font-mono">
              Last sync:{" "}
              {eatTime} EAT
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard