import Vue from 'vue';
import ElementalResource from './elemental-resource';
import { _CREATE } from '@shell/config/query-params';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../types';

const DEFAULT_CREATION_YAML = `elemental:
  install:
    device: /dev/vda
  users:
    name: root
    passwd: root`;

export default class MachineRegistration extends ElementalResource {
  applyDefaults(vm, mode) {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { cloudConfig: DEFAULT_CREATION_YAML });
    }
    if ( !this.metadata || mode === _CREATE ) {
      Vue.set(this, 'metadata', { namespace: ELEMENTAL_DEFAULT_NAMESPACE });
    }
  }
}
