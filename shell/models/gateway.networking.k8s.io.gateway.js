import SteveModel from '@shell/plugins/steve/steve-class';

export const GATEWAY_GROUP = 'gateway.networking.k8s.io';

const HTTP_SCHEMES = {
  HTTP:  'http',
  HTTPS: 'https'
};

export function schemeForListener(listener) {
  const protocol = listener?.protocol;

  // hasOwn, not a bare index: a protocol of `constructor` would otherwise resolve off the prototype.
  return Object.hasOwn(HTTP_SCHEMES, protocol) ? HTTP_SCHEMES[protocol] : undefined;
}

export default class Gateway extends SteveModel {
  get addresses() {
    return (this.status?.addresses || []).map((address) => address.value).filter((value) => !!value);
  }

  get listeners() {
    return this.spec?.listeners || [];
  }

  // `namespaces.from` defaults to `Same`, so a listener that says nothing accepts only routes beside
  // it. `Selector` needs namespace labels this model does not load, so it is treated as permissive:
  // showing one endpoint too many beats hiding a working one.
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

  // A parentRef that pins neither sectionName nor port attaches to every compatible listener, so
  // all of them are returned: a gateway that redirects on :80 and serves on :443 must not advertise
  // only whichever listener happens to be written first.
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
