# Living Room Dashboard

A TV-first dashboard designed to run as an application module inside TizenBrew. It includes a live clock, optional city weather, a local watchlist, and a TizenTube shortcut.

## Preview locally

```powershell
npm run dev
```

Open `http://127.0.0.1:5177/` in a browser. Weather uses the free Open-Meteo geocoding and forecast endpoints; no API key is required. The watchlist and city are stored in the browser's local storage.

## TizenBrew module

The root `package.json` contains the TizenBrew module fields. The public GitHub repository is `beingkha3/TizenBrewDashboard`; use that `user/repo` value as the GitHub source in TizenBrew. The first published version is available as release `v0.1.0`.

The dashboard's TizenTube shortcut uses TizenBrew's app-control handoff. It falls back to an on-screen message when opened in a regular desktop browser.
