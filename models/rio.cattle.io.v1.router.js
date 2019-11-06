const EMPTY = {};

export default {
  app() {
    const spec = this.spec || EMPTY;
    const status = this.status || EMPTY;
    const metadata = this.metadata || EMPTY;

    return spec.app || status.computedApp || metadata.name;
  },

  namespaceApp() {
    return `${ this.metadata.namespace }:${ this.app }`;
  },
};
