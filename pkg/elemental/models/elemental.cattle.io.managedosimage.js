import Vue from 'vue';
import ElementalResource from './elemental-resource';
import { _CREATE } from '@shell/config/query-params';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../types';

export default class ManagedOsImage extends ElementalResource {
  applyDefaults(vm, mode) {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { osImage: '', clusterTargets: [] });
    }
    if ( !this.metadata || mode === _CREATE ) {
      Vue.set(this, 'metadata', { namespace: ELEMENTAL_DEFAULT_NAMESPACE });
    }
  }
}
