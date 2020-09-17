export default {
  providers() {
    const spec = this.spec || {};

    return Object.keys(spec)
      .filter(provider => provider !== 'loggingRef');
  }
};
