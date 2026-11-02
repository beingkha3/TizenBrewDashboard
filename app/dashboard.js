import {
  normalizeWatchlist,
  temperatureSuffix,
  temperatureUnit,
  weatherDescription,
  weatherSymbol,
  weatherSymbolFromDescription,
} from './core.js';

const STORAGE_KEYS = {
  city: 'living-room-dashboard-city-v1',
  temperatureUnit: 'living-room-dashboard-temperature-unit-v1',
  watchlist: 'living-room-dashboard-watchlist-v1',
};
const TIZENBREW_APP_ID = 'xvvl3S1bvH.TizenBrewStandalone';
const TIZENTUBE_MODULE = {
  moduleName: '@foxreis/tizentube',
  moduleType: 'npm',
};
const MAX_WATCHLIST_ITEMS = 20;

const elements = {
  addWatchlist: document.getElementById('add-watchlist'),
  cancelModal: document.getElementById('cancel-modal'),
  cityButton: document.getElementById('set-city'),
  clock: document.getElementById('clock'),
  closeModal: document.getElementById('close-modal'),
  date: document.getElementById('date'),
  emptyAddWatchlist: document.getElementById('empty-add-watchlist'),
  entryForm: document.getElementById('entry-form'),
  entryInput: document.getElementById('entry-input'),
  entryLabel: document.getElementById('entry-label'),
  greeting: document.getElementById('greeting'),
  jumpWatchlist: document.getElementById('jump-watchlist'),
  modal: document.getElementById('entry-modal'),
  modalDescription: document.getElementById('modal-description'),
  modalError: document.getElementById('modal-error'),
  modalTitle: document.getElementById('modal-title'),
  refreshWeather: document.getElementById('refresh-weather'),
  shortcutWeather: document.getElementById('shortcut-weather'),
  shortcutWatchlistCount: document.getElementById('shortcut-watchlist-count'),
  toast: document.getElementById('toast'),
  temperatureUnits: document.getElementById('temperature-units'),
  weatherCity: document.getElementById('weather-city'),
  weatherCondition: document.getElementById('weather-condition'),
  weatherDisplay: document.getElementById('weather-display'),
  weatherStatus: document.getElementById('weather-status'),
  weatherSymbol: document.getElementById('weather-symbol'),
  weatherTemperature: document.getElementById('weather-temperature'),
  watchlistCount: document.getElementById('watchlist-count'),
  watchlistEmpty: document.getElementById('watchlist-empty'),
  watchlistList: document.getElementById('watchlist-list'),
  watchlistPanel: document.getElementById('watchlist-panel'),
  launchTizenTube: document.getElementById('launch-tizentube'),
};

let modalMode = 'watchlist';
let modalReturnFocus = null;
let toastTimeout = null;
let weatherRequest = 0;
let watchlist = readWatchlist();
let city = readCity();
let selectedTemperatureUnit = readTemperatureUnit();

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
  } catch {
    showToast('Could not save on this device.');
  }
}

function readCity() {
  return (safeRead(STORAGE_KEYS.city) || '').trim().slice(0, 80);
}

function readTemperatureUnit() {
  const saved = safeRead(STORAGE_KEYS.temperatureUnit);
  return saved === 'fahrenheit' || saved === 'celsius' ? saved : temperatureUnit(currentLocale());
}

function readWatchlist() {
  const value = safeRead(STORAGE_KEYS.watchlist);
  if (!value) return [];

  try {
    return normalizeWatchlist(JSON.parse(value));
  } catch {
    return [];
  }
}

function saveWatchlist() {
  safeWrite(STORAGE_KEYS.watchlist, JSON.stringify(watchlist));
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  elements.greeting.textContent = greeting;
  elements.clock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
  elements.date.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
}

