import CustomResourceDefinition from '@shell/models/apiextensions.k8s.io.customresourcedefinition';
import { COUNT, CRD } from '@shell/config/types';

describe('class CustomResourceDefinition', () => {
  const resourceType = 'auditlog.cattle.io.auditpolicy';

  const makeCrd = (counts: Record<string, unknown> = {}) => new CustomResourceDefinition({
    id:   'auditpolicies.auditlog.cattle.io',
    type: CRD,
    spec: { group: 'auditlog.cattle.io', names: { singular: 'auditpolicy', plural: 'auditpolicies' } }
  }, {
    getters:     { all: (type: string) => (type === COUNT ? [{ counts }] : []) },
    rootGetters: { productId: 'explorer', clusterId: 'local' },
    rootState:   { $extension: { getPlugins: () => ({}) } },
  });

  describe('resourceType', () => {
    it('should join the group and singular name', () => {
      expect(makeCrd().resourceType).toStrictEqual(resourceType);
    });
  });

  describe('resourceCount', () => {
    it('should return the summary count of the resource type', () => {
      const crd = makeCrd({ [resourceType]: { summary: { count: 3 } } });

      expect(crd.resourceCount).toStrictEqual(3);
    });

    it('should return undefined when the resource type has no count', () => {
      const crd = makeCrd({ 'other.cattle.io.thing': { summary: { count: 5 } } });

      expect(crd.resourceCount).toBeUndefined();
    });
  });

  describe('resourceLink', () => {
    it('should show the resource type and its count', () => {
      const crd = makeCrd({ [resourceType]: { summary: { count: 3 } } });

      expect(crd.resourceLink.text).toStrictEqual(`${ resourceType } (3)`);
    });

    it.each([
      ['there is no count', {}],
      ['the count is zero', { [resourceType]: { summary: { count: 0 } } }],
    ])('should show only the resource type when %s', (_, counts) => {
      expect(makeCrd(counts).resourceLink.text).toStrictEqual(resourceType);
    });

    it('should link to the list of the custom resources', () => {
      expect(makeCrd().resourceLink.to).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          product: 'explorer', cluster: 'local', resource: resourceType
        }
      });
    });

    it('should not change the list location of the definition itself', () => {
      const crd = makeCrd();
      const link = crd.resourceLink;

      expect([link.to.params.resource, crd.listLocation.params.resource]).toStrictEqual([resourceType, CRD]);
    });
  });
});
