import Vue from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class ManagedOsImage extends SteveModel {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { osImage: '', clusterTargets: [] });
    }
  }
}
