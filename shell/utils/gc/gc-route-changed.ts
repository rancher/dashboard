import gc from './gc';

function getResourceFromRoute(to: any) {
  let resource = to.params?.resource;

  if ( !resource ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      resource = match[2];
    }
  }

  return resource;
}

/**
 * Handle GC on route change (given settings this might be a no-op)
 */
class GarbageCollectRouteChanged {
  /**
  * Execute GC when the route changes
  */
  private static GC_RUN_ON_ROUTE_CHANGE = true;

  /**
   * A logged in route has changed
   * 1) Track the time this occurred to ensure any resources fetched afterwards are not GCd
   * 2) Kick off a GC
   */
  gcRouteChanged(ctx: any, to: any) {
    gc.gcUpdateRouteChanged();
    // commit(`gcRouteChanged`);

    if (!gc.gcEnabledSetting(ctx) || !GarbageCollectRouteChanged.GC_RUN_ON_ROUTE_CHANGE || to.name === 'auth-logout') {
      // Convenience, no point GC'ing if we've just lost all types
      console.warn('root gcRouteChanged', 'IGNORING (disabled)');// TODO: RC LOG

      return;
    }

    const resource = getResourceFromRoute(to);
    const ignoreTYpes = !!resource ? { [resource]: true } : {};

    console.warn('resource from route:', resource, to); // TODO: RC LOG

    // gc.garbageCollect(ctx, ignoreTYpes, this.lastRouteChange);
    ctx.dispatch('garbageCollect', ignoreTYpes); // gc.garbageCollect is per store, so dispatch via central point
  }
}

const gcrc = new GarbageCollectRouteChanged();

export default gcrc;
