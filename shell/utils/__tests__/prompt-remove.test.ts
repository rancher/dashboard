import { doneLocationAfterRemove } from '@shell/utils/prompt-remove';

const resource = (route: any, extra = {}) => ({
  id:           'ns/op-1',
  metadata:     { name: 'op-1', namespace: 'ns' },
  currentRoute: () => route,
  ...extra,
});

describe('util: doneLocationAfterRemove', () => {
  it('should not redirect when deleting several resources', () => {
    expect(doneLocationAfterRemove([resource({}), resource({})])).toBeNull();
  });

  it('should honour a resource doneOverride', () => {
    const doneOverride = { name: 'somewhere' };

    expect(doneLocationAfterRemove([resource({}, { doneOverride })])).toStrictEqual(doneOverride);
  });

  it('should stay put when not on the resource detail page', () => {
    expect(doneLocationAfterRemove([resource({ name: 'c-cluster-product-resource', params: { cluster: 'local' } })])).toStrictEqual({});
  });

  it.each([
    ['name', 'op-1'],
    ['id', 'ns/op-1'],
  ])('should go back to the list from the namespaced detail page matched by %s', (_, id) => {
    const route = {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster: 'local', product: 'explorer', resource: 'foo', namespace: 'ns', id
      }
    };

    expect(doneLocationAfterRemove([resource(route)])).toStrictEqual({
      name:   'c-cluster-product-resource',
      params: {
        cluster: 'local', product: 'explorer', resource: 'foo'
      }
    });
  });

  it('should go back to the list from a non namespaced detail page', () => {
    const route = {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster: 'local', resource: 'foo', id: 'op-1'
      }
    };

    expect(doneLocationAfterRemove([resource(route)])).toStrictEqual({ name: 'c-cluster-product-resource', params: { cluster: 'local', resource: 'foo' } });
  });
});
