import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Filter,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  Search,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLiveFlights } from "../services/aviationStack";

const AIRPORT_CODE =
  import.meta.env.VITE_AIRPORT_CODE || "ADD";

const AIRPORT_ICAO =
  import.meta.env.VITE_AIRPORT_ICAO || "HAAB";

const AIRPORT_NAME =
  import.meta.env.VITE_AIRPORT_NAME ||
  "Addis Ababa Bole International Airport";

const AIRPORT_LOCATION =
  import.meta.env.VITE_AIRPORT_LOCATION ||
  "Addis Ababa, Ethiopia";

const ITEMS_PER_PAGE = 8;
const AUTO_REFRESH_SECONDS = 30;

const TERMINALS = [
  { value: "all", label: "All Terminals" },
  { value: "T1", label: "T1 (Domestic)" },
  { value: "T2", label: "T2 (International)" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "delayed", label: "Delayed" },
  { value: "landed", label: "Landed" },
  { value: "cancelled", label: "Cancelled" },
];

const TIME_WINDOWS = [
  { value: "all", label: "All Slots" },
  { value: "morning", label: "Morning (06:00 – 12:00)" },
  { value: "afternoon", label: "Afternoon (12:00 – 18:00)" },
  { value: "evening", label: "Evening (18:00 – 24:00)" },
  { value: "night", label: "Night (00:00 – 06:00)" },
];

/* =========================================================
   HELPERS
========================================================= */

function getAirportCode(flight) {
  return (
    flight?.arrival?.iata ||
    flight?.arrival?.icao ||
    flight?.departure?.iata ||
    "N/A"
  );
}

function getAirportName(flight) {
  return (
    flight?.arrival?.airport ||
    flight?.arrival?.airport_name ||
    flight?.departure?.airport ||
    "Unknown Airport"
  );
}

function getCountry(flight) {
  return (
    flight?.arrival?.country ||
    flight?.departure?.country ||
    "Unknown"
  );
}

function getAirlineName(flight) {
  return (
    flight?.airline?.name ||
    flight?.airline?.airline_name ||
    "Unknown Airline"
  );
}

function getAirlineCode(flight) {
  return (
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "--"
  );
}

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.icao ||
    flight?.flight?.number ||
    "N/A"
  );
}

function getAircraftModel(flight) {
  return (
    flight?.aircraft?.model ||
    flight?.aircraft?.model_text ||
    "Unknown"
  );
}

function getAircraftRegistration(flight) {
  return (
    flight?.aircraft?.registration ||
    flight?.flight?.registration ||
    "N/A"
  );
}

