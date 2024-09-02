import { getters } from '../index';

describe('getters', () => {
  describe('namespaces', () => {
    it('should return empty dictionary', () => {
      const expectation = {};
      const state = {};
      const stateGetters = { currentProduct: () => ({}) };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should return all the namespaces for related category', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-namespace';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces:    [{ id: namespaceId }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should return Rancher system namespaces', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-rancher-system-namespace';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces: [{
          id:        namespaceId,
          isObscure: true
        }],
        prefs:            { data: { 'all-namespaces': true } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should filter Rancher system namespaces', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-rancher-system-namespace';
      const expectation = { };
      const state = {
        allNamespaces: [{
          id:        namespaceId,
          isObscure: true
        }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: []
      };
      const stateGetters = {
        isAllNamespaces: true,
        currentProduct:  { inStore: 'whatever' },
        'whatever/all':  {},
        currentCluster:  { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });

    it('should filter namespaces by project', () => {
      const clusterId = 'my-cluster';
      const namespaceId = 'my-product-namespace';
      const projectId = 'my-project';
      const expectation = { [namespaceId]: true };
      const state = {
        allNamespaces:    [{ id: namespaceId }],
        prefs:            { data: { 'all-namespaces': false } },
        namespaceFilters: [`project://${ projectId }`]
      };
      const stateGetters = {
        isAllNamespaces:   false,
        currentProduct:    { inStore: 'whatever' },
        'whatever/all':    {},
        'management/byId': () => ({
          id:         projectId,
          namespaces: [{ id: namespaceId }]
        }),
        currentCluster: { id: clusterId },
      };

      const result = getters.namespaces(state, stateGetters)();

      expect(result).toStrictEqual(expectation);
    });
  });
});
