import { PVC, LONGHORN_DRIVER } from '@shell/config/types';
import { VOLUME_PLUGINS } from '@shell/config/persistentVolume';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class PV extends SteveModel {
  // plugin display value table
  get source() {
    const csiDriver = this.spec?.csi?.driver;
    const fallback = `${ csiDriver } ${ this.t('persistentVolume.csi.suffix') }`;

    if (csiDriver) {
      return this.$rootGetters['i18n/withFallback'](`persistentVolume.csi.drivers.${ csiDriver.replaceAll('.', '-') }`, null, fallback);
    }
    const pluginDef = VOLUME_PLUGINS.find((plugin) => this.spec[plugin.value]);

    if (pluginDef) {
      return this.t(pluginDef.labelKey);
    }

    // every source should be a csi driver or listed in VOLUME_PLUGIN but just in case..
    return this.t('generic.unknown');
  }

  get isLonghorn() {
    return this.spec.csi && this.spec.csi.driver === LONGHORN_DRIVER;
  }

  get claim() {
    if (!this.name) {
      return null;
    }

    return this.$getters['all'](PVC).find((claim) => claim.spec.volumeName === this.name);
  }

  get claimName() {
    return this.claim?.nameDisplay || this.t('generic.na');
  }

  get canDelete() {
    return this.state !== 'bound';
  }
}
