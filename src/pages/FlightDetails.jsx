import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Flight,
  Gauge,
  Heart,
  Lightbulb,
  MapPin,
  Navigation,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Signal,
  Star,
  Thermometer,
  Timer,
  Wifi,
  Wind,
  X,
} from "lucide-react";

import { getLiveFlights } from "../services/aviationStack";

const DEFAULT_FLIGHT_NUMBER =
  import.meta.env.VITE_FLIGHT_NUMBER || "ET602";

const AIRPORT_CODE =
  import.meta.env.VITE_AIRPORT_CODE || "ADD";

const AIRPORT_ICAO =
  import.meta.env.VITE_AIRPORT_ICAO || "HAAB";

const AIRPORT_NAME =
  import.meta.env.VITE_AIRPORT_NAME ||
  "Addis Ababa Bole International Airport";

const REFRESH_SECONDS = 30;

function safe(value, fallback = "—") {
  return value === undefined ||
    value === null ||
    value === "" ||
    value === "null"
    ? fallback
    : value;
}

function getFlightNumber(flight) {
  return safe(
    flight?.flight?.iata ||
      flight?.flight?.number ||
      flight?.flight_iata ||
      flight?.flight_number
  );
}

function getAirlineName(flight) {
  return safe(
    flight?.airline?.name ||
      flight?.airline_name ||
      flight?.airline
  );
}

function getAirlineCode(flight) {
  return safe(
    flight?.airline?.iata ||
      flight?.airline?.icao ||
      flight?.airline_iata,
    ""
  );
}

function getCallsign(flight) {
  return safe(
    flight?.flight?.icao ||
      flight?.flight?.callsign ||
      flight?.flight_icao
  );
}

function getDepartureIata(flight) {
  return safe(
    flight?.departure?.iata ||
      flight?.departure_iata ||
      flight?.dep_iata
  );
}

function getDepartureAirport(flight) {
  return safe(
    flight?.departure?.airport ||
      flight?.departure_airport
  );
}

function getDepartureIcao(flight) {
  return safe(
    flight?.departure?.icao ||
      flight?.departure_icao
  );
}

function getArrivalIata(flight) {
  return safe(
    flight?.arrival?.iata ||
      flight?.arrival_iata ||
      flight?.arr_iata
  );
}

function getArrivalAirport(flight) {
  return safe(
    flight?.arrival?.airport ||
      flight?.arrival_airport
  );
}

function getArrivalIcao(flight) {
  return safe(
    flight?.arrival?.icao ||
      flight?.arrival_icao
  );
}

function getAircraftModel(flight) {
  return safe(
    flight?.aircraft?.model_text ||
      flight?.aircraft?.model ||
      flight?.aircraft?.model_code ||
      flight?.aircraft_model
  );
}

function getAircraftRegistration(flight) {
  return safe(
    flight?.aircraft?.registration ||
      flight?.aircraft_registration
  );
}

function getFlightStatus(flight) {
  return safe(
    flight?.flight_status ||
      flight?.status
  );
}

function getScheduledDeparture(flight) {
  return safe(
    flight?.departure?.scheduled ||
      flight?.departure_scheduled
  );
}

function getEstimatedDeparture(flight) {
  return safe(
    flight?.departure?.estimated ||
      flight?.departure_estimated
  );
}

function getActualDeparture(flight) {
  return safe(
    flight?.departure?.actual ||
      flight?.departure_actual
  );
}

function getScheduledArrival(flight) {
  return safe(
    flight?.arrival?.scheduled ||
      flight?.arrival_scheduled
  );
}

function getEstimatedArrival(flight) {
  return safe(
    flight?.arrival?.estimated ||
      flight?.arrival_estimated
  );
}

