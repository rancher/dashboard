import _actions from '@shell/plugins/dashboard-store/actions';

const {
  find, findAll, findMatching, findPage, forgetType
} = _actions;

describe('dashboard-store: actions', () => {
  describe('findAll', () => {
    const setupContext = () => {
      const commit = jest.fn();
      const dispatch = jest.fn((...args) => {
        switch (args[0]) {
        case 'request':
          return { data: ['requestData'] };
        }
      });
      const state = { config: { namespace: 'unitTest' } };
      const getters = {
        normalizeType:    jest.fn(() => 'getters.normalizeType'),
        typeRegistered:   jest.fn(() => false),
        haveAll:          jest.fn(() => false),
        haveAllNamespace: jest.fn(() => false),
        all:              jest.fn((type: string) => 'getters.all'),
        urlFor:           jest.fn(() => 'getters.urlFor'), // we're not testing the urlFor getter so we don't need to do anything with opt here
      };
      const rootGetters = {
        'type-map/optionsFor': jest.fn(),
        'auth/fromHeader':     'foo'
      };

      // we're not testing function output based off of state or getter inputs here since they are dependencies and should be tested independently
      return {
        state,
        getters,
        rootGetters,
        commit,
        dispatch
      };
    };

    interface FindAllResult extends Pick<ReturnType<typeof setupContext>, 'getters' | 'dispatch' | 'commit'> {
      findAllPromise: Promise<unknown>;
      findAllReturnValue: unknown;
    }

    interface FindAllAssertion {
      assertionLabel: string;
      valueGetter: (result: FindAllResult) => unknown;
      valueExpected: unknown;
      assertionMethod?: 'toBe' | 'toMatchObject' | 'toHaveLength';
    }

    const standardAssertions: Record<string, FindAllAssertion> = {
      returnsPromise: {
        assertionLabel: 'returns a promise',
        valueGetter:    ({ findAllPromise }) => typeof findAllPromise.then,
        valueExpected:  'function'
      },
      callsAll: {
        assertionLabel: 'calls the "all" getter with the normalizedType',
        valueGetter:    ({ getters }) => getters.all.mock.calls[0][0],
        valueExpected:  'getters.normalizeType'
      },
      returnsFromAll: {
        assertionLabel: 'returns the value expected from the "all" getter',
        valueGetter:    ({ findAllReturnValue }) => findAllReturnValue,
        valueExpected:  'getters.all'
      },
      firstDispatchAction: {
        assertionLabel: 'first dispatch should be the "request" action',
        valueGetter:    ({ dispatch }) => dispatch.mock.calls[0][0],
        valueExpected:  'request'
      },
      firstDispatchParams: {
        assertionLabel: 'first dispatch parameters should be provided a normalized type and a url, streaming, and "metadata.managedFields" excluded under opt',
        valueGetter:    ({ dispatch }) => dispatch.mock.calls[0][1],
        valueExpected:  {
          type: 'getters.normalizeType',
          opt:  {
            url:    'getters.urlFor',
            stream: true
          }
        },
        assertionMethod: 'toMatchObject'
      },
      secondDispatchAction: {
        assertionLabel: 'second dispatch should be the "watch" action',
        valueGetter:    ({ dispatch }) => dispatch.mock.calls[1][0],
        valueExpected:  'watch'
      },
      secondDispatchParams: {
        assertionLabel:  'second dispatch parameters should have a normalized type and force set to false',
        valueGetter:     ({ dispatch }) => dispatch.mock.calls[1][1],
        valueExpected:   { type: 'getters.normalizeType', force: false },
        assertionMethod: 'toMatchObject'
      },
      countDispatches: {
        assertionLabel:  'should only make two dispatches',
        valueGetter:     ({ dispatch }) => dispatch.mock.calls,
        valueExpected:   2,
        assertionMethod: 'toHaveLength'
      },
      firstCommitMutation: {
        assertionLabel: 'first commit should be the "registerType" mutation',
        valueGetter:    ({ commit }) => commit.mock.calls[0][0],
        valueExpected:  'registerType'
      },
      firstCommitParams: {
        assertionLabel: 'first commit parameter should be a normalized type',
        valueGetter:    ({ commit }) => commit.mock.calls[0][1],
        valueExpected:  'getters.normalizeType'
      },
      secondCommitMutation: {
        assertionLabel: 'second commit should be the "loadAll" mutation',
        valueGetter:    ({ commit }) => commit.mock.calls[1][0],
        valueExpected:  'loadAll'
      },
      secondCommitParams: {
        assertionLabel: 'second commit parameters should have a normalized type, ctx.state.config.namespace, data returned by request, and skipHaveAll set to false',
        valueGetter:    ({ commit }) => commit.mock.calls[1][1],
        valueExpected:  {
          type:        'getters.normalizeType',
          ctx:         { state: { config: { namespace: 'unitTest' } } },
          data:        ['requestData'],
          skipHaveAll: false,
        },
        assertionMethod: 'toMatchObject'
      },
      countCommits: {
        assertionLabel:  'should only make two commits',
        valueGetter:     ({ commit }) => commit.mock.calls,
        valueExpected:   2,
        assertionMethod: 'toHaveLength'
      }

    };

    describe('called without a cache for the type in the second param', () => {
      const {
        dispatch, commit, getters, rootGetters, state
      } = setupContext();

      const findAllPromise = findAll(
        {
          dispatch, commit, getters, rootGetters, state
        },
        { type: 'type', opt: {} }
      );

      const assertionChain = [
        standardAssertions.returnsPromise,
        standardAssertions.callsAll,
        standardAssertions.returnsFromAll,
        standardAssertions.firstDispatchAction,
        standardAssertions.firstDispatchParams,
        standardAssertions.secondDispatchAction,
        standardAssertions.secondDispatchParams,
        standardAssertions.countDispatches,
        standardAssertions.firstCommitMutation,
        standardAssertions.firstCommitParams,
        standardAssertions.secondCommitMutation,
        standardAssertions.secondCommitParams,
        standardAssertions.countCommits
      ];

      it.each(assertionChain)(
        '$assertionLabel',
        async({ valueGetter, valueExpected, assertionMethod = 'toBe' }) => {
          const findAllReturnValue = await findAllPromise;
          const value = valueGetter({
            findAllPromise, findAllReturnValue, getters, dispatch, commit
          });

          expect(value)[assertionMethod as 'toBe'](valueExpected);
        }
      );
    });
  });

  describe('findMatching', () => {
    const setupContext = () => {
      const commit = jest.fn();
      const dispatch = jest.fn(() => 'dispatch');

      const state = { config: { namespace: 'unitTest' } };
      const getters = {
        normalizeType:  jest.fn((type) => type),
        typeRegistered: jest.fn(() => true),
        haveSelector:   jest.fn(() => false),
        matching:       jest.fn(() => 'getters.all'),
        urlFor:         jest.fn(() => 'getters.urlFor'),
        urlOptions:     jest.fn(() => 'getters.urlOptions'),
        haveAll:        jest.fn(() => false),
        all:            jest.fn(() => []),
      };
      const rootGetters = { 'type-map/optionsFor': jest.fn() };

      // we're not testing function output based off of state or getter inputs here since they are dependencies and should be tested independently
      return {
        state,
        getters,
        rootGetters,
        commit,
        dispatch
      };
    };
    const genericType = 'services';
    const genericSelector = 'a=b';
    const genericOpt = {};

    const assertionChain = [{
      assertionLabel: 'Basic Selector',
      input:          {
        type:      genericType,
        selector:  genericSelector,
        opt:       { ...genericOpt },
        namespace: undefined
      },
      output: {
        getters: {
          urlFor: [
            genericType,
            null,
            {
              ...genericOpt,
              isCollection:  true,
              depaginate:    undefined,
              labelSelector: genericSelector,
              url:           'getters.urlFor',
            }
          ]
        },
        actions: {
          request: {
            opt:  {},
            type: genericType
          }
        }
      }
    }];

    const {
      dispatch,
      commit,
      getters,
      rootGetters,
      state
    } = setupContext();

    it.each(assertionChain)(
      '$assertionLabel',
      async({ input, output }) => {
        await findMatching(
          {
            dispatch,
            getters,
            rootGetters,
            state,
            commit,
          },
          input
        );
        expect(getters.urlFor).toHaveBeenCalledWith(...output.getters.urlFor);
      }
    );
  });
});

