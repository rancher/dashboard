import { isEmpty, set } from '@shell/utils/object';
import { areRoutesSupportedFormat, canCreate, createDefaultRouteName, updateConfig } from '@shell/utils/alertmanagerconfig';
import { MONITORING } from '@shell/config/types';
import { NAME as MONITORING_PRODUCT } from '@shell/config/product/monitoring';
import jsyaml from 'js-yaml';
import SteveModel from '@shell/plugins/steve/steve-class';

export const ROOT_NAME = 'root';

export default class Route extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {};

    spec.group_by = spec.group_by || [];
    spec.group_wait = spec.group_wait || '30s';
    spec.group_interval = spec.group_interval || '5m';
    spec.repeat_interval = spec.repeat_interval || '4h';
    spec.match = spec.match || {};
    spec.match_re = spec.match || {};

    set(this, 'spec', spec);
  }

  get removeSerially() {
    return true;
  }

  remove() {
    return this.updateRoutes((currentRoutes) => {
      return currentRoutes.filter((route, i) => {
        return createDefaultRouteName(i) !== this.id;
      });
    });
  }

  async save() {
    const errors = await this.validationErrors(this);

    if (!isEmpty(errors)) {
      return Promise.reject(errors);
    }

    await this.updateRoutes((currentRoutes) => {
      const existingRoute = currentRoutes.find((route, i) => {
        return createDefaultRouteName(i) === this.id;
      });

      if (existingRoute) {
        Object.assign(existingRoute, this.spec);
      } else {
        currentRoutes.push(this.spec);
      }

      return currentRoutes;
    });

    return {};
  }

  get canUpdate() {
    return this.secret.canUpdate;
  }

  get canCustomEdit() {
    return true;
  }

  get canCreate() {
    return canCreate(this.$rootGetters) && areRoutesSupportedFormat(this.secret);
  }

  get canDelete() {
    return !this.isRoot && this.secret.canDelete;
  }

  get canViewInApi() {
    return false;
  }

  get canYaml() {
    return areRoutesSupportedFormat(this.secret);
  }

  get _detailLocation() {
    return {
      name:   'c-cluster-monitoring-route-receiver-id',
      params: { cluster: this.$rootGetters['clusterId'], id: this.id },
      query:  { resource: this.type }
    };
  }

  get doneOverride() {
    return {
      name:   'c-cluster-monitoring-route-receiver',
      params: { cluster: this.$rootGetters['clusterId'] },
      query:  { resource: this.type }
    };
  }

  get customValidationRules() {
    const rules = [
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
  }

  updateRoutes(fn) {
    return updateConfig(this.$dispatch, 'route.routes', this.type, fn);
  }

  get isRoot() {
    return this.id === ROOT_NAME;
  }

  saveYaml(yaml) {
    const parsed = jsyaml.load(yaml);

    Object.assign(this, parsed);

    return this.save();
  }

  get receiverLink() {
    return {
      text:    this.spec.receiver,
      to:      {
        name:   'c-cluster-product-resource-id',
        params: {
          resource: MONITORING.SPOOFED.RECEIVER, product: MONITORING_PRODUCT, id: this.spec.receiver
        }
      }
    };
  }
}
