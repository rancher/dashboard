import { fetchNamespacesAllowingCreate } from '@shell/utils/namespace-permissions';

describe('fetchNamespacesAllowingCreate', () => {
  const COLLECTION = '/k8s/clusters/c-123/v1/namespaces';

  const createStore = (dispatch: jest.Mock, schema: any = { links: { collection: COLLECTION } }) => ({
    getters: { 'cluster/schemaFor': jest.fn().mockReturnValue(schema) },
    dispatch,
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['the namespace schema has no collection link', { links: {} }],
    ['there is no namespace schema', null],
  ])('returns null without a request when %s', async(_, schema) => {
    const store = createStore(jest.fn(), schema);

    const result = await fetchNamespacesAllowingCreate(store, 'cluster', 'secret');

    expect(result).toBeNull();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('asks the given store for the permissions on the type in every namespace', async() => {
    const store = createStore(jest.fn().mockResolvedValue({ data: [] }));

    await fetchNamespacesAllowingCreate(store, 'cluster', 'apps.deployment');

    expect(store.getters['cluster/schemaFor']).toHaveBeenCalledWith('namespace');
    expect(store.dispatch).toHaveBeenCalledWith('cluster/request', { url: `${ COLLECTION }?checkPermissions=apps.deployment&include=metadata.name` });
  });

  it('returns the namespaces where the user may create the type', async() => {
    const store = createStore(jest.fn().mockResolvedValue({
      data: [
        { id: 'can-create', resourcePermissions: { secret: { create: 'url', get: 'url' } } },
        { id: 'read-only', resourcePermissions: { secret: { get: 'url', list: 'url' } } },
        { id: 'other-type-only', resourcePermissions: { configmap: { create: 'url' } } },
        { id: 'no-permissions', resourcePermissions: {} },
      ]
    }));

    const result = await fetchNamespacesAllowingCreate(store, 'cluster', 'secret');

    expect(result).toStrictEqual(new Set(['can-create']));
  });

  it('returns an empty set when the user may not create the type anywhere', async() => {
    const store = createStore(jest.fn().mockResolvedValue({ data: [{ id: 'read-only', resourcePermissions: {} }] }));

    const result = await fetchNamespacesAllowingCreate(store, 'cluster', 'secret');

    expect(result).toStrictEqual(new Set());
  });

  it('returns null when the API does not support checkPermissions', async() => {
    const store = createStore(jest.fn().mockResolvedValue({ data: [{ id: 'ns-1' }, { id: 'ns-2' }] }));

    const result = await fetchNamespacesAllowingCreate(store, 'cluster', 'secret');

    expect(result).toBeNull();
  });

  it('returns null when the request fails', async() => {
    const store = createStore(jest.fn().mockRejectedValue(new Error('boom')));

    const result = await fetchNamespacesAllowingCreate(store, 'cluster', 'secret');

    expect(result).toBeNull();
  });
});
