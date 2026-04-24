import { canCreate, updateConfig } from '@shell/utils/alertmanagerconfig';
import { isEmpty } from '@shell/utils/object';
import { MONITORING } from '@shell/config/types';
import jsyaml from 'js-yaml';
import SteveModel from '@shell/plugins/steve/steve-class';
import slackLogo from '~shell/assets/images/vendor/slack.svg';
import emailLogo from '~shell/assets/images/vendor/email.svg';
import pagerdutyLogo from '~shell/assets/images/vendor/pagerduty.svg';
import webhookLogo from '~shell/assets/images/vendor/webhook.svg';
import customLogo from '~shell/assets/images/vendor/custom.svg';

// i18n-uses monitoringReceiver.slack.*, monitoringReceiver.email.*, monitoringReceiver.pagerduty.*
// i18n-uses monitoringReceiver.opsgenie.*, monitoringReceiver.webhook.*, monitoringReceiver.custom.*
export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'monitoringReceiver.slack.label',
    title: 'monitoringReceiver.slack.title',
    info:  'monitoringReceiver.slack.info',
    key:   'slack_configs',
    logo:  slackLogo
  },
  {
    name:  'email',
    label: 'monitoringReceiver.email.label',
    title: 'monitoringReceiver.email.title',
    key:   'email_configs',
    logo:  emailLogo
  },
  {
    name:  'pagerduty',
    label: 'monitoringReceiver.pagerduty.label',
    title: 'monitoringReceiver.pagerduty.title',
    info:  'monitoringReceiver.pagerduty.info',
    key:   'pagerduty_configs',
    logo:  pagerdutyLogo
  },
  {
    name:  'opsgenie',
    label: 'monitoringReceiver.opsgenie.label',
    title: 'monitoringReceiver.opsgenie.title',
    key:   'opsgenie_configs',
    logo:  emailLogo
  },
  {
    name:      'webhook',
    label:     'monitoringReceiver.webhook.label',
    title:     'monitoringReceiver.webhook.title',
    key:       'webhook_configs',
    logo:      webhookLogo,
    banner:    'webhook.banner',
    addButton: 'webhook.add'
  },
  {
    name:  'custom',
    label: 'monitoringReceiver.custom.label',
    title: 'monitoringReceiver.custom.title',
    info:  'monitoringReceiver.custom.info',
    key:   'webhook_configs',
    logo:  customLogo
  },
];

export default class Receiver extends SteveModel {
  get removeSerially() {
    return true;
  }

  remove() {
    return this.updateReceivers((currentReceivers) => {
      return currentReceivers.filter((r) => r.name !== this.spec?.name);
    });
  }

  async save() {
    const errors = this.validationErrors(this);

    if (!isEmpty(errors)) {
      return Promise.reject(errors);
    }

    await this.updateReceivers((currentReceivers) => {
      const existingReceiver = currentReceivers.find((r) => r.name === this.spec?.name);

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
    const types = RECEIVERS_TYPES
      .filter((type) => type.name !== 'custom' && this.spec[type.key]?.length > 0)
      .map((type) => this.t(type.label));

    const expectedKeys = RECEIVERS_TYPES.map((type) => type.key).filter((key) => key !== 'custom');

    expectedKeys.push('name');

    const customKeys = Object.keys(this.spec)
      .filter((key) => !expectedKeys.includes(key));

    if (customKeys.length > 0) {
      const customLabel = this.t(RECEIVERS_TYPES.find((type) => type.name === 'custom').label);

      types.push(customLabel);
    }

    return types;
  }

  get updateReceivers() {
    return (fn) => updateConfig(this.$dispatch, 'receivers', this.type, fn);
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
    return !!this.routes.find((route) => route.spec.receiver === this.id);
  }

  get preventDeletionMessage() {
    if (this.hasDependentRoutes) {
      return `There are still routes using this receiver. You cannot delete this receiver while it's in use.`;
    }

    return null;
  }
}
