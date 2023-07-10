import _actions from '@shell/plugins/dashboard-store/actions';

const { findAll } = _actions;

describe('dashboard-store: actions', () => {
  let dispatchCalls = {};
  let commitCalls = {};
  // we're dumping our commits into a map so we can reference them
  // actions and mutations are stored against their name in an array so we can capture if they're called multiple times
  // arguments past the name of the action or mutation are stored in an array in case there are multiple
  const commit = (mutation, ...args) => {
    commitCalls[mutation] = [...(commitCalls[mutation] || []), args];
  };
  const dispatch = (action, ...args) => {
    dispatchCalls[action] = [...(dispatchCalls[action] || []), args];
    if (action === 'request') {
      return { data: [] };
    }
  };
  const state = { config: { namespace: 'unitTest' } };
  const getters = {
    normalizeType:    (type) => type,
    typeRegistered:   (type) => type === 'foo',
    haveAll:          (type) => type === 'baz',
    haveAllNamespace: (type, namespaced) => type === 'far' && namespaced === 'faz',
    all:              (type) => [type],
    urlFor:           (type, _, opt) => type, // we're not testing the urlFor getter so we don't need to do anything with opt here
  };
  const rootGetters = {
    'type-map/optionsFor': (type) => {
      return {};
    },
    'auth/fromHeader': 'foo'
  };

  // we're not testing function output based off of state or getter inputs here since they are dependencies and should be tested independently
  const ctx = {
    state,
    getters,
    rootGetters,
    commit,
    dispatch
  };

  // setting afterEach here seems reasonable but isn't allowed by the linter
  const resetCalls = () => {
    dispatchCalls = {};
    commitCalls = {};
  };

  describe('dashboard-store > actions > findAll', () => {
    let findAllPromise;

    it('expects findAll to return a promise', () => {
      resetCalls();
      findAllPromise = findAll(ctx, { type: 'type:foo' });

      expect(typeof findAllPromise.then).toBe('function');
    });

    it('expects basic findAll to return an array asynchronously', async() => {
      const findAllReturnValue = await findAllPromise;

      expect(findAllReturnValue).toHaveLength(1);
      expect(findAllReturnValue[0]).toBe('type:foo');
    });
    it('expects basic findAll to dispatch the "request" action once with a url, streaming, and "metadata.managedFields" excluded', () => {
      expect(dispatchCalls.request).toMatchObject([[{
        type: 'type:foo',
        opt:  {
          url:           'type:foo',
          stream:        true,
          excludeFields: ['metadata.managedFields']
        }
      }]]);
    });
    it('expects basic findAll to dispatch the "watch" action once', () => {
      expect(dispatchCalls.watch).toMatchObject([[{ type: 'type:foo', force: false }]]);
    });
    it('expects basic findAll to commit the "registerType" mutation once', () => {
      expect(commitCalls.registerType).toMatchObject([['type:foo']]);
    });
    it('expects basic findAll to commit the "loadAll" mutation once with ...', () => {
      expect(commitCalls.loadAll).toMatchObject([[{
        type:        'type:foo',
        ctx:         { state: { config: { namespace: 'unitTest' } } },
        data:        [],
        skipHaveAll: false,
      }]]);
    });

    // make a request with excluded fields now
    it('expects findAll with excludedFields to return an array asynchronously', async() => {
      resetCalls();
      const findAllReturnValue = await findAll(ctx, { type: 'type:foo', opt: { excludeFields: ['field:foo'] } });

      expect(findAllReturnValue).toHaveLength(1);
      expect(findAllReturnValue[0]).toBe('type:foo');
    });
    it('expects findAll with excludedFields to dispatch the "request" action once with a url, streaming, and "metadata.managedFields" and "field:foo" excluded', () => {
      expect(dispatchCalls.request).toMatchObject([[{
        type: 'type:foo',
        opt:  {
          url:           'type:foo',
          stream:        true,
          excludeFields: ['field:foo', 'metadata.managedFields']
        }
      }]]);
    });
    it('expects findAll with excludedFields to dispatch the "watch" action once', () => {
      expect(dispatchCalls.watch).toMatchObject([[{ type: 'type:foo', force: false }]]);
    });
    it('expects findAll with excludedFields to commit the "registerType" mutation once', () => {
      expect(commitCalls.registerType).toMatchObject([['type:foo']]);
    });
    it('expects findAll with excludedFields to commit the "loadAll" mutation once with ...', () => {
      expect(commitCalls.loadAll).toMatchObject([[{
        type:        'type:foo',
        ctx:         { state: { config: { namespace: 'unitTest' } } },
        data:        [],
        skipHaveAll: false,
      }]]);
    });
  });
});
