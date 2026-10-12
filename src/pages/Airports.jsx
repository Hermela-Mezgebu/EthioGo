
// src/pages/Airports.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowRight,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  Globe2,
  LoaderCircle,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getAirports } from "../services/aviationStack";

const PAGE_SIZE = 100;

const REGION_FILTERS = [
  { id: "ethiopia", label: "Ethiopian Hubs" },
  { id: "east-africa", label: "East Africa" },
  { id: "africa", label: "Pan-African" },
  { id: "international", label: "International" },
];

const EAST_AFRICAN_COUNTRIES = [
  "ethiopia",
  "kenya",
  "uganda",
  "tanzania",
  "rwanda",
  "burundi",
  "somalia",
  "djibouti",
  "eritrea",
  "south sudan",
  "sudan",
];

function normalizeAirport(airport, index) {
  const latitude =
    airport.latitude ??
    airport.lat ??
    airport.latitude_deg ??
    null;

  const longitude =
    airport.longitude ??
    airport.lon ??
    airport.longitude_deg ??
    null;

  return {
    id:
      airport.id ??
      airport.airport_id ??
      airport.icao_code ??
      airport.iata_code ??
      `${airport.airport_name ?? airport.name ?? "airport"}-${index}`,

    name:
      airport.airport_name ??
      airport.name ??
      airport.airport ??
      "Unknown airport",

    iata:
      airport.iata_code ??
      airport.iata ??
      airport.iataCode ??
      "",

    icao:
      airport.icao_code ??
      airport.icao ??
      airport.icaoCode ??
      "",

    city:
      airport.city_iata_code ??
      airport.city ??
      airport.city_name ??
      "",

    country:
      airport.country_name ??
      airport.country ??
      "",

    countryCode:
      airport.country_iso2 ??
      airport.country_iso ??
      airport.country_code ??
      "",

    latitude,
    longitude,

    timezone:
      airport.timezone ??
      airport.timezone_name ??
      "",

    gmt:
      airport.gmt ??
      airport.utc ??
      "",

    // Keep optional properties only when the API actually supplies them.
    elevation:
      airport.elevation ??
      airport.elevation_ft ??
      null,

    runwayLength:
      airport.runway_length ??
      airport.runway_length_m ??
      null,
  };
}

function getAirportsFromResponse(response) {
  const airports = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.airports)
      ? response.airports
      : Array.isArray(response?.results)
        ? response.results
        : [];

  return {
    airports: airports.map(normalizeAirport),
    pagination: response?.pagination ?? {},
  };
}

function getCountryName(airport) {
  return String(airport.country || "").trim().toLowerCase();
}

function isEthiopianAirport(airport) {
  const country = getCountryName(airport);
  return (
    country === "ethiopia" ||
    airport.countryCode?.toUpperCase() === "ET"
  );
}

function isEastAfricanAirport(airport) {
  return EAST_AFRICAN_COUNTRIES.includes(getCountryName(airport));
}

function matchesRegion(airport, region) {
  switch (region) {
    case "ethiopia":
      return isEthiopianAirport(airport);

    case "east-africa":
      return isEastAfricanAirport(airport);

    case "africa":
      return (
        getCountryName(airport).length > 0 &&
        // This region can be refined if your API provides a continent field.
        isEastAfricanAirport(airport)
      );

    case "international":
      return !isEthiopianAirport(airport);

    default:
      return true;
  }
}

function formatCoordinate(value, directionPositive, directionNegative) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "Not provided";

  const direction =
    number >= 0 ? directionPositive : directionNegative;

  return `${Math.abs(number).toFixed(4)}° ${direction}`;
}

function formatCoordinates(airport) {
  if (
    airport.latitude === null ||
    airport.latitude === undefined ||
    airport.longitude === null ||
    airport.longitude === undefined
  ) {
    return "Coordinates unavailable";
  }

  return `${formatCoordinate(
    airport.latitude,
    "N",
    "S"
  )} · ${formatCoordinate(airport.longitude, "E", "W")}`;
}

