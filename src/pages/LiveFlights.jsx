import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Clock3,
  Gauge,
  MapPin,
  Navigation,
  Plane,
  Radio,
  RefreshCw,
  Search,
  Signal,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  getLiveFlights,
  searchFlight,
} from "../services/aviationStack";

const REFRESH_INTERVAL = 15000;

/* =========================================================
   FILTER OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "In Flight" },
  { value: "scheduled", label: "Scheduled" },
  { value: "landed", label: "Landed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "diverted", label: "Diverted" },
];

const ALTITUDE_OPTIONS = [
  { value: "", label: "All Altitudes" },
  { value: "high", label: "High Band (FL300 - FL450)" },
  { value: "medium", label: "Medium Band (FL100 - FL300)" },
  { value: "low", label: "Low Band (< FL100)" },
];

/* =========================================================
   DATA HELPERS
========================================================= */

function getFlightNumber(flight) {
  return (
    flight?.flight?.iata ||
    flight?.flight?.icao ||
    flight?.flight?.number ||
    "N/A"
  );
}

function getAirlineName(flight) {
  return (
    flight?.airline?.name ||
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "Unknown Airline"
  );
}

function getAirlineCode(flight) {
  return (
    flight?.airline?.iata ||
    flight?.airline?.icao ||
    "N/A"
  );
}

function getAircraftName(flight) {
  return (
    flight?.aircraft?.iata ||
    flight?.aircraft?.icao ||
    flight?.aircraft?.registration ||
    "Aircraft N/A"
  );
}

function getAircraftRegistration(flight) {
  return (
    flight?.aircraft?.registration ||
    "N/A"
  );
}

function getDepartureAirport(flight) {
  return (
    flight?.departure?.iata ||
    flight?.departure?.icao ||
    "N/A"
  );
}

function getArrivalAirport(flight) {
  return (
    flight?.arrival?.iata ||
    flight?.arrival?.icao ||
    "N/A"
  );
}

function getDepartureName(flight) {
  return (
    flight?.departure?.airport ||
    "Departure Airport"
  );
}

function getArrivalName(flight) {
  return (
    flight?.arrival?.airport ||
    "Arrival Airport"
  );
}

function getStatus(flight) {
  return (
    flight?.flight_status ||
    flight?.status ||
    "unknown"
  ).toLowerCase();
}

