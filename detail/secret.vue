<script>
import { TYPES } from '@/models/secret';
import { base64Decode } from '@/utils/crypto';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import RelatedResources from '@/components/RelatedResources';
import Tab from '@/components/Tabbed/Tab';
import { WORKLOAD_TYPES } from '@/config/types';

const types = [
  TYPES.OPAQUE,
  TYPES.DOCKER_JSON,
  TYPES.TLS,
  TYPES.SSH,
  TYPES.BASIC,
];
const registryAddresses = [
  'DockerHub', 'Quay.io', 'Artifactory', 'Custom'
];

export default {
  components: {
    ResourceTabs,
    KeyValue,
    LabeledInput,
    RelatedResources,
    Tab
  },

  mixins: [CreateEditView],

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    let username;
    let password;
    let registryURL;
    let registryProvider = 'Custom';
    let key;
    let crt;

    if (this.value._type === TYPES.DOCKER_JSON) {
      const json = base64Decode(this.value.data['.dockerconfigjson']);

      const { auths } = JSON.parse(json);

      registryURL = Object.keys(auths)[0];

      if (registryURL === 'index.dockerhub.io/v1/') {
        registryProvider = 'DockerHub';
      } else if (registryURL === 'quay.io') {
        registryProvider = 'Quay.io';
      } else if (registryURL.includes('artifactory')) {
        registryProvider = 'Artifactory';
      }

      username = auths[registryURL].username;
      password = auths[registryURL].password;
    }

    if (this.value._type === TYPES.TLS) {
      // do not show existing key when editing
      key = this.mode === 'edit' ? '' : base64Decode((this.value.data || {})['tls.key']);

      crt = base64Decode((this.value.data || {})['tls.crt']);
    }

    if ( this.value._type === TYPES.BASIC ) {
      username = base64Decode(this.value.data?.username || '');
      password = base64Decode(this.value.data?.password || '');
    }

    if ( this.value._type === TYPES.SSH ) {
      username = base64Decode(this.value.data?.['ssh-publickey'] || '');
      password = base64Decode(this.value.data?.['ssh-privatekey'] || '');
    }

    if (!this.value._type) {
      this.$set(this.value, '_type', TYPES.OPAQUE);
    }

    return {
      types,
      registryAddresses,
      registryProvider,
      username,
      password,
      registryURL,
      key,
      crt,
      relatedServices: [],
    };
  },

  computed:   {
    isCertificate() {
      return this.value._type === TYPES.TLS;
    },

    isRegistry() {
      return this.value._type === TYPES.DOCKER_JSON;
    },

    isSsh() {
      return this.value._type === TYPES.SSH;
    },

    isBasicAuth() {
      return this.value._type === TYPES.BASIC;
    },

    parsedRows() {
      const rows = [];
      const { data = {} } = this.value;

      Object.keys(data).forEach((key) => {
        const value = base64Decode(data[key]);

        rows.push({
          key,
          value
        });
      });

      return rows;
    },

    dockerRows() {
      const auths = JSON.parse(this.parsedRows[0].value).auths;
      const rows = [];

      for (const address in auths) {
        rows.push({
          address,
          username: auths[address].username,
        });
      }

      return rows;
    },

    certRows() {
      let { 'tls.key':key, 'tls.crt': crt } = this.value.data;

      key = base64Decode(key);
      crt = base64Decode(crt);

      return [{ key, crt }];
    },

    dataRows() {
      if (this.value.isRegistry) {
        return this.dockerRows;
      } else if (this.value.isCertificate) {
        return this.certRows;
      }

      return this.parsedRows;
    },

    hasRelatedWorkloads() {
      const { relationships = [] } = this.value.metadata;

      for (const r in relationships) {
        if (r.rel === 'owner' && WORKLOAD_TYPES.includes(r.fromType)) {
          return true;
        }
      }

      return false;
    },
  },
};
</script>

<template>
  <div>
    <div class="spacer" />
    <template v-if="isRegistry || isBasicAuth">
      <div class="row mb-20">
        <div v-if="isRegistry" class="col span-4">
          <LabeledInput v-model="registryURL" :label="t('secret.registry.domainName')" placeholder="e.g. index.docker.io" :mode="mode" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="username" :label="t('secret.registry.username')" :mode="mode" />
        </div>
        <div class="col span-4">
          <LabeledInput :copyable="true" :value="password" type="password" :label="t('secret.registry.password')" :mode="mode" />
        </div>
      </div>
    </template>

    <div v-else-if="isCertificate" class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="key"
          type="multiline-password"
          :label="t('secret.certificate.privateKey')"
          :mode="mode"
          placeholder="Paste in the private key, typically starting with -----BEGIN RSA PRIVATE KEY-----"
          :copyable="true"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="crt"
          :copyable="true"
          type="multiline"
          :label="t('secret.certificate.caCertificate')"
          :mode="mode"
          placeholder="Paste in the CA certificate, starting with -----BEGIN CERTIFICATE----"
        />
      </div>
    </div>

    <template v-else-if="isSsh">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="username"
            :copyable="true"
            type="multiline"
            :label="t('secret.ssh.public')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="password"
            :copyable="true"
            type="multiline-password"
            :label="t('secret.ssh.private')"
            :mode="mode"
          />
        </div>
      </div>
    </template>

    <KeyValue
      v-else
      :title="t('secret.data')"
      :value="parsedRows"
      mode="view"
      :as-map="false"
      :value-multiline="true"
      :value-concealed="true"
    />

    <ResourceTabs ref="tabs" v-model="value" :side-tabs="true" :mode="mode">
      <Tab v-if="hasRelatedWorkloads" name="workloads" :label="t('secret.relatedWorkloads')">
        <RelatedResources :ignore-types="['pod']" :value="value" rel="uses" direction="from" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
