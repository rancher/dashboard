export default {
  app() {
    return this.spec.app || this.status.computedApp || this.metadata.name;
  },

  namespaceApp() {
    return `${ this.metadata.namespace }:${ this.app }`;
  },
};
