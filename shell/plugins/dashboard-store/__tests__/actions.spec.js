import _actions from '@shell/plugins/dashboard-store/actions';

const { findAll } = _actions;

describe('dashboard-store: actions', () => {
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
      all:              jest.fn(() => 'getters.all'),
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

  const standardValidationChain = [
    [
      'returns a promise',
      {
        valueGetter:   (findAllPromise) => typeof findAllPromise.then,
        valueExpected: 'function'

      }
    ],
    [
      'calls the "all" getter with the normalizedType',
      {
        valueGetter:   (_, __, { getters }) => getters.all.mock.calls[0][0],
        valueExpected: 'getters.normalizeType'
      }
    ],
    [
      'returns the value expected from the "all" getter',
      {
        valueGetter:   (_, findAllReturnValue) => findAllReturnValue,
        valueExpected: 'getters.all'
      }
    ],
    [
      'first dispatch should be the "request" action',
      {
        valueGetter:   (_, __, { dispatch }) => dispatch.mock.calls[0][0],
        valueExpected: 'request'
      }
    ],
    [
      'first dispatch parameters should be provided a normalized type and a url, streaming, and "metadata.managedFields" excluded under opt',
      {
        valueGetter:   (_, __, { dispatch }) => dispatch.mock.calls[0][1],
        valueExpected: {
          type: 'getters.normalizeType',
          opt:  {
            url:           'getters.urlFor',
            stream:        true,
            excludeFields: ['metadata.managedFields']
          }
        },
        assertionMethod: 'toMatchObject'
      }
    ],
    [
      'second dispatch should be the "watch" action',
      {
        valueGetter:   (_, __, { dispatch }) => dispatch.mock.calls[1][0],
        valueExpected: 'watch'
      }
    ],
    [
      'second dispatch parameters should have a normalized type and force set to false',
      {
        valueGetter:     (_, __, { dispatch }) => dispatch.mock.calls[1][1],
        valueExpected:   { type: 'getters.normalizeType', force: false },
        assertionMethod: 'toMatchObject'
      }
    ],
    [
      'should only make two dispatches',
      {
        valueGetter:     (_, __, { dispatch }) => dispatch.mock.calls,
        valueExpected:   2,
        assertionMethod: 'toHaveLength'
      }
    ],

    [
      'first commit should be the "registerType" mutation',
      {
        valueGetter:   (_, __, { commit }) => commit.mock.calls[0][0],
        valueExpected: 'registerType'
      }
    ],
    [
      'first commit parameters should have a normalized type',
      {
        valueGetter:   (_, __, { commit }) => commit.mock.calls[0][1],
        valueExpected: 'getters.normalizeType'
      }
    ],

    [
      'second commit should be the "loadAll" mutation',
      {
        valueGetter:   (_, __, { commit }) => commit.mock.calls[1][0],
        valueExpected: 'loadAll'
      }
    ],
    [
      'second commit parameters should have a normalized type, ctx.state.config.namespace, data returned by request, and skipHaveAll set to false',
      {
        valueGetter:   (_, __, { commit }) => commit.mock.calls[1][1],
        valueExpected: {
          type:        'getters.normalizeType',
          ctx:         { state: { config: { namespace: 'unitTest' } } },
          data:        ['requestData'],
          skipHaveAll: false,
        },
        assertionMethod: 'toMatchObject'
      }
    ],
    [
      'should only make two commits',
      {
        valueGetter:     (_, __, { commit }) => commit.mock.calls,
        valueExpected:   2,
        assertionMethod: 'toHaveLength'
      }
    ]
  ];

  describe('dashboard-store > actions > findAll', () => {
    describe('called without a cache for the type in the second param', () => {
      const ctx = setupContext();
      const findAllPromise = findAll(ctx, { type: 'type' });

      const validationChain = standardValidationChain;

      it.each(validationChain)(
        '%s',
        async(_, { valueGetter, valueExpected, assertionMethod = 'toBe' }) => {
          const findAllReturnValue = await findAllPromise;

          expect(valueGetter(findAllPromise, findAllReturnValue, ctx))[assertionMethod](valueExpected);
        }
      );
    });

    describe('called without a cache for the type in the second param and an excluded fields array', () => {
      const ctx = setupContext();
      const findAllPromise = findAll(ctx, { type: 'type', opt: { excludeFields: ['field:foo'] } });
      const validationChain = [
        ...standardValidationChain.filter(([label]) => label !== 'first dispatch parameters should be provided a normalized type and a url, streaming, and "metadata.managedFields" excluded under opt'),
        [
          'first dispatch parameters should be provided a normalized type and a url, streaming, , and both "field:foo" and "metadata.managedFields" excluded',
          {
            valueGetter:   (_, __, { dispatch }) => dispatch.mock.calls[0][1],
            valueExpected: {
              type: 'getters.normalizeType',
              opt:  {
                url:           'getters.urlFor',
                stream:        true,
                excludeFields: ['field:foo', 'metadata.managedFields']
              }
            },
            assertionMethod: 'toMatchObject'
          }
        ]
      ];

      it.each(validationChain)(
        '%s',
        async(_, { valueGetter, valueExpected, assertionMethod = 'toBe' }) => {
          const findAllReturnValue = await findAllPromise;

          expect(valueGetter(findAllPromise, findAllReturnValue, ctx))[assertionMethod](valueExpected);
        }
      );
    });
  });
});
