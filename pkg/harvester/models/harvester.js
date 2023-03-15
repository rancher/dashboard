import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../config/harvester';
import { VIEW_IN_API, DEV } from '@shell/store/prefs';

export default class HarvesterResource extends SteveModel {
  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource`,
      params: {
        product:  HARVESTER_PRODUCT,
        cluster:  this.$rootGetters['clusterId'],
        resource: this.type,
      },
    };
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get doneRoute() {
    return this.listLocation.name;
  }

  get doneOverride() {
    return this.listLocation;
  }

  get _detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   HARVESTER_PRODUCT,
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
        id,
        namespace: this.metadata.namespace,
      },
    };
  }

  get canViewInApi() {
    // Ensure Harvester is compatible with Rancher v2.6.10
    try {
      return this.hasLink('self') && this.$rootGetters['prefs/get'](VIEW_IN_API);
    } catch {
      return this.hasLink('self') && this.$rootGetters['prefs/get'](DEV);
    }
  }
}
