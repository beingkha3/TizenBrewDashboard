import {
  formatClockTime,
  preferredTimeFormat,
  temperatureSuffix,
  temperatureUnit,
  weatherDescription,
  weatherSymbol,
  weatherSymbolFromDescription,
} from './core.js';
import {
  createAppEntry,
  DEFAULT_APPS,
  MAX_APPS,
  normalizeAppList,
  reorderAppList,
  updateAppEntry,
} from './apps.js';

const STORAGE_KEYS = {
  apps: 'living-room-dashboard-apps-v1',
  city: 'living-room-dashboard-city-v1',
  temperatureUnit: 'living-room-dashboard-temperature-unit-v1',
  timeFormat: 'living-room-dashboard-time-format-v1',
};

const elements = {
  addAppButton: document.getElementById('add-app'),
  appCategoryInput: document.getElementById('new-app-category'),
  appDescriptionInput: document.getElementById('new-app-description'),
  appEmpty: document.getElementById('apps-empty'),
  appError: document.getElementById('app-manager-error'),
  appForm: document.getElementById('app-form'),
  appFormTitle: document.getElementById('app-form-title'),
  appGrid: document.getElementById('shortcut-grid'),
  appIdInput: document.getElementById('new-app-id'),
  appManagerEmpty: document.getElementById('app-manager-empty'),
  appManagerList: document.getElementById('app-manager-list'),
  appManagerModal: document.getElementById('app-manager-modal'),
  appNameInput: document.getElementById('new-app-name'),
  appSubmitButton: document.getElementById('add-app-submit'),
  cancelAppEdit: document.getElementById('cancel-app-edit'),
  cancelModal: document.getElementById('cancel-modal'),
  cancelAppManager: document.getElementById('cancel-app-manager'),
  cityButton: document.getElementById('set-city'),
  clock: document.getElementById('clock'),
  closeModal: document.getElementById('close-modal'),
  closeAppManager: document.getElementById('close-app-manager'),
  date: document.getElementById('date'),
  entryForm: document.getElementById('entry-form'),
  entryInput: document.getElementById('entry-input'),
  entryLabel: document.getElementById('entry-label'),
  greeting: document.getElementById('greeting'),
  modal: document.getElementById('entry-modal'),
  modalDescription: document.getElementById('modal-description'),
  modalError: document.getElementById('modal-error'),
  modalTitle: document.getElementById('modal-title'),
  refreshWeather: document.getElementById('refresh-weather'),
  toast: document.getElementById('toast'),
  temperatureUnits: document.getElementById('temperature-units'),
  timeFormat: document.getElementById('time-format'),
  weatherCity: document.getElementById('weather-city'),
  weatherCondition: document.getElementById('weather-condition'),
  weatherDisplay: document.getElementById('weather-display'),
  weatherStatus: document.getElementById('weather-status'),
  weatherSymbol: document.getElementById('weather-symbol'),
  weatherTemperature: document.getElementById('weather-temperature'),
};

let modalReturnFocus = null;
let toastTimeout = null;
let weatherRequest = 0;
let editingAppId = null;
let apps = readAppList();
let city = readCity();
let selectedTemperatureUnit = readTemperatureUnit();
let selectedTimeFormat = readTimeFormat();

function safeRead(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    showToast('Could not save on this device.');
    return false;
  }
}

function readCity() {
  return (safeRead(STORAGE_KEYS.city) || '').trim().slice(0, 80);
}

function readTemperatureUnit() {
  const saved = safeRead(STORAGE_KEYS.temperatureUnit);
  return saved === 'fahrenheit' || saved === 'celsius' ? saved : temperatureUnit(currentLocale());
}

function readTimeFormat() {
  const saved = safeRead(STORAGE_KEYS.timeFormat);
  return saved === '12' || saved === '24' ? saved : preferredTimeFormat(currentLocale());
}

