import HttpRoute from '@shell/models/gateway.networking.k8s.io.httproute';
import Gateway, { schemeForListener } from '@shell/models/gateway.networking.k8s.io.gateway';
import { GATEWAY_API } from '@shell/config/types';

const service = (name: string, namespace = 'gwdemo') => ({ metadata: { name, namespace } });

const gateway = (spec: any, status: any = {}, namespace = 'gwdemo', name = 'demo-gateway') => new Gateway({
  metadata: { name, namespace },
  spec,
  status
});

const ALL_NAMESPACES = { namespaces: { from: 'All' } };

const httpListener = {
  name: 'http', protocol: 'HTTP', port: 80, allowedRoutes: ALL_NAMESPACES
};
const httpsListener = {
  name: 'https', protocol: 'HTTPS', port: 443, allowedRoutes: ALL_NAMESPACES
};

/**
 * @param spec the HTTPRoute spec
 * @param gateways the Gateways `cluster/all` should return
 * @param hasGatewaySchema false to simulate a cluster without the Gateway API CRDs
 */
const httpRoute = (spec: any, gateways: any[] = [], hasGatewaySchema = true, namespace = 'gwdemo') => new HttpRoute({
  metadata: { name: 'demo-route', namespace },
  spec
}, {
  rootGetters: {
    'cluster/schemaFor': (type: string) => (hasGatewaySchema && type === GATEWAY_API.GATEWAY ? {} : undefined),
    'cluster/all':       (type: string) => (type === GATEWAY_API.GATEWAY ? gateways : [])
  }
});

