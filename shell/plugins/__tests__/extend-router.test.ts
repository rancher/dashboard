import { extendRouter } from '@shell/plugins/extend-router';

interface CurrentRoute {
  query: Record<string, any>;
  hash: string;
}

// extendRouter mutates the passed-in router with an `applyQuery` method, which
// the plain-JS source doesn't declare a type for.
interface ExtendedRouter {
  currentRoute: { value: CurrentRoute };
  replace: jest.Mock;
  applyQuery: (qp: Record<string, any>, defaults?: Record<string, any>) => Promise<any>;
}

describe('extendRouter', () => {
  const makeRouter = (currentRoute: CurrentRoute, replaceImpl?: () => Promise<any>): ExtendedRouter => {
    const router = {
      currentRoute: { value: currentRoute },
      replace:      jest.fn(replaceImpl || (() => Promise.resolve())),
    } as ExtendedRouter;

    extendRouter(router);

    return router;
  };

  it('replaces the route with merged query params and preserves the existing hash', async() => {
    const router = makeRouter({ query: { foo: 'bar' }, hash: '#section' });

    await router.applyQuery({ page: '2' });

    expect(router.replace).toHaveBeenCalledWith({ query: { foo: 'bar', page: '2' }, hash: '#section' });
  });

  it('defaults hash to an empty string when the current route has no hash', async() => {
    const router = makeRouter({ query: {}, hash: '' });

    await router.applyQuery({ page: '2' });

    expect(router.replace).toHaveBeenCalledWith({ query: { page: '2' }, hash: '' });
  });

  it.each([
    {
      desc:     'the new value equals the default',
      qp:       { page: '1', sort: 'name' },
      defaults: { page: '1' },
      expected: { keep: 'me', sort: 'name' },
    },
    {
      desc:     'a value-less boolean flag is turned off',
      qp:       { onlyMine: false, sort: 'name' },
      defaults: { onlyMine: false },
      expected: { keep: 'me', sort: 'name' },
    },
    {
      desc:     'a value-less boolean flag is turned on',
      qp:       { onlyMine: true },
      defaults: { onlyMine: false },
      expected: { keep: 'me', onlyMine: null },
    },
  ])('computes the merged query when $desc', async({ qp, defaults, expected }) => {
    const router = makeRouter({ query: { keep: 'me' }, hash: '' });

    await router.applyQuery(qp, defaults);

    expect(router.replace).toHaveBeenCalledWith({ query: expected, hash: '' });
  });

  it('does not call replace when the computed query is unchanged from the current query', async() => {
    const router = makeRouter({ query: { foo: 'bar' }, hash: '' });

    const result = await router.applyQuery({ foo: 'bar' });

    expect(router.replace).toHaveBeenCalledTimes(0);
    expect(result).toBeUndefined();
  });

  it('swallows a NavigationDuplicated rejection from replace', async() => {
    const error = { name: 'NavigationDuplicated' };
    const router = makeRouter({ query: {}, hash: '' }, () => Promise.reject(error));

    await expect(router.applyQuery({ page: '2' })).resolves.toBeUndefined();
  });

  it('rethrows a rejection from replace that is not a NavigationDuplicated error', async() => {
    const error = new Error('boom');
    const router = makeRouter({ query: {}, hash: '' }, () => Promise.reject(error));

    await expect(router.applyQuery({ page: '2' })).rejects.toThrow(error);
  });
});
