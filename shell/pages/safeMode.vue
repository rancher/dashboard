<script>
export default {
  middleware({ redirect, store } ) {
    const dashboardHome = { name: 'home' };
    const t = store.getters['i18n/t'];

    setTimeout(() => {
      store.dispatch('growl/success', {
        title:   t('plugins.safeMode.title'),
        message: t('plugins.safeMode.message')
      }, { root: true });
    }, 1000);

    return redirect(dashboardHome);
  }
};
</script>
