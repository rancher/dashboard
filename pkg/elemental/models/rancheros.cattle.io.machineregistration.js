import Vue from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';

const DEFAULT_CREATION_YAML = `# enter cloud config as yaml or read from file...
#
#
#
#
#
#`;

export default class MachineRegistration extends SteveModel {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { cloudConfig: DEFAULT_CREATION_YAML });
    }
  }
}
