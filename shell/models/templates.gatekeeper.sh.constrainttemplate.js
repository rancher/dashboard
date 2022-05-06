import SteveModel from '@shell/plugins/steve/steve-class';

export default class extends SteveModel {
  get constraints() {
    const type = `constraints.gatekeeper.sh.${ this.id }`;

    if (!this.$rootGetters['cluster/haveAll'](type)) {
      throw new Error('The constraints have not been loaded');
    }

    return this.$rootGetters['cluster/all'](type);
  }

  get preventDeletionMessage() {
    const constraints = this.constraints;

    if ( constraints.length > 0 ) {
      return `There are still constraints using this template. You cannot delete this template while it's in use.`;
    }

    return null;
  }
}
