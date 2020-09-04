export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      this.spec = spec;

      spec.selector = spec.selector || {};
      spec.selector.matchExpressions = spec.selector.matchExpressions || [];
    };
  },
};
