# Scandi Trip Countdown

A Cloudflare Pages app for a Stockholm + Copenhagen family trip.

## Features

- Countdown to August 10, 2026 departure
- Live weather forecast for Stockholm and Copenhagen using Open-Meteo
- Activity finder links for:
  - Stockholm: Aug 11–16, 2026
  - Copenhagen: Aug 16–20, 2026
- Sweden/Denmark-inspired design
- iPhone Home Screen support

## Cloudflare Pages setup

Upload the contents of this folder to a GitHub repository root:

- index.html
- app.js
- manifest.json
- service-worker.js
- icons/
- functions/api/weather.js
- functions/api/activities.js
- README.md

Use:
- Framework preset: None
- Build command: leave blank
- Deploy command: echo "Deploy complete" if required
- Root directory: leave blank
- Build output directory: . if asked

Test endpoints:
- /api/weather
- /api/activities
