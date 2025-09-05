import {
  useNamespace, useWorkspace, useLiveDate, useProject, useResourceDetails
} from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields';
import { NAMESPACE, FLEET, MANAGEMENT } from '@shell/config/types';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';

const mockStore = {
  getters: {
    productId: 'PRODUCT_ID', clusterId: 'CLUSTER_ID', 'type-map/optionsFor': jest.fn()
  }
};
const mockRoute = { params: { cluster: 'CLUSTER', namespace: 'NAMESPACE' } };
const mockDrawer = { openResourceDetailDrawer: jest.fn() };

jest.mock('vuex', () => ({ useStore: () => mockStore }));
jest.mock('vue-router', () => ({ useRoute: () => mockRoute }));
jest.mock('@shell/components/Drawer/ResourceDetailDrawer/composables', () => ({ useResourceDetailDrawer: () => mockDrawer }));

describe('composables: IdentifyingFields', () => {
  describe('useNamespace', () => {
    it('should return undefined if namespace is falsy', () => {
      const resource = {};
      const result = useNamespace(resource);

      expect(result).toBeUndefined();
    });

    it('should return undefined if namespaces is truthy', () => {
      const resource = { namespaces: [] };
      const result = useNamespace(resource);

      expect(result).toBeUndefined();
    });

    it('should return a valid namespace row', () => {
      const resource = { namespace: 'NAMESPACE' };
      const result = useNamespace(resource);

      expect(result?.value.valueOverride?.props.type).toStrictEqual(NAMESPACE);
      expect(result?.value.valueOverride?.props.id).toStrictEqual(resource.namespace);
      expect(result?.value.value).toStrictEqual(resource.namespace);
      expect(result?.value.label).toStrictEqual('component.resource.detail.metadata.identifyingInformation.namespace');
      expect(result?.value.valueDataTestid).toStrictEqual('masthead-subheader-namespace');
    });
  });

  describe('useWorkspace', () => {
    it('should return undefined if productId is not fleet', () => {
      const resource = { metadata: { namespace: true } };
      const result = useWorkspace(resource);

      expect(result).toBeUndefined();
    });

    it('should return undefined if productId is fleet and metadata namespace is falsy', () => {
      mockStore.getters.productId = FLEET_NAME;
      const resource = { };
      const result = useWorkspace(resource);

      expect(result).toBeUndefined();
    });

    it('should return a valid workspace row', () => {
      mockStore.getters.productId = FLEET_NAME;
      const resource = { namespace: 'NAMESPACE', metadata: { namespace: true } };
      const result = useWorkspace(resource);

      expect(result?.value.to).toStrictEqual({
        name:   `c-cluster-product-resource-id`,
        params: {
          product:  FLEET_NAME,
          cluster:  'CLUSTER_ID',
          resource: FLEET.WORKSPACE,
          id:       mockRoute.params.namespace
        }
      });
      expect(result?.value.value).toStrictEqual(resource.namespace);
      expect(result?.value.label).toStrictEqual('component.resource.detail.metadata.identifyingInformation.workspace');
    });
  });

  describe('useLiveDate', () => {
    it('should return undefined if showAge is false', () => {
      mockStore.getters[`type-map/optionsFor`].mockReturnValue({ showAge: false });

      const resource = { };
      const result = useLiveDate(resource);

      expect(result).toBeUndefined();
    });

    it('should return a valid liveDate row', () => {
      mockStore.getters[`type-map/optionsFor`].mockReturnValue({ showAge: true });

      const resource = { creationTimestamp: 'CREATION_TIMESTAMP' };
      const result = useLiveDate(resource);

      expect(result?.value.valueOverride).toStrictEqual({
        component: 'LiveDate',
        props:     { value: resource.creationTimestamp }
      });
      expect(result?.value.value).toStrictEqual(resource.creationTimestamp);
      expect(result?.value.label).toStrictEqual('component.resource.detail.metadata.identifyingInformation.age');
    });
  });

  describe('useProject', () => {
    it('should return undefined if type is not namespace', () => {
      const resource = { type: 'anything' };
      const result = useProject(resource);

      expect(result).toBeUndefined();
    });

    it('should return undefined if project is falsy', () => {
      const resource = { type: NAMESPACE };
      const result = useProject(resource);

      expect(result).toBeUndefined();
    });

    it('should return a valid project row', () => {
      const resource = {
        type:    NAMESPACE,
        project: {
          id: 'ID', nameDisplay: 'PROJECT', detailLocation: 'LOCATION'
        }
      };
      const result = useProject(resource);

      expect(result?.value.valueOverride?.props.type).toStrictEqual(MANAGEMENT.PROJECT);
      expect(result?.value.valueOverride?.props.id).toStrictEqual(resource.project.id);
      expect(result?.value.label).toStrictEqual('component.resource.detail.metadata.identifyingInformation.project');
    });
  });

  describe('useResourceDetails', () => {
    it('should return undefined if details is falsy', () => {
      const resource = { };
      const result = useResourceDetails(resource);

      expect(result).toBeUndefined();
    });

    it('should return valid resourceDetail without valueOverride', () => {
      const resource = { details: [{ label: 'LABEL', content: 'CONTENT' }] };
      const result = useResourceDetails(resource);

      expect(result?.value[0].label).toStrictEqual(resource.details[0].label);
      expect(result?.value[0].value).toStrictEqual(resource.details[0].content);
      expect(result?.value[0].valueOverride).toBeUndefined();
    });

    it('should omit separator details', () => {
      const resource = { details: [{ separator: true }] };
      const result = useResourceDetails(resource);

      expect(result?.value).toHaveLength(0);
    });

    it('should return valid resourceDetail with valueOverride', () => {
      const resource = {
        details: [{
          label: 'LABEL', content: 'CONTENT', formatter: 'FORMATTER', formatterOpts: { key: 'value' }
        }]
      };
      const result = useResourceDetails(resource);

      expect(result?.value[0].label).toStrictEqual(resource.details[0].label);
      expect(result?.value[0].value).toStrictEqual(resource.details[0].content);
      expect(result?.value[0].valueOverride?.component).toStrictEqual(resource.details[0].formatter);
      expect(result?.value[0].valueOverride?.props).toStrictEqual({ value: resource.details[0].content, ...resource.details[0].formatterOpts });
    });
  });
});
