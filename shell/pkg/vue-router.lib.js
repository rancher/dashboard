// Stub for extension library builds — keeps vue-router out of extension bundles without
// hard-requiring a host global.
//
// Rancher >= 2.15 exposes the real vue-router as window.__vueRouter (see
// core/plugins-loader.js). Rancher <= 2.14 never sets it, and because the UMD wrapper binds
// externals at script-load time, an externalised 'vue-router' resolves to undefined there —
// so every useRoute() call, in @shell components and in extension code alike, throws inside
// setup(). See https://github.com/rancher/dashboard/issues/18635.
//
// Every export below forwards to the host global, so on Rancher >= 2.15 an extension gets the
// host's real vue-router, identity-equal and unchanged. useRoute()/useRouter() additionally
// have a fallback for older hosts, built on the $route/$router that vue-router installs on
// every component proxy. The rest fail with a readable message rather than as
// "undefined is not a function".

import { getCurrentInstance, reactive } from 'vue';

const host = () => (typeof window === 'undefined' ? undefined : window.__vueRouter);

const vm = () => getCurrentInstance()?.proxy;

// Forward a vue-router function to the host, or explain why it isn't there.
const delegate = (name) => (...args) => {
  const fn = host()?.[name];

  if (!fn) {
    throw new Error(`vue-router's ${ name }() is not available to extensions on this Rancher version (requires 2.15 or later)`);
  }

  return fn(...args);
};

// Forward a vue-router constant, symbol or component to the host, with an optional fallback.
const value = (name, fallback) => host()?.[name] || fallback;

// The real useRoute() returns a reactive object tracking the router's current location.
// vue-router installs the same thing as $route on every component, but swaps the object out on
// each navigation, so we read through to it on every property access instead of capturing it.
// reactive() keeps watch(route, cb) working, the way it does with the real thing.
const fallbackUseRoute = () => {
  const instance = vm();

  if (!instance) {
    return undefined;
  }

  return reactive(new Proxy({}, {
    get:                      (_target, key) => instance.$route?.[key],
    has:                      (_target, key) => key in (instance.$route || {}),
    ownKeys:                  () => Reflect.ownKeys(instance.$route || {}),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
  }));
};

export function useRoute(...args) {
  const router = host();

  return router ? router.useRoute(...args) : fallbackUseRoute();
}

export function useRouter(...args) {
  const router = host();

  return router ? router.useRouter(...args) : vm()?.$router;
}

// app.use(router) registers both of these globally, so the string name resolves in a template.
export const RouterLink = value('RouterLink', 'router-link');
export const RouterView = value('RouterView', 'router-view');

// The rest of the vue-router surface, forwarded verbatim. None of it is reachable from shell
// code today, but extensions may import any of it and did get the real thing before this stub.
export const createMemoryHistory = delegate('createMemoryHistory');
export const createRouter = delegate('createRouter');
export const createRouterMatcher = delegate('createRouterMatcher');
export const createWebHashHistory = delegate('createWebHashHistory');
export const createWebHistory = delegate('createWebHistory');
export const isNavigationFailure = delegate('isNavigationFailure');
export const loadRouteLocation = delegate('loadRouteLocation');
export const onBeforeRouteLeave = delegate('onBeforeRouteLeave');
export const onBeforeRouteUpdate = delegate('onBeforeRouteUpdate');
export const parseQuery = delegate('parseQuery');
export const stringifyQuery = delegate('stringifyQuery');
export const useLink = delegate('useLink');

export const NavigationFailureType = value('NavigationFailureType');
export const START_LOCATION = value('START_LOCATION');
export const matchedRouteKey = value('matchedRouteKey');
export const routeLocationKey = value('routeLocationKey');
export const routerKey = value('routerKey');
export const routerViewLocationKey = value('routerViewLocationKey');
export const viewDepthKey = value('viewDepthKey');
