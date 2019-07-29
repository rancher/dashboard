export default function(ctx) {
  ctx.store.dispatch('prefs/loadCookies');
}
