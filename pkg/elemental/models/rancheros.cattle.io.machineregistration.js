import Vue from 'vue';
import ElementalResource from './elemental-resource';

const DEFAULT_CREATION_YAML = `rancheros:
  install:
    device: /dev/vda
  users:
  - name: root
  passwd: root`;

export default class MachineRegistration extends ElementalResource {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { cloudConfig: DEFAULT_CREATION_YAML });
    }
  }
}
