import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';

const SOURCE_KEYS = ['gitRepo', 'helmOp'];

function isEmptyValue(value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  return Array.isArray(value) && value.length === 0;
}

export default class FleetPolicy extends SteveModel {
  applyDefaults() {
    const meta = this.metadata || {};

    meta.namespace = meta.namespace || this.$rootGetters['workspace'];

    // A policy that enforces nothing has no effect, so new ones start by requiring a service account
    set(this, 'requireServiceAccount', this.requireServiceAccount ?? true);
    set(this, 'metadata', meta);
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data, forNew);

    if (isEmptyValue(val.allowedServiceAccounts)) {
      delete val.allowedServiceAccounts;
    }

    // An empty `allowed*` list means "allow everything", so the sub-objects are dropped rather
    // than saved as `{}` once every field the user could set is back to its empty value
    SOURCE_KEYS.forEach((key) => {
      const source = val[key];

      if (!source) {
        return;
      }

      Object.keys(source).forEach((field) => {
        if (isEmptyValue(source[field])) {
          delete source[field];
        }
      });

      if (!Object.keys(source).length) {
        delete val[key];
      }
    });

    return val;
  }
}
