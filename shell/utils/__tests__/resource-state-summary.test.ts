import { resourceListRoute, isValidSummaryResponse } from '@shell/utils/resource-state-summary';

describe('utils: resource-state-summary', () => {
  describe('resourceListRoute', () => {
    it('should route to the resource list in the cluster explorer', () => {
      expect(resourceListRoute('c-123', 'apps.deployment')).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster: 'c-123', product: 'explorer', resource: 'apps.deployment'
        },
      });
    });

    it('should filter the list by the given states', () => {
      expect(resourceListRoute('c-123', 'pod', ['error', 'crashloopbackoff'])).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster: 'c-123', product: 'explorer', resource: 'pod'
        },
        query: { stateFilter: 'error,crashloopbackoff' },
      });
    });

    it('should not filter the list when the states are empty', () => {
      expect(resourceListRoute('c-123', 'pod', [])).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster: 'c-123', product: 'explorer', resource: 'pod'
        },
      });
    });
  });

  describe('isValidSummaryResponse', () => {
    const counts = { active: { total: 2, namespace: { default: 2 } } };

    it.each([
      ['every state has a total', { summary: [{ property: 'metadata.state.name', counts }] }],
      ['a summary entry has no counts', { summary: [{ property: 'metadata.state.name' }] }],
      ['the summary is empty and there is no data', { summary: [], data: [] }],
      ['there is no summary and no data', { data: [] }],
      ['there is no summary and data is missing', {}],
      ['the response is undefined', undefined],
    ])('should be valid when %s', (_, res) => {
      expect(isValidSummaryResponse(res as any)).toStrictEqual(true);
    });

    it.each([
      ['a state has no total', { summary: [{ property: 'metadata.state.name', counts: { active: { namespace: {} } } }] }],
      ['the summary is empty but data is present', { summary: [], data: [{ id: 'a' }] }],
      ['there is no summary but data is present', { data: [{ id: 'a' }] }],
      ['there is no summary and data is not a list', { data: { id: 'a' } }],
    ])('should be invalid when %s', (_, res) => {
      expect(isValidSummaryResponse(res as any)).toStrictEqual(false);
    });
  });
});
