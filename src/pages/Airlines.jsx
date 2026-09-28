import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Plane,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  getAirlines,
  getRoutes,
  getLiveFlights,
} from "../services/aviationStack";

const AIRPORT_CODE =
  import.meta.env.VITE_AIRPORT_CODE || "ADD";

const AIRPORT_ICAO =
  import.meta.env.VITE_AIRPORT_ICAO || "HAAB";

const AIRPORT_NAME =
  import.meta.env.VITE_AIRPORT_NAME ||
  "Addis Ababa Bole International Airport";

const ITEMS_PER_PAGE = 9;
const AUTO_REFRESH_SECONDS = 60;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function getAirlineCode(airline) {
  return (
    airline?.iata_code ||
    airline?.iata ||
    airline?.airline_iata ||
    airline?.code ||
    ""
  );
}

function getAirlineIcao(airline) {
  return (
    airline?.icao_code ||
    airline?.icao ||
    airline?.airline_icao ||
    ""
  );
}

function getAirlineName(airline) {
  return (
    airline?.airline_name ||
    airline?.name ||
    airline?.airline?.name ||
    "Unknown airline"
  );
}

function getCallsign(airline) {
  return (
    airline?.callsign ||
    airline?.call_sign ||
    airline?.airline?.callsign ||
    ""
  );
}

function getCountry(airline) {
  return (
    airline?.country_name ||
    airline?.country ||
    airline?.country_code ||
    ""
  );
}

function getHub(airline) {
  return (
    airline?.hub ||
    airline?.hub_airport ||
    airline?.base_airport ||
    ""
  );
}

function getAirlineId(airline) {
  return (
    getAirlineIcao(airline) ||
    getAirlineCode(airline) ||
    getAirlineName(airline)
  );
}

function normalizeAirline(airline) {
  return {
    id: getAirlineId(airline),
    name: getAirlineName(airline),
    iata: getAirlineCode(airline),
    icao: getAirlineIcao(airline),
    callsign: getCallsign(airline),
    country: getCountry(airline),
    hub: getHub(airline),
    raw: airline,
  };
}

function normalizeRoute(route) {
  const airline = route?.airline || {};

  return {
    airlineIata:
      airline?.iata ||
      airline?.iata_code ||
      route?.airline_iata ||
      route?.airline?.iata_code ||
      "",

    airlineIcao:
      airline?.icao ||
      airline?.icao_code ||
      route?.airline_icao ||
      route?.airline?.icao_code ||
      "",

    airlineName:
      airline?.name ||
      airline?.airline_name ||
      route?.airline_name ||
      "",

    departure:
      route?.departure?.iata ||
      route?.departure?.airport ||
      route?.dep_iata ||
      "",

    arrival:
      route?.arrival?.iata ||
      route?.arrival?.airport ||
      route?.arr_iata ||
      "",
  };
}

function normalizeFlight(flight) {
  return {
    airlineName:
      flight?.airline?.name ||
      flight?.airline_name ||
      "",

    airlineIata:
      flight?.airline?.iata ||
      flight?.airline_iata ||
      "",

    airlineIcao:
      flight?.airline?.icao ||
      flight?.airline_icao ||
      "",

    status: flight?.flight_status || "",
  };
}

