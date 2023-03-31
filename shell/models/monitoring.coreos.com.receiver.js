import { canCreate, updateConfig } from '@shell/utils/alertmanagerconfig';
import { isEmpty } from '@shell/utils/object';
import { MONITORING } from '@shell/config/types';
import jsyaml from 'js-yaml';
import SteveModel from '@shell/plugins/steve/steve-class';
import { _getReceiverTypes } from '@shell/plugins/steve/resourceUtils/monitoring.coreos.com.receiver';

export default class Receiver extends SteveModel {
  get removeSerially() {
    return true;
  }

  remove() {
    return this.updateReceivers((currentReceivers) => {
      return currentReceivers.filter(r => r.name !== this.spec?.name);
    });
  }

  async save() {
    const errors = await this.validationErrors(this);

    if (!isEmpty(errors)) {
      return Promise.reject(errors);
    }

    await this.updateReceivers((currentReceivers) => {
      const existingReceiver = currentReceivers.find(r => r.name === this.spec?.name);

      if (existingReceiver) {
        Object.assign(existingReceiver, this.spec);
      } else {
        currentReceivers.push(this.spec);
      }

      return currentReceivers;
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
    return canCreate(this.$rootGetters);
  }

  get canDelete() {
    return this.id !== 'null' && !this.spec.name !== 'null' && this.secret.canDelete;
  }

  get canViewInApi() {
    return false;
  }

  get canYaml() {
    return true;
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

  get receiverTypes() {
    return _getReceiverTypes(this, this.$getters, this.$rootGetters);
  }

  get updateReceivers() {
    return fn => updateConfig(this.$dispatch, 'receivers', this.type, fn);
  }

  saveYaml(yaml) {
    const parsed = jsyaml.load(yaml);

    Object.assign(this, parsed);

    return this.save();
  }

  get customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'spec.name',
        required:       true,
        translationKey: 'monitoring.receiver.fields.name'
      },
    ];

    return rules;
  }

  get routes() {
    if (!this.$rootGetters['cluster/haveAll'](MONITORING.SPOOFED.ROUTE)) {
      throw new Error('The routes have not been loaded');
    }

    return this.$rootGetters['cluster/all'](MONITORING.SPOOFED.ROUTE);
  }

  get hasDependentRoutes() {
    return !!this.routes.find(route => route.spec.receiver === this.id);
  }

  get preventDeletionMessage() {
    if (this.hasDependentRoutes) {
      return `There are still routes using this receiver. You cannot delete this receiver while it's in use.`;
    }

    return null;
  }
}
