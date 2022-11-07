import { canCreate, updateConfig } from '@shell/utils/alertmanagerconfig';
import { isEmpty } from '@shell/utils/object';
import { MONITORING } from '@shell/config/types';
import jsyaml from 'js-yaml';
import { cloneDeep, uniq } from 'lodash';
import SteveModel from '@shell/plugins/steve/steve-class';

export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'monitoringReceiver.slack.label',
    title: 'monitoringReceiver.slack.title',
    info:  'monitoringReceiver.slack.info',
    key:   'slack_configs',
    logo:  require(`~shell/assets/images/vendor/slack.svg`)
  },
  {
    name:  'email',
    label: 'monitoringReceiver.email.label',
    title: 'monitoringReceiver.email.title',
    key:   'email_configs',
    logo:  require(`~shell/assets/images/vendor/email.svg`)
  },
  {
    name:  'pagerduty',
    label: 'monitoringReceiver.pagerduty.label',
    title: 'monitoringReceiver.pagerduty.title',
    info:  'monitoringReceiver.pagerduty.info',
    key:   'pagerduty_configs',
    logo:  require(`~shell/assets/images/vendor/pagerduty.svg`)
  },
  {
    name:  'opsgenie',
    label: 'monitoringReceiver.opsgenie.label',
    title: 'monitoringReceiver.opsgenie.title',
    key:   'opsgenie_configs',
    logo:  require(`~shell/assets/images/vendor/email.svg`)
  },
  {
    name:         'webhook',
    label:        'monitoringReceiver.webhook.label',
    title:        'monitoringReceiver.webhook.title',
    key:          'webhook_configs',
    logo:         require(`~shell/assets/images/vendor/webhook.svg`),
    banner:       'webhook.banner',
    addButton:    'webhook.add'
  },
  {
    name:         'pandariaWebhook',
    label:        'monitoringReceiver.pandariaWebhook.label',
    title:        'monitoringReceiver.pandariaWebhook.title',
    key:          'pandaria_webhook_configs',
    logo:         require(`~shell/assets/images/vendor/webhook.svg`),
    banner:       'pandariaWebhook.banner',
    addButton:    'pandariaWebhook.add'
  },
  {
    name:  'custom',
    label: 'monitoringReceiver.custom.label',
    title: 'monitoringReceiver.custom.title',
    info:  'monitoringReceiver.custom.info',
    key:   'webhook_configs',
    logo:  require(`~shell/assets/images/vendor/custom.svg`)
  },
];

// Pandaria extra webhook
export const ALERTINGDRIVERNEEDUPDATE = [
  'DINGTALK',
  'MICROSOFT_TEAMS',
  'ALIYUN_SMS',
];
export const PANDARIADEFAULTTYPE = 'DINGTALK';
export const PANDARIAWEBHOOKKEY = 'pandaria_webhook_configs';
export const WEBHOOKKEY = 'webhook_configs';
export const PANDARIAWEBHOOKURL = 'http://alerting-drivers.cattle-monitoring-system.svc:9094/';

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
    const pandariaWebhookErrors = this.validationPandariaErrors();

    errors.push(...pandariaWebhookErrors);

    if (!isEmpty(errors)) {
      return Promise.reject(errors);
    }

    await this.updateReceivers((currentReceivers) => {
      if (!Array.isArray(currentReceivers)) {
        currentReceivers = [];
      }
      const existingReceiver = currentReceivers.find(r => r.name === this.spec?.name);
      const cloneSpec = cloneDeep(this.spec);

      // Assign pandaria-webhook config to webhook
      if (cloneSpec?.[PANDARIAWEBHOOKKEY]?.length > 0) {
        if (!cloneSpec[WEBHOOKKEY]) {
          cloneSpec[WEBHOOKKEY] = [];
        }
        cloneSpec[PANDARIAWEBHOOKKEY].forEach((item) => {
          cloneSpec[WEBHOOKKEY].push(item);
        });
      }

      if (existingReceiver) {
        Object.assign(existingReceiver, cloneSpec);
      } else {
        currentReceivers.push(cloneSpec);
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
      .filter(type => type.name !== 'custom' && this.spec[type.key]?.length > 0)
      .map(type => this.t(type.label));

    const expectedKeys = RECEIVERS_TYPES.map(type => type.key).filter(key => key !== 'custom');

    expectedKeys.push('name');

    const customKeys = Object.keys(this.spec)
      .filter(key => !expectedKeys.includes(key));

    if (customKeys.length > 0) {
      const customLabel = this.t(RECEIVERS_TYPES.find(type => type.name === 'custom').label);

      types.push(customLabel);
    }

    return types;
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

  // Pandaria validate PANDARIAWEBHOOKKEY
  validationPandariaErrors() {
    const errors = [];

    if (this.spec?.[PANDARIAWEBHOOKKEY]?.length > 0) {
      this.spec[PANDARIAWEBHOOKKEY].forEach((item) => {
        if (item.type === 'DINGTALK' || item.type === 'MICROSOFT_TEAMS') {
          !item.webhook_url && errors.push(this.t('validation.required', { key: 'Webhook URL' }));
        }

        if (item.type === 'ALIYUN_SMS') {
          !item.http_config?.access_key_id && errors.push(this.t('validation.required', { key: 'ALIYUN_SMS access_key_id' }));
          !item.http_config?.access_key_secret && errors.push(this.t('validation.required', { key: 'ALIYUN_SMS access_key_secret' }));
          !item.http_config?.template_code && errors.push(this.t('validation.required', { key: 'ALIYUN_SMS template_code' }));
          !item.http_config?.sign_name && errors.push(this.t('validation.required', { key: 'ALIYUN_SMS sign_name' }));
        }
      });
    }

    return uniq(errors);
  }
}
