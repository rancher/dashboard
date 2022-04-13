<script>
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { base64Decode } from '@shell/utils/crypto';
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import DetailText from '@shell/components/DetailText';
import Tab from '@shell/components/Tabbed/Tab';

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
    DetailText,
    Tab,
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
    let registryUrl;
    let registryProvider = 'Custom';
    let key;
    let crt;

    if (this.value._type === TYPES.DOCKER_JSON) {
      const json = base64Decode(this.value.data['.dockerconfigjson']);

      const { auths } = JSON.parse(json);

      registryUrl = Object.keys(auths)[0];

      if (registryUrl === 'index.docker.io/v1/') {
        registryProvider = 'DockerHub';
      } else if (registryUrl === 'quay.io') {
        registryProvider = 'Quay.io';
      } else if (registryUrl.includes('artifactory')) {
        registryProvider = 'Artifactory';
      }

      username = auths[registryUrl].username;
      password = auths[registryUrl].password;
    }

    const data = this.value?.data || {};

    if (this.value._type === TYPES.TLS) {
      // do not show existing key when editing
      key = this.mode === 'edit' ? '' : base64Decode(data['tls.key']);

      crt = base64Decode(data['tls.crt']);
    }

    if (this.value._type === TYPES.SERVICE_ACCT) {
      key = base64Decode(data['token']);
      crt = base64Decode(data['ca.crt']);
    }

    if ( this.value._type === TYPES.BASIC ) {
      username = base64Decode(data.username || '');
      password = base64Decode(data.password || '');
    }

    if ( this.value._type === TYPES.SSH ) {
      username = base64Decode(data['ssh-publickey'] || '');
      password = base64Decode(data['ssh-privatekey'] || '');
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
      registryUrl,
      key,
      crt,
      relatedServices: [],
    };
  },

  computed:   {
    isCertificate() {
      return this.value._type === TYPES.TLS;
    },

    isSvcAcctToken() {
      return this.value._type === TYPES.SERVICE_ACCT;
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

    dataLabel() {
      switch (this.value._type) {
      case TYPES.TLS:
        return this.t('secret.certificate.certificate');
      case TYPES.SSH:
        return this.t('secret.ssh.keys');
      case TYPES.BASIC:
        return this.t('secret.authentication');
      default:
        return this.t('secret.data');
      }
    }
  },
};
</script>

<template>
  <ResourceTabs v-model="value" :mode="mode">
    <Tab name="data" :label="dataLabel">
      <template v-if="isRegistry || isBasicAuth">
        <div v-if="isRegistry" class="row">
          <div class="col span-12">
            <DetailText :value="registryUrl" label-key="secret.registry.domainName">
            </detailtext>
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-6">
            <DetailText :value="username" label-key="secret.registry.username" />
          </div>
          <div class="col span-6">
            <DetailText :value="password" label-key="secret.registry.password" :conceal="true" />
          </div>
        </div>
      </template>

      <div v-else-if="isCertificate" class="row">
        <div class="col span-6">
          <DetailText :value="key" label-key="secret.certificate.privateKey" :conceal="true" />
        </div>
        <div class="col span-6">
          <DetailText :value="crt" label-key="secret.certificate.certificate" />
        </div>
      </div>

      <div v-else-if="isSvcAcctToken" class="row">
        <div class="col span-6">
          <DetailText :value="crt" label-key="secret.serviceAcct.ca" />
        </div>
        <div class="col span-6">
          <DetailText :value="key" label-key="secret.serviceAcct.token" :conceal="true" />
        </div>
      </div>

      <div v-else-if="isSsh" class="row">
        <div class="col span-6">
          <DetailText :value="username" label-key="secret.ssh.public" />
        </div>
        <div class="col span-6">
          <DetailText :value="password" label-key="secret.ssh.private" :conceal="true" />
        </div>
      </div>

      <div v-else>
        <div v-for="(row,idx) in parsedRows" :key="idx" class="entry">
          <DetailText :value="row.value" :label="row.key" :conceal="true" />
        </div>
        <div v-if="!parsedRows.length">
          <div v-t="'sortableTable.noRows'" class="m-20 text-center" />
        </div>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
  .entry {
    margin-top: 10px;

    &:first-of-type {
      margin-top: 0;
    }
  }
</style>
