# Living Room Dashboard

A simple TV home screen designed to run as an application module inside TizenBrew. It has direct shortcuts for TizenTube, Jellyfin, and NuvioTV, plus a clock and optional local weather.

## Preview locally

```powershell
npm run dev
```

Open `http://127.0.0.1:5177/` in a browser. Weather uses the free Open-Meteo geocoding and forecast endpoints, with wttr.in as a fallback if the forecast service is unavailable; no API key is required. Choose °F or °C in the weather card. Your city and temperature preference are saved in the browser.

## Customize app shortcuts

Choose **Add app** on the dashboard to add a shortcut. Enter the app name and its Tizen app ID; category and short description are optional. You can edit app details, use the up/down arrows to change shortcut order, or remove apps from the same screen. Your app list is saved on that TV or browser. The first-run defaults are kept separately in `app/apps.js`; managing shortcuts does not require editing code.

Known streaming apps are recognized from their name or Tizen app ID and get a matching icon. Other apps get a stable color and initials based on their name and ID. The root `icon.png` is the labeled dashboard launcher icon used when packaging the WGT.

## TizenBrew module

The root `package.json` contains the TizenBrew module fields. The public GitHub repository is `beingkha3/TizenBrewDashboard`; use that `user/repo` value as the GitHub source in TizenBrew. The latest version and signed WGT are available from the [GitHub releases](https://github.com/beingkha3/TizenBrewDashboard/releases).

On the TV, each app shortcut opens the installed app directly. The apps need to be installed on the TV first. In a desktop browser, the shortcuts show a reminder because the Tizen application API is only available on the TV.
