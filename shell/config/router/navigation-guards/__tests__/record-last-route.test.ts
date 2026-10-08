import { recordLastRoute } from '@shell/config/router/navigation-guards/record-last-route';

describe('recording the last route', () => {
  const route = (name: string, params: Record<string, string> = {}, query: Record<string, string> = {}) => ({
    name, params, query
  });

  const run = async(to: object, from: object) => {
    const dispatch = jest.fn();
    const next = jest.fn();

    await recordLastRoute(to, from, next, { store: { dispatch } });

    return { dispatch, next };
  };

  it('should record a route the user moved to', async() => {
    const { dispatch, next } = await run(route('c-cluster-product-resource', { resource: 'pod' }), route('c-cluster-explorer'));

    expect(dispatch).toHaveBeenCalledWith('prefs/setLastVisited', { name: 'c-cluster-product-resource', params: { resource: 'pod' } });
    expect(next).toHaveBeenCalledWith();
  });

  it('should leave it alone for a navigation that stays on the page, eg one changing only the query', async() => {
    const page = route('c-cluster-product-resource', { resource: 'pod' });
    const { dispatch, next } = await run({ ...page, query: { tableState: 'x' } }, page);

    expect(dispatch).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should record the same page for another resource', async() => {
    const { dispatch } = await run(route('c-cluster-product-resource', { resource: 'pod' }), route('c-cluster-product-resource', { resource: 'secret' }));

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
