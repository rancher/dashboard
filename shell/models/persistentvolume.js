import SteveModel from '@shell/plugins/steve/steve-class';
import { _getClaimName, _getSource, VOLUME_PLUGINS, _getClaim } from '@shell/plugins/steve/resourceUtils/persistentvolume';

export const LONGHORN_DRIVER = 'driver.longhorn.io';

export const LONGHORN_PLUGIN = VOLUME_PLUGINS.find(plugin => plugin.value === 'longhorn');

export default class PV extends SteveModel {
  // plugin display value table
  get source() {
    return _getSource(this, this.$getters, this.$rootGetters);
  }

  get isLonghorn() {
    return this.spec.csi && this.spec.csi.driver === LONGHORN_DRIVER;
  }

  get claim() {
    return _getClaim(this, this.$getters, this.$rootGetters);
  }

  get claimName() {
    return _getClaimName(this, this.$getters, this.$rootGetters);
  }

  get canDelete() {
    return this.state !== 'bound';
  }
}
