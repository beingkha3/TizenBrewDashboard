export const MAX_APPS = 20;

export const DEFAULT_APPS = Object.freeze([
  Object.freeze({
    appId: 'F5rY8d4GTA.TizenTubeStandalone',
    name: 'TizenTube',
    category: 'WATCH VIDEOS',
    description: 'Watch videos',
    icon: 'youtube',
  }),
  Object.freeze({
    appId: 'NuvioTV001.NuvioTV',
    name: 'NuvioTV',
    category: 'MOVIES AND SHOWS',
    description: 'Browse movies',
    icon: 'nuvio',
  }),
  Object.freeze({
    appId: 'AprZAARz4r.Jellyfin',
    name: 'Jellyfin',
    category: 'MOVIES AND SHOWS',
    description: 'Watch your library',
    icon: 'jellyfin',
  }),
]);

const APP_ID_PATTERN = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+$/;
const APP_ICONS = new Set(['youtube', 'nuvio', 'jellyfin', 'custom']);

export function isValidAppId(value) {
  return typeof value === 'string'
    && value.length <= 128
    && APP_ID_PATTERN.test(value.trim());
}

export function normalizeAppList(value) {
  if (!Array.isArray(value)) return [];

  const apps = [];
  const seenIds = new Set();

  value.forEach((entry) => {
    if (apps.length >= MAX_APPS || !entry || typeof entry !== 'object') return;

    const appId = typeof entry.appId === 'string' ? entry.appId.trim() : '';
    const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 40) : '';
    if (!isValidAppId(appId) || !name) return;

    const normalizedId = appId.toLowerCase();
    if (seenIds.has(normalizedId)) return;
    seenIds.add(normalizedId);

    const description = typeof entry.description === 'string'
      ? entry.description.trim().slice(0, 64)
      : '';
    const category = typeof entry.category === 'string'
      ? entry.category.trim().slice(0, 24).toUpperCase()
      : '';

    apps.push({
      appId,
      name,
      category: category || 'APP',
      description: description || 'Open this app',
      icon: APP_ICONS.has(entry.icon) ? entry.icon : 'custom',
    });
  });

  return apps;
}

export function reorderAppList(value, index, direction) {
  const apps = Array.isArray(value) ? [...value] : [];
  const offset = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;

  if (!offset || !Number.isInteger(index) || index < 0) return apps;

  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= apps.length) {
    return apps;
  }

  [apps[index], apps[targetIndex]] = [apps[targetIndex], apps[index]];
  return apps;
}

export function createAppEntry(input = {}, existingApps = []) {
  const { appId, name, category, description } = input && typeof input === 'object' ? input : {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanAppId = typeof appId === 'string' ? appId.trim() : '';

  if (!cleanName) return { error: 'Enter a name for this app.', field: 'name' };
  if (!isValidAppId(cleanAppId)) {
    return { error: 'Enter a valid Tizen app ID, for example com.example.MyApp.', field: 'appId' };
  }
  const currentApps = Array.isArray(existingApps) ? existingApps : [];
  if (currentApps.some((app) => typeof app.appId === 'string' && app.appId.toLowerCase() === cleanAppId.toLowerCase())) {
    return { error: 'That app is already on your screen.', field: 'appId' };
  }
  if (currentApps.length >= MAX_APPS) {
    return { error: `You can add up to ${MAX_APPS} apps.`, field: 'appId' };
  }

  const [app] = normalizeAppList([{ appId: cleanAppId, name: cleanName, category, description }]);
  return { app };
}

export function updateAppEntry(input = {}, existingApps = [], appId) {
  const currentApps = Array.isArray(existingApps) ? existingApps : [];
  const currentApp = currentApps.find((app) => app.appId === appId);
  if (!currentApp) return { error: 'Could not find this app.', field: 'appId' };

  const result = createAppEntry(input, currentApps.filter((app) => app !== currentApp));
  if (result.error) return result;

  return {
    app: {
      ...currentApp,
      ...result.app,
      icon: currentApp.icon,
    },
  };
}
