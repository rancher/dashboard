import jsyaml from 'js-yaml';
import { base64Decode, base64Encode } from '@/utils/crypto';
import { MONITORING, SECRET } from '@/config/types';

const DEFAULT_SECRET_ID = 'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager';
const ALERTMANAGER_ID = 'cattle-monitoring-system/rancher-monitoring-alertmanager';

export const FILENAME = 'alertmanager.yaml';

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

export async function getSecretId(dispatch, useCluster = true) {
  const action = useCluster ? 'cluster/find' : 'find';
  const alertManager = await dispatch(action, { type: MONITORING.ALERTMANAGER, id: ALERTMANAGER_ID });

  return alertManager?.spec?.configSecret || DEFAULT_SECRET_ID;
}

export default {
  removeSerially() {
    return true;
  },

  remove() {
    return async() => {
      await this.updateReceivers((currentReceivers) => {
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
    return this.$rootGetters['cluster/byId'](SECRET, DEFAULT_SECRET_ID)?.canUpdate;
  },

  canCustomEdit() {
    return true;
  },

  canCreate() {
    return this.$rootGetters['type-map/isCreatable'](SECRET);
  },

  canDelete() {
    return this.$rootGetters['cluster/byId'](SECRET, DEFAULT_SECRET_ID)?.canDelete;
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

  async secret() {
    const secretId = await getSecretId(this.$dispatch, false);

    try {
      return await this.$dispatch('find', { type: SECRET, id: secretId });
    } catch (ex) {
      const [namespace, name] = secretId.split('/');
      const secret = await this.$dispatch('create', { type: SECRET });

      secret.metadata = {
        namespace,
        name
      };

      return secret;
    }
  },

  updateReceivers() {
    return async(fn) => {
      const secret = await this.secret;

      secret.data = secret.data || {};
      const file = secret.data[FILENAME];
      const decodedFile = file ? base64Decode(file) : null;
      const loadedFile = decodedFile ? jsyaml.safeLoad(decodedFile) : {};

      loadedFile.receivers = loadedFile.receivers || [];

      const newReceivers = fn(loadedFile.receivers);

      loadedFile.receivers = newReceivers;

      const newFile = jsyaml.safeDump(loadedFile);
      const encodedFile = base64Encode(newFile);

      secret.data[FILENAME] = encodedFile;
      await secret.save();
      // Force a store update
      await this.$dispatch('findAll', { type: this.type, opt: { force: true } });
    };
  }
};
