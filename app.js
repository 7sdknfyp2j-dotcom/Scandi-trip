const DEPARTURE = new Date("2026-08-10T20:00:00-04:00");

const countdownEl = document.getElementById("countdown");
const weatherGrid = document.getElementById("weatherGrid");
const weatherUpdated = document.getElementById("weatherUpdated");
const activityGrid = document.getElementById("activityGrid");
const activityUpdated = document.getElementById("activityUpdated");
const refreshButton = document.getElementById("refreshButton");

function formatUpdated(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(0, DEPARTURE - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  countdownEl.innerHTML = `
    <div class="count-box">
      <div class="count-num">${days}</div>
      <div class="count-label">Days</div>
    </div>
    <div class="count-box">
      <div class="count-num">${hours}</div>
      <div class="count-label">Hours</div>
    </div>
    <div class="count-box">
      <div class="count-num">${mins}</div>
      <div class="count-label">Mins</div>
    </div>
    <div class="count-box">
      <div class="count-num">${secs}</div>
      <div class="count-label">Secs</div>
    </div>
  `;
}

function weatherCodeText(code) {
  const map = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm with hail"
  };

  return map[code] || "Forecast";
}

function formatForecastDay(dateString) {
  try {
    return new Date(dateString + "T12:00:00").toLocaleDateString([], {
      weekday: "short"
    });
  } catch {
    return dateString;
  }
}

async function fetchJson(url) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(url + separator + "ts=" + Date.now(), {
    cache: "no-store"
  });

  return response.json();
}

function renderWeather(data) {
  if (!data.ok) {
    throw new Error(data.error || "Weather failed.");
  }

  weatherUpdated.textContent = `Updated ${formatUpdated(data.updatedAt)}`;

  weatherGrid.innerHTML = data.cities.map(city => {
    const currentTemp = Math.round(city.current.temperature_2m);
    const wind = Math.round(city.current.wind_speed_10m);
    const currentDescription = weatherCodeText(city.current.weather_code);

    const sevenDayForecast = city.daily.time.slice(0, 7).map((date, i) => {
      const day = formatForecastDay(date);
      const high = Math.round(city.daily.temperature_2m_max[i]);
      const low = Math.round(city.daily.temperature_2m_min[i]);
      const rainChance = city.daily.precipitation_probability_max
        ? city.daily.precipitation_probability_max[i]
        : null;
      const condition = weatherCodeText(city.daily.weather_code[i]);

      return `
        <div style="
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          border-top: 1px solid rgba(255,255,255,.14);
        ">
          <div>
            <strong>${escapeHtml(day)}</strong>
            <div style="opacity:.75; font-size:12px;">${escapeHtml(condition)}</div>
          </div>
          <div style="text-align:right;">
            <strong>${high}° / ${low}°</strong>
            <div style="opacity:.75; font-size:12px;">
              ${rainChance === null ? "" : `${rainChance}% rain`}
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="weather-card">
        <div class="city-name">${escapeHtml(city.name)}</div>

        <div class="temp">${currentTemp}°F</div>

        <div class="weather-meta" style="margin-bottom: 12px;">
          ${escapeHtml(currentDescription)}<br>
          Wind: ${wind} mph
        </div>

        <div class="weather-meta">
          ${sevenDayForecast}
        </div>
      </div>
    `;
  }).join("");
}

function renderActivities(data) {
  if (!data.ok) {
    throw new Error(data.error || "Activities failed.");
  }

  activityUpdated.textContent = `Updated ${formatUpdated(data.updatedAt)}`;

  activityGrid.innerHTML = data.cities.map(city => `
    <div class="activity-card">
      <div class="badge">${escapeHtml(city.dates)}</div>

      <div class="city-name">${escapeHtml(city.name)}</div>

      <div class="activity-meta">
        ${escapeHtml(city.description)}
      </div>

      <div class="activity-grid">
        ${city.links.map(link => `
          <a class="link-card" href="${link.url}" target="_blank" rel="noreferrer">
            <strong>${escapeHtml(link.title)}</strong>
            <span class="activity-meta">${escapeHtml(link.note)}</span>
          </a>
        `).join("")}
      </div>
    </div>
  `).join("");
}

async function refreshAll() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing…";

  weatherGrid.innerHTML = `<div class="weather-card">Loading weather…</div>`;
  activityGrid.innerHTML = `<div class="activity-card">Loading activity ideas…</div>`;

  try {
    const [weather, activities] = await Promise.all([
      fetchJson("/api/weather"),
      fetchJson("/api/activities")
    ]);

    renderWeather(weather);
    renderActivities(activities);
  } catch (err) {
    const message = escapeHtml(err.message);

    weatherGrid.innerHTML = `
      <div class="weather-card error">
        Could not refresh weather or activities: ${message}
      </div>
    `;

    activityGrid.innerHTML = `
      <div class="activity-card error">
        Try refreshing again, or check the API endpoints directly.
      </div>
    `;
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh Weather + Activities";
  }
}

refreshButton.addEventListener("click", refreshAll);

updateCountdown();
setInterval(updateCountdown, 1000);

refreshAll();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
