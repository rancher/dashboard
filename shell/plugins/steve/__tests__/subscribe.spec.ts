import { actions, getters, mutations } from '../subscribe';
import { REVISION_TOO_OLD } from '../../../utils/socket';
import { STEVE_WATCH_MODE } from '../../../types/store/subscribe.types';
import backOff from '../../../utils/back-off';
import { SteveWatchEventListenerManager } from '../../subscribe-events';
import { STEVE_RESPONSE_CODE } from '../../../types/rancher/steve.api';

describe('steve: subscribe', () => {
  describe('actions', () => {
    describe('watch', () => {
      const state = { listenerManager: new SteveWatchEventListenerManager() };
      const getters = {
        normalizeType:   (type: string) => type,
        schemaFor:       () => null,
        inError:         () => false,
        watchStarted:    () => false,
        listenerManager: state.listenerManager
      };
      const rootGetters = {
        'type-map/isSpoofed': () => false,
        'features/get':       () => false,
      };

      const type = 'test';
      const selector = undefined;
      const id = undefined;
      const revision = 1;
      const namespace = undefined;
      const stop = false;
      const force = undefined;

      it('no schema', () => {
        const dispatch = jest.fn();

        actions.watch({
          state, dispatch, getters, rootGetters
        }, {
          type, selector, id, revision, namespace, stop, force
        });

        expect(dispatch).toHaveBeenCalledWith('send', {
          resourceType:    type,
          resourceVersion: revision.toString(),

        });
      });

      it('schema with watch verb', () => {
        const dispatch = jest.fn();
        const testGetters = {
          ...getters,
          schemaFor: (type: string) => ({ attributes: { verbs: ['watch'] } }),
        };

        actions.watch({
          state, dispatch, getters: testGetters, rootGetters
        }, {
          type, selector, id, revision, namespace, stop, force
        });

        expect(dispatch).toHaveBeenCalledWith('send', {
          resourceType:    type,
          resourceVersion: revision.toString(),
        });
      });

      it('schema with no watch verb', () => {
        const dispatch = jest.fn();
        const testGetters = {
          ...getters,
          schemaFor: (type: string) => ({ attributes: { verbs: [] } }),
        };

        actions.watch({
          state, dispatch, getters: testGetters, rootGetters
        }, {
          type, selector, id, revision, namespace, stop, force
        });

        expect(dispatch).not.toHaveBeenCalled();
      });

      it('don\'t watch when the watch is in error', () => {
        const dispatch = jest.fn();
        const testGetters = {
          ...getters,
          inError: (params: any) => true,
        };

        actions.watch({
          state, dispatch, getters: testGetters, rootGetters
        }, {
          type, selector, id, revision, namespace, stop, force
        });

        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('ws.resource.error', () => {
      it('handle no permission error', () => {
        const commit = jest.fn();
        const getters = { storeName: 'storeName' };
        const dispatch = undefined;

        const msg = { data: { error: 'the server does not allow this method on the requested resource' } };

        actions['ws.resource.error']({
          getters, commit, dispatch
        }, msg);
        expect(commit).toHaveBeenCalledWith('setInError', { msg, reason: 'NO_PERMS' });
      });
    });

    describe('fetchPageResources', () => {
      const dispatch = jest.fn();
      const getters = {
        backOffId:    jest.fn(),
        typeEntry:    jest.fn(),
        canBackoff:   jest.fn(),
        watchStarted: jest.fn(),
        inError:      jest.fn(),
      };
      let backOffSpy: any;
      const context = { $socket: {} };

      beforeEach(() => {
        jest.clearAllMocks();
        backOffSpy = {
          getBackOff: jest.spyOn(backOff, 'getBackOff'),
          reset:      jest.spyOn(backOff, 'reset'),
          recurse:    jest.spyOn(backOff, 'recurse'),
        };
        getters.backOffId.mockReturnValue('backoff-id');
        getters.typeEntry.mockReturnValue({ revision: '10' });
        backOffSpy.getBackOff.mockReturnValue({ metadata: { revision: '10' } } as any);
        backOffSpy.recurse.mockResolvedValue(undefined);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should abort if current revision is newer than target revision', async() => {
        // Current (10) > Target (5)
        const params = {
          resourceType: 'type', namespace: 'ns', revision: '5'
        };

        await actions.fetchPageResources.call(context, { getters, dispatch }, {
          opt: {}, storePagination: {}, params
        });

        expect(backOffSpy.recurse).not.toHaveBeenCalled();
      });

      it('should reset backoff if target revision is newer than active revision', async() => {
        // Active (10) < Target (15)
        const params = {
          resourceType: 'type', namespace: 'ns', revision: '15'
        };

        await actions.fetchPageResources.call(context, { getters, dispatch }, {
          opt: {}, storePagination: {}, params
        });

        expect(backOffSpy.reset).toHaveBeenCalledWith('backoff-id');
        expect(backOffSpy.recurse).toHaveBeenCalledWith(expect.objectContaining({
          id:       'backoff-id',
          metadata: { revision: '15' }
        }));
      });

      it('should recurse if revisions are valid', async() => {
        const params = {
          resourceType: 'type', namespace: 'ns', revision: '10'
        };

        await actions.fetchPageResources.call(context, { getters, dispatch }, {
          opt: {}, storePagination: {}, params
        });

        expect(backOffSpy.recurse).toHaveBeenCalledWith(expect.objectContaining({
          id:       'backoff-id',
          metadata: { revision: '10' }
        }));
      });

      describe('recurse options', () => {
        const params = {
          resourceType: 'type', namespace: 'ns', revision: '10'
        };
        let recurseArgs: any;

        beforeEach(async() => {
          await actions.fetchPageResources.call(context, { getters, dispatch }, {
            opt: {}, storePagination: { request: { filter: 'foo' } }, params
          });
          recurseArgs = backOffSpy.recurse.mock.calls[0][0];
        });

        it('canFn should return false if socket closed', () => {
          getters.canBackoff.mockReturnValue(false);
          expect(recurseArgs.canFn()).toBe(false);
          expect(getters.canBackoff).toHaveBeenCalledWith(context.$socket);
        });

        it('canFn should return false if watch not started and not in REVISION_TOO_OLD error', () => {
          getters.canBackoff.mockReturnValue(true);
          getters.watchStarted.mockReturnValue(false);
          getters.inError.mockReturnValue('some-other-error');
          expect(recurseArgs.canFn()).toBe(false);
        });

        it('canFn should return true if watch started', () => {
          getters.canBackoff.mockReturnValue(true);
          getters.watchStarted.mockReturnValue(true);
          expect(recurseArgs.canFn()).toBe(true);
        });

        it('canFn should return true if watch not started but in REVISION_TOO_OLD error', () => {
          getters.canBackoff.mockReturnValue(true);
          getters.watchStarted.mockReturnValue(false);
          getters.inError.mockReturnValue(REVISION_TOO_OLD);
          expect(recurseArgs.canFn()).toBe(true);
        });

        it('continueOnError should return true for UNKNOWN_REVISION error', async() => {
          const err = { status: 400, code: STEVE_RESPONSE_CODE.UNKNOWN_REVISION };

          expect(await recurseArgs.continueOnError(err)).toBe(true);
        });

        it('delayedFn should dispatch findPage', async() => {
          await recurseArgs.delayedFn();
          expect(dispatch).toHaveBeenCalledWith('findPage', {
            type: 'type',
            opt:  {
              namespaced: 'ns',
              revision:   '10',
              filter:     'foo'
            }
          });
        });
      });
    });
  });

  describe('getters', () => {
    describe('nextResourceVersion', () => {
      const myType = 'myType';
      const myId = `myId`;

      type Revision = string | number | null | undefined

      const createState = (revision?: Revision, cachedList?: any[] ) => {
        const typeState: any = {};

        if (revision !== undefined) {
          typeState.revision = revision;
        }
        if (cachedList !== undefined) {
          typeState.list = cachedList;
        } else {
          typeState.list = [];
        }

        return { types: { [myType.toLocaleLowerCase()]: typeState } };
      };

      const createGetters = (revision?: Revision) => {
        return {
          byId: (type: any, id: any) => {
            expect(type).toBe(myType.toLowerCase());
            expect(id).toBe(myId);

            return { metadata: { resourceVersion: revision } };
          }
        };
      };

      it.each([
        ['Is String, Return String', createGetters('abc'), myId, 'abc'],
        // This catches old parseInt errors
        ['Is String, Return String (integer prefix)', createGetters('123-abc'), myId, '123-abc'],
        // This catches old parseInt errors
        ['Is String, Return String (integer postfix)', createGetters('abc-123'), myId, 'abc-123'],
        ['Is 0, Return Null', createGetters(0), myId, null],
        ['Is Number, Return Number', createGetters(123), myId, 123],
        ['Is Missing (null), Return Null', createGetters(null), myId, null],
        ['Is Missing (undefined), Return Null', createGetters(undefined), myId, null],
      ])('test revision from a single resource - %s', (_, storeGetters, id, expected) => {
        expect(getters.nextResourceVersion(createState(), storeGetters)(myType, id)).toBe(expected);
      });

      const createResource = (revision: Revision) => ({ metadata: { resourceVersion: revision } });

      it.each([
        ['Is String, Return String', createState('abc'), 'abc'],
        ['Is String, Return String (integer prefix)', createState('123-abc'), '123-abc'],
        ['Is String, Return String (integer postfix)', createState('abc-123'), 'abc-123'],
        ['Is 0, Return Null (nothing in cache)', createState(0), null],
        ['Is 0, Return Number (numbers in cache)', createState(0, [createResource(1), createResource(2), createResource(3)]), 3],
        ['Is 0, Return Number (numbers and strings in cache)', createState(0, [createResource(1), createResource('abc-2'), createResource('3-abc')]), 1],
        ['Is 0, Return Null (only strings in cache)', createState(0, [createResource('abc'), createResource('abc-2'), createResource('3-abc')]), null],
        ['Is missing (undefined), Return Null ', createState(undefined), null],
        ['Is missing (null), Return Null', createState(null), null],
      ])('test revision from a collection - %s', (_, state, expected) => {
        expect(getters.nextResourceVersion(state, {})(myType)).toBe(expected);
      });
    });
  });

  describe('backoff', () => {
    const waitForBackOff = async(advanceTimersByTime = 20000) => {
      jest.advanceTimersByTime(advanceTimersByTime);
      // jest.advanceTimersByTime(advanceTimersByTime);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };

    describe('stale cache in replicate that handles watch', () => {
      /**
        1. ui makes http request.
          - it's handled by up-to-date replica A
          - response contains an up-to-date revision X
        2. ui makes watch request referencing up-to-date revision X from A
          - it's received by replica B with a stale cache which does not contain revision X.
          - replicate B rejects watch with unknown revision message (i.e. 'too old')
        3. ui receives unknown revision and makes a new request
          - this should backoff until eventually succeeding
       */

      const startWatch = ({
        ctx,
        obj, msg,
        revision
      }) => {
        const {
          state, dispatch, getters, rootGetters, commit
        } = ctx;

        // call watch
        actions.watch({
          state, dispatch, getters, rootGetters
        }, {
          ...obj,
          revision,
          mode:  STEVE_WATCH_MODE.RESOURCE_CHANGES,
          force: true,
        });

        expect(dispatch).toHaveBeenNthCalledWith(1, 'send', {
          debounceMs:      4000,
          mode:            'resource.changes',
          resourceType:    obj.type,
          resourceVersion: revision.toString(),
        });

        // Receive start from BE
        actions['ws.resource.start']({
          state, dispatch, getters, commit
        }, { ...msg });

        expect(dispatch).toHaveBeenCalledTimes(1);
        dispatch.mockClear();
      };

      const errorWatch = ({
        ctx,
        obj, msg,
      }) => {
        const {
          state, dispatch, getters, commit
        } = ctx;

        // Receive error from BE
        actions['ws.resource.error']({
          dispatch, getters, commit
        }, {
          ...msg,
          data: { error: 'too old' }
        });
        expect(state.inError).toStrictEqual(
          {
            'type=abc,namespace=,id=,selector=,mode=resource.changes': {
              obj: {
                type: msg.resourceType,
                mode: msg.mode,
              },
              reason: REVISION_TOO_OLD
            }
          }
        );

        // Receive stop from BE
        actions['ws.resource.stop']({
          state, dispatch, getters, commit
        }, { ...msg });
        // stop tries to watch again, however we're in error so will be ignored
        expect(dispatch).toHaveBeenNthCalledWith(1, 'watch', {
          id: undefined, mode: STEVE_WATCH_MODE.RESOURCE_CHANGES, namespace: undefined, selector: undefined, standardWatch: true, type: obj.type
        });

        dispatch.mockClear();
      };

      const cycleFail = async({
        ctx,
        obj, msg,
        revision,
        tooManyTries = false,
      }) => {
        const { dispatch } = ctx;

        startWatch({
          ctx, obj, msg, revision
        });
        errorWatch({
          ctx, obj, msg
        });

        await waitForBackOff(50000);
        await waitForBackOff(50000);

        if (tooManyTries) {
          expect(dispatch).toHaveBeenCalledTimes(0);
        } else {
          expect(dispatch).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledWith('resyncWatch', {
            ...msg,
            data: { error: 'too old' }
          });
        }

        await waitForBackOff();

        if (tooManyTries) {
          expect(dispatch).toHaveBeenCalledTimes(0);
        } else {
          expect(dispatch).toHaveBeenCalledTimes(1);
        }

        dispatch.mockClear();
      };

      const cycleSucceed = async({
        ctx,
        obj, msg,
        revision
      }) => {
        const { dispatch } = ctx;

        dispatch.mockImplementation(async(type: string) => {
          if (type === 'resyncWatch') {
            return Promise.resolve();
          }
        });

        startWatch({
          ctx, obj, msg, revision
        });

        await waitForBackOff();

        expect(dispatch).toHaveBeenCalledTimes(0);

        await waitForBackOff();

        expect(dispatch).toHaveBeenCalledTimes(0);

        dispatch.mockClear();
      };

      const dispatch = jest.fn();
      const rootGetters = {
        'type-map/isSpoofed': () => false,
        'management/byId':    () => ({ value: true })
      };
      const obj = { type: 'abc' };
      const msg = {
        resourceType: obj.type,
        mode:         STEVE_WATCH_MODE.RESOURCE_CHANGES,
      };

      const initStore = () => {
        const state = {
          started:         [],
          inError:         {},
          listenerManager: new SteveWatchEventListenerManager()
        };
        const _getters = {
          normalizeType:   (type: string) => type,
          schemaFor:       () => ({}),
          storeName:       'test',
          inError:         (...args) => getters.inError(state)(...args),
          watchStarted:    (...args) => getters.watchStarted(state)(...args),
          backOffId:       (...args) => getters.backOffId()(...args),
          canBackoff:      () => true,
          listenerManager: state.listenerManager
        };
        const commit = (type, ...args) => mutations[type](state, ...args);

        return {
          state, dispatch, getters: _getters, rootGetters, commit
        };
      };

      beforeAll(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        backOff.resetAll();
        dispatch.mockClear();
      });

      // eslint-disable-next-line jest/expect-expect
      it('succeeds', async() => {
        jest.useFakeTimers();

        const ctx = initStore();

        await cycleSucceed({
          ctx, msg, obj, revision: 1
        });
      });

      // eslint-disable-next-line jest/expect-expect
      it('succeeds after a few failures', async() => {
        jest.useFakeTimers();

        const ctx = initStore();

        await cycleFail({
          ctx, msg, obj, revision: 1
        });
        await cycleFail({
          ctx, msg, obj, revision: 1
        });
        await cycleFail({
          ctx, msg, obj, revision: 1
        });
        await cycleFail({
          ctx, msg, obj, revision: 1
        });
        await cycleSucceed({
          ctx, msg, obj, revision: 1
        });
      });

      // eslint-disable-next-line jest/expect-expect
      it('never succeeds', async() => {
        const ctx = initStore();

        for (let i = 0; i < 10; i++) {
          await cycleFail({
            ctx, msg, obj, revision: 1
          });
        }

        await cycleFail({
          ctx, msg, obj, revision: 1, tooManyTries: true
        });
      });
    });
  });
});
