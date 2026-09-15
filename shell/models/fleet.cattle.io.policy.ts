import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import type { FleetPolicySource } from '@shell/types/fleet';

const SOURCE_KEYS = ['gitRepo', 'helmOp'] as const;

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  return Array.isArray(value) && value.length === 0;
}

export default class FleetPolicy extends SteveModel {
  declare metadata: {
    name?: string;
    namespace?: string;
    annotations?: Record<string, string>;
  };

  declare requireServiceAccount?: boolean;
  declare allowedServiceAccounts?: string[];
  declare allowNamespaceCreation?: boolean;
  declare gitRepo?: FleetPolicySource;
  declare helmOp?: FleetPolicySource;

  applyDefaults() {
    const meta = this.metadata || {};

    meta.namespace = meta.namespace || this.$rootGetters['workspace'];

    set(this, 'metadata', meta);
  }

  cleanForSave(data: Record<string, any>, forNew?: boolean): Record<string, any> {
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
