import Vue from 'vue';
import ElementalResource from './elemental-resource';

export default class ManagedOsImage extends ElementalResource {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { osImage: '', clusterTargets: [] });
    }
  }
}