describe('class HttpRoute', () => {
  describe('backendRefTargets', () => {
    it.each([
      ['a bare ref, defaulting to a Service in the route namespace', { name: 'demo-app' }, true],
      ['an explicit core Service', {
        name: 'demo-app', group: '', kind: 'Service'
      }, true],
      ['an explicit same namespace', { name: 'demo-app', namespace: 'gwdemo' }, true],
      ['a different service name', { name: 'other-app' }, false],
      ['a Service in another namespace', { name: 'demo-app', namespace: 'elsewhere' }, false],
      ['a non-Service kind', { name: 'demo-app', kind: 'ServiceImport' }, false],
      ['a non-core group', {
        name: 'demo-app', group: 'multicluster.x-k8s.io', kind: 'Service'
      }, false],
    ])('should match %s', (_label, backendRef, expected) => {
      expect(httpRoute({}).backendRefTargets(backendRef, service('demo-app'))).toBe(expected);
    });

    it('should not match when either side is missing', () => {
      expect(httpRoute({}).backendRefTargets(undefined, service('demo-app'))).toBe(false);
      expect(httpRoute({}).backendRefTargets({ name: 'demo-app' }, undefined)).toBe(false);
    });
  });

  describe('pathsForRule', () => {
    it.each([
      ['no matches at all', {}, ['/']],
      ['a match with no path, for example header only', { matches: [{ headers: [{ name: 'x', value: 'y' }] }] }, ['/']],
      ['a PathPrefix match', { matches: [{ path: { type: 'PathPrefix', value: '/shop' } }] }, ['/shop']],
      ['an Exact match', { matches: [{ path: { type: 'Exact', value: '/shop/cart' } }] }, ['/shop/cart']],
      ['a path with no explicit type, which defaults to PathPrefix', { matches: [{ path: { value: '/shop' } }] }, ['/shop']],
      ['a path with no value', { matches: [{ path: { type: 'PathPrefix' } }] }, ['/']],
      ['duplicate paths', { matches: [{ path: { value: '/shop' } }, { path: { value: '/shop' } }] }, ['/shop']],
      ['several paths', { matches: [{ path: { value: '/shop' } }, { path: { value: '/cart' } }] }, ['/shop', '/cart']],
      ['a literal path alongside a regular expression', { matches: [{ path: { value: '/shop' } }, { path: { type: 'RegularExpression', value: '/v[0-9]+' } }] }, ['/shop']],
      // A match with no path serves everything below `/`, so it contributes `/` in its own right
      // rather than being dropped in favour of its siblings.
      ['a header-only match beside a path match, which serves both', { matches: [{ headers: [{ name: 'x', value: 'y' }] }, { path: { value: '/shop' } }] }, ['/', '/shop']],
      ['a header-only match beside a regular expression, which serves only /', { matches: [{ path: { type: 'RegularExpression', value: '/v[0-9]+' } }, { headers: [{ name: 'x', value: 'y' }] }] }, ['/']],
    ])('should return the paths for %s', (_label, rule, expected) => {
      expect(httpRoute({}).pathsForRule(rule)).toStrictEqual(expected);
    });

    it('should return no paths for a rule matched only by regular expression, rather than claiming /', () => {
      const rule = { matches: [{ path: { type: 'RegularExpression', value: '/api/v[0-9]+/.*' } }] };

      expect(httpRoute({}).pathsForRule(rule)).toStrictEqual([]);
    });
  });

  describe('rulesForServices / targetsAnyService', () => {
    const spec = {
      rules: [
        { backendRefs: [{ name: 'other-app', port: 80 }] },
        { backendRefs: [{ name: 'demo-app', port: 80 }] },
      ]
    };

    it('should return only the rules that reference one of the services', () => {
      expect(httpRoute(spec).rulesForServices([service('demo-app')])).toStrictEqual([spec.rules[1]]);
      expect(httpRoute(spec).targetsAnyService([service('demo-app')])).toBe(true);
    });

    it('should ignore services the route does not reference', () => {
      expect(httpRoute(spec).rulesForServices([service('unrelated')])).toStrictEqual([]);
      expect(httpRoute(spec).targetsAnyService([service('unrelated')])).toBe(false);
    });

    it('should return nothing when there are no services', () => {
      expect(httpRoute(spec).rulesForServices([])).toStrictEqual([]);
      expect(httpRoute(spec).targetsAnyService()).toBe(false);
    });

    it('should tolerate a rule with no backendRefs and a spec with no rules', () => {
      expect(httpRoute({ rules: [{}] }).rulesForServices([service('demo-app')])).toStrictEqual([]);
      expect(httpRoute({}).rulesForServices([service('demo-app')])).toStrictEqual([]);
    });
  });

  describe('parentGateways', () => {
    const gw = gateway({ listeners: [httpListener] });

    it.each([
      ['a bare parentRef, defaulting to a Gateway in the route namespace', { name: 'demo-gateway' }, 1],
      ['an explicit group and kind', {
        name: 'demo-gateway', group: 'gateway.networking.k8s.io', kind: 'Gateway'
      }, 1],
      ['a parentRef to a gateway that does not exist', { name: 'missing' }, 0],
      ['a parentRef in another namespace', { name: 'demo-gateway', namespace: 'elsewhere' }, 0],
      ['a non-Gateway kind', { name: 'demo-gateway', kind: 'Mesh' }, 0],
    ])('should resolve %s', (_label, parentRef, expected) => {
      expect(httpRoute({ parentRefs: [parentRef] }, [gw]).parentGateways).toHaveLength(expected);
    });

    it('should return nothing when there are no parentRefs', () => {
      expect(httpRoute({}, [gw]).parentGateways).toStrictEqual([]);
    });

    it('should not touch the store on a cluster with no Gateway schema', () => {
      const route = httpRoute({ parentRefs: [{ name: 'demo-gateway' }] }, [gw], false);

      expect(route.parentGateways).toStrictEqual([]);
    });
  });

  describe('hostnamesDisplay / parentRefsDisplay', () => {
    it('should join the hostnames', () => {
      expect(httpRoute({ hostnames: ['a.example.com', 'b.example.com'] }).hostnamesDisplay).toBe('a.example.com, b.example.com');
      expect(httpRoute({}).hostnamesDisplay).toBe('');
    });

    it('should qualify only the parentRefs that point at another namespace', () => {
      const spec = { parentRefs: [{ name: 'local-gw' }, { name: 'same-gw', namespace: 'gwdemo' }, { name: 'far-gw', namespace: 'other' }] };

      expect(httpRoute(spec).parentRefsDisplay).toBe('local-gw, same-gw, other/far-gw');
      expect(httpRoute({}).parentRefsDisplay).toBe('');
    });

    it('should list only actual Gateways, not a mesh parentRef, under a Gateways heading', () => {
      const spec = {
        parentRefs: [{ name: 'demo-gateway' }, {
          name: 'mesh-svc', kind: 'Service', group: ''
        }]
      };

      expect(httpRoute(spec).parentRefsDisplay).toBe('demo-gateway');
    });
  });

  describe('endpointsForServices', () => {
    const services = [service('demo-app')];
    const rules = [{ matches: [{ path: { type: 'PathPrefix', value: '/shop' } }], backendRefs: [{ name: 'demo-app', port: 80 }] }];
    const parentRefs = [{ name: 'demo-gateway' }];

    const endpoints = (gw: any, spec: any = {}) => httpRoute({
      parentRefs, rules, hostnames: ['demo.example.com'], ...spec
    }, [gw]).endpointsForServices(services);

    it('should build an http url and omit the default port 80', () => {
      expect(endpoints(gateway({ listeners: [httpListener] }))).toStrictEqual([
        { link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' }
      ]);
    });

    it('should build an https url and omit the default port 443', () => {
      expect(endpoints(gateway({ listeners: [httpsListener] }))).toStrictEqual([
        { link: 'https://demo.example.com/shop', linkDisplay: 'https://demo.example.com/shop' }
      ]);
    });

    it('should include a non default port', () => {
      const gw = gateway({
        listeners: [{
          name: 'http', protocol: 'HTTP', port: 8080
        }]
      });

      expect(endpoints(gw)[0].link).toBe('http://demo.example.com:8080/shop');
    });

    it('should emit a url for every listener a bare parentRef attaches to, in either order', () => {
      const httpFirst = gateway({ listeners: [httpListener, httpsListener] });
      const httpsFirst = gateway({ listeners: [httpsListener, httpListener] });
      const expected = ['http://demo.example.com/shop', 'https://demo.example.com/shop'];

      expect(endpoints(httpFirst).map((e: any) => e.link).sort()).toStrictEqual(expected);
      expect(endpoints(httpsFirst).map((e: any) => e.link).sort()).toStrictEqual(expected);
    });

    it('should fall back to the listener hostname when the route has none', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: 'listener.example.com' }] });

      expect(endpoints(gw, { hostnames: [] })[0].link).toBe('http://listener.example.com/shop');
    });

    it('should fall back to the gateway address when neither has a hostname', () => {
      const gw = gateway({ listeners: [httpListener] }, { addresses: [{ type: 'IPAddress', value: '172.19.0.240' }] });

      expect(endpoints(gw, { hostnames: [] })[0].link).toBe('http://172.19.0.240/shop');
    });

    it('should not offer the gateway address for a wildcard only route, which would not match its Host header', () => {
      const gw = gateway({ listeners: [httpListener] }, { addresses: [{ type: 'IPAddress', value: '172.19.0.240' }] });

      expect(endpoints(gw, { hostnames: ['*.example.com'] })).toStrictEqual([]);
    });

    it('should resolve a wildcard route against a listener that pins a concrete hostname', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: 'shop.example.com' }] });

      expect(endpoints(gw, { hostnames: ['*.example.com'] })[0].link).toBe('http://shop.example.com/shop');
    });

    it('should keep a route hostname that falls under a wildcard listener', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: '*.example.com' }] });

      expect(endpoints(gw)[0].link).toBe('http://demo.example.com/shop');
    });

    it('should emit nothing when the route and listener hostnames do not overlap', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: 'other.example.com' }] });

      expect(endpoints(gw)).toStrictEqual([]);
    });

    it('should emit nothing for a rule matched only by regular expression', () => {
      const gw = gateway({ listeners: [httpListener] });
      const regexRules = [{ matches: [{ path: { type: 'RegularExpression', value: '/v[0-9]+' } }], backendRefs: [{ name: 'demo-app' }] }];

      expect(endpoints(gw, { rules: regexRules })).toStrictEqual([]);
    });

    it('should bracket an IPv6 gateway address so the url is valid', () => {
      const gw = gateway({ listeners: [httpListener] }, { addresses: [{ type: 'IPAddress', value: '2001:db8::1' }] });
      const link = endpoints(gw, { hostnames: [] })[0].link;

      expect(link).toBe('http://[2001:db8::1]/shop');
      expect(() => new URL(link)).not.toThrow();
    });

    it('should match a wildcard listener as a suffix over any number of labels', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: '*.example.com' }] });

      expect(endpoints(gw, { hostnames: ['shop.example.com'] })[0].link).toBe('http://shop.example.com/shop');
      // `*.example.com` is a suffix match, so it covers a two label prefix as well
      expect(endpoints(gw, { hostnames: ['eu.shop.example.com'] })[0].link).toBe('http://eu.shop.example.com/shop');
      // but not the apex, and not a hostname that merely ends in the same characters
      expect(endpoints(gw, { hostnames: ['example.com'] })).toStrictEqual([]);
      expect(endpoints(gw, { hostnames: ['notexample.com'] })).toStrictEqual([]);
    });

    it('should compare hostnames case insensitively', () => {
      const gw = gateway({ listeners: [{ ...httpListener, hostname: 'demo.example.com' }] });

      expect(endpoints(gw, { hostnames: ['Demo.Example.COM'] })[0].link).toBe('http://demo.example.com/shop');
    });

    it('should not attach to a listener that only allows routes from its own namespace', () => {
      const gw = gateway({ listeners: [{ ...httpListener, allowedRoutes: { namespaces: { from: 'Same' } } }] }, {}, 'infra');
      const routeSpec = {
        parentRefs: [{ name: 'demo-gateway', namespace: 'infra' }], rules, hostnames: ['demo.example.com']
      };

      expect(httpRoute(routeSpec, [gw]).endpointsForServices(services)).toStrictEqual([]);
    });

    it('should return nothing when the listener is not http(s)', () => {
      expect(endpoints(gateway({
        listeners: [{
          name: 'tcp', protocol: 'TCP', port: 5432
        }]
      }))).toStrictEqual([]);
    });

    it('should return nothing when the gateway has no address and nothing has a hostname', () => {
      expect(endpoints(gateway({ listeners: [httpListener] }), { hostnames: [] })).toStrictEqual([]);
    });

    it('should return nothing when the parent gateway cannot be resolved', () => {
      expect(endpoints(gateway({ listeners: [httpListener] }, {}, 'elsewhere'))).toStrictEqual([]);
    });

    it('should return nothing when no rule targets the services', () => {
      const gw = gateway({ listeners: [httpListener] });

      expect(httpRoute({
        parentRefs, rules, hostnames: ['demo.example.com']
      }, [gw]).endpointsForServices([service('unrelated')])).toStrictEqual([]);
    });

    it('should honour a parentRef that pins a listener by sectionName', () => {
      const gw = gateway({ listeners: [httpListener, httpsListener] });
      const routeSpec = {
        parentRefs: [{ name: 'demo-gateway', sectionName: 'https' }], rules, hostnames: ['demo.example.com']
      };

      expect(httpRoute(routeSpec, [gw]).endpointsForServices(services).map((e: any) => e.link)).toStrictEqual(['https://demo.example.com/shop']);
    });

    it('should produce one url per hostname and path, without duplicates', () => {
      const gw = gateway({ listeners: [httpListener] });
      const routeSpec = {
        parentRefs: [{ name: 'demo-gateway' }, { name: 'demo-gateway' }],
        hostnames:  ['a.example.com', 'b.example.com'],
        rules:      [{
          matches:     [{ path: { value: '/shop' } }, { path: { value: '/cart' } }],
          backendRefs: [{ name: 'demo-app', port: 80 }]
        }]
      };

      expect(httpRoute(routeSpec, [gw]).endpointsForServices(services).map((e: any) => e.link)).toStrictEqual([
        'http://a.example.com/shop',
        'http://a.example.com/cart',
        'http://b.example.com/shop',
        'http://b.example.com/cart',
      ]);
    });
  });
});

