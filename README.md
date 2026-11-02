# Living Room Dashboard

A TV-first dashboard designed to run as an application module inside TizenBrew. It includes a live clock, optional city weather, a local watchlist, and a TizenTube shortcut.

## Preview locally

```powershell
npm run dev
```

Open `http://127.0.0.1:5177/` in a browser. Weather uses the free Open-Meteo geocoding and forecast endpoints, with wttr.in as a fallback if the forecast service is unavailable; no API key is required. Choose °F or °C in the weather card. The city, unit preference, and watchlist are stored in the browser's local storage.

## TizenBrew module

The root `package.json` contains the TizenBrew module fields. The public GitHub repository is `beingkha3/TizenBrewDashboard`; use that `user/repo` value as the GitHub source in TizenBrew. The latest version and signed WGT are available from the [GitHub releases](https://github.com/beingkha3/TizenBrewDashboard/releases).

The dashboard's TizenTube shortcut uses TizenBrew's app-control handoff. It falls back to an on-screen message when opened in a regular desktop browser.
