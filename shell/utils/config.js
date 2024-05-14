export default (context, inject, Vue) => {
  inject('config', nuxt.publicRuntimeConfig, context, Vue);
};
