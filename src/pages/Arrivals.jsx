import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AirVent,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  Download,
  FileText,
  Gauge,
  Luggage,
  MapPin,
  PlaneLanding,
  Printer,
  Radar,
  RefreshCw,
  Satellite,
  Search,
  Timer,
  Wind,
  X,
} from "lucide-react";

import { getLiveFlights } from "../services/aviationStack";

const AIRPORT_CODE =
  import.meta.env.VITE_AIRPORT_CODE || "ADD";

const AIRPORT_ICAO =
  import.meta.env.VITE_AIRPORT_ICAO || "HAAB";

const AIRPORT_NAME =
  import.meta.env.VITE_AIRPORT_NAME ||
  "Bole International Airport";

const AIRPORT_LOCATION =
  import.meta.env.VITE_AIRPORT_LOCATION ||
  "Addis Ababa, Ethiopia";

const ITEMS_PER_PAGE = 8;

const TERMINALS = [
  { value: "all", label: "All Terminals" },
  { value: "T1", label: "T1" },
  { value: "T2", label: "T2" },
];

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "Landed", label: "Landed" },
  { value: "Delayed", label: "Delayed" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "En Route", label: "En Route" },
  { value: "Final Approach", label: "Final Approach" },
];

const TIME_RANGES = [
  { value: "today", label: "Today" },
  { value: "full-day", label: "Full Day" },
  { value: "next-6h", label: "Next 6 Hours" },
  { value: "next-12h", label: "Next 12 Hours" },
  { value: "next-24h", label: "Next 24 Hours" },
];

function safeValue(value, fallback = "—") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}

function getArrayFromResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.flights)) {
    return payload.flights;
  }

  if (Array.isArray(payload?.arrivals)) {
    return payload.arrivals;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function normalizeStatus(status, flight) {
  const rawStatus = String(
    firstValue(
      status,
      flight?.status,
      flight?.flight_status
    ) || ""
  )
    .toLowerCase()
    .trim();

  if (
    rawStatus.includes("landed") ||
    rawStatus.includes("arrived")
  ) {
    return "Landed";
  }

  if (
    rawStatus.includes("delay") ||
    rawStatus.includes("delayed")
  ) {
    return "Delayed";
  }

  if (
    rawStatus.includes("approach") ||
    rawStatus.includes("final")
  ) {
    return "Final Approach";
  }

  if (
    rawStatus.includes("active") ||
    rawStatus.includes("en route") ||
    rawStatus.includes("enroute")
  ) {
    return "En Route";
  }

  if (
    rawStatus.includes("scheduled") ||
    rawStatus.includes("planned")
  ) {
    return "Scheduled";
  }

  /*
   * If the backend doesn't send a status,
   * infer a display status from arrival timestamps.
   */
  const arrival = flight?.arrival || {};

  const actual = firstValue(
    arrival.actual,
    arrival.actual_time,
    flight?.actual_arrival
  );

  if (actual) {
    return "Landed";
  }

  const estimated = firstValue(
    arrival.estimated,
    arrival.estimated_time,
    flight?.estimated_arrival
  );

  const scheduled = firstValue(
    arrival.scheduled,
    arrival.scheduled_time,
    flight?.scheduled_arrival
  );

  if (estimated && scheduled) {
    const estimatedTime =
      new Date(estimated).getTime();

    const scheduledTime =
      new Date(scheduled).getTime();

    if (
      Number.isFinite(estimatedTime) &&
      Number.isFinite(scheduledTime) &&
      estimatedTime - scheduledTime >
        10 * 60 * 1000
    ) {
      return "Delayed";
    }
  }

  return "Scheduled";
}

function normalizeFlight(item, index) {
  const flight = item?.flight || {};
  const airline = item?.airline || {};
  const departure = item?.departure || {};
  const arrival = item?.arrival || {};
  const aircraft = item?.aircraft || {};

  const flightNumber = firstValue(
    flight?.iata,
    flight?.number,
    item?.flight_number,
    item?.flightNumber,
    `FL-${index + 1}`
  );

  const airlineName = firstValue(
    airline?.name,
    item?.airline_name,
    item?.airlineName,
    "Unknown Airline"
  );

  const airlineCode = firstValue(
    airline?.iata,
    airline?.icao,
    item?.airline_code,
    item?.airlineCode,
    "—"
  );

  const origin = firstValue(
    departure?.airport,
    departure?.name,
    item?.origin,
    item?.origin_name,
    "Unknown Origin"
  );

  const originCode = firstValue(
    departure?.iata,
    departure?.icao,
    item?.origin_code,
    item?.originCode,
    ""
  );

  const originCountry = firstValue(
    departure?.country,
    item?.origin_country,
    item?.originCountry,
    ""
  );

  const aircraftModel = firstValue(
    aircraft?.model?.text,
    aircraft?.model,
    item?.aircraft_model,
    item?.aircraftModel,
    "Unknown Aircraft"
  );

  const registration = firstValue(
    aircraft?.registration,
    item?.tail_number,
    item?.registration,
    ""
  );

  const scheduledArrival = firstValue(
    arrival?.scheduled,
    arrival?.scheduled_time,
    item?.scheduled_arrival,
    item?.scheduledArrival
  );

  const estimatedArrival = firstValue(
    arrival?.estimated,
    arrival?.estimated_time,
    item?.estimated_arrival,
    item?.estimatedArrival,
    scheduledArrival
  );

  const actualArrival = firstValue(
    arrival?.actual,
    arrival?.actual_time,
    item?.actual_arrival,
    item?.actualArrival
  );

  const terminal = firstValue(
    arrival?.terminal,
    item?.terminal,
    "—"
  );

  const gate = firstValue(
    arrival?.gate,
    item?.gate,
    "—"
  );

  const baggage = firstValue(
    arrival?.baggage,
    item?.baggage,
    arrival?.baggage_belt,
    item?.baggage_belt,
    "—"
  );

  const status = normalizeStatus(
    firstValue(
      item?.status,
      item?.flight_status,
      flight?.status
    ),
    item
  );

  return {
    id:
      item?.id ||
      item?._id ||
      flight?.icao ||
      flight?.iata ||
      `${flightNumber}-${index}`,

    flightNumber,
    airlineName,
    airlineCode,
    origin,
    originCode,
    originCountry,
    aircraftModel,
    registration,
    scheduledArrival,
    estimatedArrival,
    actualArrival,
    terminal,
    gate,
    baggage,
    status,
    raw: item,
  };
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDelayMinutes(flight) {
  if (
    !flight?.scheduledArrival ||
    !flight?.estimatedArrival
  ) {
    return 0;
  }

  const scheduled = new Date(
    flight.scheduledArrival
  ).getTime();

  const estimated = new Date(
    flight.estimatedArrival
  ).getTime();

  if (
    !Number.isFinite(scheduled) ||
    !Number.isFinite(estimated)
  ) {
    return 0;
  }

  return Math.round(
    (estimated - scheduled) / 60000
  );
}

function getStatusLabel(flight) {
  const delay = getDelayMinutes(flight);

  if (
    flight.status === "Delayed" &&
    delay > 0
  ) {
    return `+${delay}m Late`;
  }

  if (flight.status === "Landed") {
    return "Touchdown";
  }

  if (flight.status === "Final Approach") {
    return "Final Approach";
  }

  if (flight.status === "En Route") {
    return "En Route";
  }

  if (delay < 0) {
    return `${Math.abs(delay)}m Early`;
  }

  return "On Time";
}

/*
 * Theme-aware status colors.
 * These use the variables defined in index.css,
 * so they automatically change in dark mode.
 */
function getStatusClasses(status) {
  switch (status) {
    case "Delayed":
      return {
        wrapper:
          "bg-secondary-light text-secondary",
        dot: "bg-warning",
      };

    case "Scheduled":
      return {
        wrapper:
          "bg-info/10 text-info",
        dot: "bg-info",
      };

    case "En Route":
    case "Final Approach":
      return {
        wrapper:
          "bg-primary-light text-primary",
        dot: "bg-success",
      };

    case "Landed":
    default:
      return {
        wrapper:
          "bg-neutral-light/10 text-neutral",
        dot: "bg-neutral-light",
      };
  }
}

function getAirlineBadgeClass(code) {
  const normalized = String(code || "")
    .toUpperCase();

  if (normalized === "ET") {
    return "bg-primary text-white";
  }

  if (normalized === "QR") {
    return "bg-neutral text-surface";
  }

  if (normalized === "SV") {
    return "bg-[#006A4E] text-white";
  }

  if (normalized === "TK") {
    return "bg-red-700 text-white";
  }

  return "bg-primary-light text-neutral";
}

function calculateSummary(flights) {
  return {
    total: flights.length,

    landed: flights.filter(
      (flight) => flight.status === "Landed"
    ).length,

    delayed: flights.filter(
      (flight) => flight.status === "Delayed"
    ).length,

    scheduled: flights.filter(
      (flight) => flight.status === "Scheduled"
    ).length,

    enRoute: flights.filter(
      (flight) => flight.status === "En Route"
    ).length,

    finalApproach: flights.filter(
      (flight) => flight.status === "Final Approach"
    ).length,
  };
}

function getPaginationPages(
  currentPage,
  totalPages
) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const pages = [];

  pages.push(1);

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(
    2,
    currentPage - 1
  );

  const end = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  for (
    let page = start;
    page <= end;
    page++
  ) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) {
    pages.push("...");
  }

  pages.push(totalPages);

  return pages;
}

