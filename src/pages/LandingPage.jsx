import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  Languages,
  MapPin,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Radar,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";

import {
  getLiveFlights,
  searchFlight,
} from "../services/aviationStack";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida/AEtjO1Vm0qZ9GAN3azb3qfWHO45O7bu_GTlfTMfTkJ9FVreHcZsmf2Hm-rrnTuzUhnPUEV1xXe1Kttc8fCRmIOUd8B1vNsyv6r1ODb_UFNDBLPJ733JJHvtnKqbJFPvym2DhjcHIGtrgSJz-Hrt0CmESZLOtTHmKibT5euETghXk_wTwDBpuCX4yabGvOQoIBUzpT-VQ3xzdwvRv3Ji-lu5P241961Twb2llMglxjdvIO3feM_PKQgCL9PiB6ITX";

const LOGO_IMAGE =
  "https://lh3.googleusercontent.com/aida/AEtjO1XZu3T-6n2kOohV2xf13hxEDS_WxxMYjbf6A00ecYZ6eXOPlNcY9_7NiJfXFGZyESmgZZxPjlB9Y9vKbVBmCYBrkY00pLVntmdMv0tGrmur2ie8CkOmVeZHuvEpWDgJYIGrx_vTaEMyUZphheuoryshdfo_boKRcP98CeTESB5UZW5AFFgdLD6U09OCVK-n4lN1dGPS0se25COUPaV9NH7TSuejqIAqGyEvLQPEQPyKLL1qxy7oHq98lYbH";

const quickSearches = [
  {
    value: "ET602",
    label: "ET602",
    description: "Flight search",
  },
  {
    value: "ET500",
    label: "ET500",
    description: "Flight search",
  },
  {
    value: "ET908",
    label: "ET908",
    description: "Flight search",
  },
];

function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16) || value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.number ||
    flight?.flight?.icao ||
    "Unknown"
  );
}

function getAirlineName(flight) {
  return flight?.airline?.name || "Unknown Airline";
}

function getDepartureCode(flight) {
  return flight?.departure?.iata || "---";
}

function getArrivalCode(flight) {
  return flight?.arrival?.iata || "---";
}

function getDepartureAirport(flight) {
  return flight?.departure?.airport || "Unknown airport";
}

function getArrivalAirport(flight) {
  return flight?.arrival?.airport || "Unknown airport";
}

function getStatus(flight) {
  return flight?.flight_status || "unknown";
}

function statusLabel(status) {
  if (!status) return "Unknown";

  const labels = {
    scheduled: "Scheduled",
    active: "Active",
    landed: "Landed",
    cancelled: "Cancelled",
    incident: "Incident",
    diverted: "Diverted",
  };

  return labels[status] || status;
}

function statusClasses(status) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";

    case "landed":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
    case "incident":
      return "bg-red-100 text-red-700";

    case "diverted":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getFlightIcon(status) {
  if (status === "landed") {
    return <PlaneLanding size={16} />;
  }

  return <PlaneTakeoff size={16} />;
}

function FlightStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
        status
      )}`}
    >
      {status === "active" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
      ) : null}

      {statusLabel(status)}
    </span>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan="5" className="px-4 py-10 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <RefreshCw className="animate-spin" size={18} />
          Loading live AviationStack data...
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ message }) {
  return (
    <tr>
      <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export default function LandingPage() {
  const [flights, setFlights] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const loadFlights = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const today = new Date().toISOString().split("T")[0];

      const response = await getLiveFlights({
        depIata: "ADD",
        flightDate: today,
        limit: 100,
      });

      setFlights(response?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Landing page API error:", err);

      setError(
        err?.message ||
          "Unable to connect to AviationStack. Please check your API configuration."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();

    const interval = setInterval(() => {
      loadFlights();
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadFlights]);

  const handleSearch = async () => {
    const value = searchValue.trim();

    if (!value) return;

    try {
      setSearching(true);
      setError("");

      const response = await searchFlight(value);

      setSearchResults(response?.data || []);
    } catch (err) {
      console.error("Flight search error:", err);

      setSearchResults([]);

      setError(
        err?.message ||
          "Unable to search for the flight."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleQuickSearch = async (value) => {
    setSearchValue(value);

    try {
      setSearching(true);
      setError("");

      const response = await searchFlight(value);

      setSearchResults(response?.data || []);
    } catch (err) {
      console.error("Quick search error:", err);

      setSearchResults([]);

      setError(
        err?.message ||
          "Unable to search for the flight."
      );
    } finally {
      setSearching(false);
    }
  };

  const departures = useMemo(() => {
    return flights
      .filter((flight) => flight?.departure?.iata === "ADD")
      .slice(0, 6);
  }, [flights]);

  const arrivals = useMemo(() => {
    return flights
      .filter((flight) => flight?.arrival?.iata === "ADD")
      .slice(0, 6);
  }, [flights]);

  const activeFlights = useMemo(() => {
    return flights.filter(
      (flight) => flight?.flight_status === "active"
    ).length;
  }, [flights]);

  const scheduledFlights = useMemo(() => {
    return flights.filter(
      (flight) => flight?.flight_status === "scheduled"
    ).length;
  }, [flights]);

  const delayedFlights = useMemo(() => {
    return flights.filter(
      (flight) =>
        Number(flight?.departure?.delay || 0) > 0
    ).length;
  }, [flights]);

  const monitoredAirlines = useMemo(() => {
    return new Set(
      flights
        .map((flight) => flight?.airline?.iata || flight?.airline?.name)
        .filter(Boolean)
    ).size;
  }, [flights]);

  const featuredFlight =
    flights.find(
      (flight) => flight?.flight_status === "active"
    ) ||
    flights[0] ||
    null;

  return (
    <div className="min-h-screen bg-[#f0fcf4] font-sans text-[#131e19]">
      {/* HEADER */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-gray-200/60 bg-[#f0fcf4]/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="flex items-center gap-1"
            >
              <img
                src={LOGO_IMAGE}
                alt="EthioFlight logo"
                className="h-8 w-auto object-contain"
              />

              <span className="text-lg font-bold tracking-tight text-[#005932]">
                EthioFlight
              </span>
            </a>

            <div className="hidden items-center gap-2 rounded-full bg-[#e4f1e9] px-2.5 py-1 md:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  error
                    ? "bg-red-500"
                    : "animate-pulse bg-[#087443]"
                }`}
              />

              <span className="text-xs font-medium text-[#3f4941]">
                {error
                  ? "AviationStack Error"
                  : "AviationStack Connected"}
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            <a
              href="#radar"
              className="text-xs font-semibold text-[#3f4941] transition hover:text-[#005932]"
            >
              Live Radar
            </a>

            <a
              href="#departures"
              className="text-xs font-semibold text-[#3f4941] transition hover:text-[#005932]"
            >
              Departures
            </a>

            <a
              href="#features"
              className="text-xs font-semibold text-[#3f4941] transition hover:text-[#005932]"
            >
              Airlines
            </a>

            <a
              href="#bole-hub"
              className="text-xs font-semibold text-[#3f4941] transition hover:text-[#005932]"
            >
              Airports
            </a>

            <a
              href="#api"
              className="text-xs font-semibold text-[#3f4941] transition hover:text-[#005932]"
            >
              API
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded bg-[#eaf7ee] px-2.5 py-1 text-xs sm:flex">
              <Languages size={15} className="text-gray-500" />
              <button className="font-bold text-[#005932]">
                EN
              </button>
              <span className="text-gray-400">/</span>
              <button className="text-gray-500">
                አማ
              </button>
            </div>

            <a
              href="/login"
              className="hidden px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:text-[#005932] sm:block"
            >
              Login
            </a>

            <a
              href="/signup"
              className="rounded-lg bg-[#005932] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#087443]"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* HERO */}
        <section
          id="radar"
          className="relative overflow-hidden px-6 py-12 lg:py-16"
        >
          <div className="pointer-events-none absolute -right-20 -top-40 h-[550px] w-[550px] rounded-full bg-[#99f6b9]/20 blur-3xl" />

          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="flex flex-col items-start space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e4f1e9] px-3 py-1 text-xs font-semibold text-[#005932]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#087443]" />
                Live Horn of Africa Flight Tracking
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#131e19] md:text-5xl">
                Real-time flight tracking across Ethiopian airspace.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-[#3f4941] md:text-lg">
                Monitor live commercial flights, Bole International
                Airport operations, and global aviation routes using
                real AviationStack flight data.
              </p>

              {/* SEARCH */}
              <div className="w-full max-w-2xl rounded-xl border border-gray-200/70 bg-white p-2 shadow-lg">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={searchValue}
                      onChange={(event) =>
                        setSearchValue(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      className="h-12 w-full rounded-lg bg-[#eaf7ee] pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-[#005932]"
                      placeholder="Try ET602, ET500, or another flight..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#005932] px-6 text-sm font-bold text-white transition hover:bg-[#087443] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {searching ? (
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Search size={17} />
                    )}

                    {searching
                      ? "Searching..."
                      : "Track Flight"}

                    {!searching && <ArrowRight size={17} />}
                  </button>
                </div>

                {/* QUICK SEARCH */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Quick Search:
                  </span>

                  {quickSearches.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        handleQuickSearch(item.value)
                      }
                      className="rounded bg-[#eaf7ee] px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-[#e4f1e9] hover:text-[#005932]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex w-full max-w-2xl items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-bold">
                      AviationStack connection problem
                    </p>

                    <p className="mt-1 break-words">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={loadFlights}
                      className="mt-2 font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* HERO LIVE CARD */}
            <div className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl bg-[#d9e6dd] shadow-2xl">
                <img
                  src={HERO_IMAGE}
                  alt="Commercial aircraft over Ethiopian mountains"
                  className="h-[400px] w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#28332d]/90 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-[#28332d]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#99f6b9]" />
                  LIVE FLIGHT FEED
                </div>

                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-4 text-[#131e19] shadow-xl backdrop-blur-md">
                  {featuredFlight ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#005932]">
                            {getFlightNumber(featuredFlight)}
                          </span>

                          <span className="rounded bg-[#e4f1e9] px-2 py-0.5 text-xs text-gray-600">
                            {getAirlineName(featuredFlight)}
                          </span>
                        </div>

                        <FlightStatusBadge
                          status={getStatus(featuredFlight)}
                        />
                      </div>

                      <div className="my-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold">
                            {getDepartureCode(featuredFlight)}
                          </div>

                          <div className="text-xs text-gray-500">
                            {formatTime(
                              featuredFlight?.departure?.scheduled
                            )}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col items-center px-3">
                          <div className="flex w-full items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-[#d9e6dd]">
                              <div
                                className="h-full rounded-full bg-[#005932]"
                                style={{
                                  width:
                                    getStatus(featuredFlight) ===
                                    "active"
                                      ? "65%"
                                      : "35%",
                                }}
                              />
                            </div>

                            <Plane
                              size={17}
                              className="rotate-90 text-[#005932]"
                            />

                            <div className="h-1.5 flex-1 rounded-full bg-[#d9e6dd]" />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {getArrivalCode(featuredFlight)}
                          </div>

                          <div className="text-xs text-gray-500">
                            {formatTime(
                              featuredFlight?.arrival?.scheduled
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        {getDepartureAirport(featuredFlight)}
                        {" → "}
                        {getArrivalAirport(featuredFlight)}
                      </div>
                    </>
                  ) : loading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Loading live flight...
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No live flight data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE STATISTICS */}
        <section className="border-y border-gray-200/70 bg-[#eaf7ee] px-6 py-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">
            <StatCard
              value={activeFlights}
              title="Aircraft Active"
              subtitle="From AviationStack"
              icon={<Plane size={19} />}
              loading={loading}
            />

            <StatCard
              value={departures.length}
              title="ADD Departures"
              subtitle="Live API results"
              icon={<PlaneTakeoff size={19} />}
              loading={loading}
            />

            <StatCard
              value={arrivals.length}
              title="ADD Arrivals"
              subtitle="Live API results"
              icon={<PlaneLanding size={19} />}
              loading={loading}
            />

            <StatCard
              value={monitoredAirlines}
              title="Airlines"
              subtitle="In current results"
              icon={<Globe2 size={19} />}
              loading={loading}
            />
          </div>
        </section>

        {/* BOLE AIRPORT */}
        <section
          id="bole-hub"
          className="px-6 py-12 lg:py-16"
        >
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#131e19] md:text-3xl">
                  Bole International Airport (ADD)
                </h2>

                <p className="mt-1 text-sm text-[#3f4941]">
                  Live flight operations from AviationStack.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg bg-[#e4f1e9] px-3 py-2 text-xs font-medium text-[#3f4941]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    error
                      ? "bg-red-500"
                      : "animate-pulse bg-[#087443]"
                  }`}
                />

                {error
                  ? "API connection unavailable"
                  : "AviationStack feed active"}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#eaf7ee] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        Flight
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Destination / Route
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Scheduled
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Airline
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e4f1e9] text-sm">
                    {loading ? (
                      <LoadingRow />
                    ) : departures.length === 0 ? (
                      <EmptyRow message="No departure data is currently available for ADD." />
                    ) : (
                      departures.map((flight, index) => {
                        const status = getStatus(flight);

                        return (
                          <tr
                            key={`${getFlightNumber(
                              flight
                            )}-${index}`}
                            className="transition hover:bg-[#f0fcf4]"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 font-bold text-[#005932]">
                                {getFlightIcon(status)}
                                {getFlightNumber(flight)}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-medium">
                                {getArrivalAirport(flight)}
                              </div>

                              <div className="mt-0.5 text-xs text-gray-500">
                                ADD → {getArrivalCode(flight)}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-gray-500">
                              <div>
                                {formatTime(
                                  flight?.departure?.scheduled
                                )}
                              </div>

                              <div className="text-xs">
                                {formatDate(
                                  flight?.flight_date
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 font-medium">
                              {getAirlineName(flight)}
                            </td>

                            <td className="px-4 py-4 text-right">
                              <FlightStatusBadge
                                status={status}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-gray-200/70 bg-[#eaf7ee] p-3 sm:flex-row sm:items-center">
                <span className="text-xs text-gray-500">
                  Showing {departures.length} live ADD departures
                </span>

                <a
                  href="#departures"
                  className="flex items-center gap-1 text-xs font-bold text-[#005932] hover:underline"
                >
                  View Full Departures Matrix
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH RESULTS */}
        {searchResults.length > 0 && (
          <section className="bg-[#eaf7ee] px-6 py-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#005932]">
                    Flight Search
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Results for "{searchValue}"
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-900"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((flight, index) => (
                  <FlightSearchCard
                    key={`${getFlightNumber(
                      flight
                    )}-${index}`}
                    flight={flight}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ARRIVALS */}
        <section
          id="departures"
          className="px-6 py-12"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#005932]">
                  Live Operations
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Bole Departures & Arrivals
                </h2>
              </div>

              <button
                type="button"
                onClick={loadFlights}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#005932]/20 bg-white px-4 py-2 text-sm font-semibold text-[#005932] transition hover:bg-[#eaf7ee] disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh Data
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <OperationTable
                title="Departures from ADD"
                icon={<PlaneTakeoff size={19} />}
                flights={departures}
                loading={loading}
                type="departure"
              />

              <OperationTable
                title="Arrivals to ADD"
                icon={<PlaneLanding size={19} />}
                flights={arrivals}
                loading={loading}
                type="arrival"
              />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="bg-[#eaf7ee] px-6 py-12 lg:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#005932]">
                Why EthioFlight
              </span>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Aviation data built for everyone
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Use live aviation information to understand
                flights, airlines, airports, and routes.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<Radar size={27} />}
                title="Live Flight Data"
                description="Track current flight operations using live data returned by AviationStack."
              />

              <FeatureCard
                icon={<MapPin size={27} />}
                title="Bole Airport Intelligence"
                description="Monitor departures and arrivals connected with Addis Ababa Bole International Airport."
              />

              <FeatureCard
                icon={<Clock3 size={27} />}
                title="Schedule Visibility"
                description="View scheduled departure and arrival times directly from the aviation API."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          id="get-started"
          className="px-6 py-12 lg:py-16"
        >
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#005932] p-8 text-white shadow-xl lg:p-16">
            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to track Ethiopian airspace?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-white/80">
                Explore real aviation data, airport operations,
                flight schedules, and global airline information.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#radar"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#febf27] px-6 py-3 text-sm font-bold text-[#261900] shadow-md transition hover:bg-[#fbbc23]"
                >
                  <Radar size={19} />
                  Explore Live Data
                </a>

                <a
                  href="#bole-hub"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <MapPin size={19} />
                  View Bole Operations
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        id="api"
        className="border-t border-gray-800 bg-[#28332d] text-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <img
                  src={LOGO_IMAGE}
                  alt="EthioFlight logo"
                  className="h-8 w-auto object-contain"
                />

                <span className="text-lg font-bold text-[#99f6b9]">
                  EthioFlight
                </span>
              </div>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-300">
                Real-time flight tracking and aviation intelligence
                focused on Ethiopia, the Horn of Africa, and global
                aviation.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#99f6b9]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    error
                      ? "bg-red-400"
                      : "animate-pulse bg-[#99f6b9]"
                  }`}
                />

                {error
                  ? "AviationStack unavailable"
                  : "AviationStack Live Feed"}
              </div>
            </div>

            <FooterColumn
              title="Products"
              links={[
                ["Live Airspace Radar", "#radar"],
                ["Bole Hub (ADD)", "#bole-hub"],
                ["Departures Matrix", "#departures"],
                ["Arrivals Matrix", "#departures"],
              ]}
            />

            <FooterColumn
              title="Operations & Data"
              links={[
                ["AviationStack API", "#api"],
                ["Flight Search", "#radar"],
                ["Airline Data", "#features"],
                ["Airport Data", "#bole-hub"],
              ]}
            />

            <FooterColumn
              title="Company"
              links={[
                ["About EthioFlight", "#about"],
                ["Bole Operations Center", "#bole-hub"],
                ["Support", "#contact"],
                ["Documentation", "#api"],
              ]}
            />
          </div>

          <div className="flex flex-col justify-between gap-4 pt-6 text-xs text-gray-400 md:flex-row">
            <div>
              © 2026 EthioFlight. All rights reserved.
            </div>

            <div className="flex items-center gap-2">
              <Server size={14} />
              <span>
                Live data powered by AviationStack
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  value,
  title,
  subtitle,
  icon,
  loading,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[#005932]">
        {icon}
      </div>

      <div className="text-3xl font-bold tracking-tight text-[#005932]">
        {loading ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded bg-[#d9e6dd]" />
        ) : (
          value
        )}
      </div>

      <div className="mt-1 text-sm font-bold text-[#131e19]">
        {title}
      </div>

      <div className="text-xs text-gray-500">
        {subtitle}
      </div>
    </div>
  );
}

function OperationTable({
  title,
  icon,
  flights,
  loading,
  type,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-md">
      <div className="flex items-center gap-2 border-b border-gray-200/70 bg-[#eaf7ee] px-4 py-4">
        <span className="text-[#005932]">
          {icon}
        </span>

        <h3 className="font-bold">{title}</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <RefreshCw
              size={17}
              className="animate-spin"
            />
            Loading...
          </div>
        ) : flights.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No {type} data available.
          </div>
        ) : (
          flights.map((flight, index) => {
            const status = getStatus(flight);

            return (
              <div
                key={`${getFlightNumber(
                  flight
                )}-${index}`}
                className="flex items-center justify-between gap-3 p-4 transition hover:bg-[#f0fcf4]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f1e9] text-[#005932]">
                    {getFlightIcon(status)}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-[#005932]">
                      {getFlightNumber(flight)}
                    </div>

                    <div className="truncate text-xs text-gray-500">
                      {type === "departure"
                        ? `${getDepartureCode(
                            flight
                          )} → ${getArrivalCode(flight)}`
                        : `${getArrivalCode(
                            flight
                          )} ← ${getDepartureCode(flight)}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {type === "departure"
                      ? formatTime(
                          flight?.departure?.scheduled
                        )
                      : formatTime(
                          flight?.arrival?.scheduled
                        )}
                  </div>

                  <div className="mt-1">
                    <FlightStatusBadge status={status} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FlightSearchCard({ flight }) {
  const status = getStatus(flight);

  return (
    <div className="rounded-xl border border-gray-200/70 bg-white p-5 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-[#005932]">
            {getFlightNumber(flight)}
          </div>

          <div className="text-xs text-gray-500">
            {getAirlineName(flight)}
          </div>
        </div>

        <FlightStatusBadge status={status} />
      </div>

      <div className="my-5 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">
            {getDepartureCode(flight)}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {formatTime(
              flight?.departure?.scheduled
            )}
          </div>
        </div>

        <Plane
          size={22}
          className="rotate-90 text-[#005932]"
        />

        <div className="text-right">
          <div className="text-2xl font-bold">
            {getArrivalCode(flight)}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {formatTime(
              flight?.arrival?.scheduled
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Departure</span>
          <span className="font-medium text-gray-700">
            {getDepartureAirport(flight)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span>Arrival</span>
          <span className="font-medium text-gray-700">
            {getArrivalAirport(flight)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e4f1e9] text-[#005932]">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="text-sm text-gray-400 transition hover:text-[#99f6b9]"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}