import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAppEntry,
  DEFAULT_APPS,
  MAX_APPS,
  normalizeAppList,
  reorderAppList,
  updateAppEntry,
} from '../app/apps.js';

test('default app shortcuts are configured separately from the dashboard markup', () => {
  assert.deepEqual(DEFAULT_APPS.map((app) => app.appId), [
    'F5rY8d4GTA.TizenTubeStandalone',
    'NuvioTV001.NuvioTV',
    'AprZAARz4r.Jellyfin',
  ]);
});

test('app lists discard invalid and duplicate entries and enforce the app limit', () => {
  const normalized = normalizeAppList([
    { appId: ' com.example.Movies ', name: ' Movies ', description: ' Watch movies ' },
    { appId: 'COM.EXAMPLE.MOVIES', name: 'Duplicate' },
    { appId: 'not-an-app-id', name: 'Invalid ID' },
    { appId: 'com.example.NoName', name: '  ' },
  ]);

  assert.deepEqual(normalized, [{
    appId: 'com.example.Movies',
    name: 'Movies',
    category: 'APP',
    description: 'Watch movies',
    icon: 'custom',
  }]);

  const oversized = Array.from({ length: MAX_APPS + 4 }, (_, index) => ({
    appId: `com.example.App${index}`,
    name: `App ${index}`,
  }));
  assert.equal(normalizeAppList(oversized).length, MAX_APPS);
});

test('app shortcuts can be moved up or down without changing the source list', () => {
  const apps = normalizeAppList(DEFAULT_APPS);
  const movedUp = reorderAppList(apps, 2, 'up');
  assert.deepEqual(movedUp.map((app) => app.name), ['TizenTube', 'Jellyfin', 'NuvioTV']);
  assert.deepEqual(apps.map((app) => app.name), ['TizenTube', 'NuvioTV', 'Jellyfin']);

  const movedDown = reorderAppList(movedUp, 0, 'down');
  assert.deepEqual(movedDown.map((app) => app.name), ['Jellyfin', 'TizenTube', 'NuvioTV']);
  assert.deepEqual(reorderAppList(apps, 0, 'up'), apps);
  assert.deepEqual(reorderAppList(apps, apps.length - 1, 'down'), apps);
  assert.deepEqual(reorderAppList(apps, 1, 'left'), apps);
});

test('existing shortcuts can be edited, including category, while retaining their icon', () => {
  const apps = normalizeAppList(DEFAULT_APPS);
  const updated = updateAppEntry({
    appId: 'com.example.Tube',
    name: 'My videos',
    category: 'Video tools',
    description: 'Personal video library',
  }, apps, 'F5rY8d4GTA.TizenTubeStandalone');

  assert.deepEqual(updated.app, {
    appId: 'com.example.Tube',
    name: 'My videos',
    category: 'VIDEO TOOLS',
    description: 'Personal video library',
    icon: 'youtube',
  });
  assert.equal(apps[0].name, 'TizenTube');
  assert.equal(updateAppEntry({ appId: 'NuvioTV001.NuvioTV', name: 'Duplicate' }, apps,
    'F5rY8d4GTA.TizenTubeStandalone').error, 'That app is already on your screen.');
  assert.equal(updateAppEntry({}, apps, 'missing.app').error, 'Could not find this app.');
});

test('new apps require a valid name and app ID, and cannot be added twice', () => {
  const added = createAppEntry({
    appId: 'com.example.FamilyMovies',
    name: 'Family movies',
    category: 'Family time',
    description: 'Watch together',
  }, DEFAULT_APPS);
  assert.equal(added.error, undefined);
  assert.equal(added.app.appId, 'com.example.FamilyMovies');
  assert.equal(added.app.name, 'Family movies');
  assert.equal(added.app.category, 'FAMILY TIME');
  assert.equal(createAppEntry({ appId: 'com.example.DefaultCategory', name: 'Default category' }).app.category, 'APP');

  assert.equal(createAppEntry({ name: 'Missing ID' }).field, 'appId');
  assert.equal(createAppEntry({ appId: 'invalid', name: 'Bad ID' }).field, 'appId');
  assert.equal(createAppEntry({ appId: 'com.example.App', name: '  ' }).field, 'name');
  assert.equal(createAppEntry({ appId: 'nUVioTV001.NuvioTV', name: 'Duplicate' }, DEFAULT_APPS).error,
    'That app is already on your screen.');

  const fullList = Array.from({ length: MAX_APPS }, (_, index) => ({
    appId: `com.example.App${index}`,
    name: `App ${index}`,
  }));
  assert.match(createAppEntry({ appId: 'com.example.NewApp', name: 'New app' }, fullList).error, /up to 20 apps/);
});