function getDateValue(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value) {
  const date = getDateValue(value);

  if (!date) return "--:--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTime(value) {
  const date = getDateValue(value);

  if (!date) return "N/A";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(flight) {
  const status = String(
    flight?.flight_status ||
      flight?.status ||
      "scheduled"
  ).toLowerCase();

  if (
    status.includes("cancel") ||
    status === "cancelled"
  ) {
    return "cancelled";
  }

  if (
    status.includes("delay") ||
    status === "delayed"
  ) {
    return "delayed";
  }

  if (
    status.includes("land") ||
    status === "landed"
  ) {
    return "landed";
  }

  if (
    status.includes("active") ||
    status === "active"
  ) {
    return "active";
  }

  return "scheduled";
}

function normalizeFlight(flight, index) {
  const scheduled =
    flight?.arrival?.scheduled ||
    flight?.arrival?.estimated ||
    flight?.arrival?.actual ||
    null;

  const estimated =
    flight?.arrival?.estimated ||
    null;

  const actual =
    flight?.arrival?.actual ||
    null;

  return {
    ...flight,
    _id:
      flight?.flight?.iata ||
      flight?.flight?.icao ||
      `${index}-${scheduled || "flight"}`,

    airportCode: getAirportCode(flight),
    airportName: getAirportName(flight),
    country: getCountry(flight),

    airlineName: getAirlineName(flight),
    airlineCode: getAirlineCode(flight),

    flightNumber: getFlightNumber(flight),

    aircraftModel: getAircraftModel(flight),
    aircraftRegistration:
      getAircraftRegistration(flight),

    scheduled,
    estimated,
    actual,

    status: normalizeStatus(flight),

    terminal:
      flight?.arrival?.terminal ||
      flight?.terminal ||
      "N/A",

    gate:
      flight?.arrival?.gate ||
      flight?.gate ||
      "N/A",

    baggage:
      flight?.arrival?.baggage ||
      flight?.baggage ||
      null,

    delay:
      flight?.arrival?.delay ||
      flight?.delay ||
      null,
  };
}

function getStatusKey(status) {
  const key = String(status || "").toLowerCase();

  if (key === "active") return "active";
  if (key === "delayed") return "delayed";
  if (key === "cancelled") return "cancelled";
  if (key === "landed") return "landed";

  return "scheduled";
}

/*
 * IMPORTANT:
 * These colors use your semantic Tailwind theme tokens.
 * Because your index.css maps these tokens to CSS variables,
 * they automatically change when .dark is applied.
 */
function getStatusClasses(status) {
  const key = getStatusKey(status);

  switch (key) {
    case "active":
      return "bg-primary-light text-primary";

    case "delayed":
      return "bg-secondary-light text-secondary";

    case "cancelled":
      return "bg-danger/10 text-danger";

    case "landed":
      return "bg-neutral-light/10 text-neutral";

    case "scheduled":
    default:
      return "bg-info/10 text-info";
  }
}

function getStatusDot(status) {
  const key = getStatusKey(status);

  switch (key) {
    case "active":
      return "bg-success";

    case "delayed":
      return "bg-warning";

    case "cancelled":
      return "bg-danger";

    case "landed":
      return "bg-neutral-light";

    case "scheduled":
    default:
      return "bg-info";
  }
}

function getTimeWindow(value) {
  const date = getDateValue(value);

  if (!date) return "unknown";

  const hour = date.getHours();

  if (hour >= 6 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 18) {
    return "afternoon";
  }

  if (hour >= 18 && hour < 24) {
    return "evening";
  }

  return "night";
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "text-primary",
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-sm border border-border">
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-light">
          {label}
        </span>

        <div className="mt-1 text-[22px] font-bold leading-7 text-neutral">
          {value}
        </div>

        {description && (
          <span className="mt-0.5 block text-xs text-neutral-light">
            {description}
          </span>
        )}
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light ${iconClass}`}
      >
        <Icon size={19} />
      </div>
    </div>
  );
}

/* =========================================================
   LOADING ROWS
========================================================= */

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr
          key={index}
          className="border-b border-divider"
        >
          {Array.from({ length: 8 }).map(
            (_, cellIndex) => (
              <td
                key={cellIndex}
                className="px-4 py-4"
              >
                <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-primary-light" />
              </td>
            )
          )}
        </tr>
      ))}
    </>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary-dark">
        <Plane size={25} />
      </div>

      <h3 className="text-base font-bold text-neutral">
        No flights found
      </h3>

      <p className="mt-1 max-w-md text-sm text-neutral-light">
        No departures match your current search and
        filter settings.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-lg bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary"
      >
        Clear Filters
      </button>
    </div>
  );
}

/* =========================================================
   FLIGHT DETAILS MODAL
========================================================= */

function FlightDetailsModal({
  flight,
  onClose,
}) {
  if (!flight) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface shadow-2xl border border-border"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-light">
              Flight Details
            </p>

            <h2 className="mt-1 text-xl font-bold text-neutral">
              {flight.flightNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-light transition hover:bg-primary-light hover:text-neutral"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Airline */}
          <div className="flex items-center gap-4 rounded-xl bg-primary-light p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
              <Plane size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-neutral">
                {flight.airlineName}
              </p>

              <p className="text-xs text-neutral-light">
                {flight.airlineCode} ·{" "}
                {flight.flightNumber}
              </p>
            </div>

            <span
              className={`ml-auto aero-status ${getStatusClasses(
                flight.status
              )}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${getStatusDot(
                  flight.status
                )}`}
              />

              {flight.status}
            </span>
          </div>

          {/* Route */}
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="Destination"
              value={flight.airportName}
            />

            <DetailItem
              label="Airport Code"
              value={flight.airportCode}
            />

            <DetailItem
              label="Country"
              value={flight.country}
            />

            <DetailItem
              label="Scheduled"
              value={formatDateTime(
                flight.scheduled
              )}
            />

            <DetailItem
              label="Estimated"
              value={formatDateTime(
                flight.estimated
              )}
            />

            <DetailItem
              label="Actual"
              value={formatDateTime(flight.actual)}
            />

            <DetailItem
              label="Terminal"
              value={flight.terminal}
            />

            <DetailItem
              label="Gate"
              value={flight.gate}
            />

            <DetailItem
              label="Aircraft"
              value={flight.aircraftModel}
            />

            <DetailItem
              label="Registration"
              value={flight.aircraftRegistration}
            />

            <DetailItem
              label="Delay"
              value={
                flight.delay
                  ? `${flight.delay} minutes`
                  : "No delay information"
              }
            />

            <DetailItem
              label="Baggage"
              value={
                flight.baggage || "Not available"
              }
            />
          </div>

          {/* Source */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <ExternalLink
                size={17}
                className="mt-0.5 text-primary"
              />

              <div>
                <p className="text-sm font-semibold text-neutral">
                  Live Aviation Data
                </p>

                <p className="mt-1 text-xs leading-5 text-neutral-light">
                  Flight information is provided by
                  the configured aviation data service
                  and may change as the airline updates
                  its operational information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-light">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-neutral">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [terminal, setTerminal] = useState("all");
  const [status, setStatus] = useState("all");
  const [timeWindow, setTimeWindow] =
    useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [countdown, setCountdown] =
    useState(AUTO_REFRESH_SECONDS);

  const [selectedFlight, setSelectedFlight] =
    useState(null);

  const loadFlights = useCallback(async () => {
    try {
      setError("");

      const response = await getLiveFlights(
        AIRPORT_CODE
      );

      const data = Array.isArray(response)
        ? response
        : response?.data || response?.results || [];

      const normalized = data.map(
        normalizeFlight
      );

      setFlights(normalized);
      setLastUpdated(new Date());
      setCountdown(AUTO_REFRESH_SECONDS);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load live flight information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  /* Auto refresh */
  useEffect(() => {
    const interval = setInterval(() => {
      loadFlights();
    }, AUTO_REFRESH_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [loadFlights]);

  /* Countdown */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          return AUTO_REFRESH_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* Filter */
  const filteredFlights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return flights.filter((flight) => {
      const matchesSearch =
        !query ||
        [
          flight.flightNumber,
          flight.airlineName,
          flight.airportName,
          flight.airportCode,
          flight.country,
          flight.aircraftModel,
          flight.aircraftRegistration,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesTerminal =
        terminal === "all" ||
        flight.terminal === terminal;

      const matchesStatus =
        status === "all" ||
        flight.status === status;

      const matchesTime =
        timeWindow === "all" ||
        getTimeWindow(flight.scheduled) ===
          timeWindow;

      return (
        matchesSearch &&
        matchesTerminal &&
        matchesStatus &&
        matchesTime
      );
    });
  }, [
    flights,
    search,
    terminal,
    status,
    timeWindow,
  ]);

  /* Pagination */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFlights.length / ITEMS_PER_PAGE
    )
  );

  const paginatedFlights = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredFlights.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredFlights, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* Statistics */
  const statistics = useMemo(() => {
    const active = flights.filter(
      (flight) => flight.status === "active"
    ).length;

    const scheduled = flights.filter(
      (flight) => flight.status === "scheduled"
    ).length;

    const delayed = flights.filter(
      (flight) => flight.status === "delayed"
    ).length;

    const landed = flights.filter(
      (flight) => flight.status === "landed"
    ).length;

    const cancelled = flights.filter(
      (flight) => flight.status === "cancelled"
    ).length;

    return {
      total: flights.length,
      active,
      scheduled,
      delayed,
      landed,
      cancelled,
    };
  }, [flights]);

  /* Terminal statistics */
  const terminalStatistics = useMemo(() => {
    const t1 = flights.filter(
      (flight) => flight.terminal === "T1"
    ).length;

    const t2 = flights.filter(
      (flight) => flight.terminal === "T2"
    ).length;

    const unknown = flights.filter(
      (flight) =>
        !["T1", "T2"].includes(flight.terminal)
    ).length;

    return {
      t1,
      t2,
      unknown,
    };
  }, [flights]);

  /* Reset filters */
  const resetFilters = () => {
    setSearch("");
    setTerminal("all");
    setStatus("all");
    setTimeWindow("all");
    setCurrentPage(1);
  };

  /* CSV export */
  const exportCsv = () => {
    const headers = [
      "Flight",
      "Airline",
      "Destination",
      "Country",
      "Status",
      "Scheduled",
      "Estimated",
      "Actual",
      "Terminal",
      "Gate",
      "Aircraft",
      "Registration",
    ];

    const rows = filteredFlights.map(
      (flight) => [
        flight.flightNumber,
        flight.airlineName,
        flight.airportName,
        flight.country,
        flight.status,
        formatDateTime(flight.scheduled),
        formatDateTime(flight.estimated),
        formatDateTime(flight.actual),
        flight.terminal,
        flight.gate,
        flight.aircraftModel,
        flight.aircraftRegistration,
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `ethioflight-departures-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const startItem =
    filteredFlights.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredFlights.length
  );

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* =====================================================
          AIRPORT HEADER
      ===================================================== */}

      <section className="border-b border-border bg-surface px-4 py-4 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-dark text-white shadow-sm">
              <Plane size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-neutral sm:text-xl">
                  {AIRPORT_NAME}
                </h1>

                <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
                  {AIRPORT_CODE}
                </span>

                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-neutral-light">
                  {AIRPORT_ICAO}
                </span>
              </div>

              <p className="mt-1 text-xs text-neutral-light">
                {AIRPORT_LOCATION}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Station Clock */}
            <div className="flex items-center gap-2 rounded-lg bg-primary-light px-3 py-2">
              <Timer
                size={16}
                className="text-primary"
              />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
                  Station Clock
                </p>

                <p className="text-sm font-bold text-neutral">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Live status */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-primary-light px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>

              <span className="text-xs font-semibold text-primary">
                Live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6">
        {/* ===================================================
            KPI CARDS
        =================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard
            icon={Plane}
            label="Total Flights"
            value={statistics.total}
            description="Today's departures"
          />

          <MetricCard
            icon={PlaneTakeoff}
            label="Active"
            value={statistics.active}
            description="Currently active"
            iconClass="text-success"
          />

          <MetricCard
            icon={Clock3}
            label="Scheduled"
            value={statistics.scheduled}
            description="Upcoming flights"
            iconClass="text-info"
          />

          <MetricCard
            icon={AlertCircle}
            label="Delayed"
            value={statistics.delayed}
            description="Delayed flights"
            iconClass="text-warning"
          />

          <MetricCard
            icon={PlaneLanding}
            label="Landed"
            value={statistics.landed}
            description="Completed flights"
            iconClass="text-primary"
          />
        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <section className="rounded-xl border border-danger/30 bg-danger/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-danger"
                />

                <div>
                  <p className="text-sm font-bold text-danger">
                    Unable to load flight data
                  </p>

                  <p className="mt-1 text-xs text-danger/80">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadFlights}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </section>
        )}

        {/* ===================================================
            FILTER STATION
        =================================================== */}

        <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search flight, airline, destination, aircraft..."
                  className="h-10 w-full rounded-lg border border-border bg-primary-light pl-9 pr-3 text-sm text-neutral outline-none placeholder:text-neutral-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {/* Terminal */}
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-primary-light p-1">
                {TERMINALS.map((item) => {
                  const active =
                    terminal === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setTerminal(item.value);
                        setCurrentPage(1);
                      }}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-surface text-neutral shadow-sm"
                          : "text-neutral-light hover:text-neutral"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Refresh */}
              <div className="flex items-center gap-2 rounded-lg bg-primary-light px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-success" />

                <span className="text-xs text-neutral-light">
                  Next sync
                </span>

                <span className="text-xs font-bold text-neutral">
                  {countdown}s
                </span>

                <button
                  type="button"
                  onClick={loadFlights}
                  className="ml-1 rounded-md p-1.5 text-neutral transition hover:bg-surface hover:text-primary"
                  title="Refresh now"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Export */}
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-neutral transition hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                <Download size={14} />
                Export
              </button>
            </div>

            {/* Status + Time */}
            <div className="flex flex-col gap-3 border-t border-divider pt-3 xl:flex-row xl:items-center xl:justify-between">
              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-primary-light p-1">
                  {STATUS_FILTERS.map((item) => {
                    const active =
                      status === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setStatus(item.value);
                          setCurrentPage(1);
                        }}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-surface text-neutral shadow-sm"
                            : "text-neutral-light hover:text-neutral"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden items-center gap-2 text-xs text-neutral-light sm:flex">
                  <Filter size={14} />
                  Filters
                </div>
              </div>

              {/* Time */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-neutral-light">
                  Time:
                </span>

                {TIME_WINDOWS.map((item) => {
                  const active =
                    timeWindow === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setTimeWindow(item.value);
                        setCurrentPage(1);
                      }}
                      className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        active
                          ? "bg-primary-dark text-white"
                          : "bg-primary-light text-neutral-light hover:bg-primary-light hover:text-neutral"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            DEPARTURES TABLE
        =================================================== */}

        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral">
                Departures
              </h2>

              <p className="mt-0.5 text-xs text-neutral-light">
                Live flight information from{" "}
                {AIRPORT_CODE}
              </p>
            </div>

            {lastUpdated && (
              <div className="text-xs text-neutral-light">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="bg-primary-light text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Flight
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Airline
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Destination
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Aircraft
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Schedule
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Terminal
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Status
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-light">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-divider">
                {loading ? (
                  <LoadingRows />
                ) : paginatedFlights.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        onReset={resetFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedFlights.map((flight) => {
                    const scheduleTime =
                      formatTime(
                        flight.scheduled
                      );

                    const estimatedTime =
                      formatTime(
                        flight.estimated
                      );

                    const actualTime =
                      formatTime(flight.actual);

                    const hasActual =
                      Boolean(flight.actual);

                    const hasEstimate =
                      Boolean(flight.estimated);

                    return (
                      <tr
                        key={flight._id}
                        className="group transition hover:bg-primary-light/60"
                      >
                        {/* Flight */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p className="text-sm font-bold text-primary-dark">
                              {flight.flightNumber}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-light">
                              {flight.airlineCode}
                            </p>
                          </div>
                        </td>

                        {/* Airline */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-white">
                              {flight.airlineCode}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[150px] truncate text-xs font-semibold text-neutral">
                                {flight.airlineName}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="max-w-[170px] truncate text-sm font-semibold text-neutral">
                                {flight.airportName}
                              </p>

                              <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-[9px] font-bold text-neutral-light">
                                {flight.airportCode}
                              </span>
                            </div>

                            <p className="mt-1 text-[10px] text-neutral-light">
                              {flight.country}
                            </p>
                          </div>
                        </td>

                        {/* Aircraft */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p className="text-xs font-semibold text-neutral">
                              {flight.aircraftModel}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-light">
                              {flight.aircraftRegistration}
                            </p>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p className="text-sm font-bold text-neutral">
                              {scheduleTime}
                            </p>

                            {hasActual ? (
                              <p className="mt-1 text-[10px] font-semibold text-success">
                                Actual{" "}
                                {actualTime}
                              </p>
                            ) : hasEstimate ? (
                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  flight.delay
                                    ? "text-warning"
                                    : "text-success"
                                }`}
                              >
                                Est.{" "}
                                {estimatedTime}
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] text-neutral-light">
                                No estimate
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Terminal */}
                        <td className="px-4 py-4 align-top">
                          <div className="inline-flex flex-col rounded-lg bg-primary-light px-2.5 py-1.5">
                            <span className="text-[9px] font-semibold uppercase text-neutral-light">
                              Terminal
                            </span>

                            <span className="mt-0.5 text-xs font-bold text-neutral">
                              {flight.terminal}
                            </span>

                            <span className="mt-0.5 text-[9px] text-neutral-light">
                              Gate {flight.gate}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 align-top">
                          <span
                            className={`aero-status ${getStatusClasses(
                              flight.status
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                flight.status
                              )}`}
                            />

                            {flight.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFlight(
                                flight
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-2 text-xs font-semibold text-neutral transition hover:bg-primary hover:text-white"
                          >
                            View
                            <ExternalLink
                              size={13}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading &&
            filteredFlights.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border bg-primary-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-neutral-light">
                  Showing{" "}
                  <span className="font-bold text-neutral">
                    {startItem}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-neutral">
                    {endItem}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-neutral">
                    {filteredFlights.length}
                  </span>{" "}
                  flights
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-neutral transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .slice(
                      Math.max(0, currentPage - 3),
                      Math.min(
                        totalPages,
                        currentPage + 2
                      )
                    )
                    .map((page) => {
                      const active =
                        page === currentPage;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            setCurrentPage(page)
                          }
                          className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition ${
                            active
                              ? "bg-primary-dark text-white"
                              : "border border-border bg-surface text-neutral hover:bg-primary-light"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                  <button
                    type="button"
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-neutral transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
        </section>

        {/* ===================================================
            SUMMARY
        =================================================== */}

        <section className="grid gap-4 lg:grid-cols-3">
          {/* Flight Status */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral">
                  Flight Status
                </h3>

                <p className="mt-1 text-xs text-neutral-light">
                  Current departure breakdown
                </p>
              </div>

              <PlaneTakeoff
                size={18}
                className="text-primary"
              />
            </div>

            <div className="mt-5 space-y-3">
              <SummaryProgress
                label="Active"
                value={statistics.active}
                total={statistics.total}
                icon={ArrowUp}
                barClass="bg-success"
              />

              <SummaryProgress
                label="Scheduled"
                value={statistics.scheduled}
                total={statistics.total}
                icon={Clock3}
                barClass="bg-info"
              />

              <SummaryProgress
                label="Delayed"
                value={statistics.delayed}
                total={statistics.total}
                icon={Clock3}
                barClass="bg-warning"
              />

              <SummaryProgress
                label="Cancelled"
                value={statistics.cancelled}
                total={statistics.total}
                icon={X}
                barClass="bg-danger"
              />
            </div>
          </div>

          {/* Terminal Summary */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral">
                  Terminal Distribution
                </h3>

                <p className="mt-1 text-xs text-neutral-light">
                  Flights by terminal
                </p>
              </div>

              <Users
                size={18}
                className="text-primary"
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <TerminalSummary
                label="T1"
                value={terminalStatistics.t1}
              />

              <TerminalSummary
                label="T2"
                value={terminalStatistics.t2}
              />

              <TerminalSummary
                label="Other"
                value={terminalStatistics.unknown}
              />
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral">
                  System Status
                </h3>

                <p className="mt-1 text-xs text-neutral-light">
                  EthioFlight service information
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <AvailabilityRow
                label="Flight Data"
                value={
                  loading ? "Loading" : "Connected"
                }
                active={!loading && !error}
              />

              <AvailabilityRow
                label="Airport"
                value={AIRPORT_CODE}
                active
              />

              <AvailabilityRow
                label="Last Sync"
                value={
                  lastUpdated
                    ? lastUpdated.toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Waiting..."
                }
                active={Boolean(lastUpdated)}
              />
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          MODAL
      ===================================================== */}

      <FlightDetailsModal
        flight={selectedFlight}
        onClose={() => setSelectedFlight(null)}
      />
    </div>
  );
}

/* =========================================================
   SUMMARY PROGRESS
========================================================= */

function SummaryProgress({
  label,
  value,
  total,
  icon: Icon,
  barClass,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            size={14}
            className="text-neutral-light"
          />

          <span className="text-xs font-semibold text-neutral">
            {label}
          </span>
        </div>

        <span className="text-xs font-bold text-neutral">
          {value}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-light">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   TERMINAL SUMMARY
========================================================= */

function TerminalSummary({ label, value }) {
  return (
    <div className="rounded-xl bg-primary-light p-3">
      <p className="text-xs font-semibold text-neutral">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-primary-dark">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   AVAILABILITY ROW
========================================================= */

function AvailabilityRow({
  label,
  value,
  active,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            active
              ? "bg-success"
              : "bg-neutral-light"
          }`}
        />

        <span className="text-xs font-semibold text-neutral-light">
          {label}
        </span>
      </div>

      <span className="text-xs font-bold text-neutral">
        {value}
      </span>
    </div>
  );
}