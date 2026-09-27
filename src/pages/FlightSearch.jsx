import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileJson,
  Filter,
  Info,
  MapPin,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { getLiveFlights } from "../services/aviationStack";

const PAGE_SIZE = 5;

/* -------------------------------------------------------------------------- */
/* Demo data                                                                   */
/* -------------------------------------------------------------------------- */

const DEMO_FLIGHTS = [
  {
    _demo: true,
    flight_status: "scheduled",
    flight: {
      iata: "ET302",
      icao: "ETH302",
      number: "302",
    },
    airline: {
      name: "Ethiopian Airlines",
      iata: "ET",
      icao: "ETH",
    },
    departure: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "2",
      gate: "A4",
      scheduled: "2026-09-27T10:00:00+00:00",
      estimated: "2026-09-27T10:10:00+00:00",
    },
    arrival: {
      airport: "Jomo Kenyatta International Airport",
      iata: "NBO",
      icao: "HKJK",
      terminal: "1",
      gate: "B12",
      scheduled: "2026-09-27T12:05:00+00:00",
      estimated: "2026-09-27T12:15:00+00:00",
    },
    aircraft: {
      registration: "ET-ABC",
      iata: "B738",
      icao: "B738",
    },
  },

  {
    _demo: true,
    flight_status: "active",
    flight: {
      iata: "ET603",
      icao: "ETH603",
      number: "603",
    },
    airline: {
      name: "Ethiopian Airlines",
      iata: "ET",
      icao: "ETH",
    },
    departure: {
      airport: "Dubai International Airport",
      iata: "DXB",
      icao: "OMDB",
      terminal: "3",
      gate: "B28",
      scheduled: "2026-09-27T17:20:00+00:00",
      estimated: "2026-09-27T17:20:00+00:00",
    },
    arrival: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "2",
      gate: "E6",
      scheduled: "2026-09-27T20:25:00+00:00",
      estimated: "2026-09-27T20:35:00+00:00",
    },
    aircraft: {
      registration: "ET-AUO",
      iata: "B789",
      icao: "B789",
    },
  },

  {
    _demo: true,
    flight_status: "scheduled",
    flight: {
      iata: "QR1427",
      icao: "QTR1427",
      number: "1427",
    },
    airline: {
      name: "Qatar Airways",
      iata: "QR",
      icao: "QTR",
    },
    departure: {
      airport: "Hamad International Airport",
      iata: "DOH",
      icao: "OTHH",
      terminal: "1",
      gate: "C14",
      scheduled: "2026-09-27T08:40:00+00:00",
      estimated: "2026-09-27T08:50:00+00:00",
    },
    arrival: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "2",
      gate: "F2",
      scheduled: "2026-09-27T11:35:00+00:00",
      estimated: "2026-09-27T11:45:00+00:00",
    },
    aircraft: {
      registration: "A7-ABC",
      iata: "A320",
      icao: "A320",
    },
  },

  {
    _demo: true,
    flight_status: "delayed",
    flight: {
      iata: "KQ401",
      icao: "KQA401",
      number: "401",
    },
    airline: {
      name: "Kenya Airways",
      iata: "KQ",
      icao: "KQA",
    },
    departure: {
      airport: "Jomo Kenyatta International Airport",
      iata: "NBO",
      icao: "HKJK",
      terminal: "1",
      gate: "C8",
      scheduled: "2026-09-27T13:30:00+00:00",
      estimated: "2026-09-27T14:05:00+00:00",
    },
    arrival: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "2",
      gate: "D5",
      scheduled: "2026-09-27T15:30:00+00:00",
      estimated: "2026-09-27T16:05:00+00:00",
    },
    aircraft: {
      registration: "5Y-XYZ",
      iata: "B738",
      icao: "B738",
    },
  },

  {
    _demo: true,
    flight_status: "landed",
    flight: {
      iata: "SV411",
      icao: "SVA411",
      number: "411",
    },
    airline: {
      name: "Saudia",
      iata: "SV",
      icao: "SVA",
    },
    departure: {
      airport: "King Abdulaziz International Airport",
      iata: "JED",
      icao: "OEJN",
      terminal: "1",
      gate: "B2",
      scheduled: "2026-09-27T05:20:00+00:00",
      actual: "2026-09-27T05:25:00+00:00",
    },
    arrival: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "2",
      gate: "B2",
      scheduled: "2026-09-27T08:20:00+00:00",
      actual: "2026-09-27T08:28:00+00:00",
    },
    aircraft: {
      registration: "HZ-ABC",
      iata: "A320",
      icao: "A320",
    },
  },

  {
    _demo: true,
    flight_status: "scheduled",
    flight: {
      iata: "ET908",
      icao: "ETH908",
      number: "908",
    },
    airline: {
      name: "Ethiopian Airlines",
      iata: "ET",
      icao: "ETH",
    },
    departure: {
      airport: "Bole International Airport",
      iata: "ADD",
      icao: "HAAB",
      terminal: "1",
      gate: "C3",
      scheduled: "2026-09-27T15:10:00+00:00",
    },
    arrival: {
      airport: "Lagos Murtala Muhammed International Airport",
      iata: "LOS",
      icao: "DNMM",
      terminal: "2",
      gate: "A6",
      scheduled: "2026-09-27T19:15:00+00:00",
    },
    aircraft: {
      registration: "ET-ABC",
      iata: "B788",
      icao: "B788",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight_iata ||
    flight?.flight?.icao ||
    flight?.flight_icao ||
    flight?.flight?.number ||
    flight?.flight_number ||
    "Unknown"
  );
}