function MetricCard({
  title,
  icon,
  children,
  footer,
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-light">
          {title}
        </span>

        {icon}
      </div>

      {children}

      {footer}
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = getStatusClasses(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${classes.wrapper}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${classes.dot}`}
      />

      {status}
    </span>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }).map(
    (_, index) => (
      <tr key={index}>
        {Array.from({ length: 10 }).map(
          (_, cellIndex) => (
            <td
              key={cellIndex}
              className="px-4 py-4"
            >
              <div className="h-4 animate-pulse rounded bg-primary-light" />
            </td>
          )
        )}
      </tr>
    )
  );
}

function EmptyState({ search }) {
  return (
    <tr>
      <td
        colSpan={10}
        className="px-6 py-16 text-center"
      >
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <PlaneLanding className="h-6 w-6 text-primary" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-neutral">
            No arrivals found
          </h3>

          <p className="mt-1 text-sm text-neutral-light">
            {search
              ? "Try changing your search or filters."
              : "The backend did not return any arrivals for this period."}
          </p>
        </div>
      </td>
    </tr>
  );
}

function FlightRow({
  flight,
  onSelect,
}) {
  const statusText =
    getStatusLabel(flight);

  return (
    <tr className="group border-b border-border transition-colors hover:bg-primary-light/50">
      {/* Flight */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold text-neutral">
            {safeValue(flight.flightNumber)}
          </span>
        </div>
      </td>

      {/* Airline */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${getAirlineBadgeClass(
              flight.airlineCode
            )}`}
          >
            {safeValue(
              flight.airlineCode,
              "?"
            ).slice(0, 3)}
          </div>

          <span className="truncate text-sm font-medium text-neutral">
            {safeValue(flight.airlineName)}
          </span>
        </div>
      </td>

      {/* Origin */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-base font-semibold text-neutral">
            {safeValue(flight.origin)}

            {flight.originCode && (
              <span className="rounded bg-primary-light px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral">
                {flight.originCode}
              </span>
            )}
          </span>

          {flight.originCountry && (
            <span className="text-xs text-neutral-light">
              {flight.originCountry}
            </span>
          )}
        </div>
      </td>

      {/* Aircraft */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col font-mono text-[13px]">
          <span className="font-semibold text-neutral">
            {safeValue(
              flight.aircraftModel
            )}
          </span>

          {flight.registration && (
            <span className="text-xs text-neutral-light">
              {flight.registration}
            </span>
          )}
        </div>
      </td>

      {/* Scheduled */}
      <td className="px-4 py-3.5 text-right font-mono text-[13px] text-neutral-light">
        {formatTime(
          flight.scheduledArrival
        )}
      </td>

      {/* Estimated / Actual */}
      <td className="px-4 py-3.5 text-right font-mono text-[13px]">
        <span
          className={
            flight.status === "Delayed"
              ? "font-bold text-warning"
              : "font-bold text-neutral"
          }
        >
          {formatTime(
            flight.actualArrival ||
              flight.estimatedArrival
          )}
        </span>

        <span
          className={`block text-xs font-semibold ${
            flight.status === "Delayed"
              ? "text-warning"
              : "text-neutral-light"
          }`}
        >
          {statusText}
        </span>
      </td>

      {/* Gate */}
      <td className="px-4 py-3.5 text-center">
        <div className="inline-flex items-center gap-1">
          <span className="rounded bg-primary-light px-1.5 py-0.5 font-mono text-[12px] font-medium text-neutral">
            {safeValue(
              flight.terminal
            )}
          </span>

          <span className="font-mono text-[13px] font-bold text-neutral">
            {safeValue(flight.gate)}
          </span>
        </div>
      </td>

      {/* Baggage */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Luggage className="h-4 w-4 text-neutral-light" />

          <span className="text-xs font-semibold text-neutral">
            {safeValue(flight.baggage)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 text-center">
        <StatusBadge
          status={flight.status}
        />
      </td>

      {/* Action */}
      <td className="px-4 py-3.5 text-right">
        <button
          type="button"
          onClick={() => onSelect(flight)}
          className="rounded-lg bg-primary-light px-3 py-1.5 text-[11px] font-semibold text-neutral shadow-sm transition-all hover:bg-primary hover:text-white"
        >
          View Flight
        </button>
      </td>
    </tr>
  );
}

export default function Arrivals() {
  const [flights, setFlights] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [operations, setOperations] =
    useState(null);

  const [search, setSearch] = useState("");

  const [terminal, setTerminal] =
    useState("all");

  const [status, setStatus] =
    useState("all");

  const [timeRange, setTimeRange] =
    useState("full-day");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedFlight, setSelectedFlight] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const fetchArrivals = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getLiveFlights({
          arrIata: AIRPORT_CODE,
          limit: 100,
        });

        if (!response.ok) {
          throw new Error(
            `Backend request failed with status ${response.status}`
          );
        }

        const payload =
          await response.json();

        const rawFlights =
          getArrayFromResponse(payload);

        const normalizedFlights =
          rawFlights.map(
            normalizeFlight
          );

        setFlights(
          normalizedFlights
        );

        /*
         * Use backend summary when available.
         * Otherwise calculate it from returned flights.
         */
        const backendSummary =
          payload?.summary ||
          payload?.statistics ||
          null;

        setSummary(
          backendSummary ||
            calculateSummary(
              normalizedFlights
            )
        );

        setWeather(
          payload?.weather ||
            payload?.metar ||
            null
        );

        setOperations(
          payload?.operations ||
            payload?.airport_operations ||
            null
        );

        setLastUpdated(new Date());
      } catch (requestError) {
        console.error(
          "Arrivals request failed:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load arrivals from the backend."
        );

        /*
         * Do not inject fake flights when
         * the backend is unavailable.
         */
        setFlights([]);
        setSummary(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
   * Load backend arrivals when the page opens.
   */
  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  /*
   * Reset pagination when filters change.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    terminal,
    status,
    timeRange,
  ]);

  const filteredFlights = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return flights.filter((flight) => {
      const matchesSearch =
        !query ||
        [
          flight.flightNumber,
          flight.airlineName,
          flight.airlineCode,
          flight.origin,
          flight.originCode,
          flight.originCountry,
          flight.aircraftModel,
          flight.registration,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesTerminal =
        terminal === "all" ||
        flight.terminal === terminal;

      const matchesStatus =
        status === "all" ||
        flight.status === status;

      return (
        matchesSearch &&
        matchesTerminal &&
        matchesStatus
      );
    });
  }, [
    flights,
    search,
    terminal,
    status,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFlights.length /
        ITEMS_PER_PAGE
    )
  );

  const visibleFlights =
    filteredFlights.slice(
      (currentPage - 1) *
        ITEMS_PER_PAGE,
      currentPage *
        ITEMS_PER_PAGE
    );

  const calculatedSummary =
    calculateSummary(flights);

  const totalArrivals = Number(
    summary?.total ??
      summary?.total_arrivals ??
      calculatedSummary.total
  );

  const landedCount = Number(
    summary?.landed ??
      summary?.arrived ??
      calculatedSummary.landed
  );

  const delayedCount = Number(
    summary?.delayed ??
      summary?.delays ??
      calculatedSummary.delayed
  );

  const scheduledCount = Number(
    summary?.scheduled ??
      calculatedSummary.scheduled
  );

  const activeCount = Number(
    summary?.active ??
      summary?.en_route ??
      calculatedSummary.enRoute +
        calculatedSummary.finalApproach
  );

  const landedPercent =
    totalArrivals > 0
      ? (landedCount /
          totalArrivals) *
        100
      : 0;

  const delayedPercent =
    totalArrivals > 0
      ? (delayedCount /
          totalArrivals) *
        100
      : 0;

  const scheduledPercent =
    totalArrivals > 0
      ? (scheduledCount /
          totalArrivals) *
        100
      : 0;

  function handleRefresh() {
    fetchArrivals({
      silent: true,
    });
  }

  function handleResetFilters() {
    setSearch("");
    setTerminal("all");
    setStatus("all");
    setCurrentPage(1);
  }

  function handleExportCsv() {
    if (!filteredFlights.length) {
      return;
    }

    const headers = [
      "Flight",
      "Airline",
      "Origin",
      "Origin Code",
      "Country",
      "Aircraft",
      "Registration",
      "Scheduled Arrival",
      "Estimated Arrival",
      "Actual Arrival",
      "Terminal",
      "Gate",
      "Baggage",
      "Status",
    ];

    const rows =
      filteredFlights.map(
        (flight) => [
          flight.flightNumber,
          flight.airlineName,
          flight.origin,
          flight.originCode,
          flight.originCountry,
          flight.aircraftModel,
          flight.registration,
          flight.scheduledArrival,
          flight.estimatedArrival,
          flight.actualArrival,
          flight.terminal,
          flight.gate,
          flight.baggage,
          flight.status,
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              value === undefined ||
              value === null
                ? ""
                : String(value);

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `arrivals-${AIRPORT_CODE}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  const paginationPages =
    getPaginationPages(
      currentPage,
      totalPages
    );

  const weatherTemperature =
    firstValue(
      weather?.temperature,
      weather?.temp,
      weather?.temperature_c
    );

  const weatherCondition =
    firstValue(
      weather?.condition,
      weather?.visibility,
      weather?.flight_category,
      weather?.category
    );

  const windDirection =
    firstValue(
      weather?.wind_direction,
      weather?.wind_dir,
      weather?.wind?.direction
    );

  const windSpeed =
    firstValue(
      weather?.wind_speed,
      weather?.wind_speed_kt,
      weather?.wind?.speed
    );

  const qnh =
    firstValue(
      weather?.qnh,
      weather?.pressure,
      weather?.altimeter
    );

  const runway =
    firstValue(
      operations?.active_runway,
      operations?.runway,
      weather?.runway
    );

  const arrivalConfiguration =
    firstValue(
      operations?.arrival_configuration,
      operations?.approach,
      operations?.approach_configuration
    );

  const holdingTime =
    firstValue(
      operations?.holding_time,
      operations?.average_holding_minutes,
      operations?.avg_holding_minutes
    );

  const gateOccupancy =
    firstValue(
      operations?.gate_occupancy,
      operations?.gateOccupancy
    );

  const terminalCapacity =
    firstValue(
      operations?.terminal_capacity,
      operations?.capacity
    );

  const operationsMessage =
    firstValue(
      operations?.baggage_message,
      operations?.message,
      operations?.alert
    );

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* Airport header */}
      <section className="relative overflow-hidden rounded-xl bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <PlaneLanding className="h-7 w-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-tight text-neutral">
                  {AIRPORT_NAME}
                </h1>

                <span className="rounded-lg bg-primary-light px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-neutral">
                  {AIRPORT_CODE} /{" "}
                  {AIRPORT_ICAO}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  LIVE INBOUND RADAR ACTIVE
                </span>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-light">
                <MapPin className="h-4 w-4 text-neutral-light" />

                {AIRPORT_LOCATION}

                {runway && (
                  <>
                    <span>·</span>
                    Active Runway: {runway}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                refreshing || loading
              }
              className="flex items-center gap-2 rounded-lg bg-primary-light px-3.5 py-2 text-sm font-medium text-neutral shadow-sm transition hover:bg-primary-light/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-[18px] w-[18px] ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh Stream"}
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
            >
              <Satellite className="h-[18px] w-[18px]" />
              Approach Vector Map
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
            <Radar className="h-4 w-4" />
          </div>

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load arrivals
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                fetchArrivals()
              }
              className="mt-3 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Metrics */}
      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Inbound volume */}
        <MetricCard
          title="Inbound Flights Today"
          icon={
            <CloudDownload className="h-[18px] w-[18px] text-primary" />
          }
          footer={
            <div className="mt-2 flex items-center justify-between font-mono text-[12px] text-neutral-light">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {landedCount} Landed
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                {delayedCount} Delayed
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-info" />
                {scheduledCount} Scheduled
              </span>
            </div>
          }
        >
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[40px] font-bold tracking-tight text-neutral">
              {loading
                ? "—"
                : totalArrivals}
            </span>

            <span className="text-[11px] font-semibold text-primary">
              Backend synced
            </span>
          </div>

          <div className="flex h-2 w-full overflow-hidden rounded-full bg-primary-light">
            <div
              className="h-full bg-primary"
              style={{
                width: `${landedPercent}%`,
              }}
            />

            <div
              className="h-full bg-secondary"
              style={{
                width: `${delayedPercent}%`,
              }}
            />

            <div
              className="h-full bg-info"
              style={{
                width: `${scheduledPercent}%`,
              }}
            />
          </div>
        </MetricCard>

        {/* Weather */}
        <MetricCard
          title="METAR & Conditions"
          icon={
            <AirVent className="h-[18px] w-[18px] text-info" />
          }
          footer={
            <div className="mt-2 flex items-center justify-between rounded-lg bg-primary-light px-2 py-1.5">
              <span className="text-[11px] font-medium text-neutral">
                Arrival Configuration
              </span>

              <span className="font-mono text-[11px] font-semibold text-primary">
                {safeValue(
                  arrivalConfiguration
                )}
              </span>
            </div>
          }
        >
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-[30px] font-semibold text-neutral">
              {weatherTemperature !==
              undefined
                ? `${weatherTemperature}°C`
                : "—"}
            </span>

            <span className="text-xs font-semibold text-neutral-light">
              {safeValue(
                weatherCondition
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-light">
            <span className="flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" />

              Wind{" "}
              {safeValue(
                windDirection
              )}
              ° @{" "}
              {safeValue(
                windSpeed
              )}{" "}
              kts
            </span>

            <span className="font-mono font-semibold text-primary">
              QNH {safeValue(qnh)}
            </span>
          </div>
        </MetricCard>

        {/* Holding */}
        <MetricCard
          title="Inbound Approach Holding"
          icon={
            <Timer className="h-[18px] w-[18px] text-secondary" />
          }
          footer={
            <p className="mt-2 flex items-center gap-1 text-xs text-neutral-light">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />

              {safeValue(
                operations?.holding_message,
                "Backend operational data"
              )}
            </p>
          }
        >
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-[40px] font-bold tracking-tight text-neutral">
              {holdingTime !==
              undefined
                ? holdingTime
                : "—"}
            </span>

            <span className="text-base text-neutral-light">
              min avg
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-light">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width:
                    holdingTime !==
                      undefined &&
                    Number(
                      holdingTime
                    ) >= 0
                      ? `${Math.min(
                          Number(
                            holdingTime
                          ) * 10,
                          100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <span className="text-[11px] font-medium text-primary">
              Live
            </span>
          </div>
        </MetricCard>

        {/* Capacity */}
        <MetricCard
          title="Terminal Capacity"
          icon={
            <Gauge className="h-[18px] w-[18px] text-neutral-light" />
          }
          footer={
            <div className="flex justify-between text-[11px] text-neutral-light">
              <span>
                Active arrivals
              </span>

              <span className="font-mono font-semibold text-neutral">
                {activeCount}
              </span>
            </div>
          }
        >
          <div className="my-1 flex items-center justify-between">
            <div>
              <span className="text-[30px] font-semibold text-neutral">
                {gateOccupancy !==
                undefined
                  ? `${gateOccupancy}%`
                  : "—"}
              </span>

              <span className="block text-xs text-neutral-light">
                Gate Occupancy
              </span>
            </div>

            <div className="relative h-12 w-12">
              <svg
                className="h-12 w-12 -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="stroke-primary-light"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3.5"
                />

                <path
                  className="stroke-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray={`${Number(
                    gateOccupancy || 0
                  )}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-neutral-light">
            <span>
              Capacity
            </span>

            <span className="font-mono font-semibold text-neutral">
              {safeValue(
                terminalCapacity
              )}
            </span>
          </div>
        </MetricCard>
      </section>

      {/* Filters */}
      <section className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-lg">
              <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-light" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Filter by flight number, origin, or airline..."
                className="h-10 w-full rounded-lg border border-border bg-primary-light pl-9 pr-9 text-sm text-neutral outline-none transition placeholder:text-neutral-muted focus:border-primary focus:bg-surface"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-light hover:bg-primary-light hover:text-neutral"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Terminal */}
            <div className="flex items-center overflow-hidden rounded-lg bg-primary-light p-1">
              {TERMINALS.map(
                (item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setTerminal(
                        item.value
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      terminal ===
                      item.value
                        ? "bg-surface text-neutral shadow-sm"
                        : "text-neutral-light hover:text-neutral"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

            {/* Status */}
            <div className="flex items-center overflow-x-auto rounded-lg bg-primary-light p-1">
              {STATUSES.map(
                (item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setStatus(
                        item.value
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      status ===
                      item.value
                        ? "bg-surface text-neutral shadow-sm"
                        : "text-neutral-light hover:text-neutral"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time range */}
            <select
              value={timeRange}
              onChange={(event) =>
                setTimeRange(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-neutral outline-none focus:border-primary"
            >
              {TIME_RANGES.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={
                handleResetFilters
              }
              className="h-10 rounded-lg bg-primary-light px-3 text-xs font-semibold text-neutral-light transition hover:bg-primary-light/70 hover:text-neutral"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Arrivals table */}
      <section className="mt-4 overflow-hidden rounded-xl bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />

            <div>
              <h2 className="text-sm font-semibold text-neutral">
                Arrival Flight Matrix
              </h2>

              <p className="text-xs text-neutral-light">
                Live inbound flights for{" "}
                {AIRPORT_CODE}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-light">
            <span className="hidden sm:inline">
              {lastUpdated
                ? `Updated ${formatDateTime(
                    lastUpdated
                  )}`
                : "Waiting for backend"}
            </span>

            <span className="flex items-center gap-1.5 rounded-full bg-primary-light px-2 py-1 text-[10px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              LIVE
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full border-collapse">
            <thead>
              <tr className="bg-primary-light text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Flight
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Airline
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Origin
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Aircraft
                </th>

                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Scheduled
                </th>

                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Estimated / Actual
                </th>

                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Gate
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Baggage
                </th>

                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <LoadingRows />
              ) : visibleFlights.length ===
                0 ? (
                <EmptyState
                  search={
                    search ||
                    terminal !==
                      "all" ||
                    status !== "all"
                  }
                />
              ) : (
                visibleFlights.map(
                  (flight) => (
                    <FlightRow
                      key={flight.id}
                      flight={flight}
                      onSelect={
                        setSelectedFlight
                      }
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Operations ribbon */}
        <div className="flex flex-col items-start justify-between gap-3 bg-primary-light px-4 py-3 md:flex-row md:items-center">
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral">
                Baggage Hall Ops:
              </span>

              <span className="text-xs text-neutral-light">
                {safeValue(
                  operationsMessage,
                  "Waiting for operational data from backend."
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <span className="font-mono text-[11px] text-neutral-light">
              Telemetry:{" "}
              {safeValue(
                operations?.telemetry,
                "ADS-B"
              )}
            </span>

            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              Ground Movement Radar
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 bg-surface p-4 sm:flex-row">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-light">
              Showing
            </span>

            <span className="font-semibold text-neutral">
              {visibleFlights.length}
            </span>

            <span className="text-neutral-light">
              of{" "}
              {filteredFlights.length}{" "}
              filtered arrivals
            </span>

            {filteredFlights.length !==
              flights.length && (
              <span className="text-neutral-light">
                ({flights.length} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Export */}
            <div className="flex items-center gap-1 border-r border-border pr-3">
              <button
                type="button"
                onClick={
                  handleExportCsv
                }
                disabled={
                  !filteredFlights.length
                }
                title="Export CSV Data"
                className="rounded-lg p-2 text-neutral-light transition hover:bg-primary-light hover:text-neutral disabled:opacity-40"
              >
                <Download className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                title="Print Flight Board"
                className="rounded-lg p-2 text-neutral-light transition hover:bg-primary-light hover:text-neutral"
              >
                <Printer className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-neutral-light transition hover:text-neutral disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-[18px] w-[18px]" />
              </button>

              {paginationPages.map(
                (page, index) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="px-1 text-neutral-light"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-mono text-xs font-bold transition ${
                        currentPage ===
                        page
                          ? "bg-primary text-white"
                          : "bg-primary-light text-neutral hover:bg-primary-light/70"
                      }`}
                    >
                      {page}
                    </button>
                  )
              )}

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-neutral transition hover:bg-primary-light/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Flight details modal */}
      {selectedFlight && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={() =>
            setSelectedFlight(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <div className="flex items-center gap-2">
                  <PlaneLanding className="h-5 w-5 text-primary" />

                  <h2 className="text-lg font-semibold text-neutral">
                    Flight{" "}
                    {safeValue(
                      selectedFlight.flightNumber
                    )}
                  </h2>
                </div>

                <p className="mt-1 text-sm text-neutral-light">
                  {safeValue(
                    selectedFlight.airlineName
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedFlight(
                    null
                  )
                }
                className="rounded-lg p-2 text-neutral-light hover:bg-primary-light hover:text-neutral"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <DetailItem
                label="Status"
                value={
                  <StatusBadge
                    status={
                      selectedFlight.status
                    }
                  />
                }
              />

              <DetailItem
                label="Origin"
                value={`${safeValue(
                  selectedFlight.origin
                )} ${
                  selectedFlight.originCode
                    ? `(${selectedFlight.originCode})`
                    : ""
                }`}
              />

              <DetailItem
                label="Scheduled Arrival"
                value={formatDateTime(
                  selectedFlight.scheduledArrival
                )}
              />

              <DetailItem
                label="Estimated Arrival"
                value={formatDateTime(
                  selectedFlight.estimatedArrival
                )}
              />

              <DetailItem
                label="Actual Arrival"
                value={formatDateTime(
                  selectedFlight.actualArrival
                )}
              />

              <DetailItem
                label="Aircraft"
                value={safeValue(
                  selectedFlight.aircraftModel
                )}
              />

              <DetailItem
                label="Registration"
                value={safeValue(
                  selectedFlight.registration
                )}
              />

              <DetailItem
                label="Terminal"
                value={safeValue(
                  selectedFlight.terminal
                )}
              />

              <DetailItem
                label="Gate"
                value={safeValue(
                  selectedFlight.gate
                )}
              />

              <DetailItem
                label="Baggage"
                value={safeValue(
                  selectedFlight.baggage
                )}
              />
            </div>

            <div className="border-t border-border bg-primary-light p-5">
              <p className="flex items-center gap-2 text-xs font-semibold text-neutral">
                <FileText className="h-4 w-4 text-primary" />
                Backend Flight Data
              </p>

              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-[#0B1713] p-4 text-xs text-green-100">
                {JSON.stringify(
                  selectedFlight.raw,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-primary-light p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-light">
        {label}
      </p>

      <div className="mt-1 text-sm font-semibold text-neutral">
        {value}
      </div>
    </div>
  );
}