function renderWatchlist() {
  elements.watchlistList.replaceChildren();
  elements.watchlistCount.textContent = String(watchlist.length);
  elements.shortcutWatchlistCount.textContent = watchlist.length === 0
    ? 'Nothing saved yet'
    : `${watchlist.length} ${watchlist.length === 1 ? 'title' : 'titles'} saved`;
  elements.watchlistEmpty.hidden = watchlist.length > 0;

  watchlist.forEach((item) => {
    const row = document.createElement('li');
    row.className = `watchlist-item${item.done ? ' is-done' : ''}`;

    const doneButton = document.createElement('button');
    doneButton.className = 'watchlist-done';
    doneButton.type = 'button';
    doneButton.dataset.action = 'toggle';
    doneButton.dataset.id = item.id;
    doneButton.setAttribute('aria-label', item.done ? `Mark ${item.title} unwatched` : `Mark ${item.title} watched`);
    doneButton.textContent = item.done ? '✓' : '';

    const title = document.createElement('span');
    title.className = 'watchlist-title';
    title.textContent = item.title;

    const removeButton = document.createElement('button');
    removeButton.className = 'watchlist-remove';
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove';
    removeButton.dataset.id = item.id;
    removeButton.setAttribute('aria-label', `Remove ${item.title}`);
    removeButton.textContent = '×';

    row.append(doneButton, title, removeButton);
    elements.watchlistList.append(row);
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2800);
}

function openModal(mode) {
  modalReturnFocus = document.activeElement;
  modalMode = mode;
  elements.modalError.textContent = '';
  elements.modal.hidden = false;

  if (mode === 'city') {
    elements.modalTitle.textContent = city ? 'Change your city' : 'Set your city';
    elements.modalDescription.textContent = 'We use your city to show a simple local forecast.';
    elements.entryLabel.textContent = 'City or town';
    elements.entryInput.placeholder = 'e.g. Seattle';
    elements.entryInput.value = city;
  } else {
    elements.modalTitle.textContent = 'Add to your watchlist';
    elements.modalDescription.textContent = 'Keep a title handy for your next movie night.';
    elements.entryLabel.textContent = 'Movie or show title';
    elements.entryInput.placeholder = 'e.g. The next family movie';
    elements.entryInput.value = '';
  }

  window.requestAnimationFrame(() => {
    if (!elements.modal.hidden) elements.entryInput.focus();
  });
}

function closeModal() {
  elements.modal.hidden = true;
  elements.modalError.textContent = '';
  const returnFocus = modalReturnFocus;
  modalReturnFocus = null;
  if (returnFocus instanceof HTMLElement && returnFocus.isConnected && !returnFocus.closest('[hidden]')) {
    returnFocus.focus();
  }
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

function renderWeather({ temperature, condition, symbol, displayName, high, low, unit }) {
  elements.weatherDisplay.classList.remove('is-empty', 'is-loading');
  elements.weatherSymbol.textContent = symbol;
  elements.weatherTemperature.textContent = `${Math.round(temperature)}${temperatureSuffix(unit)}`;
  elements.weatherCondition.textContent = condition;
  elements.weatherCity.textContent = displayName.toUpperCase();
  const suffix = temperatureSuffix(unit);
  elements.weatherStatus.textContent = `H ${Math.round(high)}${suffix}  ·  L ${Math.round(low)}${suffix}`;
}

async function loadWeather() {
  if (!city) {
    setWeatherEmpty('Add your city for local weather');
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

    const message = place ? 'Forecast unavailable' : error instanceof Error ? error.message : 'Forecast unavailable';
    setWeatherEmpty(message, city);
    elements.weatherStatus.textContent = place
      ? 'Weather providers are temporarily unavailable. Tap refresh to retry.'
      : 'Check your connection or update the city.';
  }
}

function submitEntry(event) {
  event.preventDefault();
  const value = elements.entryInput.value.trim();
  if (!value) {
    elements.modalError.textContent = 'Please enter a value first.';
    elements.entryInput.focus();
    return;
  }

  if (modalMode === 'city') {
    city = value.slice(0, 80);
    safeWrite(STORAGE_KEYS.city, city);
    closeModal();
    loadWeather();
    return;
  }

  if (watchlist.length >= MAX_WATCHLIST_ITEMS) {
    elements.modalError.textContent = 'Your list is full. Remove a title to make room.';
    return;
  }

  watchlist.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: value.slice(0, 80), done: false });
  saveWatchlist();
  renderWatchlist();
  closeModal();
  showToast('Added to your watchlist.');
}

function handleWatchlistAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === 'toggle') {
    watchlist = watchlist.map((item) => item.id === id ? { ...item, done: !item.done } : item);
  } else if (action === 'remove') {
    watchlist = watchlist.filter((item) => item.id !== id);
  }

  saveWatchlist();
  renderWatchlist();
}

function handleTemperatureUnitChange(event) {
  const button = event.target.closest('button[data-unit]');
  if (!button || button.dataset.unit === selectedTemperatureUnit) return;

  selectedTemperatureUnit = button.dataset.unit;
  safeWrite(STORAGE_KEYS.temperatureUnit, selectedTemperatureUnit);
  renderTemperatureUnit();
  loadWeather();
}

function launchTizenTube() {
  const tizenApi = window.tizen;
  if (!tizenApi || !tizenApi.application || !tizenApi.ApplicationControl) {
    showToast('Open TizenTube from TizenBrew on the TV.');
    return;
  }

  try {
    const handoff = new tizenApi.ApplicationControlData('module', [JSON.stringify({
      moduleName: TIZENTUBE_MODULE.moduleName,
      moduleType: TIZENTUBE_MODULE.moduleType,
      args: '',
    })]);
    const control = new tizenApi.ApplicationControl(
      'http://tizen.org/appcontrol/operation/default',
      null,
      null,
      null,
      [handoff],
    );

    tizenApi.application.launchAppControl(
      control,
      TIZENBREW_APP_ID,
      () => showToast('Opening TizenTube…'),
      (error) => showToast(error && error.message ? error.message : 'Could not open TizenTube.'),
    );
  } catch {
    showToast('Open TizenTube from the TizenBrew module list.');
  }
}

function moveRemoteFocus(direction) {
  const active = document.activeElement;
  const focusable = [...document.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
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
  const direction = directions[event.key];
  const isTextField = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

  if (direction && !isTextField) {
    event.preventDefault();
    moveRemoteFocus(direction);
    return;
  }

  if (event.key === 'Escape' || event.key === 'Backspace' || event.keyCode === 10009) {
    if (!elements.modal.hidden) {
      event.preventDefault();
      closeModal();
    } else if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  }
}

elements.addWatchlist.addEventListener('click', () => openModal('watchlist'));
elements.emptyAddWatchlist.addEventListener('click', () => openModal('watchlist'));
elements.cityButton.addEventListener('click', () => openModal('city'));
elements.shortcutWeather.addEventListener('click', () => openModal('city'));
elements.refreshWeather.addEventListener('click', loadWeather);
elements.temperatureUnits.addEventListener('click', handleTemperatureUnitChange);
elements.launchTizenTube.addEventListener('click', launchTizenTube);
elements.jumpWatchlist.addEventListener('click', () => {
  elements.watchlistPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => elements.addWatchlist.focus(), 150);
});
elements.watchlistList.addEventListener('click', handleWatchlistAction);
elements.entryForm.addEventListener('submit', submitEntry);
elements.cancelModal.addEventListener('click', closeModal);
elements.closeModal.addEventListener('click', closeModal);
elements.modal.addEventListener('click', (event) => {
  if (event.target === elements.modal) closeModal();
});
document.addEventListener('keydown', handleRemoteKeys);

updateClock();
window.setInterval(updateClock, 1000);
renderWatchlist();
renderTemperatureUnit();
loadWeather();
window.requestAnimationFrame(() => elements.launchTizenTube.focus());
