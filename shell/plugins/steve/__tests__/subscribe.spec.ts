import { actions } from '../subscribe';

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
});
