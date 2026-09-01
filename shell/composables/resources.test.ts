import { useResourceIdentifiers, useFetchResourceWithId } from '@shell/composables/resources';

const mockStore: any = {
  getters:  { 'cluster/schemaFor': jest.fn(() => ({ id: 'test-schema' })) },
  dispatch: jest.fn()
};
const mockRoute: any = {
  params: {
    cluster:   'test-cluster',
    namespace: 'test-namespace',
    id:        'test-id',
  },
};

jest.mock('vuex', () => ({ useStore: () => mockStore }));
jest.mock('vue-router', () => ({ useRoute: () => mockRoute }));

describe('resources', () => {
  describe('useResourceIdentifiers', () => {
    it('should return the correct value for a route with a namespace', async() => {
      const { clusterId, id, schema } = useResourceIdentifiers('test-type');

      expect(clusterId).toBe('test-cluster');
      expect(id).toBe('test-namespace/test-id');
      expect(schema).toStrictEqual({ id: 'test-schema' });
    });

    it('should return the correct value for a route without a namespace', async() => {
      mockRoute.params.namespace = undefined;
      const { clusterId, id, schema } = useResourceIdentifiers('test-type');

      expect(clusterId).toBe('test-cluster');
      expect(id).toBe('test-id');
      expect(schema).toStrictEqual({ id: 'test-schema' });
    });
  });

  describe('useFetchResourceWithId', () => {
    it('should return the correct value given the correct arguments are passed to the dispatch method', async() => {
      mockStore.dispatch.mockImplementation(() => Promise.resolve({ id: 'test-resource' }));
      const resource = await useFetchResourceWithId('test-type', 'test-id');

      expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/find', { type: 'test-type', id: 'test-id' });
      expect(resource).toStrictEqual({ id: 'test-resource' });
    });

    it('should dispatch a loadingError if a 404 occurs', async() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      mockStore.dispatch.mockImplementationOnce(() => Promise.reject({ status: 404 }));
      await useFetchResourceWithId('test-type', 'test-id');

      expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', new Error('nav.failWhale.resourceIdNotFound-{"resource":"test-type","fqid":"test-id"}'));
    });

    it('should dispatch a loadingError if a 403 occurs', async() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      mockStore.dispatch.mockImplementationOnce(() => Promise.reject({ status: 403 }));
      await useFetchResourceWithId('test-type', 'test-id');

      expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', new Error('nav.failWhale.resourceIdNotFound-{"resource":"test-type","fqid":"test-id"}'));
    });
  });
});
