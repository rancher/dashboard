export default {
  constraints() {
    const type = `constraints.gatekeeper.sh.${ this.id }`;

    if (!this.$rootGetters['cluster/haveAll'](type)) {
      throw new Error('The constraints have not been loaded');
    }

    return this.$rootGetters['cluster/all'](type);
  },

  preventDeletionMessage() {
    const constraints = this.constraints;

    if ( constraints.length > 0 ) {
      return `There are still constaints using this template. You cannot delete this template while it's in use.`;
    }
  },
};