function getAirlineName(flight) {
  return (
    flight?.airline?.name ||
    flight?.airline_name ||
    flight?.airline?.iata ||
    "Unknown airline"
  );
}

function getAirlineIata(flight) {
  return flight?.airline?.iata || flight?.airline_iata || "—";
}

function getAirlineIcao(flight) {
  return flight?.airline?.icao || flight?.airline_icao || "—";
}

function getStatus(flight) {
  const status = flight?.flight_status || flight?.status;

  if (!status) return "Unknown";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusKey(flight) {
  return String(
    flight?.flight_status || flight?.status || "unknown"
  ).toLowerCase();
}

function getAirportCode(airport) {
  return (
    airport?.iata ||
    airport?.icao ||
    airport?.airport ||
    airport?.name ||
    "—"
  );
}

function getAirportName(airport) {
  return (
    airport?.airport ||
    airport?.name ||
    airport?.iata ||
    airport?.icao ||
    "Unknown airport"
  );
}

function getAircraftType(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    flight?.aircraft?.type ||
    flight?.aircraft_iata ||
    "—"
  );
}

function getRegistration(flight) {
  return (
    flight?.aircraft?.registration ||
    flight?.registration ||
    "—"
  );
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getBestArrivalTime(flight) {
  return (
    flight?.arrival?.actual ||
    flight?.arrival?.estimated ||
    flight?.arrival?.scheduled ||
    null
  );
}

function getBestDepartureTime(flight) {
  return (
    flight?.departure?.actual ||
    flight?.departure?.estimated ||
    flight?.departure?.scheduled ||
    null
  );
}

function isQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("429") ||
    message.includes("monthly usage limit") ||
    message.includes("usage limit has been reached") ||
    message.includes("upgrade your subscription plan")
  );
}