describe('dashboard-store: findPage', () => {
  interface PageOpt {
    pagination: { filters: string[] };
  }

  interface PageResponse {
    data: string[];
    count: number;
    revision: string;
  }

  const setupPageContext = (respond: (opt: PageOpt) => Promise<PageResponse>) => {
    const commit = jest.fn();
    const dispatch = jest.fn((action: string, payload: { opt: PageOpt }) => {
      if (action === 'request') {
        return respond(payload.opt);
      }

      return undefined;
    });
    const getters = {
      normalizeType:     jest.fn((t: string) => t),
      typeRegistered:    jest.fn(() => true),
      havePaginatedPage: jest.fn(() => false),
      urlFor:            jest.fn(() => 'url'),
      all:               jest.fn(() => []),
      haveAll:           jest.fn(() => true),
      haveAllNamespace:  jest.fn(() => false),
    };

    return {
      state: { config: { namespace: 'unitTest' }, latestPageRequests: {} }, getters, commit, dispatch, rootGetters: {}
    };
  };

  const loadPageCalls = (commit: jest.Mock) => commit.mock.calls.filter((c) => c[0] === 'loadPage');

  it('does not let a superseded response overwrite a newer one', async() => {
    const ctx = setupPageContext((opt) => {
      // the first (unfiltered) request is slow, the second (filtered) one returns straight away
      const slow = !opt.pagination.filters.length;

      return new Promise((resolve) => setTimeout(
        () => resolve({
          data: [slow ? 'unfiltered' : 'filtered'], count: 1, revision: '1'
        }),
        slow ? 30 : 0
      ));
    });

    const page = (filters: string[]) => findPage(ctx, {
      type: 'pod',
      opt:  {
        pagination: {
          page: 1, pageSize: 10, filters
        }
      }
    });

    await Promise.all([page([]), page(['name~foo'])]);

    const committed = loadPageCalls(ctx.commit);

    expect(committed).toHaveLength(1);
    expect(committed[0][1].data).toStrictEqual(['filtered']);
  });

  it('still commits when a request is the newest one', async() => {
    const ctx = setupPageContext(() => Promise.resolve({
      data: ['only'], count: 1, revision: '1'
    }));

    await findPage(ctx, {
      type: 'pod',
      opt:  {
        pagination: {
          page: 1, pageSize: 10, filters: []
        }
      }
    });

    expect(loadPageCalls(ctx.commit)).toHaveLength(1);
  });

  it('does not commit or watch when forgetType invalidates an in-flight page request', async() => {
    let resolveRequest!: (value: PageResponse) => void;
    const ctx = setupPageContext(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const pending = findPage(ctx, {
      type: 'pod',
      opt:  {
        pagination: {
          page: 1, pageSize: 10, filters: []
        }
      }
    });

    forgetType({
      commit: ctx.commit, dispatch: ctx.dispatch, state: { ...ctx.state, started: [] }
    }, { type: 'pod', unwatch: false });

    resolveRequest({
      data: ['stale'], count: 1, revision: '1'
    });

    await pending;

    expect(loadPageCalls(ctx.commit)).toHaveLength(0);
    expect(ctx.dispatch).not.toHaveBeenCalledWith('watch', expect.anything());
  });
});

describe('dashboard-store: find', () => {
  const setupFindContext = ({
    havePageBefore = false,
    havePageAfter = false,
    cachedAfter = undefined as unknown,
    response = { id: 'ns/dep', metadata: { resourceVersion: '42' } },
    created = { id: 'ns/dep', classified: true },
  } = {}) => {
    let havePage = havePageBefore;
    let stored: unknown;

    const dispatch = jest.fn((action: string, payload?: unknown) => {
      if (action === 'request') {
        havePage = havePageAfter;
        if (cachedAfter !== undefined) {
          stored = cachedAfter;
        }

        return Promise.resolve(response);
      }
      if (action === 'load') {
        stored = { ...(payload as { data: object }).data, loaded: true };

        return Promise.resolve(stored);
      }
      if (action === 'create') {
        return Promise.resolve(created);
      }

      return Promise.resolve();
    });

    const getters = {
      byId:     jest.fn(() => stored),
      havePage: jest.fn(() => havePage),
      urlFor:   jest.fn(() => '/v1/apps.deployments/ns/dep'),
    };

    const state = { config: { namespace: 'unitTest' }, types: {} };

    return {
      state, getters, dispatch, response, created
    };
  };

  it('loads, watches, and returns the cached resource when no page-cache race occurs', async() => {
    const ctx = setupFindContext();

    const result = await find(ctx, {
      type: 'apps.deployment', id: 'ns/dep', opt: {}
    });

    expect(ctx.dispatch).toHaveBeenCalledWith('load', { data: ctx.response, invalidatePageCache: undefined });
    expect(ctx.dispatch).toHaveBeenCalledWith('watch', {
      type:      'apps.deployment',
      id:        'dep',
      namespace: 'ns',
      revision:  '42',
      force:     false,
    });
    expect(result).toStrictEqual({ ...ctx.response, loaded: true });
  });

  it('skips watch when opt.watch is false', async() => {
    const ctx = setupFindContext();

    await find(ctx, {
      type: 'apps.deployment', id: 'ns/dep', opt: { watch: false }
    });

    expect(ctx.dispatch).toHaveBeenCalledWith('load', { data: ctx.response, invalidatePageCache: undefined });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('watch', expect.anything());
  });

  it('returns the classified resource without loading or watching when havePage becomes true mid-request', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ctx = setupFindContext({ havePageBefore: false, havePageAfter: true });

    try {
      const result = await find(ctx, {
        type: 'apps.deployment', id: 'ns/dep', opt: { watch: true }
      });

      expect(warnSpy).toHaveBeenCalledWith('Prevented `find` action from polluting cache for type "apps.deployment" (currently represents a page).');
      expect(ctx.dispatch).not.toHaveBeenCalledWith('load', expect.anything());
      expect(ctx.dispatch).not.toHaveBeenCalledWith('watch', expect.anything());
      expect(ctx.dispatch).toHaveBeenCalledWith('create', ctx.response);
      expect(result).toStrictEqual(ctx.created);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('loads normally when havePage was already true before the request started', async() => {
    const ctx = setupFindContext({ havePageBefore: true, havePageAfter: true });

    const result = await find(ctx, {
      type: 'apps.deployment', id: 'ns/dep', opt: {}
    });

    expect(ctx.dispatch).toHaveBeenCalledWith('load', { data: ctx.response, invalidatePageCache: undefined });
    expect(result).toStrictEqual({ ...ctx.response, loaded: true });
  });

  it('returns the classified resource without warning or loading when opt.transient is true, even if havePage flips', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ctx = setupFindContext({ havePageBefore: false, havePageAfter: true });

    try {
      const result = await find(ctx, {
        type: 'apps.deployment', id: 'ns/dep', opt: { transient: true }
      });

      expect(warnSpy).not.toHaveBeenCalledWith(expect.anything());
      expect(ctx.dispatch).not.toHaveBeenCalledWith('load', expect.anything());
      expect(ctx.dispatch).not.toHaveBeenCalledWith('watch', expect.anything());
      expect(ctx.dispatch).toHaveBeenCalledWith('create', ctx.response);
      expect(result).toStrictEqual(ctx.created);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('returns the store-backed resource when havePage becomes true mid-request and the page already cached it', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const pageCached = { id: 'ns/dep', fromPage: true };
    const ctx = setupFindContext({
      havePageBefore: false, havePageAfter: true, cachedAfter: pageCached
    });

    try {
      const result = await find(ctx, {
        type: 'apps.deployment', id: 'ns/dep', opt: { watch: true }
      });

      expect(ctx.dispatch).not.toHaveBeenCalledWith('load', expect.anything());
      expect(ctx.dispatch).not.toHaveBeenCalledWith('create', expect.anything());
      expect(result).toStrictEqual(pageCached);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('returns the classified resource without loading or watching when opt.transient is true and there is no page', async() => {
    const ctx = setupFindContext();

    const result = await find(ctx, {
      type: 'apps.deployment', id: 'ns/dep', opt: { transient: true }
    });

    expect(ctx.dispatch).not.toHaveBeenCalledWith('load', expect.anything());
    expect(ctx.dispatch).not.toHaveBeenCalledWith('watch', expect.anything());
    expect(ctx.dispatch).toHaveBeenCalledWith('create', ctx.response);
    expect(result).toStrictEqual(ctx.created);
  });
});
