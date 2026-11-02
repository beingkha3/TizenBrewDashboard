export function weatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm and hail',
    99: 'Thunderstorm and hail',
  };

  return descriptions[Number(code)] || 'Weather update';
}

export function weatherSymbol(code) {
  const value = Number(code);
  if (value === 0 || value === 1) return '☀';
  if ([2, 3, 45, 48].includes(value)) return '☁';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(value)) return '☂';
  if ([71, 73, 75, 77, 85, 86].includes(value)) return '❄';
  if ([95, 96, 99].includes(value)) return 'ϟ';
  return '✳';
}

export function weatherSymbolFromDescription(description) {
  const value = String(description || '').toLowerCase();
  if (/thunder|lightning/.test(value)) return weatherSymbol(95);
  if (/snow|sleet|hail|ice/.test(value)) return weatherSymbol(71);
  if (/rain|drizzle|shower/.test(value)) return weatherSymbol(61);
  if (/fog|mist/.test(value)) return weatherSymbol(45);
  if (/cloud|overcast/.test(value)) return weatherSymbol(3);
  if (/clear|sun/.test(value)) return weatherSymbol(0);
  return '✳';
}

export function temperatureUnit(locale = '') {
  return /^en-US(?:-|$)/i.test(locale) ? 'fahrenheit' : 'celsius';
}

export function temperatureSuffix(unit) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}
