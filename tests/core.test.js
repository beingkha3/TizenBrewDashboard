import test from 'node:test';
import assert from 'node:assert/strict';
import { temperatureSuffix, temperatureUnit, weatherDescription, weatherSymbol, weatherSymbolFromDescription } from '../app/core.js';

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
