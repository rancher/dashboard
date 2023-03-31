import SteveModel from '@shell/plugins/steve/steve-class';
import { _getGroupByLabel } from '@shell/plugins/steve/resourceUtils/fleet.cattle.io.clusterregistration';

export default class FleetToken extends SteveModel {
  get groupByLabel() {
    return _getGroupByLabel(this, this.$getters, this.$rootGetters);
  }
}