function readAppList() {
  const saved = safeRead(STORAGE_KEYS.apps);
  if (saved === null) return normalizeAppList(DEFAULT_APPS);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? normalizeAppList(parsed) : normalizeAppList(DEFAULT_APPS);
  } catch {
    return normalizeAppList(DEFAULT_APPS);
  }
}

function saveAppList(nextApps) {
  const normalized = normalizeAppList(nextApps);
  if (!safeWrite(STORAGE_KEYS.apps, JSON.stringify(normalized))) return false;

  apps = normalized;
  renderApps();
  renderAppManagerList();
  return true;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const APP_ICON_MARKS = {
  netflix: 'N',
  'prime-video': '▶',
  'disney-plus': 'D+',
  plex: 'P',
  'hbo-max': 'M',
  hulu: 'hulu',
  twitch: 'T',
  'apple-tv': 'tv',
  crunchyroll: 'C',
};

function appendSvgShape(svg, tagName, attributes) {
  const shape = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, value));
  svg.append(shape);
}

function createBrandSvg(appIcon) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.classList.add('shortcut-icon-art');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('focusable', 'false');

  if (appIcon === 'nuvio') {
    appendSvgShape(svg, 'path', {
      d: 'M11 36V12l26 24V12',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
  } else if (appIcon === 'jellyfin') {
    appendSvgShape(svg, 'path', {
      d: 'M8 21C8 11.6 14.8 5 24 5s16 6.6 16 16c0 5.5-3.9 8.7-9 10l2 9-6-7-3 9-4-9-6 7 1.7-9C11 29.5 8 26.2 8 21Z',
      fill: 'currentColor',
    });
    appendSvgShape(svg, 'circle', { cx: '19', cy: '20', r: '2', fill: '#17142b' });
    appendSvgShape(svg, 'circle', { cx: '29', cy: '20', r: '2', fill: '#17142b' });
  } else if (appIcon === 'spotify') {
    appendSvgShape(svg, 'circle', { cx: '24', cy: '24', r: '19', fill: 'currentColor' });
    appendSvgShape(svg, 'path', {
      d: 'M13 19c8-2 15-1 22 3M15 25c7-2 13-1 18 2M17 31c5-1 10 0 14 2',
      fill: 'none',
      stroke: '#10291f',
      'stroke-width': '3',
      'stroke-linecap': 'round',
    });
  } else if (appIcon === 'twitch') {
    appendSvgShape(svg, 'path', {
      d: 'M10 7h30v23l-9 9h-8l-5 5v-5h-8V14l3-7Z',
      fill: 'currentColor',
    });
    appendSvgShape(svg, 'path', {
      d: 'M22 16v9m9-9v9',
      fill: 'none',
      stroke: '#fff',
      'stroke-width': '3',
      'stroke-linecap': 'round',
    });
  }

  return svg;
}

function getCustomIconHue(appId) {
  let hash = 0;
  for (let index = 0; index < appId.length; index += 1) {
    hash = (hash * 31 + appId.charCodeAt(index)) >>> 0;
  }
  return hash % 360;
}

function getAppMonogram(name) {
  const words = name.trim().split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1
    ? words.slice(0, 2).map((word) => Array.from(word)[0]).join('')
    : Array.from(words[0] || 'APP').slice(0, 2).join('');
  return letters.toUpperCase();
}

function createShortcutIcon(app) {
  const icon = document.createElement('span');
  icon.className = 'shortcut-icon';
  icon.classList.add(`${app.icon}-icon`);
  icon.setAttribute('aria-hidden', 'true');

  if (app.icon === 'custom') {
    icon.classList.add('custom-app-icon');
    icon.style.setProperty('--app-icon-hue', getCustomIconHue(app.appId));
    const mark = document.createElement('span');
    mark.className = 'shortcut-icon-mark';
    mark.textContent = getAppMonogram(app.name);
    icon.append(mark);
  } else if (app.icon === 'youtube') {
    const play = document.createElement('span');
    play.className = 'youtube-mark';
    play.textContent = '▶';
    icon.append(play);
  } else if (['nuvio', 'jellyfin', 'spotify', 'twitch'].includes(app.icon)) {
    icon.append(createBrandSvg(app.icon));
  } else {
    const mark = document.createElement('span');
    mark.className = 'shortcut-icon-mark';
    mark.textContent = APP_ICON_MARKS[app.icon] || getAppMonogram(app.name);
    icon.append(mark);
  }

  return icon;
}

function createAppButton(app, index) {
  const button = document.createElement('button');
  button.className = `shortcut-card ${index === 0 ? 'shortcut-primary' : 'shortcut-secondary'}`;
  button.type = 'button';
  button.dataset.appId = app.appId;
  button.dataset.appName = app.name;
  button.setAttribute('aria-label', `Open ${app.name}`);
  button.addEventListener('click', () => launchApp(app.appId, app.name));

  const icon = createShortcutIcon(app);

  const copy = document.createElement('span');
  copy.className = 'shortcut-copy';
  const category = document.createElement('span');
  category.className = 'shortcut-kicker';
  category.textContent = app.category;
  const name = document.createElement('strong');
  name.textContent = app.name;
  const description = document.createElement('span');
  description.className = 'shortcut-description';
  description.textContent = app.description;
  copy.append(category, name, description);

  const number = document.createElement('span');
  number.className = 'shortcut-number';
  number.setAttribute('aria-hidden', 'true');
  number.textContent = String(index + 1).padStart(2, '0');

  button.append(icon, copy, number);
  return button;
}

function renderApps() {
  elements.appGrid.replaceChildren(...apps.map(createAppButton));
  elements.appGrid.hidden = apps.length === 0;
  elements.appEmpty.hidden = apps.length > 0;
}

function renderAppManagerList() {
  elements.appManagerList.replaceChildren();
  elements.appManagerEmpty.hidden = apps.length > 0;
  updateAppFormControls();

  apps.forEach((app, index) => {
    const row = document.createElement('li');
    row.className = 'app-manager-item';

    const details = document.createElement('span');
    details.className = 'app-manager-copy';
    const name = document.createElement('strong');
    name.textContent = app.name;
    const appId = document.createElement('code');
    appId.textContent = app.appId;
    details.append(name, appId);

    const order = document.createElement('span');
    order.className = 'app-manager-order';
    ['up', 'down'].forEach((direction) => {
      const move = document.createElement('button');
      move.className = 'app-order-button';
      move.type = 'button';
      move.dataset.moveAppId = app.appId;
      move.dataset.moveDirection = direction;
      move.disabled = direction === 'up' ? index === 0 : index === apps.length - 1;
      move.setAttribute('aria-label', `Move ${app.name} ${direction}`);
      move.textContent = direction === 'up' ? '↑' : '↓';
      order.append(move);
    });

    const actions = document.createElement('span');
    actions.className = 'app-manager-actions';

    const edit = document.createElement('button');
    edit.className = 'edit-app-button';
    edit.type = 'button';
    edit.dataset.editAppId = app.appId;
    edit.setAttribute('aria-label', `Edit ${app.name}`);
    edit.textContent = 'Edit';

    const remove = document.createElement('button');
    remove.className = 'remove-app-button';
    remove.type = 'button';
    remove.dataset.removeAppId = app.appId;
    remove.dataset.appName = app.name;
    remove.setAttribute('aria-label', `Remove ${app.name}`);
    remove.textContent = 'Remove';

    actions.append(edit, remove);
    row.append(details, order, actions);
    elements.appManagerList.append(row);
  });
}

function updateAppFormControls() {
  const isEditing = Boolean(editingAppId);
  const atLimit = apps.length >= MAX_APPS && !isEditing;
  elements.appFormTitle.textContent = isEditing ? 'Edit app details' : 'Add an app';
  elements.cancelAppEdit.hidden = !isEditing;
  elements.appSubmitButton.disabled = atLimit;
  elements.appSubmitButton.textContent = isEditing
    ? 'Save changes'
    : atLimit ? 'App limit reached' : 'Add app';
}

function resetAppForm() {
  editingAppId = null;
  elements.appForm.reset();
  elements.appError.textContent = '';
  updateAppFormControls();
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  elements.greeting.textContent = greeting;
  elements.clock.textContent = formatClockTime(now, selectedTimeFormat, currentLocale());
  elements.clock.setAttribute('aria-label', `Current time in ${selectedTimeFormat}-hour format`);
  elements.date.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2800);
}