function formatElevation(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toLocaleString()} ft`
    : String(value);
}

function AirportCode({ children, secondary = false }) {
  if (!children) return null;

  return (
    <span
      className={
        secondary
          ? "inline-flex items-center rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold tracking-wider text-muted-foreground"
          : "inline-flex items-center rounded-md bg-[#0B1713] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-white dark:bg-primary"
      }
    >
      {children}
    </span>
  );
}

function AirportBadge({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function DataItem({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="break-words text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function AirportCard({ airport, featured = false }) {
  const location = [airport.city, airport.country]
    .filter(Boolean)
    .join(", ");

  const hasCoordinates =
    airport.latitude !== null &&
    airport.latitude !== undefined &&
    airport.longitude !== null &&
    airport.longitude !== undefined;

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${airport.latitude},${airport.longitude}`
      )}`
    : null;

  return (
    <article
      className={[
        "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        featured ? "shadow-md" : "shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "h-1.5 w-full",
          featured ? "bg-primary" : "bg-primary/35",
        ].join(" ")}
      />

      <div className={featured ? "p-5 sm:p-6" : "p-5"}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AirportCode>{airport.iata || "N/A"}</AirportCode>
          <AirportCode secondary>{airport.icao || "ICAO N/A"}</AirportCode>

          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Featured airport
            </span>
          )}
        </div>

        <h2
          className={[
            "font-bold tracking-tight text-foreground",
            featured ? "text-xl sm:text-2xl" : "text-base",
          ].join(" ")}
        >
          {airport.name}
        </h2>

        <p className="mt-1.5 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{location || "Location not provided by API"}</span>
        </p>

        {featured && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Airport directory details from AviationStack. Available fields
            depend on the airport record returned by your API plan.
          </p>
        )}

        <div
          className={[
            "mt-5 grid grid-cols-1 gap-4 rounded-xl bg-muted/50 p-4",
            featured ? "sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-2",
          ].join(" ")}
        >
          <DataItem
            label="IATA code"
            value={airport.iata || "Not provided"}
            icon={Plane}
          />

          <DataItem
            label="ICAO code"
            value={airport.icao || "Not provided"}
            icon={Compass}
          />

          <DataItem
            label="Country"
            value={airport.country || "Not provided"}
            icon={Globe2}
          />

          <DataItem
            label="Timezone"
            value={airport.timezone || "Not provided"}
            icon={Clock3}
          />

          {featured && (
            <>
              <DataItem
                label="Latitude"
                value={formatCoordinate(airport.latitude, "N", "S")}
              />
              <DataItem
                label="Longitude"
                value={formatCoordinate(airport.longitude, "E", "W")}
              />
              <DataItem
                label="Elevation"
                value={formatElevation(airport.elevation)}
              />
              <DataItem
                label="Runway length"
                value={
                  airport.runwayLength
                    ? `${Number(airport.runwayLength).toLocaleString()} m`
                    : "Not provided"
                }
              />
            </>
          )}
        </div>

        {featured && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AirportBadge icon={MapPin}>
              {formatCoordinates(airport)}
            </AirportBadge>

            {airport.gmt !== "" && (
              <AirportBadge icon={Clock3}>
                GMT {airport.gmt}
              </AirportBadge>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="truncate text-xs text-muted-foreground">
            {airport.countryCode
              ? `Country code: ${airport.countryCode.toUpperCase()}`
              : "Airport directory record"}
          </span>

          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className={[
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2",
                "text-xs font-semibold transition-colors",
                featured
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-foreground hover:bg-accent",
              ].join(" ")}
            >
              View location
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              No coordinates
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function AirportSkeleton({ featured = false }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="h-1.5 animate-pulse bg-muted" />
      <div className="space-y-4 p-5">
        <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div
          className={[
            "grid gap-4 rounded-xl bg-muted/40 p-4",
            featured ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
          ].join(" ")}
        >
          {Array.from({ length: featured ? 8 : 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 max-w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Airports() {
  const [airports, setAirports] = useState([]);
  const [pagination, setPagination] = useState({
    total: null,
    count: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState("ethiopia");
  const [sortBy, setSortBy] = useState("name-asc");

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAirports = useCallback(
    async ({ showRefresh = false } = {}) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getAirports({
          search: submittedSearch.trim() || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });

        const result = getAirportsFromResponse(response);

        setAirports(result.airports);

        const total = result.pagination?.total;
        const count = result.pagination?.count;

        setPagination({
          total:
            total !== undefined && total !== null && total !== ""
              ? Number(total)
              : null,
          count:
            count !== undefined && count !== null
              ? Number(count)
              : result.airports.length,
        });
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load airports. Please try again."
        );
        setAirports([]);
        setPagination({ total: null, count: 0 });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, submittedSearch]
  );

  useEffect(() => {
    loadAirports();
  }, [loadAirports]);

  const filteredAirports = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    const result = airports.filter((airport) => {
      const matchesQuery =
        !query ||
        [
          airport.name,
          airport.iata,
          airport.icao,
          airport.city,
          airport.country,
          airport.countryCode,
          airport.timezone,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return (
        matchesQuery &&
        matchesRegion(airport, activeRegion)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortBy === "country-asc") {
        return (
          a.country.localeCompare(b.country) ||
          a.name.localeCompare(b.name)
        );
      }

      if (sortBy === "iata-asc") {
        return a.iata.localeCompare(b.iata);
      }

      return a.name.localeCompare(b.name);
    });
  }, [airports, searchInput, activeRegion, sortBy]);

  const featuredAirport = useMemo(() => {
    if (filteredAirports.length === 0) return null;

    return (
      filteredAirports.find(
        (airport) => airport.iata?.toUpperCase() === "ADD"
      ) || filteredAirports[0]
    );
  }, [filteredAirports]);

  const otherAirports = useMemo(() => {
    if (!featuredAirport) return [];

    return filteredAirports.filter(
      (airport) => airport.id !== featuredAirport.id
    );
  }, [filteredAirports, featuredAirport]);

  const ethiopianCount = useMemo(
    () => airports.filter(isEthiopianAirport).length,
    [airports]
  );

  const eastAfricaCount = useMemo(
    () => airports.filter(isEastAfricanAirport).length,
    [airports]
  );

  const internationalCount = useMemo(
    () => airports.filter((airport) => !isEthiopianAirport(airport)).length,
    [airports]
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSubmittedSearch("");
    setPage(0);
  }

  const hasNextPage =
    pagination.total !== null
      ? (page + 1) * PAGE_SIZE < pagination.total
      : pagination.count >= PAGE_SIZE;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
        {/* Page heading */}
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                AIRSPACE INFRASTRUCTURE DIRECTORY
              </span>

              <span className="text-xs font-medium text-muted-foreground">
                ETHIOGO · AIRPORT DIRECTORY
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore Airports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Explore airport locations, aviation codes, coordinates, and
              timezone information using real AviationStack directory data.
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:min-w-[400px] sm:gap-3 sm:p-3">
            <div className="rounded-xl bg-muted/70 px-3 py-3">
              <p className="text-xl font-bold tabular-nums text-primary">
                {loading ? "—" : ethiopianCount}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                Ethiopia
              </p>
            </div>

            <div className="rounded-xl bg-muted/70 px-3 py-3">
              <p className="text-xl font-bold tabular-nums text-foreground">
                {loading ? "—" : eastAfricaCount}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                East Africa
              </p>
            </div>

            <div className="rounded-xl bg-muted/70 px-3 py-3">
              <p className="text-xl font-bold tabular-nums text-foreground">
                {loading
                  ? "—"
                  : pagination.total !== null
                    ? pagination.total.toLocaleString()
                    : internationalCount}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                {pagination.total !== null ? "API Total" : "Other Countries"}
              </p>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search airport, city, country, IATA or ICAO code..."
                className="h-12 w-full rounded-xl border border-border bg-muted/50 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              Search directory
            </button>

            <button
              type="button"
              onClick={() => loadAirports({ showRefresh: true })}
              disabled={loading || refreshing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  refreshing ? "animate-spin" : "",
                ].join(" ")}
              />
              Refresh
            </button>
          </form>

          <div className="flex flex-col gap-3 border-t border-border pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Region
              </span>

              {REGION_FILTERS.map((region) => {
                const active = activeRegion === region.id;

                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setActiveRegion(region.id)}
                    className={[
                      "whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                    ].join(" ")}
                  >
                    {region.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setActiveRegion("all")}
                className={[
                  "whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  activeRegion === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                ].join(" ")}
              >
                All loaded airports
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="whitespace-nowrap font-medium">Sort by</span>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-9 max-w-[190px] rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                >
                  <option value="name-asc">Name: A–Z</option>
                  <option value="name-desc">Name: Z–A</option>
                  <option value="country-asc">Country</option>
                  <option value="iata-asc">IATA code</option>
                </select>
              </label>

              <span className="text-xs text-muted-foreground">
                {loading
                  ? "Loading results…"
                  : `${filteredAirports.length} shown`}
              </span>
            </div>
          </div>

          {submittedSearch && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                API search:{" "}
                <span className="font-semibold text-foreground">
                  {submittedSearch}
                </span>
              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* Error state */}
        {error && (
          <section
            role="alert"
            className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h2 className="font-semibold text-foreground">
                  Unable to load airport data
                </h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {error}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Check your AviationStack API key, plan permissions, and
                  network connection. No sample airport data has been
                  substituted.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadAirports()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        {/* Results heading */}
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Airport directory
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Retrieving airport records from AviationStack…"
                : `Showing ${filteredAirports.length} matching airport${
                    filteredAirports.length === 1 ? "" : "s"
                  } from the loaded API results.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={[
                "h-2 w-2 rounded-full",
                error ? "bg-destructive" : loading ? "bg-amber-500" : "bg-primary",
              ].join(" ")}
            />
            {error ? "Connection issue" : loading ? "Connecting" : "API response received"}
          </div>
        </section>

        {/* Airport cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <AirportSkeleton featured />
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <AirportSkeleton key={index} />
            ))}
          </div>
        ) : !error && filteredAirports.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-bold">No airports found</h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Try another airport name, city, country, or aviation code.
              If you selected a region, switch to “All loaded airports”.
            </p>

            <button
              type="button"
              onClick={() => {
                clearSearch();
                setActiveRegion("all");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          </section>
        ) : !error ? (
          <div className="space-y-5">
            {featuredAirport && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="xl:col-span-3">
                  <AirportCard
                    airport={featuredAirport}
                    featured
                  />
                </div>
              </div>
            )}

            {otherAirports.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {otherAirports.map((airport) => (
                  <AirportCard key={airport.id} airport={airport} />
                ))}
              </div>
            )}

            {filteredAirports.length === 1 && (
              <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Only one airport matches the current filters.
              </p>
            )}
          </div>
        ) : null}

        {/* Pagination */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Page {page + 1}
            </span>
            <span className="mx-2">·</span>
            {pagination.total !== null
              ? `${pagination.total.toLocaleString()} total records reported by API`
              : `${pagination.count} records returned in this response`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDownZA className="h-4 w-4 rotate-90" />
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowDownAZ className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </section>

        {/* Footer note */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">
                AviationStack airport directory
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                This page displays fields returned by your API response.
                Operational status, runway dimensions, weather, and daily
                traffic are not inferred when the endpoint does not provide
                them.
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            Updated when you refresh
          </span>
        </section>
      </div>
    </main>
  );
}
