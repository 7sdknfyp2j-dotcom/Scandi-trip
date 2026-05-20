const CITIES = [
  {
    name: "Stockholm",
    latitude: 59.3293,
    longitude: 18.0686,
    timezone: "Europe/Stockholm"
  },
  {
    name: "Copenhagen",
    latitude: 55.6761,
    longitude: 12.5683,
    timezone: "Europe/Copenhagen"
  }
];

async function fetchWeather(city) {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: city.timezone,
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    forecast_days: "7"
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Weather failed for ${city.name}`);
  }

  return {
    ...city,
    current: data.current,
    daily: data.daily
  };
}

export async function onRequest() {
  try {
    const cities = await Promise.all(CITIES.map(fetchWeather));

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: new Date().toISOString(),
        cities
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