function openCityModal() {
  modalReturnFocus = document.activeElement;
  elements.modalError.textContent = '';
  elements.modal.hidden = false;
  elements.modalTitle.textContent = city ? 'Change your city' : 'Set your city';
  elements.modalDescription.textContent = 'Enter your city or town to see the local weather.';
  elements.entryLabel.textContent = 'City or town';
  elements.entryInput.placeholder = 'e.g. Seattle';
  elements.entryInput.value = city;

  window.requestAnimationFrame(() => {
    if (!elements.modal.hidden) elements.entryInput.focus();
  });
}

function closeModal() {
  const activeModal = [elements.appManagerModal, elements.modal].find((modal) => !modal.hidden);
  if (!activeModal) return;

  if (activeModal === elements.appManagerModal) resetAppForm();
  activeModal.hidden = true;
  elements.modalError.textContent = '';
  elements.appError.textContent = '';
  const returnFocus = modalReturnFocus;
  modalReturnFocus = null;
  if (returnFocus instanceof HTMLElement && returnFocus.isConnected && !returnFocus.closest('[hidden]')) {
    returnFocus.focus();
  }
}

function openAppManager() {
  modalReturnFocus = document.activeElement;
  elements.appError.textContent = '';
  renderAppManagerList();
  elements.appManagerModal.hidden = false;

  window.requestAnimationFrame(() => {
    if (!elements.appManagerModal.hidden) elements.appNameInput.focus();
  });
}