function getActualArrival(flight) {
  return safe(
    flight?.arrival?.actual ||
      flight?.arrival_actual
  );
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.includes("T")
      ? value.split("T")[1]?.slice(0, 5) || value
      : value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("active")) return "EN ROUTE";
  if (normalized.includes("landed")) return "LANDED";
  if (normalized.includes("scheduled")) return "SCHEDULED";
  if (normalized.includes("cancel")) return "CANCELLED";
  if (normalized.includes("incident")) return "INCIDENT";
  if (normalized.includes("divert")) return "DIVERTED";
  if (normalized.includes("unknown")) return "UNKNOWN";

  return safe(status, "UNKNOWN").toUpperCase();
}

function getStatusClasses(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("cancel") ||
    normalized.includes("incident") ||
    normalized.includes("divert")
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (normalized.includes("active")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (normalized.includes("landed")) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  if (normalized.includes("scheduled")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

function DataUnavailable({ children = "Not available from AviationStack" }) {
  return (
    <span className="text-slate-400 italic">
      {children}
    </span>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-medium text-right ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-emerald-700">
            <Icon size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              {title}
            </h3>

            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function TelemetryValue({
  label,
  value,
  unit,
  description,
  icon: Icon,
}) {
  return (
    <div className="bg-white p-4">
      <div className="mb-1 flex items-center gap-2">
        {Icon && (
          <Icon
            size={15}
            className="text-slate-400"
          />
        )}

        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-slate-900">
          {value}
        </span>

        {unit && (
          <span className="text-xs text-slate-500">
            {unit}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] p-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-white" />
        <div className="h-80 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-white" />
          <div className="h-64 animate-pulse rounded-xl bg-white" />
          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function FlightDetails({
  flightNumber = DEFAULT_FLIGHT_NUMBER,
  onBack,
}) {
  const [flight, setFlight] = useState(null);
  const [searchValue, setSearchValue] =
    useState(flightNumber);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [isFavorite, setIsFavorite] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const fetchFlight = useCallback(
    async (requestedFlight = flightNumber) => {
      const normalizedFlight =
        requestedFlight?.trim();

      if (!normalizedFlight) {
        setError("Enter a flight number.");
        return;
      }

      try {
        setError("");
        setRefreshing(true);

        const response = await getLiveFlights({
          flightNumber: normalizedFlight,
          limit: 10,
        });

        const flights = Array.isArray(response?.data)
          ? response.data
          : [];

        if (!flights.length) {
          setFlight(null);
          setError(
            `No AviationStack flight data was found for ${normalizedFlight}.`
          );
          return;
        }

        /*
         * If multiple records are returned, prefer:
         * 1. Active flight
         * 2. Matching IATA flight number
         * 3. First result
         */
        const exactMatches = flights.filter(
          (item) =>
            String(getFlightNumber(item))
              .toLowerCase() ===
            normalizedFlight.toLowerCase()
        );

        const candidates =
          exactMatches.length > 0
            ? exactMatches
            : flights;

        const activeFlight =
          candidates.find(
            (item) =>
              String(getFlightStatus(item))
                .toLowerCase() === "active"
          ) || candidates[0];

        setFlight(activeFlight);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load flight data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [flightNumber]
  );

  useEffect(() => {
    fetchFlight();

    const interval = setInterval(() => {
      fetchFlight();
    }, REFRESH_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [fetchFlight]);

  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) return;

    fetchFlight(value);
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Flight ${getFlightNumber(flight)}`,
          text: `Flight tracking information for ${getFlightNumber(
            flight
          )}`,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch {
      // User cancelled native share dialog.
    }
  };

  const handleExport = () => {
    if (!flight) return;

    const exportData = {
      flight: getFlightNumber(flight),
      airline: getAirlineName(flight),
      airlineCode: getAirlineCode(flight),
      status: getFlightStatus(flight),
      departure: {
        airport: getDepartureAirport(flight),
        iata: getDepartureIata(flight),
        icao: getDepartureIcao(flight),
        scheduled: getScheduledDeparture(flight),
        estimated: getEstimatedDeparture(flight),
        actual: getActualDeparture(flight),
      },
      arrival: {
        airport: getArrivalAirport(flight),
        iata: getArrivalIata(flight),
        icao: getArrivalIcao(flight),
        scheduled: getScheduledArrival(flight),
        estimated: getEstimatedArrival(flight),
        actual: getActualArrival(flight),
      },
      aircraft: {
        model: getAircraftModel(flight),
        registration: getAircraftRegistration(flight),
      },
      callsign: getCallsign(flight),
      retrievedAt: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${getFlightNumber(
      flight
    )}-flight-data.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const flightSummary = useMemo(() => {
    if (!flight) return null;

    return {
      number: getFlightNumber(flight),
      airline: getAirlineName(flight),
      airlineCode: getAirlineCode(flight),
      status: getFlightStatus(flight),
      statusLabel: getStatusLabel(
        getFlightStatus(flight)
      ),
      departureIata: getDepartureIata(flight),
      departureAirport:
        getDepartureAirport(flight),
      departureIcao: getDepartureIcao(flight),
      arrivalIata: getArrivalIata(flight),
      arrivalAirport:
        getArrivalAirport(flight),
      arrivalIcao: getArrivalIcao(flight),
      aircraftModel:
        getAircraftModel(flight),
      registration:
        getAircraftRegistration(flight),
      callsign: getCallsign(flight),
      scheduledDeparture:
        getScheduledDeparture(flight),
      estimatedDeparture:
        getEstimatedDeparture(flight),
      actualDeparture:
        getActualDeparture(flight),
      scheduledArrival:
        getScheduledArrival(flight),
      estimatedArrival:
        getEstimatedArrival(flight),
      actualArrival:
        getActualArrival(flight),
    };
  }, [flight]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center gap-5 px-4 lg:px-8">
          {/* Back */}
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">
              Back
            </span>
          </button>

          {/* Breadcrumb */}
          <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
            <Signal size={16} />
            <span>Operations</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              Flight Telemetry
            </span>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="ml-auto flex h-10 w-full max-w-[360px] items-center rounded-xl border border-slate-200 bg-[#F7F9FB] px-3"
          >
            <Search
              size={17}
              className="mr-2 shrink-0 text-slate-400"
            />

            <input
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              placeholder="Search flight number..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Search
            </button>
          </form>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                AviationStack
              </span>
            </div>

            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              title="Theme"
            >
              <Lightbulb size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Flight data unavailable
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchFlight()}
              className="ml-auto rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {flight && flightSummary ? (
          <>
            {/* Page title */}
            <div className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (onBack) {
                        onBack();
                      } else {
                        window.history.back();
                      }
                    }}
                    className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    <ArrowLeft size={15} />
                    Back to Live Flights
                  </button>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span className="uppercase tracking-wider text-slate-400">
                    Flight Telemetry View
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {flightSummary.number}
                  </h1>

                  {flightSummary.callsign !==
                    "—" && (
                    <>
                      <span className="text-2xl text-slate-300">
                        /
                      </span>

                      <span className="text-xl font-medium text-slate-500">
                        {flightSummary.callsign}
                      </span>
                    </>
                  )}

                  <span className="text-2xl text-slate-300">
                    ·
                  </span>

                  <span className="text-xl font-semibold text-slate-700">
                    {flightSummary.airline}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${getStatusClasses(
                      flightSummary.status
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {flightSummary.statusLabel}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Aircraft:{" "}
                  <strong className="text-slate-800">
                    {flightSummary.aircraftModel}
                  </strong>

                  <span className="mx-2">
                    ·
                  </span>

                  Registration:{" "}
                  <span className="font-mono font-semibold text-emerald-700">
                    {flightSummary.registration}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setIsFavorite((value) => !value)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow-sm ring-1 ring-slate-100 hover:bg-slate-50"
                >
                  {isFavorite ? (
                    <Star
                      size={18}
                      fill="currentColor"
                      className="text-amber-500"
                    />
                  ) : (
                    <Heart
                      size={18}
                      className="text-amber-500"
                    />
                  )}

                  {isFavorite
                    ? "Saved in Favorites"
                    : "Save to Favorites"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
                >
                  {copied ? (
                    <Check size={18} />
                  ) : (
                    <Share2 size={18} />
                  )}

                  {copied
                    ? "Link Copied"
                    : "Share Flight"}
                </button>
              </div>
            </div>

            {/* Route card */}
            <section className="relative mb-6 overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl" />

              <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.6fr_1fr]">
                {/* Departure */}
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-white">
                      {flightSummary.departureIata}
                    </span>

                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <PlaneTakeoff size={15} />
                      Origin
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {flightSummary.departureAirport}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {flightSummary.departureIcao !==
                    "—"
                      ? flightSummary.departureIcao
                      : "ICAO unavailable"}
                  </p>

                  <div className="mt-4 flex items-center gap-4 rounded-lg bg-slate-50 p-3">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Scheduled
                      </span>

                      <span className="font-mono text-sm font-bold">
                        {formatTime(
                          flightSummary.scheduledDeparture
                        )}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Actual
                      </span>

                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {formatTime(
                          flightSummary.actualDeparture
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="px-2 py-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>
                      Departure
                    </span>

                    <span className="text-emerald-700">
                      AviationStack route data
                    </span>

                    <span>
                      Arrival
                    </span>
                  </div>

                  <div className="relative py-5">
                    <div className="h-2 w-full rounded-full bg-slate-100" />

                    <div className="absolute left-0 top-1/2 h-2 w-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400" />

                    <div className="absolute left-0 top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg">
                        <Plane
                          size={19}
                          className="rotate-45"
                        />
                      </div>

                      <span className="mt-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                        LIVE DATA
                      </span>
                    </div>

                    <div className="absolute right-0 top-1/2 flex h-4 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {flightSummary.departureIata}
                    </span>

                    <span className="font-mono font-semibold text-slate-700">
                      {flightSummary.number}
                    </span>

                    <span>
                      {flightSummary.arrivalIata}
                    </span>
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <div className="mb-3 flex items-center justify-end gap-3">
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                      Destination
                      <PlaneLanding size={15} />
                    </span>

                    <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-white">
                      {flightSummary.arrivalIata}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {flightSummary.arrivalAirport}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {flightSummary.arrivalIcao !==
                    "—"
                      ? flightSummary.arrivalIcao
                      : "ICAO unavailable"}
                  </p>

                  <div className="mt-4 flex items-center justify-end gap-4 rounded-lg bg-slate-50 p-3">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Scheduled
                      </span>

                      <span className="font-mono text-sm font-bold">
                        {formatTime(
                          flightSummary.scheduledArrival
                        )}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Estimated
                      </span>

                      <span className="font-mono text-sm font-bold text-amber-700">
                        {formatTime(
                          flightSummary.estimatedArrival
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Telemetry */}
            <section className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-col justify-between gap-4 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Navigation size={21} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Live Flight Telemetry
                    </h3>

                    <p className="text-xs text-slate-500">
                      Data available from the AviationStack
                      flight response
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  API RESPONSE AVAILABLE
                </span>
              </div>

              {/* We deliberately do not fabricate telemetry. */}
              <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
                <TelemetryValue
                  label="Altitude"
                  value={
                    <DataUnavailable />
                  }
                  description="Requires position/ADS-B telemetry source"
                  icon={Gauge}
                />

                <TelemetryValue
                  label="Ground Speed"
                  value={
                    <DataUnavailable />
                  }
                  description="Not included in this flight response"
                  icon={Navigation}
                />

                <TelemetryValue
                  label="Coordinates"
                  value={
                    <DataUnavailable />
                  }
                  description="Requires live position data"
                  icon={MapPin}
                />

                <TelemetryValue
                  label="Squawk"
                  value={
                    <DataUnavailable />
                  }
                  description="Not included in this response"
                  icon={Signal}
                />

                <TelemetryValue
                  label="Heading"
                  value={
                    <DataUnavailable />
                  }
                  description="Requires live position data"
                  icon={Navigation}
                />
              </div>

              {/* Map placeholder */}
              <div className="relative h-72 overflow-hidden bg-[#e8f0eb]">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute left-[15%] top-[25%] h-px w-[70%] rotate-12 bg-emerald-700" />
                  <div className="absolute left-[10%] top-[55%] h-px w-[80%] -rotate-6 bg-emerald-700" />
                  <div className="absolute left-[30%] top-[10%] h-[80%] w-px rotate-[18deg] bg-emerald-700" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-xl bg-white/90 p-5 text-center shadow-lg backdrop-blur">
                    <MapPin
                      size={28}
                      className="mx-auto mb-2 text-slate-400"
                    />

                    <p className="font-semibold text-slate-700">
                      Live position unavailable
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                      AviationStack's standard flight response
                      does not provide the live latitude,
                      longitude, altitude and heading required
                      to render the original radar map.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical cards */}
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <InfoCard
                icon={PlaneTakeoff}
                title="Departure Station"
                subtitle={`${flightSummary.departureIata} / ${flightSummary.departureIcao}`}
              >
                <DetailRow
                  label="Airport"
                  value={
                    flightSummary.departureAirport
                  }
                />

                <DetailRow
                  label="Scheduled"
                  value={formatDateTime(
                    flightSummary.scheduledDeparture
                  )}
                  mono
                />

                <DetailRow
                  label="Estimated"
                  value={formatDateTime(
                    flightSummary.estimatedDeparture
                  )}
                  mono
                />

                <DetailRow
                  label="Actual"
                  value={formatDateTime(
                    flightSummary.actualDeparture
                  )}
                  mono
                />

                <DetailRow
                  label="Terminal / Gate"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Runway"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Weather"
                  value={<DataUnavailable />}
                />
              </InfoCard>

              <InfoCard
                icon={PlaneLanding}
                title="Arrival Station"
                subtitle={`${flightSummary.arrivalIata} / ${flightSummary.arrivalIcao}`}
              >
                <DetailRow
                  label="Airport"
                  value={
                    flightSummary.arrivalAirport
                  }
                />

                <DetailRow
                  label="Scheduled"
                  value={formatDateTime(
                    flightSummary.scheduledArrival
                  )}
                  mono
                />

                <DetailRow
                  label="Estimated"
                  value={formatDateTime(
                    flightSummary.estimatedArrival
                  )}
                  mono
                />

                <DetailRow
                  label="Actual"
                  value={formatDateTime(
                    flightSummary.actualArrival
                  )}
                  mono
                />

                <DetailRow
                  label="Terminal / Gate"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Baggage Belt"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Weather"
                  value={<DataUnavailable />}
                />
              </InfoCard>

              <InfoCard
                icon={Flight}
                title="Aircraft & Operator"
                subtitle={`${flightSummary.airline} (${flightSummary.airlineCode || "—"})`}
              >
                <DetailRow
                  label="Aircraft Model"
                  value={
                    flightSummary.aircraftModel
                  }
                />

                <DetailRow
                  label="Registration"
                  value={
                    flightSummary.registration
                  }
                  mono
                />

                <DetailRow
                  label="Callsign"
                  value={
                    flightSummary.callsign
                  }
                  mono
                />

                <DetailRow
                  label="Flight Status"
                  value={
                    flightSummary.statusLabel
                  }
                />

                <DetailRow
                  label="Aircraft Age"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Engine Configuration"
                  value={<DataUnavailable />}
                />

                <DetailRow
                  label="Cabin Layout"
                  value={<DataUnavailable />}
                />
              </InfoCard>
            </div>

            {/* Schedule / operational data */}
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Flight Schedule
                    </h3>

                    <p className="text-xs text-slate-500">
                      Times returned by AviationStack
                    </p>
                  </div>

                  <Timer
                    size={20}
                    className="text-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Departure Date
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatDate(
                        flightSummary.scheduledDeparture
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Arrival Date
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatDate(
                        flightSummary.scheduledArrival
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Scheduled Departure
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatTime(
                        flightSummary.scheduledDeparture
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Scheduled Arrival
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatTime(
                        flightSummary.scheduledArrival
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Actual Departure
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold text-emerald-700">
                      {formatTime(
                        flightSummary.actualDeparture
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Actual Arrival
                    </span>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatTime(
                        flightSummary.actualArrival
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Data Availability
                    </h3>

                    <p className="text-xs text-slate-500">
                      Fields exposed by the current API response
                    </p>
                  </div>

                  <Signal
                    size={20}
                    className="text-emerald-700"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    [
                      "Flight number",
                      getFlightNumber(flight),
                    ],
                    [
                      "Airline",
                      getAirlineName(flight),
                    ],
                    [
                      "Origin",
                      getDepartureIata(flight),
                    ],
                    [
                      "Destination",
                      getArrivalIata(flight),
                    ],
                    [
                      "Aircraft",
                      getAircraftModel(flight),
                    ],
                    [
                      "Registration",
                      getAircraftRegistration(
                        flight
                      ),
                    ],
                    [
                      "Flight status",
                      getFlightStatus(flight),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-500">
                        {label}
                      </span>

                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Check
                          size={15}
                          className="text-emerald-600"
                        />
                        {safe(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Unsupported original fields */}
            <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">
                  Additional Telemetry
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  The original HTML displayed these as live
                  values. They are intentionally not fabricated
                  because they are not present in the current
                  AviationStack flight payload.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {[
                  ["Altitude", Gauge],
                  ["Ground Speed", Navigation],
                  ["Position", MapPin],
                  ["Squawk", Signal],
                  ["Heading", Navigation],
                  ["Wind", Wind],
                  ["Temperature", Thermometer],
                  ["QNH", Gauge],
                  ["Runway", Plane],
                  ["Gate", MapPin],
                  ["Baggage", Download],
                  ["Wi-Fi", Wifi],
                ].map(([label, Icon]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <Icon
                      size={18}
                      className="mb-3 text-slate-400"
                    />

                    <p className="text-xs font-semibold text-slate-600">
                      {label}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Not available
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* API metadata */}
            <section className="rounded-xl bg-emerald-50 p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 font-mono font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    AviationStack Live Payload
                  </span>

                  <span className="text-slate-400">
                    ·
                  </span>

                  <span className="font-mono text-slate-700">
                    /v1/flights?flight_number=
                    {flightSummary.number}
                  </span>

                  <span className="text-slate-400">
                    ·
                  </span>

                  <span className="text-slate-500">
                    Last Updated:
                  </span>

                  <strong className="text-slate-800">
                    {lastUpdated
                      ? lastUpdated.toLocaleTimeString()
                      : "—"}
                  </strong>

                  <span className="text-slate-400">
                    ·
                  </span>

                  <span className="font-semibold text-emerald-700">
                    Data Status: Connected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fetchFlight(
                        flightSummary.number
                      )
                    }
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Fetch Sync
                  </button>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Download size={15} />
                    Export
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Printer size={15} />
                    Print
                  </button>
                </div>
              </div>
            </section>

            <p className="mt-4 text-center text-xs text-slate-400">
              Automatic refresh every{" "}
              {REFRESH_SECONDS} seconds
            </p>
          </>
        ) : (
          !error && (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <Plane
                  size={42}
                  className="mx-auto mb-4 text-slate-300"
                />

                <h2 className="font-semibold text-slate-700">
                  No flight selected
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Search for a flight number above.
                </p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}