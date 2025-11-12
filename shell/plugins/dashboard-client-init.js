export default async(context) => {
  await context.store.dispatch('dashboardClientInit', context);
};
