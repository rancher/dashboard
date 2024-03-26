import _actions from '@shell/plugins/dashboard-store/actions';

const { findAll, findMatching } = _actions;

describe('dashboard-store: actions', () => {
  describe('findAll', () => {
    // Note - there are TS errors alll over this describe and should not have merged with them in.
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

    const standardAssertions = {
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
        { type: 'type' }
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

          expect(valueGetter({
            findAllPromise, findAllReturnValue, getters, dispatch, commit
          }))[assertionMethod](valueExpected);
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
        urlOptions:     jest.fn(() => 'getters.urlOptions')
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
