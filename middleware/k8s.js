export default async function(ctx) {
  await ctx.store.dispatch('k8s/loadAll');
}
