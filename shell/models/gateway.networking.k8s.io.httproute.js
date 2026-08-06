import { GATEWAY_API } from '@shell/config/types';
import { uniq } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import { schemeForListener, GATEWAY_GROUP } from '@shell/models/gateway.networking.k8s.io.gateway';

// Ports that are implied by the scheme and so should not appear in the url.
const DEFAULT_PORTS = {
  http:  80,
  https: 443
};

// Match types whose `value` is a literal prefix of the url. A `RegularExpression` match cannot be
// turned back into a browsable path, so a rule that only uses one contributes no url at all.
const LITERAL_PATH_TYPES = ['Exact', 'PathPrefix'];

const isWildcard = (hostname) => !!hostname?.startsWith('*.');

/**
 * Does `hostname` fall under `wildcard`? A Gateway API wildcard is a suffix match over any number
 * of labels, so `*.example.com` covers both `shop.example.com` and `eu.shop.example.com`, but not
 * the apex `example.com`.
 *
 * @param {string} hostname
 * @param {string} wildcard
 * @returns {boolean}
 */
function matchesWildcard(hostname, wildcard) {
  // `wildcard` starts `*.`, so dropping the `*` leaves the leading dot that stops `*.example.com`
  // matching either `example.com` itself or `notexample.com`.
  return hostname.endsWith(wildcard.slice(1));
}

/**
 * The hostname a route hostname and a listener hostname agree on, or undefined when they do not
 * overlap. Either side may be a wildcard, and the more specific of the two wins. A listener with no
 * hostname matches anything. Hostnames are case insensitive.
 *
 * @param {string} routeHostname
 * @param {string} [listenerHostname]
 * @returns {string|undefined}
 */
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

/**
 * An IPv6 literal has to be bracketed before it can go in a url.
 *
 * @param {string} host
 * @returns {string}
 */
const hostForUrl = (host) => (host.includes(':') ? `[${ host }]` : host);

/**
 * Does this ref point at a Gateway? `group` and `kind` are both optional and default to
 * `gateway.networking.k8s.io` and `Gateway`.
 *
 * @param {object} parentRef
 * @returns {boolean}
 */
const isGatewayRef = (parentRef) => (parentRef?.group ?? GATEWAY_GROUP) === GATEWAY_GROUP &&
  (parentRef?.kind ?? 'Gateway') === 'Gateway';

export default class HttpRoute extends SteveModel {
  get rules() {
    return this.spec?.rules || [];
  }

  /**
   * The hostnames this route serves, for the list column. Steve's printer column for this field is
   * the raw array, which renders as JSON.
   */
  get hostnamesDisplay() {
    return (this.spec?.hostnames || []).join(', ');
  }

  /**
   * The gateways this route asks to be attached to, for the list column. Read from the spec rather
   * than resolved through the store, so the column does not depend on Gateways being loaded. Refs
   * into another namespace are qualified, since only those are ambiguous.
   */
  get parentRefsDisplay() {
    return (this.spec?.parentRefs || []).filter(isGatewayRef).map((parentRef) => {
      const namespace = parentRef.namespace;

      return namespace && namespace !== this.metadata?.namespace ? `${ namespace }/${ parentRef.name }` : parentRef.name;
    }).join(', ');
  }

  /**
   * Does `backendRef` point at `service`?
   *
   * `group`, `kind` and `namespace` are all optional in the spec and default to the core group,
   * `Service`, and the route's own namespace respectively. Unlike Ingress, an HTTPRoute may
   * reference a Service in another namespace, so the namespace is compared rather than assumed.
   *
   * @param {object} [backendRef]
   * @param {object} [service]
   * @returns {boolean}
   */
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

  /**
   * The rules that send traffic to one of `services`.
   *
   * @param {object[]} services
   * @returns {object[]}
   */
  rulesForServices(services = []) {
    if (!services.length) {
      return [];
    }

    return this.rules.filter((rule) => (rule?.backendRefs || []).some(
      (backendRef) => services.some((service) => this.backendRefTargets(backendRef, service))
    ));
  }

  /**
   * Does any rule on this route send traffic to one of `services`?
   *
   * @param {object[]} services
   * @returns {boolean}
   */
  targetsAnyService(services = []) {
    return this.rulesForServices(services).length > 0;
  }

  /**
   * The url paths a rule serves.
   *
   * A rule with no path match serves everything below `/`, which is the spec default. A rule whose
   * only path matches are regular expressions serves something we cannot express as a url, so it
   * contributes nothing rather than claiming `/`.
   *
   * @param {object} rule
   * @returns {string[]}
   */
  pathsForRule(rule) {
    // A match with no `path` is a prefix match on `/` per the spec default, so it is defaulted
    // rather than dropped - dropping it would lose the `/` url when it sits beside an explicit path.
    const matchedPaths = (rule?.matches || []).map((match) => match?.path ?? { type: 'PathPrefix', value: '/' });

    if (!matchedPaths.length) {
      return ['/'];
    }

    return uniq(matchedPaths
      .filter((path) => LITERAL_PATH_TYPES.includes(path.type ?? 'PathPrefix'))
      .map((path) => path.value || '/'));
  }

  /**
   * The `parentRefs` that point at a Gateway, paired with the Gateway they resolve to. Refs whose
   * Gateway is missing (not yet created, or not visible to this user) are dropped.
   *
   * @returns {{ parentRef: object, gateway: object }[]}
   */
  get parentGateways() {
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

  /**
   * The hostnames to build urls from for a given gateway listener.
   *
   * A route that declares hostnames is only served for those hostnames, intersected with the
   * listener's own. Wildcards are dropped because they are not a url anyone can open, and dropping
   * them yields nothing rather than falling back to the gateway address: the gateway matches on the
   * `Host` header, so a link to the bare address would not reach this route.
   *
   * @param {object} gateway
   * @param {object} listener
   * @returns {string[]}
   */
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

  /**
   * The external http(s) urls this route exposes for `services`, resolved through every listener
   * each parent Gateway attaches it to.
   *
   * @param {object[]} services
   * @returns {{ link: string, linkDisplay: string }[]}
   */
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
