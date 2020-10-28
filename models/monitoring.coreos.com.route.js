import { isEmpty, set } from '@/utils/object';
import { areRoutesSupportedFormat, canCreate, updateConfig } from '@/utils/alertmanagerconfig';

export const ROOT_NAME = 'root';

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      spec.group_by = spec.group_by || [];
      spec.group_wait = spec.group_wait || '30s';
      spec.group_interval = spec.group_interval || '5m';
      spec.repeat_interval = spec.repeat_interval || '4h';
      spec.match = spec.match || {};
      spec.match_re = spec.match || {};

      set(this, 'spec', spec);
    };
  },

  removeSerially() {
    return true;
  },

  remove() {
    return () => {
      return this.updateRoutes((currentRoutes) => {
        return currentRoutes.filter(r => r.name !== this.spec?.name);
      });
    };
  },

  save() {
    return async() => {
      const errors = await this.validationErrors(this);

      if (!isEmpty(errors)) {
        return Promise.reject(errors);
      }

      await this.updateRoutes((currentRoutes) => {
        const existingRoute = currentRoutes.find(r => r.name === this.spec?.name);

        if (existingRoute) {
          Object.assign(existingRoute, this.spec);
        } else {
          currentRoutes.push(this.spec);
        }

        return currentRoutes;
      });

      return {};
    };
  },

  canUpdate() {
    return this.secret.canUpdate;
  },

  canCustomEdit() {
    return true;
  },

  canCreate() {
    return canCreate(this.$rootGetters) && areRoutesSupportedFormat(this.secret);
  },

  canDelete() {
    return !this.isRoot && this.secret.canDelete;
  },

  canViewInApi() {
    return false;
  },

  canYaml() {
    return areRoutesSupportedFormat(this.secret);
  },

  customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'spec.name',
        required:       true,
        translationKey: 'generic.name'
      },
      {
        nullable:       false,
        path:           'spec.receiver',
        required:       true,
        translationKey: 'monitoring.route.fields.receiver'
      },
      {
        path:           'spec.group_wait',
        validators:     ['interval'],
        translationKey: 'monitoring.route.fields.groupWait'
      },
      {
        path:           'spec.group_interval',
        validators:     ['interval'],
        translationKey: 'monitoring.route.fields.groupInterval'
      },
      {
        path:           'spec.repeat_interval',
        validators:     ['interval'],
        translationKey: 'monitoring.route.fields.repeatInterval'
      }
    ];

    if (!this.isRoot) {
      rules.push({
        path:       'spec',
        validators: ['matching']
      });
    }

    return rules;
  },

  updateRoutes() {
    return fn => updateConfig(this.$dispatch, 'route.routes', this.type, fn);
  },

  isRoot() {
    return this.id === ROOT_NAME;
  }
};
