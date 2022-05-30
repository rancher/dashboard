import Vue from 'vue';
import ElementalResource from './elemental-resource';

const DEFAULT_CREATION_YAML = `# enter cloud config as yaml
#
#
#
#
#
#`;

export default class MachineRegistration extends ElementalResource {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { cloudConfig: DEFAULT_CREATION_YAML });
    }
  }
}