function getInitials(name) {
  if (!name) return "?";

  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getDisplayCode(airline) {
  const codes = [
    airline.iata,
    airline.icao,
  ].filter(Boolean);

  return codes.length ? codes.join(" · ") : "—";
}

function getCountryLabel(country) {
  if (!country) return "Country unavailable";

  return country;
}

function getRouteCount(routeMap, airline) {
  const keys = [
    airline.iata,
    airline.icao,
    airline.name.toLowerCase(),
  ].filter(Boolean);

  for (const key of keys) {
    if (routeMap.has(key)) {
      return routeMap.get(key);
    }
  }

  return 0;
}

function getLiveCount(liveMap, airline) {
  const keys = [
    airline.iata,
    airline.icao,
    airline.name.toLowerCase(),
  ].filter(Boolean);

  for (const key of keys) {
    if (liveMap.has(key)) {
      return liveMap.get(key);
    }
  }

  return 0;
}

/*
  AviationStack's Airlines response does not reliably provide:
  - alliance
  - punctuality percentage
  - fleet size
  - aircraft age
  - aircraft fleet types
  - terminal
  - ATC telemetry

  Therefore those values are deliberately NOT fabricated.
*/

function getDataBadge(airline) {
  if (airline.iata || airline.icao) {
    return "Verified API record";
  }

  return "API record";
}

/* -------------------------------------------------------
   Small UI components
------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "text-primary",
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/5" />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-light">
          {label}
        </span>

        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold leading-[48px] text-neutral">
          {value}
        </span>
      </div>

      <div className="mt-2 text-xs text-neutral-light">
        {description}
      </div>
    </div>
  );
}

function AirlineAvatar({ airline }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-dark text-xs font-bold text-white">
      {getInitials(airline.name)}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex justify-between">
        <div className="h-7 w-20 rounded bg-primary-light" />
        <div className="h-7 w-24 rounded-full bg-primary-light" />
      </div>

      <div className="mt-5 h-6 w-48 rounded bg-primary-light" />
      <div className="mt-2 h-4 w-32 rounded bg-primary-light" />

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="h-20 rounded-lg bg-primary-light" />
        <div className="h-20 rounded-lg bg-primary-light" />
      </div>

      <div className="mt-5 h-10 rounded-xl bg-primary-light" />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
      <Search className="mx-auto h-10 w-10 text-neutral-light" />

      <h3 className="mt-4 text-lg font-semibold text-neutral">
        No airlines found
      </h3>

      <p className="mt-1 text-sm text-neutral-light">
        Try changing your search or clearing the current filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
      >
        <X className="h-4 w-4" />
        Clear filters
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-surface p-8 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-danger" />

      <h3 className="mt-4 text-lg font-semibold text-neutral">
        Unable to load airline data
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-light">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function AirlineCard({
  airline,
  routeCount,
  liveCount,
  onOpen,
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <AirlineAvatar airline={airline} />

            <span className="whitespace-nowrap rounded bg-neutral/90 px-2 py-1 font-mono text-xs font-bold text-white">
              {getDisplayCode(airline)}
            </span>
          </div>

          <span className="whitespace-nowrap rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
            {getDataBadge(airline)}
          </span>
        </div>

        <div>
          <h3 className="truncate text-[18px] font-semibold leading-6 text-neutral">
            {airline.name}
          </h3>

          <p className="mt-1 text-xs text-neutral-light">
            {getCountryLabel(airline.country)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-primary-light p-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
              IATA
            </span>

            <p className="mt-1 font-mono text-xs font-bold text-neutral">
              {airline.iata || "—"}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
              ICAO
            </span>

            <p className="mt-1 font-mono text-xs font-bold text-neutral">
              {airline.icao || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background p-3">
            <div className="flex items-center gap-1.5">
              <Plane className="h-4 w-4 text-primary-dark" />

              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
                ADD Routes
              </span>
            </div>

            <p className="mt-1 text-lg font-bold text-neutral">
              {routeCount}
            </p>

            <span className="text-[11px] text-neutral-light">
              API route records
            </span>
          </div>

          <div className="rounded-lg bg-background p-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />

              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
                Live Flights
              </span>
            </div>

            <p className="mt-1 text-lg font-bold text-success">
              {liveCount}
            </p>

            <span className="text-[11px] text-neutral-light">
              Current API response
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
            Callsign
          </span>

          <p className="font-mono text-xs font-bold text-neutral">
            {airline.callsign || "Not provided by API"}
          </p>
        </div>

        {airline.hub && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
              Hub
            </span>

            <p className="text-sm font-medium text-neutral">
              {airline.hub}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => onOpen(airline)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm font-semibold text-neutral transition-all hover:bg-primary hover:text-white"
        >
          View airline details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AirlineDetailsModal({
  airline,
  routeCount,
  liveCount,
  onClose,
}) {
  if (!airline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between bg-neutral p-6 text-white">
          <div className="flex items-center gap-3">
            <AirlineAvatar airline={airline} />

            <div>
              <h2 className="text-xl font-bold">
                {airline.name}
              </h2>

              <p className="text-xs text-neutral-muted">
                {getDisplayCode(airline)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="Airline"
              value={airline.name}
            />

            <DetailItem
              label="Country"
              value={airline.country || "Not provided"}
            />

            <DetailItem
              label="IATA"
              value={airline.iata || "Not provided"}
              mono
            />

            <DetailItem
              label="ICAO"
              value={airline.icao || "Not provided"}
              mono
            />

            <DetailItem
              label="Callsign"
              value={airline.callsign || "Not provided"}
              mono
            />

            <DetailItem
              label="Hub"
              value={airline.hub || "Not provided"}
            />

            <DetailItem
              label="ADD route records"
              value={routeCount}
            />

            <DetailItem
              label="Current live flights"
              value={liveCount}
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-primary-light p-4">
            <div className="flex gap-3">
              <CloudOff className="h-5 w-5 shrink-0 text-neutral-light" />

              <div>
                <p className="text-sm font-semibold text-neutral">
                  Data availability
                </p>

                <p className="mt-1 text-xs leading-5 text-neutral-light">
                  Alliance membership, punctuality, fleet size,
                  aircraft age, fleet composition and telemetry
                  are not assumed when they are not supplied by
                  the AviationStack response.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-background px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="rounded-xl bg-background p-4">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
        {label}
      </span>

      <p
        className={`mt-1 text-sm font-semibold text-neutral ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   Main page
------------------------------------------------------- */

export default function Airlines() {
  const [airlines, setAirlines] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [liveFlights, setLiveFlights] = useState([]);

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedAirline, setSelectedAirline] =
    useState(null);

  const [page, setPage] = useState(1);

  /*
    The original HTML had alliance and region filters.

    AviationStack's airline endpoint does not provide a reliable
    alliance classification, so alliance filtering is intentionally
    removed rather than inventing classifications.

    Region filtering below uses the airline's actual country field.
  */

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
          1. Airline directory
        */

        const airlineResponse = await getAirlines({
          limit: 100,
        });

        const airlineData = Array.isArray(
          airlineResponse?.data
        )
          ? airlineResponse.data
          : [];

        /*
          2. Routes involving ADD

          We use both directions because an airline may operate:
          ADD -> destination
          destination -> ADD
        */

        let routeData = [];

        try {
          const [
            departureRoutes,
            arrivalRoutes,
          ] = await Promise.all([
            getRoutes({
              depIata: AIRPORT_CODE,
              limit: 100,
            }),

            getRoutes({
              arrIata: AIRPORT_CODE,
              limit: 100,
            }),
          ]);

          routeData = [
            ...(Array.isArray(
              departureRoutes?.data
            )
              ? departureRoutes.data
              : []),

            ...(Array.isArray(
              arrivalRoutes?.data
            )
              ? arrivalRoutes.data
              : []),
          ];
        } catch (routeError) {
          console.warn(
            "Unable to load ADD route data:",
            routeError
          );
        }

        /*
          3. Current live flights around ADD

          This gives us a real, current signal for operators
          represented in the live response.
        */

        let liveData = [];

        try {
          const [
            departures,
            arrivals,
          ] = await Promise.all([
            getLiveFlights({
              depIata: AIRPORT_CODE,
              limit: 100,
            }),

            getLiveFlights({
              arrIata: AIRPORT_CODE,
              limit: 100,
            }),
          ]);

          liveData = [
            ...(Array.isArray(departures?.data)
              ? departures.data
              : []),

            ...(Array.isArray(arrivals?.data)
              ? arrivals.data
              : []),
          ];
        } catch (liveError) {
          console.warn(
            "Unable to load live ADD flights:",
            liveError
          );
        }

        const normalizedAirlines = airlineData
          .map(normalizeAirline)
          .filter(
            (airline) =>
              airline.name &&
              airline.name !== "Unknown airline"
          );

        setAirlines(normalizedAirlines);
        setRoutes(routeData);
        setLiveFlights(liveData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "AviationStack returned an unexpected response."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      loadData(true);
    }, AUTO_REFRESH_SECONDS * 1000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  /* -------------------------------------------------------
     Route statistics
  ------------------------------------------------------- */

  const routeMap = useMemo(() => {
    const map = new Map();

    routes
      .map(normalizeRoute)
      .forEach((route) => {
        const keys = [
          route.airlineIata,
          route.airlineIcao,
          route.airlineName?.toLowerCase(),
        ].filter(Boolean);

        keys.forEach((key) => {
          map.set(
            key,
            (map.get(key) || 0) + 1
          );
        });
      });

    return map;
  }, [routes]);

  /* -------------------------------------------------------
     Live-flight statistics
  ------------------------------------------------------- */

  const liveMap = useMemo(() => {
    const map = new Map();

    liveFlights
      .map(normalizeFlight)
      .forEach((flight) => {
        const keys = [
          flight.airlineIata,
          flight.airlineIcao,
          flight.airlineName?.toLowerCase(),
        ].filter(Boolean);

        keys.forEach((key) => {
          map.set(
            key,
            (map.get(key) || 0) + 1
          );
        });
      });

    return map;
  }, [liveFlights]);

  /* -------------------------------------------------------
     Countries / region filter
  ------------------------------------------------------- */

  const countries = useMemo(() => {
    return [
      ...new Set(
        airlines
          .map((airline) => airline.country)
          .filter(Boolean)
      ),
    ].sort();
  }, [airlines]);

  const regionOptions = useMemo(() => {
    return countries.slice(0, 8);
  }, [countries]);

  /* -------------------------------------------------------
     Search + filters
  ------------------------------------------------------- */

  const filteredAirlines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return airlines.filter((airline) => {
      const searchableText = [
        airline.name,
        airline.iata,
        airline.icao,
        airline.callsign,
        airline.country,
        airline.hub,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesRegion =
        region === "all" ||
        airline.country?.toLowerCase() ===
          region.toLowerCase();

      return matchesSearch && matchesRegion;
    });
  }, [airlines, search, region]);

  useEffect(() => {
    setPage(1);
  }, [search, region]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAirlines.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedAirlines = useMemo(() => {
    const start =
      (page - 1) * ITEMS_PER_PAGE;

    return filteredAirlines.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredAirlines, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* -------------------------------------------------------
     Header statistics
  ------------------------------------------------------- */

  const operatorsWithAddRoutes = useMemo(() => {
    return airlines.filter(
      (airline) =>
        getRouteCount(routeMap, airline) > 0
    ).length;
  }, [airlines, routeMap]);

  const totalAddRoutes = routes.length;

  const totalLiveFlights = liveFlights.length;

  const resetFilters = () => {
    setSearch("");
    setRegion("all");
    setPage(1);
  };

  const openAirline = (airline) => {
    setSelectedAirline(airline);
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background text-neutral">
      <main className="w-full">
        <div className="flex w-full flex-col">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">

            {/* ---------------------------------------------
                Page header
            --------------------------------------------- */}

            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-secondary" />

                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-dark">
                    AviationStack Airline Registry
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-neutral sm:text-3xl">
                  Airlines Directory
                </h1>

                <p className="max-w-3xl text-sm text-neutral-light">
                  Airline records available through the
                  AviationStack API, with current route and
                  live-flight information for {AIRPORT_CODE}.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-primary-light px-3 py-2">
                <CheckCircle2 className="h-5 w-5 text-primary-dark" />

                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-light">
                    Airport
                  </span>

                  <span className="font-mono text-xs font-bold text-neutral">
                    {AIRPORT_CODE} / {AIRPORT_ICAO}
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------
                API status
            --------------------------------------------- */}

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>

                <div>
                  <span className="text-sm font-semibold text-success">
                    AviationStack Connected
                  </span>

                  <span className="ml-2 text-xs text-neutral-light">
                    {AIRPORT_NAME}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-neutral-light">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-semibold text-neutral hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />

                  Refresh
                </button>
              </div>
            </div>

            {/* ---------------------------------------------
                Statistics
            --------------------------------------------- */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                icon={Users}
                label="Airline Records"
                value={loading ? "—" : airlines.length}
                description="Airlines returned by AviationStack"
              />

              <StatCard
                icon={Plane}
                label="ADD Operators"
                value={
                  loading
                    ? "—"
                    : operatorsWithAddRoutes
                }
                description="Airlines represented in ADD route data"
                iconClass="text-warning"
              />

              <StatCard
                icon={Building2}
                label="ADD Route Records"
                value={
                  loading
                    ? "—"
                    : totalAddRoutes
                }
                description="Routes returned for ADD"
                iconClass="text-info"
              />
            </div>

            {/* ---------------------------------------------
                Search / filters
            --------------------------------------------- */}

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-light" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-border bg-primary-light pl-10 pr-10 text-sm text-neutral placeholder:text-neutral-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Search airline by name, callsign, IATA, ICAO or country..."
                  type="text"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-light hover:text-neutral"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-light">
                    Country:
                  </span>

                  <button
                    type="button"
                    onClick={() => setRegion("all")}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                      region === "all"
                        ? "bg-primary-dark text-white shadow-sm"
                        : "bg-primary-light text-neutral-light hover:bg-primary hover:text-white"
                    }`}
                  >
                    All
                  </button>

                  {regionOptions.map((country) => (
                    <button
                      type="button"
                      key={country}
                      onClick={() =>
                        setRegion(country)
                      }
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                        region === country
                          ? "bg-neutral text-white shadow-sm"
                          : "bg-primary-light text-neutral-light hover:bg-primary hover:text-white"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-neutral-light">
                  {filteredAirlines.length} matching airline
                  {filteredAirlines.length === 1
                    ? ""
                    : "s"}
                </div>
              </div>
            </div>

            {/* ---------------------------------------------
                Error
            --------------------------------------------- */}

            {error && (
              <ErrorState
                message={error}
                onRetry={() => loadData()}
              />
            )}

            {/* ---------------------------------------------
                Cards
            --------------------------------------------- */}

            {!error && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <LoadingCard key={index} />
                  ))
                ) : paginatedAirlines.length === 0 ? (
                  <EmptyState
                    onReset={resetFilters}
                  />
                ) : (
                  paginatedAirlines.map((airline) => (
                    <AirlineCard
                      key={airline.id}
                      airline={airline}
                      routeCount={getRouteCount(
                        routeMap,
                        airline
                      )}
                      liveCount={getLiveCount(
                        liveMap,
                        airline
                      )}
                      onOpen={openAirline}
                    />
                  ))
                )}
              </div>
            )}

            {/* ---------------------------------------------
                Pagination
            --------------------------------------------- */}

            {!loading &&
              !error &&
              filteredAirlines.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row">
                  <span className="text-xs text-neutral-light">
                    Showing{" "}
                    <strong className="text-neutral">
                      {(page - 1) *
                        ITEMS_PER_PAGE +
                        1}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-neutral">
                      {Math.min(
                        page * ITEMS_PER_PAGE,
                        filteredAirlines.length
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-neutral">
                      {filteredAirlines.length}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                        )
                      }
                      className="rounded-lg bg-primary-light p-2 text-neutral hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="px-3 text-xs font-semibold text-neutral">
                      Page {page} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                        )
                      }
                      className="rounded-lg bg-primary-light p-2 text-neutral hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

            {/* ---------------------------------------------
                Data limitations / telemetry footer
            --------------------------------------------- */}

            <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <RefreshCw className="h-5 w-5" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral">
                    Live AviationStack Data
                  </span>

                  <span className="text-xs text-neutral-light">
                    Airline records, ADD routes and current
                    flight responses are loaded from the API.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-light">
                  Refresh: {AUTO_REFRESH_SECONDS}s
                </span>

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  className="rounded-xl bg-primary-light px-4 py-2 text-xs font-semibold text-neutral transition-all hover:bg-primary hover:text-white"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------------------------------------------
          Modal
      --------------------------------------------- */}

      <AirlineDetailsModal
        airline={selectedAirline}
        routeCount={
          selectedAirline
            ? getRouteCount(
                routeMap,
                selectedAirline
              )
            : 0
        }
        liveCount={
          selectedAirline
            ? getLiveCount(
                liveMap,
                selectedAirline
              )
            : 0
        }
        onClose={() =>
          setSelectedAirline(null)
        }
      />
    </div>
  );
}