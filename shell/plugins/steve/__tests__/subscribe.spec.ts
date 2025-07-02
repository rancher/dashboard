import { actions, getters } from '../subscribe';

describe('steve: subscribe', () => {
  describe('actions', () => {
    describe('watch', () => {
      const state = {};
      const getters = {
        normalizeType: (type: string) => type,
        schemaFor:     () => null,
        inError:       () => false,
        watchStarted:  () => false,
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
});
