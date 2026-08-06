import SteveModel from '@shell/plugins/steve/steve-class';

export const GATEWAY_GROUP = 'gateway.networking.k8s.io';

// Listener protocols that resolve to a browsable http(s) URL, and the scheme each one serves.
const HTTP_SCHEMES = {
  HTTP:  'http',
  HTTPS: 'https'
};

/**
 * The url scheme a gateway listener serves, or undefined when it is not http(s).
 *
 * @param {object} [listener] a `Gateway.spec.listeners[]` entry
 * @returns {string|undefined}
 */
export function schemeForListener(listener) {
  const protocol = listener?.protocol;

  return Object.hasOwn(HTTP_SCHEMES, protocol) ? HTTP_SCHEMES[protocol] : undefined;
}

export default class Gateway extends SteveModel {
  /**
   * The externally reachable IPs/hostnames the gateway controller has assigned, in the order the
   * controller reported them.
   *
   * @returns {string[]}
   */
  get addresses() {
    return (this.status?.addresses || []).map((address) => address.value).filter((value) => !!value);
  }

  get listeners() {
    return this.spec?.listeners || [];
  }

  /**
   * Will `listener` accept a route of `kind` from `routeNamespace`?
   *
   * `allowedRoutes.namespaces.from` defaults to `Same`, so a listener that says nothing accepts
   * only routes beside it. `Selector` needs namespace labels this model does not load, so it is
   * treated as permissive: showing one endpoint too many beats hiding a working one.
   *
   * @param {object} listener
   * @param {string} routeNamespace
   * @param {string} kind
   * @returns {boolean}
   */
  allowsRoute(listener, routeNamespace, kind) {
    const allowedRoutes = listener?.allowedRoutes;
    const kinds = allowedRoutes?.kinds;

    if (kinds?.length && !kinds.some((k) => k?.kind === kind && (k?.group ?? GATEWAY_GROUP) === GATEWAY_GROUP)) {
      return false;
    }

    if ((allowedRoutes?.namespaces?.from ?? 'Same') === 'Same') {
      return routeNamespace === this.metadata?.namespace;
    }

    return true;
  }

  /**
   * The http(s) listeners a `parentRef` from a route in `routeNamespace` actually attaches to.
   *
   * A `parentRef` may pin a listener by `sectionName`, by `port`, by both, or by neither. With
   * neither it attaches to every compatible listener, so all of them are returned rather than an
   * arbitrary first one - a gateway that redirects on :80 and serves on :443 must not advertise
   * only whichever listener happens to be written first.
   *
   * @param {object} parentRef
   * @param {string} routeNamespace
   * @param {string} kind the route kind, for `allowedRoutes.kinds`
   * @returns {object[]}
   */
  listenersFor(parentRef, routeNamespace, kind = 'HTTPRoute') {
    const { sectionName, port } = parentRef || {};

    return this.listeners.filter((listener) => {
      if (!schemeForListener(listener)) {
        return false;
      }

      if (sectionName && listener.name !== sectionName) {
        return false;
      }

      if (port && listener.port !== port) {
        return false;
      }

      return this.allowsRoute(listener, routeNamespace, kind);
    });
  }
}
