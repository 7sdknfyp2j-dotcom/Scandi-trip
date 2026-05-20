function googleSearch(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const CITIES = [
  {
    name: "Stockholm",
    dates: "Aug 11–16, 2026",
    description: "Nature, food, culture, family-friendly ideas, and current event listings for your Stockholm dates.",
    links: [
      { title: "Live search: Stockholm events Aug 11–16", note: "Broad live search for events during your exact dates.", url: googleSearch("Stockholm events August 11 16 2026 family food culture") },
      { title: "Visit Stockholm events", note: "Official tourism/event source.", url: "https://www.visitstockholm.com/events/" },
      { title: "Stockholm food + fika ideas", note: "Food-forward search for cafes, halls, and family stops.", url: googleSearch("best Stockholm food halls cafes fika family friendly August") },
      { title: "Stockholm nature day ideas", note: "Parks, islands, ferries, and easy nature escapes.", url: googleSearch("Stockholm nature day trips family August Vaxholm Djurgarden archipelago") }
    ]
  },
  {
    name: "Copenhagen",
    dates: "Aug 16–20, 2026",
    description: "Date-aware searches for Copenhagen activities, food, Tivoli, canals, design, and family-friendly events.",
    links: [
      { title: "Live search: Copenhagen events Aug 16–20", note: "Broad live search for events during your exact dates.", url: googleSearch("Copenhagen events August 16 20 2026 family food culture") },
      { title: "Visit Copenhagen events", note: "Official tourism/event source.", url: "https://www.visitcopenhagen.com/copenhagen/events" },
      { title: "Copenhagen food + neighborhoods", note: "Food markets, bakeries, canals, and easy family wandering.", url: googleSearch("best Copenhagen food markets bakeries family friendly August") },
      { title: "Copenhagen family attractions", note: "Tivoli, canals, Experimentarium, parks, and kid-friendly ideas.", url: googleSearch("Copenhagen family activities August Tivoli canals Experimentarium") }
    ]
  }
];

export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, updatedAt: new Date().toISOString(), cities: CITIES }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}