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

  return words.map((word) => word[0]).join("").toUpperCase();
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
  iconClass = "text-[#005932]",
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8e4] shadow-sm p-5 relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#005932]/5 pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6f7a70]">
          {label}
        </span>

        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl leading-[48px] font-bold text-[#131e19]">
          {value}
        </span>
      </div>

      <div className="mt-2 text-xs text-[#3f4941]">
        {description}
      </div>
    </div>
  );
}

function AirlineAvatar({ airline }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#005932] text-white flex items-center justify-center font-bold text-xs shrink-0">
      {getInitials(airline.name)}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8e4] shadow-sm p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-7 w-20 rounded bg-[#e4f1e9]" />
        <div className="h-7 w-24 rounded-full bg-[#e4f1e9]" />
      </div>

      <div className="mt-5 h-6 w-48 rounded bg-[#e4f1e9]" />
      <div className="mt-2 h-4 w-32 rounded bg-[#e4f1e9]" />

      <div className="grid grid-cols-2 gap-2 mt-5">
        <div className="h-20 rounded-lg bg-[#eaf7ee]" />
        <div className="h-20 rounded-lg bg-[#eaf7ee]" />
      </div>

      <div className="mt-5 h-10 rounded-xl bg-[#e4f1e9]" />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="col-span-full bg-white rounded-xl border border-[#e2e8e4] p-12 text-center">
      <Search className="w-10 h-10 mx-auto text-[#6f7a70]" />

      <h3 className="mt-4 text-lg font-semibold text-[#131e19]">
        No airlines found
      </h3>

      <p className="mt-1 text-sm text-[#3f4941]">
        Try changing your search or clearing the current filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005932] text-white text-sm font-semibold hover:bg-[#087443]"
      >
        <X className="w-4 h-4" />
        Clear filters
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white border border-[#f1b8b3] rounded-xl p-8 text-center">
      <AlertCircle className="w-10 h-10 mx-auto text-[#ba1a1a]" />

      <h3 className="mt-4 text-lg font-semibold text-[#131e19]">
        Unable to load airline data
      </h3>

      <p className="mt-2 max-w-xl mx-auto text-sm text-[#3f4941]">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005932] text-white text-sm font-semibold hover:bg-[#087443]"
      >
        <RefreshCw className="w-4 h-4" />
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
    <div className="bg-white rounded-xl border border-[#e2e8e4] shadow-sm p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AirlineAvatar airline={airline} />

            <span className="bg-[#28332d] text-white font-mono text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
              {getDisplayCode(airline)}
            </span>
          </div>

          <span className="bg-[#eaf7ee] text-[#005932] text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
            {getDataBadge(airline)}
          </span>
        </div>

        <div>
          <h3 className="text-[18px] leading-6 font-semibold text-[#131e19] truncate">
            {airline.name}
          </h3>

          <p className="mt-1 text-xs text-[#6f7a70]">
            {getCountryLabel(airline.country)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#eaf7ee] p-2 rounded-lg">
          <div>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
              IATA
            </span>

            <p className="mt-1 font-mono text-xs font-bold text-[#131e19]">
              {airline.iata || "—"}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
              ICAO
            </span>

            <p className="mt-1 font-mono text-xs font-bold text-[#131e19]">
              {airline.icao || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#f7f9fb] rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-[#005932]" />

              <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
                ADD Routes
              </span>
            </div>

            <p className="mt-1 text-lg font-bold text-[#131e19]">
              {routeCount}
            </p>

            <span className="text-[11px] text-[#6f7a70]">
              API route records
            </span>
          </div>

          <div className="bg-[#f7f9fb] rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#005932]" />

              <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
                Live Flights
              </span>
            </div>

            <p className="mt-1 text-lg font-bold text-[#005932]">
              {liveCount}
            </p>

            <span className="text-[11px] text-[#6f7a70]">
              Current API response
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
            Callsign
          </span>

          <p className="font-mono text-xs font-bold text-[#131e19]">
            {airline.callsign || "Not provided by API"}
          </p>
        </div>

        {airline.hub && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
              Hub
            </span>

            <p className="text-sm font-medium text-[#131e19]">
              {airline.hub}
            </p>
          </div>
        )}
      </div>

      <div className="pt-5 mt-4 border-t border-[#e2e8e4]">
        <button
          type="button"
          onClick={() => onOpen(airline)}
          className="w-full py-2.5 px-3 bg-[#e4f1e9] hover:bg-[#deebe3] text-[#131e19] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          View airline details
          <ArrowRight className="w-4 h-4" />
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
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-[#0b1713] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AirlineAvatar airline={airline} />

            <div>
              <h2 className="text-xl font-bold">
                {airline.name}
              </h2>

              <p className="text-xs text-[#aab8b0]">
                {getDisplayCode(airline)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="mt-6 p-4 rounded-xl bg-[#eaf7ee] border border-[#becabe]">
            <div className="flex gap-3">
              <CloudOff className="w-5 h-5 text-[#6f7a70] shrink-0" />

              <div>
                <p className="text-sm font-semibold text-[#131e19]">
                  Data availability
                </p>

                <p className="mt-1 text-xs leading-5 text-[#3f4941]">
                  Alliance membership, punctuality, fleet size,
                  aircraft age, fleet composition and telemetry
                  are not assumed when they are not supplied by
                  the AviationStack response.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#f7f9fb] border-t border-[#e2e8e4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#005932] text-white text-sm font-semibold hover:bg-[#087443]"
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
    <div className="bg-[#f7f9fb] rounded-xl p-4">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-[#6f7a70]">
        {label}
      </span>

      <p
        className={`mt-1 text-sm font-semibold text-[#131e19] ${
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

  const [selectedAirline, setSelectedAirline] = useState(null);

  const [page, setPage] = useState(1);

  /*
    The original HTML had alliance and region filters.

    AviationStack's airline endpoint does not provide a reliable
    alliance classification, so alliance filtering is intentionally
    removed rather than inventing classifications.

    Region filtering below uses the airline's actual country field.
  */

  const loadData = useCallback(async (isRefresh = false) => {
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

      const airlineData = Array.isArray(airlineResponse?.data)
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
        const [departureRoutes, arrivalRoutes] =
          await Promise.all([
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
          ...(Array.isArray(departureRoutes?.data)
            ? departureRoutes.data
            : []),
          ...(Array.isArray(arrivalRoutes?.data)
            ? arrivalRoutes.data
            : []),
        ];
      } catch (routeError) {
        /*
          Airline data is still useful if routes are unavailable.
          Do not fail the entire directory.
          */
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
        const [departures, arrivals] = await Promise.all([
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
  }, []);

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

     We cannot safely infer the original UI's custom regions
     from incomplete airline data.

     Therefore the region buttons are based on actual countries
     represented in the API response.
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
      filteredAirlines.length / ITEMS_PER_PAGE
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
    <div className="min-h-screen bg-[#f7f9fb] text-[#131e19]">
      <main className="w-full">
        <div className="flex flex-col w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col gap-5 max-w-[1600px] mx-auto w-full">

            {/* ---------------------------------------------
                Page header
            --------------------------------------------- */}

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#febf27]" />

                  <span className="text-[11px] uppercase tracking-[0.06em] text-[#005932] font-semibold">
                    AviationStack Airline Registry
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#131e19]">
                  Airlines Directory
                </h1>

                <p className="text-sm text-[#3f4941] max-w-3xl">
                  Airline records available through the AviationStack
                  API, with current route and live-flight information
                  for {AIRPORT_CODE}.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#eaf7ee] px-3 py-2 rounded-xl border border-[#becabe]">
                <CheckCircle2 className="w-5 h-5 text-[#005932]" />

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-[#6f7a70] font-semibold">
                    Airport
                  </span>

                  <span className="font-mono text-xs font-bold text-[#131e19]">
                    {AIRPORT_CODE} / {AIRPORT_ICAO}
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------
                API status
            --------------------------------------------- */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#e2e8e4] rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#005932] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#005932]" />
                </span>

                <div>
                  <span className="text-sm font-semibold text-[#005932]">
                    AviationStack Connected
                  </span>

                  <span className="ml-2 text-xs text-[#6f7a70]">
                    {AIRPORT_NAME}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-[#6f7a70]">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e4f1e9] text-[#131e19] text-xs font-semibold hover:bg-[#deebe3] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                iconClass="text-[#7a5900]"
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
                iconClass="text-[#0043b5]"
              />
            </div>

            {/* ---------------------------------------------
                Search / filters
            --------------------------------------------- */}

            <div className="bg-white p-5 rounded-xl border border-[#e2e8e4] shadow-sm flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6f7a70]" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#eaf7ee] text-[#131e19] text-sm placeholder-[#6f7a70] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005932]/10 transition-all"
                  placeholder="Search airline by name, callsign, IATA, ICAO or country..."
                  type="text"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f7a70] hover:text-[#131e19]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-[#6f7a70] mr-1 font-semibold">
                    Country:
                  </span>

                  <button
                    type="button"
                    onClick={() => setRegion("all")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                      region === "all"
                        ? "bg-[#005932] text-white shadow-sm"
                        : "bg-[#e4f1e9] text-[#3f4941] hover:bg-[#deebe3]"
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
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                        region === country
                          ? "bg-[#28332d] text-white shadow-sm"
                          : "bg-[#e4f1e9] text-[#3f4941] hover:bg-[#deebe3]"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-[#6f7a70]">
                  {filteredAirlines.length} matching
                  airline
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div className="bg-white p-4 rounded-xl border border-[#e2e8e4] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-[#6f7a70]">
                    Showing{" "}
                    <strong className="text-[#131e19]">
                      {(page - 1) *
                        ITEMS_PER_PAGE +
                        1}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-[#131e19]">
                      {Math.min(
                        page * ITEMS_PER_PAGE,
                        filteredAirlines.length
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-[#131e19]">
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
                      className="p-2 rounded-lg bg-[#e4f1e9] text-[#131e19] hover:bg-[#deebe3] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 text-xs font-semibold">
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
                      className="p-2 rounded-lg bg-[#e4f1e9] text-[#131e19] hover:bg-[#deebe3] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            {/* ---------------------------------------------
                Data limitations / telemetry footer
            --------------------------------------------- */}

            <div className="bg-white p-5 rounded-xl border border-[#e2e8e4] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#005932]/10 flex items-center justify-center text-[#005932] shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#131e19]">
                    Live AviationStack Data
                  </span>

                  <span className="text-xs text-[#3f4941]">
                    Airline records, ADD routes and current
                    flight responses are loaded from the API.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-wide font-mono text-[#6f7a70]">
                  Refresh: {AUTO_REFRESH_SECONDS}s
                </span>

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  className="px-4 py-2 bg-[#e4f1e9] hover:bg-[#deebe3] text-[#131e19] rounded-xl text-xs font-semibold transition-all"
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