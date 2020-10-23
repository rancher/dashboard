import { canCreate, updateConfig } from '@/utils/alertmanagerconfig';

export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'Slack',
    title: 'Slack Config',
    key:   'slack_configs',
    logo:  require(`~/assets/images/icon-slack.svg`)
  },
  {
    name:  'email',
    label: 'Email',
    title: 'Email Config',
    key:   'email_configs',
    logo:  require(`~/assets/images/icon-email.svg`)
  },
  {
    name:  'webhook',
    label: 'Webhook',
    title: 'Webhook Config',
    key:   'webhook_configs',
    logo:  require(`~/assets/images/icon-webhook.svg`)
  },
  {
    name:  'custom',
    label: 'Custom',
    title: 'Custom Config',
    key:   'webhook_configs',
    logo:  require(`~/assets/images/icon-custom.svg`)
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
    return this.secret.canDelete;
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
  }
};
