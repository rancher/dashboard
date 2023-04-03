import { applyProducts } from '@shell/store/type-map';

export default async function({
  route, app, store, redirect, $cookies, req, isDev, from, $plugin, next
}) {
  // Load stuff
  await applyProducts(store, $plugin);
}
