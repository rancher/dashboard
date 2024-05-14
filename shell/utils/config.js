export default (context, inject, Vue) => {
  // eslint-disable-next-line no-undef
  inject('config', nuxt.publicRuntimeConfig, context, Vue);
};
