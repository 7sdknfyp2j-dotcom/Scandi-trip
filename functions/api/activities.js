function googleSearch(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const STOCKHOLM_API_BASE = "https://api.visitstockholm.com/api";

async function tryFetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });

  const text = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(text),
      text
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      text
    };
  }
}

function findArray(value) {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== "object") return [];

  const likelyKeys = [
    "items",
    "data",
    "results",
    "events",
    "occurrences",
    "products",
    "content"
  ];

  for (const key of likelyKeys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findArray(child);
    if (found.length) return found;
  }

  return [];
}

function get(obj, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc && acc[key], obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function normalizeStockholmEvent(item) {
  const title =
    get(item, [
      "name.en",
      "name",
      "title.en",
      "title",
      "heading.en",
      "heading"
    ]) || "Stockholm activity";

  const description =
    get(item, [
      "description.en",
      "description",
      "shortDescription.en",
      "shortDescription",
      "preamble.en",
      "preamble"
    ]) || "";

  const place =
    get(item, [
      "place.name.en",
      "place.name",
      "venue.name.en",
      "venue.name",
      "location.name.en",
      "location.name",
      "address.name"
    ]) || "";

  const start =
    get(item, [
      "startDate",
      "start",
      "startsAt",
      "occurrence.startDate",
      "occurrences.0.startDate"
    ]) || "";

  const end =
    get(item, [
      "endDate",
      "end",
      "endsAt",
      "occurrence.endDate",
      "occurrences.0.endDate"
    ]) || "";

  const url =
    get(item, [
      "url.en",
      "url",
      "link.en",
      "link",
      "website.en",
      "website"
    ]) || "https://www.visitstockholm.com/events/";

  return {
    title: String(title).trim(),
    note: [place, start ? `Starts: ${start}` : "", end ? `Ends: ${end}` : ""]
      .filter(Boolean)
      .join(" • "),
    description: String(description).replace(/<[^>]*>/g, "").slice(0, 180),
    url
  };
}

async function fetchStockholmEvents() {
  /*
    Visit Stockholm Open API exposes public event and occurrence data.
    Its docs describe public access to event/occurrence data managed by Stockholm Business Region.
    If the exact endpoint changes, this tries several likely documented endpoint patterns.
  */
  const candidateUrls = [
    `${STOCKHOLM_API_BASE}/events?from=2026-08-11&to=2026-08-16&language=en`,
    `${STOCKHOLM_API_BASE}/events?startDate=2026-08-11&endDate=2026-08-16&language=en`,
    `${STOCKHOLM_API_BASE}/occurrences?from=2026-08-11&to=2026-08-16&language=en`,
    `${STOCKHOLM_API_BASE}/occurrences?startDate=2026-08-11&endDate=2026-08-16&language=en`
  ];

  for (const url of candidateUrls) {
    try {
      const result = await tryFetchJson(url);
      const items = findArray(result.data);

      if (result.ok && items.length) {
        return {
          source: url,
          events: items.slice(0, 12).map(normalizeStockholmEvent)
        };
      }
    } catch {
      // Try the next endpoint shape.
    }
  }

  return {
    source: "fallback",
    events: []
  };
}

export async function onRequest() {
  const stockholm = await fetchStockholmEvents();

  const stockholmLinks =
    stockholm.events.length > 0
      ? stockholm.events.map(event => ({
          title: event.title,
          note: event.note || event.description || "Stockholm event",
          url: event.url
        }))
      : [
          {
            title: "Visit Stockholm events calendar",
            note: "Official event calendar. Use this if the Open API has no Aug 2026 results yet.",
            url: "https://www.visitstockholm.com/events/"
          },
          {
            title: "Stockholm events Aug 11–16",
            note: "Live search for your exact dates.",
            url: googleSearch("Stockholm events August 11 16 2026 family food culture")
          },
          {
            title: "Stockholm nature + archipelago ideas",
            note: "Nature, ferry, island, and kid-friendly ideas.",
            url: googleSearch("Stockholm archipelago nature family activities August")
          },
          {
            title: "Stockholm food + fika ideas",
            note: "Cafes, food halls, bakeries, and easy family stops.",
            url: googleSearch("Stockholm food halls cafes fika family friendly August")
          }
        ];

  const cities = [
    {
      name: "Stockholm",
      dates: "Aug 11–16, 2026",
      description:
        stockholm.events.length > 0
          ? "Live events pulled from the Visit Stockholm Open API."
          : "Visit Stockholm Open API returned no dated events yet, so this shows official/fallback activity links.",
      source: stockholm.source,
      links: stockholmLinks
    },
    {
      name: "Copenhagen",
      dates: "Aug 16–20, 2026",
      description:
        "Copenhagen stays as fallback links for now while we focus on Stockholm's Open API.",
      links: [
        {
          title: "Visit Copenhagen events",
          note: "Official tourism/event source.",
          url: "https://www.visitcopenhagen.com/copenhagen/events"
        },
        {
          title: "Copenhagen events Aug 16–20",
          note: "Live search for your exact dates.",
          url: googleSearch("Copenhagen events August 16 20 2026 family food culture")
        },
        {
          title: "Copenhagen food + neighborhoods",
          note: "Food markets, bakeries, canals, and easy family wandering.",
          url: googleSearch("best Copenhagen food markets bakeries family friendly August")
        }
      ]
    }
  ];

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
}
