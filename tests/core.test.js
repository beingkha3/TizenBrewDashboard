import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWatchlist, temperatureSuffix, temperatureUnit, weatherDescription, weatherSymbol } from '../app/core.js';

test('weather codes map to readable labels and symbols', () => {
  assert.equal(weatherDescription(0), 'Clear sky');
  assert.equal(weatherDescription(95), 'Thunderstorm');
  assert.equal(weatherDescription(999), 'Weather update');
  assert.equal(weatherSymbol(71), '❄');
  assert.equal(weatherSymbol(2), '☁');
});

test('watchlist parsing drops invalid or empty entries and limits the list', () => {
  assert.deepEqual(normalizeWatchlist(null), []);
  assert.deepEqual(normalizeWatchlist([{ title: '  ' }, { title: ' Arrival ', id: 1, done: 1 }]), [
    { id: '1', title: 'Arrival', done: true },
  ]);

  const oversized = Array.from({ length: 25 }, (_, index) => ({ title: `Title ${index}` }));
  assert.equal(normalizeWatchlist(oversized).length, 20);
});

test('temperature units follow the browser locale', () => {
  assert.equal(temperatureUnit('en-US'), 'fahrenheit');
  assert.equal(temperatureUnit('en-GB'), 'celsius');
  assert.equal(temperatureSuffix('fahrenheit'), '°F');
  assert.equal(temperatureSuffix('celsius'), '°C');
});
