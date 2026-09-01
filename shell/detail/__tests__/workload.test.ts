import Workload from '@shell/detail/workload/index.vue';
import {
  AGE, NAME, NAMESPACE, STATE, HTTP_ROUTE_HOSTNAMES, HTTP_ROUTE_GATEWAYS
} from '@shell/config/table-headers';

describe('workload detail page', () => {
  it('should not have findMatchingIngresses method (logic moved to workload model)', () => {
    expect(Workload.methods?.findMatchingIngresses).toBeUndefined();
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
});
