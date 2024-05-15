export default (context, inject) => {
  // eslint-disable-next-line no-undef
  inject('config', nuxt.publicRuntimeConfig);
};
