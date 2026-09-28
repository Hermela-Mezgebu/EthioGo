const API_BASE_URL =
  import.meta.env.VITE_AVIATIONSTACK_BASE_URL ||
  "https://api.aviationstack.com/v1";

const API_KEY = import.meta.env.VITE_AVIATIONSTACK_ACCESS_KEY;

async function aviationRequest(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error(
      "AviationStack API key is missing. Add VITE_AVIATIONSTACK_ACCESS_KEY to your .env file."
    );
  }

  const searchParams = new URLSearchParams({
    access_key: API_KEY,
    ...params,
  });

  const response = await fetch(
    `${API_BASE_URL}/${endpoint}?${searchParams.toString()}`
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `HTTP ${response.status}`;

    throw new Error(
      `AviationStack request failed with status ${response.status}: ${message}`
    );
  }

  if (data?.error) {
    throw new Error(
      data.error.message ||
        data.error.info ||
        "AviationStack returned an API error."
    );
  }

  return data;
}

export async function getLiveFlights({
  depIata,
  arrIata,
  flightNumber,
  flightStatus,
  flightDate,
  limit = 100,
  offset = 0,
} = {}) {
  const params = {
    limit,
    offset,
  };

  if (depIata) params.dep_iata = depIata;
  if (arrIata) params.arr_iata = arrIata;
  if (flightNumber) params.flight_number = flightNumber;
  if (flightStatus) params.flight_status = flightStatus;
  if (flightDate) params.flight_date = flightDate;

  return aviationRequest("flights", params);
}

export async function searchFlight(flightNumber) {
  return getLiveFlights({
    flightNumber,
    limit: 10,
  });
}

export async function getAirlines({
  search,
  limit = 100,
  offset = 0,
} = {}) {
  const params = {
    limit,
    offset,
  };

  if (search) params.search = search;

  return aviationRequest("airlines", params);
}

export async function getAirports({
  search,
  limit = 100,
  offset = 0,
} = {}) {
  const params = {
    limit,
    offset,
  };

  if (search) params.search = search;

  return aviationRequest("airports", params);
}

export async function getRoutes({
  airlineIata,
  depIata,
  arrIata,
  limit = 100,
  offset = 0,
} = {}) {
  const params = {
    limit,
    offset,
  };

  if (airlineIata) params.airline_iata = airlineIata;
  if (depIata) params.dep_iata = depIata;
  if (arrIata) params.arr_iata = arrIata;

  return aviationRequest("routes", params);
}