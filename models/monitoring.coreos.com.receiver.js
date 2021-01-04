import { canCreate, updateConfig } from '@/utils/alertmanagerconfig';
import { isEmpty } from '@/utils/object';
import { MONITORING } from '@/config/types';
import jsyaml from 'js-yaml';

export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'monitoringReceiver.slack.label',
    title: 'monitoringReceiver.slack.title',
    info:  'monitoringReceiver.slack.info',
    key:   'slack_configs',
    logo:  require(`~/assets/images/vendor/slack.svg`)
  },
  {
    name:  'email',
    label: 'monitoringReceiver.email.label',
    title: 'monitoringReceiver.email.title',
    key:   'email_configs',
    logo:  require(`~/assets/images/vendor/email.svg`)
  },
  {
    name:  'pagerduty',
    label: 'monitoringReceiver.pagerduty.label',
    title: 'monitoringReceiver.pagerduty.title',
    info:  'monitoringReceiver.pagerduty.info',
    key:   'pagerduty_configs',
    logo:  require(`~/assets/images/vendor/pagerduty.svg`)
  },
  {
    name:  'opsgenie',
    label: 'monitoringReceiver.opsgenie.label',
    title: 'monitoringReceiver.opsgenie.title',
    key:   'opsgenie_configs',
    logo:  require(`~/assets/images/vendor/email.svg`)
  },
  {
    name:  'webhook',
    label: 'monitoringReceiver.webhook.label',
    title: 'monitoringReceiver.webhook.title',
    key:   'webhook_configs',
    logo:  require(`~/assets/images/vendor/webhook.svg`)
  },
  {
    name:  'custom',
    label: 'monitoringReceiver.custom.label',
    title: 'monitoringReceiver.custom.title',
    info:  'monitoringReceiver.custom.info',
    key:   'webhook_configs',
    logo:  require(`~/assets/images/vendor/custom.svg`)
  },
];

export default {
  removeSerially() {
    return true;
  },

  remove() {
    return () => {
      return this.updateReceivers((currentReceivers) => {
        return currentReceivers.filter(r => r.name !== this.spec?.name);
      });
    };
  },

  save() {
    return async() => {
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
    };
  },

  canUpdate() {
    return this.secret.canUpdate;
  },

  canCustomEdit() {
    return true;
  },

  canCreate() {
    return canCreate(this.$rootGetters);
  },

  canDelete() {
    return this.id !== 'null' && !this.spec.name !== 'null' && this.secret.canDelete;
  },

  canViewInApi() {
    return false;
  },

  canYaml() {
    return true;
  },

  receiverTypes() {
    const types = RECEIVERS_TYPES
      .filter(type => type.name !== 'custom' && this.spec[type.key]?.length > 0)
      .map(type => type.label);

    const expectedKeys = RECEIVERS_TYPES.map(type => type.key).filter(key => key !== 'custom');

    expectedKeys.push('name');

    const customKeys = Object.keys(this.spec)
      .filter(key => !expectedKeys.includes(key));

    if (customKeys.length > 0) {
      const customLabel = RECEIVERS_TYPES.find(type => type.name === 'custom').label;

      types.push(customLabel);
    }

    return types;
  },

  updateReceivers() {
    return fn => updateConfig(this.$dispatch, 'receivers', this.type, fn);
  },

  saveYaml() {
    return (yaml) => {
      const parsed = jsyaml.safeLoad(yaml);

      Object.assign(this, parsed);

      return this.save();
    };
  },

  customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'spec.name',
        required:       true,
        translationKey: 'monitoring.receiver.fields.name'
      },
    ];

    return rules;
  },

  routes() {
    if (!this.$rootGetters['cluster/haveAll'](MONITORING.SPOOFED.ROUTE)) {
      throw new Error('The routes have not been loaded');
    }

    return this.$rootGetters['cluster/all'](MONITORING.SPOOFED.ROUTE);
  },

  hasDependentRoutes() {
    return !!this.routes.find(route => route.spec.receiver === this.id);
  },

  preventDeletionMessage() {
    if (this.hasDependentRoutes) {
      return `There are still routes using this receiver. You cannot delete this receiver while it's in use.`;
    }
  },

};
