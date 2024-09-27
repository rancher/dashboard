import { DESCRIPTION } from '@shell/config/labels-annotations';
import NormanModel from '@shell/plugins/steve/norman-class';
import { KONTAINER_TO_DRIVER } from './management.cattle.io.kontainerdriver';
import capitalize from 'lodash/capitalize';

export default class Driver extends NormanModel {
  get canViewYaml() {
    return false;
  }

  get driverName() {
    if (!this.builtIn) {
      // if the driver is not built in, there's a good change its a custom one
      // custom drivers have a random id, so shouldn't be used as the type
      // instead use the status.displayName. this will map to the name extracted from the binary
      const driverName = this.status?.displayName?.toLowerCase();

      if (driverName) {
        // some drivers are built in but don't have the builtIn flag. ensure we pass these through K_TO_D
        return KONTAINER_TO_DRIVER[driverName] || driverName;
      }
    }

    return KONTAINER_TO_DRIVER[this.id] || this.name || this.id;
  }

  get nameDisplay() {
    const path = `cluster.provider.${ this.driverName }`;
    const label = capitalize(this.driverName);

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get description() {
    if (!!this.builtIn || !!this.builtin) {
      return this.$rootGetters['i18n/withFallback']('tableHeaders.builtIn');
    } else {
      return this.url;
    }
  }

  /**
   * Set description based on the type of model available with private fallback
   */
  set description(value) {
    if (this.annotations) {
      this.annotations[DESCRIPTION] = value;
    }

    this._description = value;
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data, forNew);

    if (forNew) {
      val.active = true;
    }
    delete val.metadata;

    return val;
  }
}
