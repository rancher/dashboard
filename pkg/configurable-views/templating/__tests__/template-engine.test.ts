import type { Store } from 'vuex';
import {
  appliedViewScopes, getPageConfig, isTemplatingEnabled, saveView, toggleTemplating
} from '@pkg/configurable-views/templating/template-engine';
import type { ViewSet } from '@pkg/configurable-views/templating/types';

const MARKER = 'templates.rancher.io/ai-templating';

interface FakeConfigMap {
  metadata: { name: string; namespace: string; labels: Record<string, string> };
  data: Record<string, string>;
  save: jest.Mock;
}

function configMap(name: string, data: Record<string, unknown>, type = 'config'): FakeConfigMap {
  return {
    metadata: {
      name, namespace: 'default', labels: { [MARKER]: 'true', 'templates.rancher.io/type': type }
    },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

// A store holding the given ConfigMaps, the way the management store hands them back.
function storeWith(...maps: FakeConfigMap[]) {
  const created: FakeConfigMap[] = [];
  const getters = {
    'management/byId': (_type: string, id: string) => maps.find((m) => `${ m.metadata.namespace }/${ m.metadata.name }` === id),
    'management/all':  () => maps,
  };
  const dispatch = jest.fn((action: string, spec: FakeConfigMap) => {
    const made = { ...spec, save: jest.fn().mockResolvedValue(undefined) };

    created.push(made);

    return Promise.resolve(made);
  });

  return {
    store: { getters, dispatch } as unknown as Store<unknown>, created, dispatch
  };
}

const set = (...names: string[]): ViewSet => ({
  views: names.map((name) => ({
    id: name, name, kind: 'stock' as const
  }))
});

describe('appliedViewScopes', () => {
  it("shows a user their own views over the organization's", () => {
    const { store } = storeWith(configMap('templating-home', { home: { global: set('Org'), users: { u1: set('Mine') } } }));

    expect(appliedViewScopes(store.getters, 'u1').resolved?.views.map((v) => v.name)).toStrictEqual(['Mine']);
    expect(appliedViewScopes(store.getters, 'u2').resolved?.views.map((v) => v.name)).toStrictEqual(['Org']);
  });

  it("falls back to the organization's when a user's scope is switched off", () => {
    const { store } = storeWith(configMap('templating-home', { home: { global: set('Org'), users: { u1: { ...set('Mine'), disabled: true } } } }));
    const scopes = appliedViewScopes(store.getters, 'u1');

    expect(scopes.resolved?.views.map((v) => v.name)).toStrictEqual(['Org']);
    expect(scopes.user?.disabled).toBe(true);
    expect(scopes.hasUser).toBe(true);
  });

  it('keeps each page apart', () => {
    const { store } = storeWith(configMap('templating-home', { home: { global: set('Home') }, clusterDashboard: { global: set('Dash') } }));

    expect(appliedViewScopes(store.getters, null, 'clusterDashboard').resolved?.views.map((v) => v.name)).toStrictEqual(['Dash']);
  });

  it('reads views stored under their earlier name', () => {
    const { store } = storeWith(configMap('templating-home', { home: { users: { u1: { panels: [{ id: 'p', name: 'Old' }], defaultPanelId: 'p' } } } }));
    const { user } = appliedViewScopes(store.getters, 'u1');

    expect(user?.views.map((v) => v.name)).toStrictEqual(['Old']);
    expect(user?.defaultViewId).toBe('p');
  });

  it('has nothing to show when nothing is stored, or it cannot be read', () => {
    expect(appliedViewScopes(storeWith().store.getters, 'u1').resolved).toBeNull();
    expect(appliedViewScopes(storeWith(configMap('templating-home', { home: '{not json' })).store.getters, 'u1').resolved).toBeNull();
  });
});

describe('getPageConfig', () => {
  it('still reads a Home stored in the kill-switch ConfigMap, where it used to live', () => {
    const { store } = storeWith(configMap('templating-config', { home: { global: set('Legacy') } }));

    expect(getPageConfig(store.getters, 'home')).toStrictEqual({ global: set('Legacy') });
    expect(getPageConfig(store.getters, 'clusterDashboard')).toStrictEqual({});
  });
});

describe('the kill switch', () => {
  it('is on unless it says "false"', () => {
    expect(isTemplatingEnabled(storeWith().store.getters)).toBe(true);
    expect(isTemplatingEnabled(storeWith(configMap('templating-config', { enabled: 'false' })).store.getters)).toBe(false);
  });

  it('flips and saves the stored switch', async() => {
    const cm = configMap('templating-config', { enabled: 'true' });

    expect(await toggleTemplating(storeWith(cm).store)).toBe(false);
    expect(cm.data.enabled).toBe('false');
    expect(cm.save).toHaveBeenCalledTimes(1);
  });
});

describe('saveView', () => {
  it("writes one user's views, leaving other users and other pages as they were", async() => {
    const cm = configMap('templating-home', { home: { global: set('Org'), users: { u2: set('Theirs') } }, clusterDashboard: { global: set('Dash') } });

    await saveView(storeWith(cm).store, 'user', set('Mine'), 'u1', 'home');

    expect(JSON.parse(cm.data.home)).toStrictEqual({ global: set('Org'), users: { u2: set('Theirs'), u1: set('Mine') } });
    expect(JSON.parse(cm.data.clusterDashboard)).toStrictEqual({ global: set('Dash') });
    expect(cm.save).toHaveBeenCalledTimes(1);
  });

  it('clears a scope when given nothing', async() => {
    const cm = configMap('templating-home', { home: { global: set('Org'), users: { u1: set('Mine') } } });

    await saveView(storeWith(cm).store, 'user', null, 'u1');
    await saveView(storeWith(cm).store, 'global', null);

    expect(JSON.parse(cm.data.home)).toStrictEqual({ users: {} });
  });

  it('creates the ConfigMap the first time, labelled so it is found again', async() => {
    const { store, created } = storeWith();

    await saveView(store, 'global', set('Org'), null, 'clusterDashboard');

    expect(created).toHaveLength(1);
    expect(created[0].metadata).toStrictEqual(expect.objectContaining({ name: 'templating-home', namespace: 'default' }));
    expect(created[0].metadata.labels[MARKER]).toBe('true');
    expect(JSON.parse(created[0].data.clusterDashboard)).toStrictEqual({ global: set('Org') });
    expect(created[0].save).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a user scope with no user', async() => {
    const { store, dispatch } = storeWith();

    await saveView(store, 'user', set('Mine'), null);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
