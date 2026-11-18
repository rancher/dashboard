import { GATEWAY_API } from '@shell/config/types';
import { uniq } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import { schemeForListener, GATEWAY_GROUP } from '@shell/models/gateway.networking.k8s.io.gateway';

// Implied by the scheme, so omitted from the url.
const DEFAULT_PORTS = {
  http:  80,
  https: 443
};

// A `RegularExpression` match cannot be turned back into a browsable path, so it yields no url.
const LITERAL_PATH_TYPES = ['Exact', 'PathPrefix'];

const isWildcard = (hostname) => !!hostname?.startsWith('*.');

// A Gateway API wildcard is a suffix match over any number of labels, not the single-label TLS
// certificate rule: `*.example.com` covers `eu.shop.example.com`. Keeping the leading dot is what
// stops it also matching the apex `example.com` or `notexample.com`.
function matchesWildcard(hostname, wildcard) {
  return hostname.endsWith(wildcard.slice(1));
}

// Either side may be a wildcard and the more specific wins. A listener with no hostname matches
// anything.
function intersectHostnames(routeHostname, listenerHostname) {
  const route = routeHostname?.toLowerCase();
  const listener = listenerHostname?.toLowerCase();

  if (!listener || route === listener) {
    return route;
  }

  if (isWildcard(listener) && !isWildcard(route) && matchesWildcard(route, listener)) {
    return route;
  }

  if (isWildcard(route) && !isWildcard(listener) && matchesWildcard(listener, route)) {
    return listener;
  }

  return undefined;
}

// An IPv6 literal has to be bracketed before it can go in a url.
const hostForUrl = (host) => (host.includes(':') ? `[${ host }]` : host);

// `group` and `kind` are optional, defaulting to `gateway.networking.k8s.io` and `Gateway`.
const isGatewayRef = (parentRef) => (parentRef?.group ?? GATEWAY_GROUP) === GATEWAY_GROUP &&
  (parentRef?.kind ?? 'Gateway') === 'Gateway';

export default class HttpRoute extends SteveModel {
  get rules() {
    return this.spec?.rules || [];
  }

  // Steve's printer column for this field is the raw array, which renders as JSON.
  get hostnamesDisplay() {
    return (this.spec?.hostnames || []).join(', ');
  }

  // Read from the spec rather than resolved through the store, so the column does not depend on
  // Gateways being loaded. Only cross-namespace refs are qualified, since only those are ambiguous.
  get parentRefsDisplay() {
    return (this.spec?.parentRefs || []).filter(isGatewayRef).map((parentRef) => {
      const namespace = parentRef.namespace;

      return namespace && namespace !== this.metadata?.namespace ? `${ namespace }/${ parentRef.name }` : parentRef.name;
    }).join(', ');
  }

  // `group`, `kind` and `namespace` default to the core group, `Service`, and the route's own
  // namespace. Unlike Ingress, an HTTPRoute may reference a Service in another namespace, so the
  // namespace is compared rather than assumed.
  backendRefTargets(backendRef, service) {
    if (!backendRef || !service) {
      return false;
    }

    const group = backendRef.group ?? '';
    const kind = backendRef.kind ?? 'Service';
    const namespace = backendRef.namespace ?? this.metadata?.namespace;

    return group === '' &&
      kind === 'Service' &&
      backendRef.name === service.metadata?.name &&
      namespace === service.metadata?.namespace;
  }

  rulesForServices(services = []) {
    if (!services.length) {
      return [];
    }

    return this.rules.filter((rule) => (rule?.backendRefs || []).some(
      (backendRef) => services.some((service) => this.backendRefTargets(backendRef, service))
    ));
  }

  targetsAnyService(services = []) {
    return this.rulesForServices(services).length > 0;
  }

  pathsForRule(rule) {
    // A match with no `path` is a prefix match on `/` per the spec default, so it is defaulted
    // rather than dropped: dropping it would lose the `/` url when it sits beside an explicit path.
    const matchedPaths = (rule?.matches || []).map((match) => match?.path ?? { type: 'PathPrefix', value: '/' });

    if (!matchedPaths.length) {
      return ['/'];
    }

    return uniq(matchedPaths
      .filter((path) => LITERAL_PATH_TYPES.includes(path.type ?? 'PathPrefix'))
      .map((path) => path.value || '/'));
  }

  get parentGateways() {
    // Asking `cluster/all` for a type with no schema warns and registers a phantom type, so the
    // schema is checked first on clusters without the Gateway API CRDs.
    if (!this.$rootGetters['cluster/schemaFor'](GATEWAY_API.GATEWAY)) {
      return [];
    }

    const parentRefs = (this.spec?.parentRefs || []).filter(isGatewayRef);

    if (!parentRefs.length) {
      return [];
    }

    const allGateways = this.$rootGetters['cluster/all'](GATEWAY_API.GATEWAY) || [];

    return parentRefs.reduce((out, parentRef) => {
      const namespace = parentRef.namespace ?? this.metadata?.namespace;
      const gateway = allGateways.find((g) => g.metadata?.name === parentRef.name && g.metadata?.namespace === namespace);

      if (gateway) {
        out.push({ parentRef, gateway });
      }

      return out;
    }, []);
  }

  // Wildcards are dropped because they are not a url anyone can open, and that yields nothing
  // rather than falling back to the gateway address: the gateway matches on the `Host` header, so a
  // link to the bare address would not reach this route.
  hostsFor(gateway, listener) {
    const routeHostnames = this.spec?.hostnames || [];
    const listenerHostname = listener?.hostname;

    if (routeHostnames.length) {
      return uniq(routeHostnames
        .map((hostname) => intersectHostnames(hostname, listenerHostname))
        .filter((hostname) => hostname && !isWildcard(hostname)));
    }

    if (listenerHostname) {
      return isWildcard(listenerHostname) ? [] : [listenerHostname];
    }

    return gateway?.addresses || [];
  }

  endpointsForServices(services = []) {
    const rules = this.rulesForServices(services);

    if (!rules.length) {
      return [];
    }

    const paths = uniq(rules.flatMap((rule) => this.pathsForRule(rule)));

    if (!paths.length) {
      return [];
    }

    const links = this.parentGateways.flatMap(({ parentRef, gateway }) => {
      return gateway.listenersFor(parentRef, this.metadata?.namespace).flatMap((listener) => {
        const scheme = schemeForListener(listener);
        const port = listener.port && listener.port !== DEFAULT_PORTS[scheme] ? `:${ listener.port }` : '';

        return this.hostsFor(gateway, listener)
          .flatMap((host) => paths.map((path) => `${ scheme }://${ hostForUrl(host) }${ port }${ path }`));
      });
    });

    return uniq(links).map((link) => ({ link, linkDisplay: link }));
  }
}