function getAltitude(flight) {
  const value = Number(
    flight?.live?.altitude ??
      flight?.altitude ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getSpeed(flight) {
  const value = Number(
    flight?.live?.speed_horizontal ??
      flight?.live?.speed ??
      flight?.speed ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getVerticalSpeed(flight) {
  const value = Number(
    flight?.live?.vertical_speed ??
      flight?.vertical_speed ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getHeading(flight) {
  const value = Number(
    flight?.live?.direction ??
      flight?.live?.heading ??
      flight?.heading ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getLatitude(flight) {
  const value = Number(
    flight?.live?.latitude ??
      flight?.latitude
  );

  return Number.isFinite(value) ? value : null;
}

function getLongitude(flight) {
  const value = Number(
    flight?.live?.longitude ??
      flight?.longitude
  );

  return Number.isFinite(value) ? value : null;
}

function getSquawk(flight) {
  return (
    flight?.live?.squawk ||
    flight?.squawk ||
    "N/A"
  );
}

function getFlightDate(flight) {
  return (
    flight?.flight_date ||
    flight?.departure?.scheduled?.split("T")?.[0] ||
    null
  );
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatTime(dateString) {
  if (!dateString) {
    return "--:--";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("en-ET", {
    timeZone: "Africa/Addis_Ababa",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatAltitude(value) {
  if (!value) {
    return "N/A";
  }

  return `${Math.round(value).toLocaleString()} ft`;
}

function formatFlightLevel(value) {
  if (!value) {
    return "N/A";
  }

  return `FL${Math.round(value / 100)}`;
}

function formatSpeed(value) {
  if (!value) {
    return "N/A";
  }

  return `${Math.round(value).toLocaleString()} km/h`;
}

function formatCoordinates(latitude, longitude) {
  if (
    latitude === null ||
    longitude === null
  ) {
    return "N/A";
  }

  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

function getAltitudeCategory(altitude) {
  if (!altitude || altitude < 10000) {
    return "low";
  }

  if (altitude <= 30000) {
    return "medium";
  }

  return "high";
}

/* =========================================================
   RADAR POSITION
========================================================= */

function getRadarPosition(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  /*
    East Africa / Middle East radar region.
    This keeps ADD, DXB and surrounding routes
    visible in a compact radar-style view.
  */

  const minLat = -15;
  const maxLat = 45;

  const minLng = 20;
  const maxLng = 70;

  const left =
    ((longitude - minLng) /
      (maxLng - minLng)) *
    100;

  const top =
    (1 -
      (latitude - minLat) /
        (maxLat - minLat)) *
    100;

  return {
    left: `${Math.min(
      96,
      Math.max(4, left)
    )}%`,
    top: `${Math.min(
      94,
      Math.max(6, top)
    )}%`,
  };
}

/* =========================================================
   STATUS STYLES
========================================================= */

function getStatusStyle(status) {
  switch (status) {
    case "active":
      return {
        label: "En Route",
        className:
          "bg-primary-light text-primary border-primary/20",
        dot: "bg-primary",
      };

    case "scheduled":
      return {
        label: "Scheduled",
        className:
          "bg-tertiary-light text-tertiary border-tertiary/20",
        dot: "bg-tertiary",
      };

    case "landed":
      return {
        label: "Landed",
        className:
          "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-500",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "bg-red-50 text-red-600 border-red-200",
        dot: "bg-red-500",
      };

    case "diverted":
      return {
        label: "Diverted",
        className:
          "bg-secondary-light text-[#806000] border-secondary/30",
        dot: "bg-secondary",
      };

    default:
      return {
        label: "Unknown",
        className:
          "bg-slate-100 text-slate-500 border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const style = getStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
      />

      {style.label}
    </span>
  );
}

/* =========================================================
   RADAR GRID
========================================================= */

function RadarGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Vertical lines */}
      <div className="absolute inset-y-0 left-[20%] w-px bg-primary/10" />
      <div className="absolute inset-y-0 left-[40%] w-px bg-primary/10" />
      <div className="absolute inset-y-0 left-[60%] w-px bg-primary/10" />
      <div className="absolute inset-y-0 left-[80%] w-px bg-primary/10" />

      {/* Horizontal lines */}
      <div className="absolute inset-x-0 top-[20%] h-px bg-primary/10" />
      <div className="absolute inset-x-0 top-[40%] h-px bg-primary/10" />
      <div className="absolute inset-x-0 top-[60%] h-px bg-primary/10" />
      <div className="absolute inset-x-0 top-[80%] h-px bg-primary/10" />

      {/* Radar circles */}
      <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

      <div className="absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

      <div className="absolute left-1/2 top-1/2 h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

      {/* Radar center */}
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary shadow-[0_0_12px_rgba(229,169,0,0.8)]" />

      {/* Decorative route lines */}
      <div className="absolute left-[12%] top-[70%] h-px w-[68%] rotate-[-22deg] bg-primary/20" />

      <div className="absolute left-[28%] top-[72%] h-px w-[58%] rotate-[-48deg] bg-primary/20" />
    </div>
  );
}

/* =========================================================
   AIRCRAFT MARKER
========================================================= */

function AircraftMarker({
  flight,
  selected,
  onClick,
}) {
  const latitude = getLatitude(flight);
  const longitude = getLongitude(flight);

  const position = getRadarPosition(
    latitude,
    longitude
  );

  if (!position) {
    return null;
  }

  const status = getStatus(flight);

  const markerColor =
    status === "active"
      ? "border-primary bg-primary"
      : status === "scheduled"
      ? "border-tertiary bg-tertiary"
      : "border-secondary bg-secondary";

  return (
    <button
      type="button"
      onClick={onClick}
      title={getFlightNumber(flight)}
      style={position}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 ${markerColor} ${
          selected
            ? "scale-125 ring-4 ring-secondary/30"
            : "hover:scale-110"
        }`}
      >
        <Plane
          size={12}
          className="rotate-45 text-white"
        />

        {selected && (
          <span className="absolute inset-[-7px] animate-ping rounded-full border border-secondary/40" />
        )}
      </div>

      <span className="absolute left-1/2 top-8 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral/90 px-1.5 py-0.5 text-[8px] font-medium text-white group-hover:block sm:block">
        {getFlightNumber(flight)}
      </span>
    </button>
  );
}

/* =========================================================
   SELECTED FLIGHT CARD
========================================================= */

function SelectedFlightCard({
  flight,
  onClose,
}) {
  if (!flight) {
    return null;
  }

  const flightNumber =
    getFlightNumber(flight);

  const airline =
    getAirlineName(flight);

  const airlineCode =
    getAirlineCode(flight);

  const status =
    getStatus(flight);

  const departure =
    getDepartureAirport(flight);

  const arrival =
    getArrivalAirport(flight);

  const aircraft =
    getAircraftName(flight);

  const registration =
    getAircraftRegistration(flight);

  const altitude =
    getAltitude(flight);

  const speed =
    getSpeed(flight);

  const verticalSpeed =
    getVerticalSpeed(flight);

  const heading =
    getHeading(flight);

  const squawk =
    getSquawk(flight);

  return (
    <div className="absolute right-4 top-4 z-40 w-[290px] max-w-[calc(100%-32px)] overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral">
              {flightNumber}
            </h3>

            <StatusBadge status={status} />
          </div>

          <p className="mt-1 text-[10px] text-neutral-muted">
            {airline} · Flight Plan
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-neutral-muted transition hover:bg-background hover:text-neutral"
        >
          <X size={14} />
        </button>
      </div>

      {/* Aircraft */}
      <div className="border-b border-border bg-primary-light/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Plane size={17} />
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral">
              {aircraft}
            </p>

            <p className="mt-0.5 text-[10px] text-neutral-muted">
              Reg: {registration} · {airlineCode}
            </p>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <p className="text-xl font-bold text-neutral">
              {departure}
            </p>

            <p className="mt-1 text-[9px] text-neutral-muted">
              {getDepartureName(flight)}
            </p>

            <p className="mt-1 text-[9px] font-medium text-neutral-muted">
              {formatTime(
                flight?.departure?.scheduled
              )}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <Plane
              size={15}
              className="rotate-90 text-primary"
            />

            <div className="mt-1 h-px w-12 bg-primary/30" />
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-neutral">
              {arrival}
            </p>

            <p className="mt-1 text-[9px] text-neutral-muted">
              {getArrivalName(flight)}
            </p>

            <p className="mt-1 text-[9px] font-medium text-neutral-muted">
              {formatTime(
                flight?.arrival?.scheduled
              )}
            </p>
          </div>
        </div>

        {/* Flight metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-background p-3">
          <div>
            <p className="text-[8px] uppercase tracking-wide text-neutral-muted">
              Altitude
            </p>

            <p className="mt-1 text-xs font-bold text-neutral">
              {formatAltitude(altitude)}
            </p>

            <p className="text-[8px] text-neutral-muted">
              {formatFlightLevel(altitude)}
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-wide text-neutral-muted">
              Ground Speed
            </p>

            <p className="mt-1 text-xs font-bold text-neutral">
              {formatSpeed(speed)}
            </p>

            <p className="text-[8px] text-neutral-muted">
              {Math.round(speed * 0.539957 || 0)} kts
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-wide text-neutral-muted">
              Vert Speed
            </p>

            <p className="mt-1 text-xs font-bold text-neutral">
              {verticalSpeed
                ? `${Math.round(verticalSpeed)} fpm`
                : "N/A"}
            </p>

            <p className="text-[8px] text-neutral-muted">
              {verticalSpeed > 0
                ? "Climbing"
                : verticalSpeed < 0
                ? "Descending"
                : "Level"}
            </p>
          </div>
        </div>

        {/* Extra details */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[8px] uppercase text-neutral-muted">
              Heading
            </p>

            <p className="mt-1 text-[10px] font-semibold text-neutral">
              {heading
                ? `${Math.round(heading)}°`
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase text-neutral-muted">
              Squawk
            </p>

            <p className="mt-1 text-[10px] font-semibold text-neutral">
              {squawk}
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase text-neutral-muted">
              Position
            </p>

            <p className="mt-1 text-[10px] font-semibold text-neutral">
              {getLatitude(flight) !== null
                ? "LIVE"
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-primary-dark"
        >
          <Navigation size={12} />
          View Full Flight Details
        </button>

        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-[10px] font-semibold text-neutral transition hover:bg-background"
        >
          <Signal size={12} />
          Add to Tracked Flights
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FLIGHT TABLE
========================================================= */

function FlightMatrix({
  flights,
  selectedFlight,
  onSelect,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Table header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity
            size={14}
            className="text-primary"
          />

          <div>
            <h2 className="text-xs font-bold text-neutral">
              Addis Ababa FIR (HAAA) Live Transponder Stream
            </h2>

            <p className="mt-0.5 text-[9px] text-neutral-muted">
              ADS-B Mode-S
            </p>
          </div>
        </div>

        <span className="text-[9px] text-neutral-muted">
          Showing {flights.length} high-priority vectors
        </span>
      </div>

      {flights.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <Plane
              size={30}
              className="mx-auto text-neutral-muted"
            />

            <p className="mt-3 text-sm font-medium text-neutral">
              No flights found
            </p>

            <p className="mt-1 text-xs text-neutral-muted">
              Try changing your search or filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-background">
              <tr className="border-b border-border text-[8px] uppercase tracking-wider text-neutral-muted">
                <th className="px-4 py-2.5">
                  Callsign / Airline
                </th>

                <th className="px-4 py-2.5">
                  Route
                </th>

                <th className="px-4 py-2.5">
                  Altitude
                </th>

                <th className="px-4 py-2.5">
                  Ground Speed
                </th>

                <th className="px-4 py-2.5">
                  Squawk
                </th>

                <th className="px-4 py-2.5">
                  Status
                </th>

                <th className="px-4 py-2.5 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {flights.map((flight, index) => {
                const flightNumber =
                  getFlightNumber(flight);

                const isSelected =
                  selectedFlight === flight;

                const altitude =
                  getAltitude(flight);

                const speed =
                  getSpeed(flight);

                return (
                  <tr
                    key={`${flightNumber}-${index}`}
                    onClick={() =>
                      onSelect(flight)
                    }
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-primary-light/70"
                        : "hover:bg-background"
                    }`}
                  >
                    {/* Flight */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-primary-light text-primary"
                          }`}
                        >
                          <Plane size={12} />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-neutral">
                            {flightNumber}
                          </p>

                          <p className="mt-0.5 text-[8px] text-neutral-muted">
                            {getAirlineName(flight)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-neutral">
                          {getDepartureAirport(
                            flight
                          )}
                        </span>

                        <ArrowDown
                          size={10}
                          className="-rotate-90 text-primary"
                        />

                        <span className="text-[10px] font-semibold text-neutral">
                          {getArrivalAirport(
                            flight
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-[8px] text-neutral-muted">
                        {formatTime(
                          flight?.departure?.scheduled
                        )}{" "}
                        →{" "}
                        {formatTime(
                          flight?.arrival?.scheduled
                        )}
                      </p>
                    </td>

                    {/* Altitude */}
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-semibold text-neutral">
                        {formatAltitude(altitude)}
                      </p>

                      <p className="mt-0.5 text-[8px] text-neutral-muted">
                        {formatFlightLevel(altitude)}
                      </p>
                    </td>

                    {/* Speed */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Gauge
                          size={11}
                          className="text-neutral-muted"
                        />

                        <span className="text-[10px] font-medium text-neutral">
                          {speed
                            ? `${Math.round(speed)} km/h`
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Squawk */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium text-neutral">
                        {getSquawk(flight)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={getStatus(flight)}
                      />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(flight);
                        }}
                        className="rounded-md p-1.5 text-neutral-muted transition hover:bg-primary-light hover:text-primary"
                      >
                        <Navigation size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LiveFlights() {
  const [flights, setFlights] =
    useState([]);

  const [selectedFlight, setSelectedFlight] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [airlineFilter, setAirlineFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [altitudeFilter, setAltitudeFilter] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  /* =======================================================
     LOAD FLIGHTS
  ======================================================= */

  const loadFlights = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getLiveFlights({
            limit: 100,
            offset: 0,
          });

        const incomingFlights =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.flights)
            ? response.flights
            : Array.isArray(response?.results)
            ? response.results
            : [];

        setFlights(incomingFlights);

        setLastUpdated(new Date());

        setSelectedFlight((current) => {
          if (!current) {
            return incomingFlights[0] || null;
          }

          const currentNumber =
            getFlightNumber(current);

          return (
            incomingFlights.find(
              (flight) =>
                getFlightNumber(flight) ===
                currentNumber
            ) ||
            incomingFlights[0] ||
            null
          );
        });
      } catch (err) {
        console.error(
          "Live flights error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load live flight data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadFlights({
          silent: true,
        });
      }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadFlights]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch = async (
    event
  ) => {
    event?.preventDefault();

    const value = search.trim();

    if (!value) {
      loadFlights();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await searchFlight(value);

      const results =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.flights)
          ? response.flights
          : [];

      setFlights(results);

      setSelectedFlight(
        results[0] || null
      );

      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Flight search error:",
        err
      );

      setError(
        err?.message ||
          "Unable to search for this flight."
      );

      setFlights([]);
      setSelectedFlight(null);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     AIRLINE OPTIONS
  ======================================================= */

  const airlineOptions =
    useMemo(() => {
      const airlines = new Set();

      flights.forEach((flight) => {
        const airline =
          getAirlineName(flight);

        if (
          airline &&
          airline !== "Unknown Airline"
        ) {
          airlines.add(airline);
        }
      });

      return Array.from(airlines).sort();
    }, [flights]);

  /* =======================================================
     FILTERED FLIGHTS
  ======================================================= */

  const filteredFlights =
    useMemo(() => {
      return flights.filter(
        (flight) => {
          const flightNumber =
            getFlightNumber(flight);

          const airline =
            getAirlineName(flight);

          const status =
            getStatus(flight);

          const altitude =
            getAltitude(flight);

          const searchValue =
            search.toLowerCase();

          const matchesSearch =
            !search.trim() ||
            flightNumber
              .toLowerCase()
              .includes(searchValue) ||
            airline
              .toLowerCase()
              .includes(searchValue);

          const matchesAirline =
            !airlineFilter ||
            airline === airlineFilter;

          const matchesStatus =
            !statusFilter ||
            status === statusFilter;

          const matchesAltitude =
            !altitudeFilter ||
            getAltitudeCategory(
              altitude
            ) === altitudeFilter;

          return (
            matchesSearch &&
            matchesAirline &&
            matchesStatus &&
            matchesAltitude
          );
        }
      );
    }, [
      flights,
      search,
      airlineFilter,
      statusFilter,
      altitudeFilter,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(() => {
      const positioned =
        filteredFlights.filter(
          (flight) =>
            getLatitude(flight) !==
              null &&
            getLongitude(flight) !==
              null
        ).length;

      const active =
        filteredFlights.filter(
          (flight) =>
            getStatus(flight) ===
            "active"
        ).length;

      return {
        total: filteredFlights.length,
        positioned,
        active,
      };
    }, [filteredFlights]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    flights.length === 0
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
            <RefreshCw
              size={20}
              className="animate-spin text-primary"
            />
          </div>

          <h2 className="mt-4 text-sm font-bold text-neutral">
            Loading live flights
          </h2>

          <p className="mt-1 text-xs text-neutral-muted">
            Connecting to AviationStack...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-background p-4 lg:p-5">

      {/* ===================================================
          TOP TOOLBAR
      =================================================== */}

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-1 gap-2"
        >
          <div className="relative max-w-md flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search flight, callsign or airline..."
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-8 text-[10px] text-neutral outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadFlights();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-[10px] font-semibold text-white transition hover:bg-primary-dark"
          >
            Search
          </button>
        </form>

        {/* Status indicators */}
        <div className="flex items-center gap-2">

          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

            <span className="text-[9px] font-semibold text-neutral">
              {statistics.total} Aircraft Monitored
            </span>
          </div>

          <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-white px-3 sm:flex">
            <Radio
              size={12}
              className="text-primary"
            />

            <span className="text-[9px] font-semibold text-neutral">
              15s AUTO
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadFlights({
                silent: true,
              })
            }
            disabled={refreshing}
            className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-[9px] font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            <RefreshCw
              size={12}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh Now
          </button>
        </div>
      </div>

      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">

        {/* Airline */}
        <div className="relative">
          <SlidersHorizontal
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted"
          />

          <select
            value={airlineFilter}
            onChange={(event) =>
              setAirlineFilter(
                event.target.value
              )
            }
            className="h-8 w-full appearance-none rounded-md border border-border bg-white pl-8 pr-8 text-[9px] font-medium text-neutral outline-none focus:border-primary sm:w-52"
          >
            <option value="">
              All Airlines
            </option>

            {airlineOptions.map(
              (airline) => (
                <option
                  key={airline}
                  value={airline}
                >
                  {airline}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-8 w-full appearance-none rounded-md border border-border bg-white px-3 pr-8 text-[9px] font-medium text-neutral outline-none focus:border-primary sm:w-36"
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted"
          />
        </div>

        {/* Altitude */}
        <div className="relative">
          <select
            value={altitudeFilter}
            onChange={(event) =>
              setAltitudeFilter(
                event.target.value
              )
            }
            className="h-8 w-full appearance-none rounded-md border border-border bg-white px-3 pr-8 text-[9px] font-medium text-neutral outline-none focus:border-primary sm:w-48"
          >
            {ALTITUDE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted"
          />
        </div>

        <div className="ml-auto hidden items-center gap-2 text-[9px] text-neutral-muted lg:flex">
          <Clock3 size={12} />

          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString(
                "en-ET",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                }
              )}`
            : "Waiting for update"}
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ===================================================
          RADAR
      =================================================== */}

      <div className="relative mb-4 overflow-hidden rounded-lg border border-neutral bg-[#06140F] shadow-sm">

        {/* Radar header */}
        <div className="absolute left-3 top-3 z-30 flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded bg-neutral/80 px-2 py-1 text-[8px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Live High
          </div>

          <div className="hidden items-center gap-1.5 rounded bg-neutral/70 px-2 py-1 text-[8px] text-white/70 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            IFR / Scheduled
          </div>

          <div className="hidden items-center gap-1.5 rounded bg-neutral/70 px-2 py-1 text-[8px] text-white/70 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            High Altitude
          </div>
        </div>

        {/* Radar */}
        <div className="relative h-[390px] w-full overflow-hidden bg-[#06140F]">

          <RadarGrid />

          {/* Region labels */}
          <span className="absolute left-[32%] top-[25%] z-10 text-[8px] font-medium uppercase tracking-widest text-white/20">
            East Africa
          </span>

          <span className="absolute right-[16%] top-[36%] z-10 text-[8px] font-medium uppercase tracking-widest text-white/20">
            Arabian Sea
          </span>

          <span className="absolute left-[44%] bottom-[16%] z-10 text-[8px] font-medium uppercase tracking-widest text-white/20">
            Indian Ocean
          </span>

          {/* Aircraft */}
          {filteredFlights
            .filter(
              (flight) =>
                getLatitude(flight) !==
                  null &&
                getLongitude(flight) !==
                  null
            )
            .slice(0, 60)
            .map(
              (flight, index) => (
                <AircraftMarker
                  key={`${getFlightNumber(
                    flight
                  )}-${index}`}
                  flight={flight}
                  selected={
                    selectedFlight ===
                    flight
                  }
                  onClick={() =>
                    setSelectedFlight(
                      flight
                    )
                  }
                />
              )
            )}

          {/* No positions */}
          {filteredFlights.filter(
            (flight) =>
              getLatitude(flight) !==
                null &&
              getLongitude(flight) !==
                null
          ).length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center">
                <MapPin
                  size={28}
                  className="mx-auto text-white/20"
                />

                <p className="mt-2 text-xs font-medium text-white/60">
                  No live positions available
                </p>

                <p className="mt-1 text-[9px] text-white/30">
                  AviationStack did not provide coordinates
                </p>
              </div>
            </div>
          )}

          {/* Selected flight */}
          <SelectedFlightCard
            flight={selectedFlight}
            onClose={() =>
              setSelectedFlight(null)
            }
          />

          {/* Radar controls */}
          <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded bg-neutral/80 text-white/70 hover:text-white"
            >
              +
            </button>

            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded bg-neutral/80 text-white/70 hover:text-white"
            >
              −
            </button>

            <button
              type="button"
              className="ml-1 flex h-6 items-center gap-1 rounded bg-neutral/80 px-2 text-[8px] text-white/70 hover:text-white"
            >
              <MapPin size={9} />
              Re-center ADD
            </button>
          </div>

          {/* Radar label */}
          <div className="absolute bottom-3 right-3 z-30 rounded bg-neutral/80 px-2 py-1 text-[8px] uppercase tracking-wider text-white/50">
            Live Radar · East Africa
          </div>
        </div>
      </div>

      {/* ===================================================
          FLIGHT MATRIX
      =================================================== */}

      <FlightMatrix
        flights={filteredFlights}
        selectedFlight={selectedFlight}
        onSelect={setSelectedFlight}
      />

      {/* ===================================================
          FOOTER INFO
      =================================================== */}

      <div className="mt-3 flex flex-col gap-1 text-[8px] text-neutral-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Live flight data powered by AviationStack
        </span>

        <span>
          Automatic refresh every{" "}
          {REFRESH_INTERVAL / 1000} seconds
        </span>
      </div>
    </div>
  );
}