function setWeatherLoading(message) {
  elements.weatherStatus.textContent = message;
  elements.weatherDisplay.classList.toggle('is-loading', message === 'Checking the forecast…');
}

function setWeatherEmpty(message, cityLabel = 'LOCATION NOT SET') {
  elements.weatherDisplay.classList.add('is-empty');
  elements.weatherDisplay.classList.remove('is-loading');
  elements.weatherSymbol.textContent = '✳';
  elements.weatherTemperature.textContent = '--°';
  elements.weatherCondition.textContent = message;
  elements.weatherCity.textContent = cityLabel.toUpperCase();
}

function currentLocale() {
  return (navigator.languages && navigator.languages[0]) || navigator.language || '';
}

function renderTemperatureUnit() {
  elements.temperatureUnits.querySelectorAll('[data-unit]').forEach((button) => {
    const selected = button.dataset.unit === selectedTemperatureUnit;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function renderTimeFormat() {
  elements.timeFormat.querySelectorAll('[data-time-format]').forEach((button) => {
    const selected = button.dataset.timeFormat === selectedTimeFormat;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function renderWeather({ temperature, condition, symbol, displayName, high, low, unit }) {
  elements.weatherDisplay.classList.remove('is-empty', 'is-loading');
  elements.weatherSymbol.textContent = symbol;
  elements.weatherTemperature.textContent = `${Math.round(temperature)}${temperatureSuffix(unit)}`;
  elements.weatherCondition.textContent = condition;
  elements.weatherCity.textContent = displayName.toUpperCase();
  const suffix = temperatureSuffix(unit);
  elements.weatherStatus.textContent = `High ${Math.round(high)}${suffix}  ·  Low ${Math.round(low)}${suffix}`;
}

async function loadWeather() {
  if (!city) {
    setWeatherEmpty('Set your city to see local weather');
    elements.weatherStatus.textContent = '';
    return;
  }

  const requestId = ++weatherRequest;
  const unit = selectedTemperatureUnit;
  setWeatherLoading('Checking the forecast…');
  elements.weatherCity.textContent = city.toUpperCase();
  let place;

  try {
    const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodeUrl.search = new URLSearchParams({
      count: '1',
      format: 'json',
      language: 'en',
      name: city,
    });
    const locationResponse = await fetch(geocodeUrl);
    if (!locationResponse.ok) throw new Error('Location lookup failed');
    const locationData = await locationResponse.json();
    place = locationData.results && locationData.results[0];
    if (!place) throw new Error('City not found. Check the spelling and try again.');

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.search = new URLSearchParams({
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min',
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      temperature_unit: unit,
      timezone: 'auto',
      wind_speed_unit: unit === 'fahrenheit' ? 'mph' : 'kmh',
    });
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) throw new Error('Forecast unavailable');
    const weatherData = await weatherResponse.json();
    if (requestId !== weatherRequest) return;

    const current = weatherData.current;
    const displayName = [place.name, place.admin1].filter(Boolean).join(', ');
    renderWeather({
      temperature: current.temperature_2m,
      condition: weatherDescription(current.weather_code),
      symbol: weatherSymbol(current.weather_code),
      displayName,
      high: weatherData.daily.temperature_2m_max[0],
      low: weatherData.daily.temperature_2m_min[0],
      unit,
    });
  } catch (error) {
    if (requestId !== weatherRequest) return;

    if (place) {
      try {
        const backupUrl = new URL(`https://wttr.in/${place.latitude},${place.longitude}`);
        backupUrl.searchParams.set('format', 'j1');
        const backupResponse = await fetch(backupUrl);
        if (!backupResponse.ok) throw new Error('Backup forecast unavailable');
        const backupData = await backupResponse.json();
        const current = backupData.current_condition && backupData.current_condition[0];
        const today = backupData.weather && backupData.weather[0];
        if (!current || !today) throw new Error('Backup forecast response was incomplete');

        const temperatureKey = unit === 'fahrenheit' ? 'temp_F' : 'temp_C';
        const highKey = unit === 'fahrenheit' ? 'maxtempF' : 'maxtempC';
        const lowKey = unit === 'fahrenheit' ? 'mintempF' : 'mintempC';
        const temperature = Number(current[temperatureKey]);
        const high = Number(today[highKey]);
        const low = Number(today[lowKey]);
        const condition = String(current.weatherDesc && current.weatherDesc[0] && current.weatherDesc[0].value || 'Weather update').trim();
        if (![temperature, high, low].every(Number.isFinite)) throw new Error('Backup forecast values were invalid');
        if (requestId !== weatherRequest) return;

        const areaName = backupData.nearest_area && backupData.nearest_area[0] && backupData.nearest_area[0].areaName && backupData.nearest_area[0].areaName[0] && backupData.nearest_area[0].areaName[0].value;
        renderWeather({
          temperature,
          condition,
          symbol: weatherSymbolFromDescription(condition),
          displayName: areaName || [place.name, place.admin1].filter(Boolean).join(', '),
          high,
          low,
          unit,
        });
        return;
      } catch {
        // Keep the primary error for the on-screen message if both providers fail.
      }
    }

    const cityNotFound = !place && error instanceof Error && error.message.startsWith('City not found');
    const message = place ? 'Weather is unavailable right now.' : cityNotFound ? 'We could not find that city.' : 'Weather could not load.';
    setWeatherEmpty(message, city);
    elements.weatherStatus.textContent = place
      ? 'Try again in a little while.'
      : cityNotFound ? 'Check the spelling and try again.' : 'Check your connection and try again.';
  }
}

function submitEntry(event) {
  event.preventDefault();
  const value = elements.entryInput.value.trim();
  if (!value) {
    elements.modalError.textContent = 'Please enter a city or town.';
    elements.entryInput.focus();
    return;
  }

  city = value.slice(0, 80);
  safeWrite(STORAGE_KEYS.city, city);
  closeModal();
  loadWeather();
}

function submitAppForm(event) {
  event.preventDefault();
  const appDetails = {
    appId: elements.appIdInput.value,
    name: elements.appNameInput.value,
    category: elements.appCategoryInput.value,
    description: elements.appDescriptionInput.value,
  };
  const result = editingAppId
    ? updateAppEntry(appDetails, apps, editingAppId)
    : createAppEntry(appDetails, apps);

  if (result.error) {
    elements.appError.textContent = result.error;
    (result.field === 'name' ? elements.appNameInput : elements.appIdInput).focus();
    return;
  }

  const nextApps = editingAppId
    ? apps.map((app) => app.appId === editingAppId ? result.app : app)
    : [...apps, result.app];
  if (!saveAppList(nextApps)) return;

  const message = editingAppId ? `${result.app.name} updated.` : `${result.app.name} added.`;
  resetAppForm();
  elements.appNameInput.focus();
  showToast(message);
}

function editApp(event) {
  const button = event.target.closest('button[data-edit-app-id]');
  if (!button) return;

  const app = apps.find((entry) => entry.appId === button.dataset.editAppId);
  if (!app) return;

  editingAppId = app.appId;
  elements.appNameInput.value = app.name;
  elements.appIdInput.value = app.appId;
  elements.appCategoryInput.value = app.category;
  elements.appDescriptionInput.value = app.description;
  elements.appError.textContent = '';
  updateAppFormControls();
  elements.appNameInput.focus();
}

function cancelAppEdit() {
  resetAppForm();
  elements.appNameInput.focus();
}

function removeApp(event) {
  const button = event.target.closest('button[data-remove-app-id]');
  if (!button) return;

  const index = apps.findIndex((app) => app.appId === button.dataset.removeAppId);
  if (index < 0) return;
  const removedApp = apps[index];
  const nextApps = apps.filter((app) => app.appId !== removedApp.appId);
  if (!saveAppList(nextApps)) return;
  if (editingAppId === removedApp.appId) resetAppForm();

  const removeButtons = [...elements.appManagerList.querySelectorAll('[data-remove-app-id]')];
  (removeButtons[Math.min(index, removeButtons.length - 1)] || elements.appNameInput).focus();
  showToast(`${removedApp.name} removed.`);
}

function moveApp(event) {
  const button = event.target.closest('button[data-move-app-id]');
  if (!button || button.disabled) return;

  const appIndex = apps.findIndex((app) => app.appId === button.dataset.moveAppId);
  const direction = button.dataset.moveDirection;
  if (appIndex < 0) return;

  const movedApp = apps[appIndex];
  const nextApps = reorderAppList(apps, appIndex, direction);
  if (nextApps.every((app, index) => app === apps[index])) return;
  if (!saveAppList(nextApps)) return;

  const row = [...elements.appManagerList.children].find((item) => (
    item.querySelector('[data-move-app-id]')?.dataset.moveAppId === movedApp.appId
  ));
  const moveButtons = [...(row?.querySelectorAll('[data-move-direction]') || [])];
  const focusTarget = moveButtons.find((item) => (
    item.dataset.moveDirection === direction && !item.disabled
  )) || moveButtons.find((item) => !item.disabled);
  focusTarget?.focus();
  showToast(`${movedApp.name} moved ${direction}.`);
}

function handleTemperatureUnitChange(event) {
  const button = event.target.closest('button[data-unit]');
  if (!button || button.dataset.unit === selectedTemperatureUnit) return;

  selectedTemperatureUnit = button.dataset.unit;
  safeWrite(STORAGE_KEYS.temperatureUnit, selectedTemperatureUnit);
  renderTemperatureUnit();
  loadWeather();
}

function handleTimeFormatChange(event) {
  const button = event.target.closest('button[data-time-format]');
  if (!button || button.dataset.timeFormat === selectedTimeFormat) return;

  selectedTimeFormat = button.dataset.timeFormat;
  safeWrite(STORAGE_KEYS.timeFormat, selectedTimeFormat);
  renderTimeFormat();
  updateClock();
}

function launchApp(appId, appName) {
  const tizenApi = window.tizen;
  if (!tizenApi || !tizenApi.application || typeof tizenApi.application.launch !== 'function') {
    showToast(`Open ${appName} on your TV.`);
    return;
  }

  try {
    tizenApi.application.launch(
      appId,
      () => showToast(`Opening ${appName}…`),
      () => showToast(`${appName} could not open. Check that it is installed.`),
    );
  } catch {
    showToast(`${appName} could not open. Check that it is installed.`);
  }
}

function moveRemoteFocus(direction) {
  const active = document.activeElement;
  const activeModal = [elements.appManagerModal, elements.modal].find((modal) => !modal.hidden);
  const focusScope = activeModal || document;
  const focusable = [...focusScope.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
    .filter((element) => !element.closest('[hidden]') && element.getClientRects().length > 0);
  if (focusable.length === 0) return;

  if (!focusable.includes(active)) {
    focusable[0].focus();
    return;
  }

  const current = active.getBoundingClientRect();
  const currentX = current.left + current.width / 2;
  const currentY = current.top + current.height / 2;
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of focusable) {
    if (candidate === active) continue;
    const rect = candidate.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - currentX;
    const dy = rect.top + rect.height / 2 - currentY;
    const primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    if (primary <= 4) continue;
    const cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + cross * 2.1;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (best) best.focus();
}

function handleRemoteKeys(event) {
  const directions = {
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
  };
  const direction = directions[event.key] || {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
  }[event.keyCode];
  const isTextField = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
  const isSingleLineInput = event.target instanceof HTMLInputElement;
  const shouldMoveFocus = direction && (!isTextField || (
    isSingleLineInput && (direction === 'up' || direction === 'down')
  ));

  // Vertical arrows move between controls; left/right remain available to edit text.
  if (shouldMoveFocus) {
    event.preventDefault();
    moveRemoteFocus(direction);
    return;
  }

  if (event.key === 'Escape' || event.key === 'Backspace' || event.keyCode === 10009) {
    if (!elements.modal.hidden || !elements.appManagerModal.hidden) {
      event.preventDefault();
      closeModal();
    } else if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  }
}

elements.cityButton.addEventListener('click', openCityModal);
elements.addAppButton.addEventListener('click', openAppManager);
elements.refreshWeather.addEventListener('click', loadWeather);
elements.temperatureUnits.addEventListener('click', handleTemperatureUnitChange);
elements.timeFormat.addEventListener('click', handleTimeFormatChange);
elements.entryForm.addEventListener('submit', submitEntry);
elements.appForm.addEventListener('submit', submitAppForm);
elements.appManagerList.addEventListener('click', removeApp);
elements.appManagerList.addEventListener('click', moveApp);
elements.appManagerList.addEventListener('click', editApp);
elements.cancelModal.addEventListener('click', closeModal);
elements.closeModal.addEventListener('click', closeModal);
elements.cancelAppManager.addEventListener('click', closeModal);
elements.cancelAppEdit.addEventListener('click', cancelAppEdit);
elements.closeAppManager.addEventListener('click', closeModal);
elements.modal.addEventListener('click', (event) => {
  if (event.target === elements.modal) closeModal();
});
elements.appManagerModal.addEventListener('click', (event) => {
  if (event.target === elements.appManagerModal) closeModal();
});
document.addEventListener('keydown', handleRemoteKeys);

updateClock();
window.setInterval(updateClock, 1000);
renderTemperatureUnit();
renderTimeFormat();
renderApps();
loadWeather();
window.requestAnimationFrame(() => elements.appGrid.querySelector('button')?.focus());
