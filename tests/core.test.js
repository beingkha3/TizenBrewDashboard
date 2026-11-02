import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClockTime, preferredTimeFormat, temperatureSuffix, temperatureUnit, weatherDescription, weatherSymbol, weatherSymbolFromDescription } from '../app/core.js';

test('weather codes map to readable labels and symbols', () => {
  assert.equal(weatherDescription(0), 'Clear sky');
  assert.equal(weatherDescription(95), 'Thunderstorm');
  assert.equal(weatherDescription(999), 'Weather update');
  assert.equal(weatherSymbol(71), '❄');
  assert.equal(weatherSymbol(2), '☁');
  assert.equal(weatherSymbolFromDescription('Overcast'), '☁');
  assert.equal(weatherSymbolFromDescription('Light rain'), '☂');
  assert.equal(weatherSymbolFromDescription('Thunderstorm'), 'ϟ');
});

test('temperature units follow the browser locale', () => {
  assert.equal(temperatureUnit('en-US'), 'fahrenheit');
  assert.equal(temperatureUnit('en-GB'), 'celsius');
  assert.equal(temperatureSuffix('fahrenheit'), '°F');
  assert.equal(temperatureSuffix('celsius'), '°C');
});

test('clock supports 12-hour and 24-hour display formats', () => {
  const morning = new Date(2024, 0, 1, 7, 5);
  const evening = new Date(2024, 0, 1, 19, 5);
  const midnight = new Date(2024, 0, 1, 0, 5);

  assert.equal(formatClockTime(morning, '12', 'en-US'), '7:05 AM');
  assert.equal(formatClockTime(evening, '12', 'en-US'), '7:05 PM');
  assert.equal(formatClockTime(evening, '24', 'en-US'), '19:05');
  assert.equal(formatClockTime(midnight, '24', 'en-US'), '00:05');
  assert.equal(preferredTimeFormat('en-US'), '12');
  assert.equal(preferredTimeFormat('en-GB'), '24');
});