describe('class Gateway', () => {
  describe('addresses', () => {
    it('should return the values the controller assigned', () => {
      const gw = gateway({}, { addresses: [{ type: 'IPAddress', value: '172.19.0.240' }, { type: 'Hostname', value: 'gw.example.com' }] });

      expect(gw.addresses).toStrictEqual(['172.19.0.240', 'gw.example.com']);
    });

    it.each([
      ['no status', {}],
      ['no addresses', { addresses: [] }],
      ['an address with no value', { addresses: [{ type: 'IPAddress' }] }],
    ])('should return an empty list for %s', (_label, status) => {
      expect(gateway({}, status).addresses).toStrictEqual([]);
    });
  });

  describe('listenersFor', () => {
    const gw = gateway({
      listeners: [
        {
          name: 'tcp', protocol: 'TCP', port: 5432
        },
        httpListener,
        httpsListener,
      ]
    });

    const names = (listeners: any[]) => listeners.map((l: any) => l.name);

    it('should return every http(s) listener when nothing is pinned', () => {
      expect(names(gw.listenersFor({}, 'gwdemo'))).toStrictEqual(['http', 'https']);
    });

    it('should honour sectionName', () => {
      expect(names(gw.listenersFor({ sectionName: 'https' }, 'gwdemo'))).toStrictEqual(['https']);
    });

    it('should honour port', () => {
      expect(names(gw.listenersFor({ port: 443 }, 'gwdemo'))).toStrictEqual(['https']);
    });

    it('should honour sectionName and port together', () => {
      expect(names(gw.listenersFor({ sectionName: 'https', port: 443 }, 'gwdemo'))).toStrictEqual(['https']);
      expect(gw.listenersFor({ sectionName: 'https', port: 80 }, 'gwdemo')).toStrictEqual([]);
    });

    it('should return nothing when nothing matches', () => {
      expect(gw.listenersFor({ sectionName: 'nope' }, 'gwdemo')).toStrictEqual([]);
      expect(gw.listenersFor({ sectionName: 'tcp' }, 'gwdemo')).toStrictEqual([]);
      expect(gateway({}).listenersFor({}, 'gwdemo')).toStrictEqual([]);
    });
  });

  describe('allowsRoute', () => {
    const gw = gateway({});

    it('should default to accepting only routes in its own namespace', () => {
      expect(gw.allowsRoute({}, 'gwdemo', 'HTTPRoute')).toBe(true);
      expect(gw.allowsRoute({}, 'elsewhere', 'HTTPRoute')).toBe(false);
    });

    it('should honour namespaces.from', () => {
      expect(gw.allowsRoute({ allowedRoutes: ALL_NAMESPACES }, 'elsewhere', 'HTTPRoute')).toBe(true);
      expect(gw.allowsRoute({ allowedRoutes: { namespaces: { from: 'Same' } } }, 'elsewhere', 'HTTPRoute')).toBe(false);
    });

    it('should be permissive for a namespace Selector, whose labels this model does not load', () => {
      const listener = { allowedRoutes: { namespaces: { from: 'Selector', selector: { matchLabels: { env: 'prod' } } } } };

      expect(gw.allowsRoute(listener, 'elsewhere', 'HTTPRoute')).toBe(true);
    });

    it('should honour allowedRoutes.kinds', () => {
      const onlyGrpc = { allowedRoutes: { ...ALL_NAMESPACES, kinds: [{ kind: 'GRPCRoute' }] } };
      const bothKinds = { allowedRoutes: { ...ALL_NAMESPACES, kinds: [{ kind: 'GRPCRoute' }, { kind: 'HTTPRoute' }] } };

      expect(gw.allowsRoute(onlyGrpc, 'gwdemo', 'HTTPRoute')).toBe(false);
      expect(gw.allowsRoute(bothKinds, 'gwdemo', 'HTTPRoute')).toBe(true);
    });
  });

  describe('schemeForListener', () => {
    it.each([
      ['HTTP', 'http'],
      ['HTTPS', 'https'],
      ['TCP', undefined],
      ['UDP', undefined],
      [undefined, undefined],
      // A protocol that collides with a name on Object.prototype must not resolve to it
      ['constructor', undefined],
      ['toString', undefined],
    ])('should map the %s listener protocol to %s', (protocol, expected) => {
      expect(schemeForListener({ protocol })).toBe(expected);
    });

    it('should return undefined for no listener at all', () => {
      expect(schemeForListener(undefined)).toBeUndefined();
    });
  });
});