function getQueryDescription(searchType, search) {
  if (searchType === "flight") {
    return search.flightNumber || "flight";
  }

  if (searchType === "airport") {
    return search.airport || "airport";
  }

  return `${search.departure || "origin"} → ${search.arrival || "destination"}`;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function FlightSearch() {
  const [searchType, setSearchType] = useState("route");

  const [search, setSearch] = useState({
    departure: "ADD",
    arrival: "",
    flightNumber: "",
    airport: "",
    flightDate: "",
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [demoMode, setDemoMode] = useState(false);
  const [demoReason, setDemoReason] = useState("");

  const [selectedFlight, setSelectedFlight] = useState(null);

  const [page, setPage] = useState(1);

  const [airlineFilter, setAirlineFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [lastUpdated, setLastUpdated] = useState(null);

  /* ------------------------------------------------------------------------ */
  /* Search parameters                                                        */
  /* ------------------------------------------------------------------------ */

  function buildQueryParams() {
    const params = {
      limit: 100,
      offset: 0,
    };

    if (searchType === "route") {
      if (search.departure.trim()) {
        params.depIata = search.departure.trim().toUpperCase();
      }

      if (search.arrival.trim()) {
        params.arrIata = search.arrival.trim().toUpperCase();
      }
    }

    if (searchType === "flight") {
      if (search.flightNumber.trim()) {
        params.flightNumber = search.flightNumber.trim().toUpperCase();
      }
    }

    if (searchType === "airport") {
      if (search.airport.trim()) {
        params.depIata = search.airport.trim().toUpperCase();
      }
    }

    if (search.flightDate) {
      params.flightDate = search.flightDate;
    }

    return params;
  }

  /* ------------------------------------------------------------------------ */
  /* Demo filtering                                                           */
  /* ------------------------------------------------------------------------ */

  function filterDemoFlights() {
    const departure = search.departure.trim().toUpperCase();
    const arrival = search.arrival.trim().toUpperCase();
    const flightNumber = search.flightNumber.trim().toUpperCase();
    const airport = search.airport.trim().toUpperCase();

    return DEMO_FLIGHTS.filter((flight) => {
      const flightNo = getFlightNumber(flight).toUpperCase();
      const dep = getAirportCode(flight.departure).toUpperCase();
      const arr = getAirportCode(flight.arrival).toUpperCase();
      const airline = getAirlineName(flight).toLowerCase();

      if (searchType === "flight") {
        if (!flightNumber) return true;

        return (
          flightNo.includes(flightNumber) ||
          flight?.flight?.number?.toUpperCase() === flightNumber
        );
      }

      if (searchType === "airport") {
        if (!airport) return true;

        return (
          dep.includes(airport) ||
          arr.includes(airport)
        );
      }

      const matchesDeparture =
        !departure || dep === departure;

      const matchesArrival =
        !arrival || arr === arrival;

      return matchesDeparture && matchesArrival;
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Search                                                                    */
  /* ------------------------------------------------------------------------ */

  async function handleSearch(event) {
    event?.preventDefault();

    setLoading(true);
    setError("");
    setSelectedFlight(null);
    setPage(1);

    try {
      const data = await getLiveFlights(buildQueryParams());

      const liveFlights = Array.isArray(data?.data)
        ? data.data
        : [];

      setFlights(liveFlights);
      setDemoMode(false);
      setDemoReason("");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Flight search failed:", err);

      if (isQuotaError(err)) {
        const demoFlights = filterDemoFlights();

        setFlights(demoFlights);
        setDemoMode(true);

        setDemoReason(
          "AviationStack returned HTTP 429 because the monthly API usage limit has been reached."
        );

        setError("");

        setLastUpdated(new Date());
      } else {
        setFlights([]);
        setDemoMode(false);
        setError(
          err?.message ||
            "Unable to retrieve flight data from AviationStack."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Initial request                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    handleSearch();
    // Initial page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Filtering                                                                 */
  /* ------------------------------------------------------------------------ */

  const airlines = useMemo(() => {
    const values = flights
      .map((flight) => getAirlineName(flight))
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [flights]);

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const airline = getAirlineName(flight);
      const status = getStatusKey(flight);

      const matchesAirline =
        airlineFilter === "all" ||
        airline === airlineFilter;

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return matchesAirline && matchesStatus;
    });
  }, [flights, airlineFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFlights.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleFlights = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredFlights.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredFlights, currentPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* ------------------------------------------------------------------------ */
  /* Search input helpers                                                     */
  /* ------------------------------------------------------------------------ */

  function updateSearch(field, value) {
    setSearch((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function swapRoute() {
    setSearch((current) => ({
      ...current,
      departure: current.arrival,
      arrival: current.departure,
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Export                                                                    */
  /* ------------------------------------------------------------------------ */

  function exportJSON() {
    const filename = `aerotrack-flights-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    downloadFile(
      filename,
      JSON.stringify(filteredFlights, null, 2),
      "application/json"
    );
  }

  function exportCSV() {
    const rows = filteredFlights.map((flight) => ({
      flight: getFlightNumber(flight),
      airline: getAirlineName(flight),
      departure: getAirportCode(flight.departure),
      arrival: getAirportCode(flight.arrival),
      departureTime: getBestDepartureTime(flight),
      arrivalTime: getBestArrivalTime(flight),
      status: getStatus(flight),
      aircraft: getAircraftType(flight),
      registration: getRegistration(flight),
      demo: Boolean(flight?._demo),
    }));

    const headers = Object.keys(rows[0] || {
      flight: "",
      airline: "",
      departure: "",
      arrival: "",
      departureTime: "",
      arrivalTime: "",
      status: "",
      aircraft: "",
      registration: "",
      demo: "",
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(row[header] ?? "")
              .replaceAll('"', '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const filename = `aerotrack-flights-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    downloadFile(filename, csv, "text/csv;charset=utf-8");
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#005932] text-white shadow-sm">
                <Plane className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Flight Search
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Search and inspect flight information from AviationStack.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {demoMode ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                <ShieldAlert className="h-3.5 w-3.5" />
                Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live AviationStack
              </span>
            )}
          </div>
        </div>

        {/* Demo mode banner */}
        {demoMode && (
          <div className="mb-6 overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-amber-900">
                    DEMO DATA MODE
                  </h2>

                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    Not Live
                  </span>
                </div>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  AviationStack could not provide live results because its
                  monthly API usage limit has been reached. The page is
                  displaying clearly labeled local demo flights so you can
                  continue testing the search and flight-detail interface.
                </p>

                <p className="mt-2 text-xs text-amber-700">
                  {demoReason}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Try Live Again
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !demoMode && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h3 className="font-semibold text-red-900">
                  AviationStack connection error
                </h3>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Card */}
        <form
          onSubmit={handleSearch}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          {/* Search type */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["route", "Route Search"],
              ["flight", "Flight Number"],
              ["airport", "Airport"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSearchType(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  searchType === value
                    ? "bg-[#005932] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr_auto]">
            {searchType === "route" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Departure
                  </label>

                  <div className="relative">
                    <PlaneTakeoff className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={search.departure}
                      onChange={(e) =>
                        updateSearch(
                          "departure",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="ADD"
                      maxLength={4}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 font-mono text-sm font-semibold uppercase outline-none transition focus:border-[#005932] focus:ring-2 focus:ring-[#005932]/10"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={swapRoute}
                  className="mt-6 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-[#005932]"
                  title="Swap route"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Arrival
                  </label>

                  <div className="relative">
                    <PlaneLanding className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={search.arrival}
                      onChange={(e) =>
                        updateSearch(
                          "arrival",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="NBO"
                      maxLength={4}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 font-mono text-sm font-semibold uppercase outline-none transition focus:border-[#005932] focus:ring-2 focus:ring-[#005932]/10"
                    />
                  </div>
                </div>
              </>
            )}

            {searchType === "flight" && (
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Flight Number
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search.flightNumber}
                    onChange={(e) =>
                      updateSearch(
                        "flightNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="ET302"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 font-mono text-sm font-semibold uppercase outline-none transition focus:border-[#005932] focus:ring-2 focus:ring-[#005932]/10"
                  />
                </div>
              </div>
            )}

            {searchType === "airport" && (
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Airport IATA / ICAO
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search.airport}
                    onChange={(e) =>
                      updateSearch(
                        "airport",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="ADD"
                    maxLength={4}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 font-mono text-sm font-semibold uppercase outline-none transition focus:border-[#005932] focus:ring-2 focus:ring-[#005932]/10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Date
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="date"
                  value={search.flightDate}
                  onChange={(e) =>
                    updateSearch("flightDate", e.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#005932] focus:ring-2 focus:ring-[#005932]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#005932] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#004a2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />

              {loading ? "Searching..." : "Search Flights"}
            </button>
          </div>
        </form>

        {/* Result summary */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Flight Results
              </h2>

              {demoMode && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Demo
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {filteredFlights.length} result
              {filteredFlights.length === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-slate-700">
                {getQueryDescription(searchType, search)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                Updated {formatTime(lastUpdated)}
              </span>
            )}

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Sync
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={!filteredFlights.length}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>

            <button
              type="button"
              onClick={exportJSON}
              disabled={!filteredFlights.length}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileJson className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <select
            value={airlineFilter}
            onChange={(e) => {
              setAirlineFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#005932]"
          >
            <option value="all">All Airlines</option>

            {airlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#005932]"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="en-route">En Route</option>
            <option value="landed">Landed</option>
            <option value="delayed">Delayed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(airlineFilter !== "all" ||
            statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setAirlineFilter("all");
                setStatusFilter("all");
                setPage(1);
              }}
              className="text-sm font-semibold text-[#005932] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#005932]" />

            <p className="mt-4 font-semibold text-slate-800">
              Loading flight data...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Connecting to AviationStack.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {visibleFlights.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Flight
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Airline
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Route
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Aircraft
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Departure
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Arrival
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {visibleFlights.map((flight, index) => (
                        <FlightRow
                          key={`${getFlightNumber(flight)}-${index}`}
                          flight={flight}
                          onView={() => setSelectedFlight(flight)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredFlights.length === 0
                        ? 0
                        : (currentPage - 1) * PAGE_SIZE + 1}
                    </span>
                    {" – "}
                    <span className="font-semibold text-slate-700">
                      {Math.min(
                        currentPage * PAGE_SIZE,
                        filteredFlights.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredFlights.length}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setPage((value) => Math.max(1, value - 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-[80px] text-center text-sm font-semibold text-slate-600">
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((value) =>
                          Math.min(totalPages, value + 1)
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                demoMode={demoMode}
                onRetry={handleSearch}
              />
            )}
          </>
        )}

        {/* Informational note */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

            <div>
              <h3 className="font-semibold text-slate-800">
                Flight data availability
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Flight details shown here are limited to fields returned by
                the AviationStack response. Live coordinates, altitude,
                heading, speed, radar frequency, baggage carousel and other
                telemetry are not invented when the API does not provide
                them.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Flight detail modal */}
      {selectedFlight && (
        <FlightDetailsModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Flight row                                                                  */
/* -------------------------------------------------------------------------- */

function FlightRow({ flight, onView }) {
  const flightNumber = getFlightNumber(flight);
  const airline = getAirlineName(flight);
  const airlineIata = getAirlineIata(flight);

  const departure = flight?.departure || {};
  const arrival = flight?.arrival || {};

  const status = getStatus(flight);
  const statusKey = getStatusKey(flight);

  const aircraft = getAircraftType(flight);
  const registration = getRegistration(flight);

  return (
    <tr
      onClick={onView}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onView();
        }
      }}
      tabIndex={0}
      className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900">
            {flightNumber}
          </span>

          {flight?._demo && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
              Demo
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#005932] text-[10px] font-bold text-white">
            {airlineIata !== "—"
              ? airlineIata
              : airline.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">
              {airline}
            </div>

            <div className="text-xs text-slate-400">
              {airlineIata}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div>
            <div className="font-mono text-sm font-bold text-slate-800">
              {getAirportCode(departure)}
            </div>

            <div className="max-w-[150px] truncate text-xs text-slate-400">
              {getAirportName(departure)}
            </div>
          </div>

          <ArrowLeftRight className="h-4 w-4 shrink-0 text-slate-300" />

          <div>
            <div className="font-mono text-sm font-bold text-slate-800">
              {getAirportCode(arrival)}
            </div>

            <div className="max-w-[150px] truncate text-xs text-slate-400">
              {getAirportName(arrival)}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="font-mono text-sm font-semibold text-slate-700">
          {aircraft}
        </div>

        <div className="mt-0.5 text-xs text-slate-400">
          {registration}
        </div>
      </td>

      <td className="px-4 py-4 text-right">
        <div className="font-mono text-sm font-semibold text-slate-700">
          {formatTime(
            departure.actual ||
              departure.estimated ||
              departure.scheduled
          )}
        </div>

        <div className="mt-0.5 text-xs text-slate-400">
          {departure.actual
            ? "Actual"
            : departure.estimated
            ? "Estimated"
            : "Scheduled"}
        </div>
      </td>

      <td className="px-4 py-4 text-right">
        <div className="font-mono text-sm font-semibold text-slate-700">
          {formatTime(
            arrival.actual ||
              arrival.estimated ||
              arrival.scheduled
          )}
        </div>

        <div className="mt-0.5 text-xs text-slate-400">
          {arrival.actual
            ? "Actual"
            : arrival.estimated
            ? "Estimated"
            : "Scheduled"}
        </div>
      </td>

      <td className="px-4 py-4 text-center">
        <StatusBadge
          status={status}
          statusKey={statusKey}
        />
      </td>

      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#005932] hover:text-white"
        >
          View Flight
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Status badge                                                                */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status, statusKey }) {
  const styles = {
    scheduled:
      "bg-blue-50 text-blue-700 border-blue-200",
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    "en-route":
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    landed:
      "bg-slate-100 text-slate-700 border-slate-200",
    delayed:
      "bg-amber-50 text-amber-700 border-amber-200",
    cancelled:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        styles[statusKey] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="mr-1.5 mt-1 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({ demoMode, onRetry }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Plane className="h-6 w-6 text-slate-400" />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        No flights found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {demoMode
          ? "There are no matching demo flights for this search."
          : "Try another flight number, airport, route, or date."}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#005932] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#004a2a]"
      >
        <RefreshCw className="h-4 w-4" />
        Search Again
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Flight details modal                                                        */
/* -------------------------------------------------------------------------- */

function FlightDetailsModal({ flight, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  const departure = flight?.departure || {};
  const arrival = flight?.arrival || {};
  const airline = flight?.airline || {};
  const aircraft = flight?.aircraft || {};

  const status = getStatus(flight);
  const statusKey = getStatusKey(flight);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl font-bold text-slate-900">
                {getFlightNumber(flight)}
              </span>

              {flight?._demo && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  <ShieldAlert className="h-3 w-3" />
                  Demo Data
                </span>
              )}

              <StatusBadge
                status={status}
                statusKey={statusKey}
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {airline?.name ||
                airline?.iata ||
                "Unknown airline"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close flight details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {flight?._demo && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <p className="font-semibold text-amber-900">
                    This flight is demo data
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    It is being displayed because AviationStack's monthly
                    usage quota has been reached. These values are local
                    development data and are not a live flight feed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Route */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <DetailAirport
                icon={<PlaneTakeoff className="h-5 w-5" />}
                label="Departure"
                airport={departure}
              />

              <div className="hidden h-px w-20 bg-slate-300 md:block" />

              <DetailAirport
                icon={<PlaneLanding className="h-5 w-5" />}
                label="Arrival"
                airport={arrival}
              />
            </div>
          </section>

          {/* Timing */}
          <section className="mt-5">
            <SectionTitle
              icon={<Clock3 className="h-4 w-4" />}
              title="Schedule"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Departure Scheduled"
                value={formatDateTime(
                  departure.scheduled
                )}
              />

              <DetailItem
                label="Departure Estimated"
                value={formatDateTime(
                  departure.estimated
                )}
              />

              <DetailItem
                label="Departure Actual"
                value={formatDateTime(
                  departure.actual
                )}
              />

              <DetailItem
                label="Arrival Scheduled"
                value={formatDateTime(
                  arrival.scheduled
                )}
              />

              <DetailItem
                label="Arrival Estimated"
                value={formatDateTime(
                  arrival.estimated
                )}
              />

              <DetailItem
                label="Arrival Actual"
                value={formatDateTime(
                  arrival.actual
                )}
              />
            </div>
          </section>

          {/* Airport information */}
          <section className="mt-5">
            <SectionTitle
              icon={<MapPin className="h-4 w-4" />}
              title="Airport & Gate Information"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Departure IATA"
                value={departure.iata || "—"}
                mono
              />

              <DetailItem
                label="Departure ICAO"
                value={departure.icao || "—"}
                mono
              />

              <DetailItem
                label="Departure Terminal"
                value={departure.terminal || "—"}
              />

              <DetailItem
                label="Departure Gate"
                value={departure.gate || "—"}
              />

              <DetailItem
                label="Arrival IATA"
                value={arrival.iata || "—"}
                mono
              />

              <DetailItem
                label="Arrival ICAO"
                value={arrival.icao || "—"}
                mono
              />

              <DetailItem
                label="Arrival Terminal"
                value={arrival.terminal || "—"}
              />

              <DetailItem
                label="Arrival Gate"
                value={arrival.gate || "—"}
              />
            </div>
          </section>

          {/* Airline / aircraft */}
          <section className="mt-5">
            <SectionTitle
              icon={<Plane className="h-4 w-4" />}
              title="Flight & Aircraft"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="Flight IATA"
                value={flight?.flight?.iata || "—"}
                mono
              />

              <DetailItem
                label="Flight ICAO"
                value={flight?.flight?.icao || "—"}
                mono
              />

              <DetailItem
                label="Airline IATA"
                value={airline?.iata || "—"}
                mono
              />

              <DetailItem
                label="Airline ICAO"
                value={airline?.icao || "—"}
                mono
              />

              <DetailItem
                label="Aircraft Type"
                value={
                  aircraft?.iata ||
                  aircraft?.icao ||
                  "—"
                }
                mono
              />

              <DetailItem
                label="Aircraft Registration"
                value={
                  aircraft?.registration || "—"
                }
                mono
              />

              <DetailItem
                label="Aircraft ICAO"
                value={aircraft?.icao || "—"}
                mono
              />

              <DetailItem
                label="Airline"
                value={
                  airline?.name ||
                  airline?.iata ||
                  "—"
                }
              />
            </div>
          </section>

          {/* Telemetry */}
          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Info className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Live Position Telemetry
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Latitude, longitude, altitude, heading, ground speed and
                  similar live radar telemetry are not available in this
                  AviationStack flight response, so they are intentionally
                  shown as unavailable rather than fabricated.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailItem
                label="Latitude"
                value="Not provided"
              />

              <DetailItem
                label="Longitude"
                value="Not provided"
              />

              <DetailItem
                label="Altitude"
                value="Not provided"
              />

              <DetailItem
                label="Ground Speed"
                value="Not provided"
              />
            </div>
          </section>

          {/* API response */}
          <details className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <summary className="cursor-pointer bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              View API response
            </summary>

            <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-5 text-slate-200">
              {JSON.stringify(flight, null, 2)}
            </pre>
          </details>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <span className="text-xs text-slate-400">
            {flight?._demo
              ? "Local demo record"
              : "AviationStack flight record"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#005932] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#004a2a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal components                                                            */
/* -------------------------------------------------------------------------- */

function DetailAirport({ icon, label, airport }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <div className="font-mono text-3xl font-bold text-slate-900">
        {getAirportCode(airport)}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-600">
        {getAirportName(airport)}
      </div>

      <div className="mt-2 text-xs text-slate-400">
        ICAO:{" "}
        <span className="font-mono font-semibold text-slate-600">
          {airport?.icao || "—"}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="text-[#005932]">
        {icon}
      </div>

      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>
    </div>
  );
}

function DetailItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 break-words text-sm font-semibold text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}