import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import Workload from '@shell/detail/workload/index.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import {
  AGE, NAME, NAMESPACE, STATE, HTTP_ROUTE_HOSTNAMES, HTTP_ROUTE_GATEWAYS
} from '@shell/config/table-headers';
import { PVC, WORKLOAD_TYPES } from '@shell/config/types';

jest.mock('@shell/utils/grafana', () => ({ allDashboardsExist: jest.fn().mockResolvedValue(false) }));

describe('workload detail page', () => {
  it('should not have findMatchingIngresses method (logic moved to workload model)', () => {
    expect((Workload.methods as { findMatchingIngresses?: unknown } | undefined)?.findMatchingIngresses).toBeUndefined();
  });

  describe('httpRouteHeaders', () => {
    const configuredHeaders = [STATE, NAME, NAMESPACE, HTTP_ROUTE_HOSTNAMES, HTTP_ROUTE_GATEWAYS, AGE];

    const stub = (overrides: any = {}) => ({
      $store:                      { getters: { 'type-map/headersFor': () => [...configuredHeaders] } },
      httpRouteSchema:             {},
      gatewaySchema:               {},
      httpRoutesAreAllInNamespace: true,
      relatedServices:             [],
      ...overrides,
    });

    const headers = (overrides?: any) => (Workload as any).computed.httpRouteHeaders.call(stub(overrides));

    it('should place the endpoints column immediately before age', () => {
      const names = headers().map((h: any) => h.name);

      expect(names.slice(-2)).toStrictEqual(['httpRouteEndpoints', 'age']);
    });

    it('should not show the endpoints column without the gateway schema', () => {
      const names = headers({ gatewaySchema: null }).map((h: any) => h.name);

      expect(names).not.toContain('httpRouteEndpoints');
      expect(names).toStrictEqual([STATE.name, NAME.name, HTTP_ROUTE_HOSTNAMES.name, HTTP_ROUTE_GATEWAYS.name, AGE.name]);
    });

    it('should drop the namespace column when every route is in the workload namespace', () => {
      expect(headers().map((h: any) => h.name)).not.toContain(NAMESPACE.name);
    });

    it('should keep the namespace column when a route is in another namespace', () => {
      expect(headers({ httpRoutesAreAllInNamespace: false }).map((h: any) => h.name)).toContain(NAMESPACE.name);
    });

    it('should resolve the endpoints value from the route, narrowed to the services of this workload', () => {
      const relatedServices = [{ id: 'gwdemo/demo-app' }];
      const endpoints = [{ link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' }];
      const endpointsForServices = jest.fn().mockReturnValue(endpoints);

      const col = headers({ relatedServices }).find((h: any) => h.name === 'httpRouteEndpoints');

      expect(col.value({ endpointsForServices })).toStrictEqual(endpoints);
      expect(endpointsForServices).toHaveBeenCalledWith(relatedServices);
    });
  });

  describe('storage tab', () => {
    const claim = { id: 'default/web-data', metadata: { name: 'web-data', namespace: 'default' } };

    const TabStub = {
      props:    ['name'],
      template: `<div :data-testid="'tab-' + name"><slot /></div>`,
    };

    const mountWorkload = async({ pvcSchema = {}, claims = [] as any[] }: { pvcSchema?: object | null, claims?: any[] } = {}) => {
      const value = {
        type:                        WORKLOAD_TYPES.DEPLOYMENT,
        metadata:                    { name: 'web', namespace: 'default' },
        spec:                        { template: { spec: { containers: [{ name: 'web' }] } } },
        pods:                        [],
        relatedServices:             [],
        matchingIngresses:           [],
        fetchSummaries:              jest.fn().mockResolvedValue(undefined),
        fetchPersistentVolumeClaims: jest.fn().mockResolvedValue(claims),
      };

      const $store = {
        getters: {
          'cluster/schemaFor':   (type: string) => (type === PVC ? pvcSchema : undefined),
          'type-map/headersFor': () => [STATE, NAME, NAMESPACE, AGE],
          currentStore:          () => 'cluster',
          currentCluster:        { id: 'local' },
        },
        dispatch: jest.fn().mockResolvedValue(undefined),
      };

      const wrapper = shallowMount(Workload, {
        props:  { value },
        global: {
          mocks: { $store, $fetchState: { pending: false } },
          stubs: { ResourceTabs: { template: '<div><slot /></div>' }, Tab: TabStub },
        },
      });

      await (Workload as any).fetch.call(wrapper.vm);
      await nextTick();

      return { wrapper, value };
    };

    it('should list the mounted claims in a resource table', async() => {
      const { wrapper } = await mountWorkload({ claims: [claim] });
      const tables = wrapper.find('[data-testid="tab-storage"]').findAllComponents(ResourceTable);

      expect(tables).toHaveLength(1);
      expect(tables[0].props('rows')).toStrictEqual([claim]);
    });

    it('should not show the empty caption when the workload mounts a claim', async() => {
      const { wrapper } = await mountWorkload({ claims: [claim] });

      expect(wrapper.find('[data-testid="tab-storage"]').text()).not.toContain('%workload.detail.cannotFindStorage%');
    });

    it('should show the empty caption when the workload mounts no claims', async() => {
      const { wrapper } = await mountWorkload({ claims: [] });

      expect(wrapper.find('[data-testid="tab-storage"]').text()).toContain('%workload.detail.cannotFindStorage%');
    });

    it('should not render a resource table when the workload mounts no claims', async() => {
      const { wrapper } = await mountWorkload({ claims: [] });

      expect(wrapper.find('[data-testid="tab-storage"]').findAllComponents(ResourceTable)).toHaveLength(0);
    });

    it('should hide the storage tab without the PVC schema', async() => {
      const { wrapper } = await mountWorkload({ pvcSchema: null, claims: [claim] });

      expect(wrapper.find('[data-testid="tab-storage"]').exists()).toBe(false);
    });

    it('should not fetch claims without the PVC schema', async() => {
      const { value } = await mountWorkload({ pvcSchema: null, claims: [claim] });

      expect(value.fetchPersistentVolumeClaims).not.toHaveBeenCalled();
    });

    it('should fetch claims when the PVC schema is available', async() => {
      const { value } = await mountWorkload({ claims: [claim] });

      expect(value.fetchPersistentVolumeClaims).toHaveBeenCalledWith();
    });
  });
});
