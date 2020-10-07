<script>
import { TYPES } from '@/models/secret';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import ResourceTabs from '@/components/form/ResourceTabs';
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';

const types = [
  { label: 'Opaque', value: TYPES.OPAQUE },
  { label: 'Registry', value: TYPES.DOCKER_JSON },
  { label: 'Certificate', value: TYPES.TLS },
  { label: 'SSH Key', value: TYPES.SSH },
  { label: 'HTTP Basic Auth', value: TYPES.BASIC },
];
const registryAddresses = [
  'DockerHub', 'Quay.io', 'Artifactory', 'Custom'
];

export default {
  name: 'CruSecret',

  components: {
    KeyValue,
    FileSelector,
    Footer,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    NameNsDescription,
    ResourceTabs
  },

  mixins: [CreateEditView],

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
    };
  },

  computed: {
    dockerconfigjson() {
      let dockerServer = this.registryProvider === 'DockerHub' ? 'index.dockerhub.io/v1/' : 'quay.io';

      if (this.needsDockerServer) {
        dockerServer = this.registryURL;
      }

      if (this.isRegistry && dockerServer) {
        const config = {
          auths: {
            [dockerServer]: {
              username: this.username,
              password: this.password,
            }
          }
        };
        const json = JSON.stringify(config);

        return json;
      } else {
        return null;
      }
    },

    namespaces() {
      return this.$store.getters['cluster/all'](NAMESPACE).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },

    isSsh() {
      return this.value._type === TYPES.SSH;
    },

    isBasicAuth() {
      return this.value._type === TYPES.BASIC;
    },

    isCertificate() {
      return this.value._type === TYPES.TLS;
    },

    isRegistry() {
      return this.value._type === TYPES.DOCKER_JSON;
    },

    needsDockerServer() {
      return this.registryProvider === 'Artifactory' || this.registryProvider === 'Custom';
    }
  },

  watch: { 'value.data': () => {} },

  methods: {
    saveSecret(buttonCb) {
      if (this.isRegistry) {
        const data = { '.dockerconfigjson': base64Encode(this.dockerconfigjson) };

        this.$set(this.value, 'data', data);
      } else if (this.isCertificate) {
        let keyToSave;

        // use preexisting key if no new one was provided while editing
        if (this.mode === 'edit' && !this.key.length) {
          keyToSave = (this.value.data || {})['tls.key'];
        } else {
          keyToSave = base64Encode(this.key);
        }
        const data = { 'tls.crt': base64Encode(this.crt), 'tls.key': keyToSave };

        this.$set(this.value, 'data', data);
      } else if ( this.isBasicAuth ) {
        const data = {
          username: base64Encode(this.username),
          password: base64Encode(this.password),
        };

        this.$set(this.value, 'data', data);
      } else if ( this.isSsh ) {
        const data = {
          'ssh-publickey':  base64Encode(this.username),
          'ssh-privatekey':  base64Encode(this.password),
        };

        this.$set(this.value, 'data', data);
      }

      this.save(buttonCb);
    },
    onKeySelected:      createOnSelected('key'),
    onCrtSelected:      createOnSelected('crt'),
    onUsernameSelected: createOnSelected('username'),
    onPasswordSelected: createOnSelected('password'),
  }
};
</script>

<template>
  <form>
    <NameNsDescription v-model="value" :mode="mode" :extra-columns="['type']">
      <template v-slot:type>
        <LabeledSelect
          v-model="value._type"
          :label="t('secret.type')"
          :options="types"
          :mode="mode"
          :disabled="mode!=='create'"
          :taggable="true"
          :create-option="opt=>opt"
        />
      </template>
    </NameNsDescription>

    <div class="spacer"></div>

    <template v-if="isRegistry">
      <div id="registry-type" class="row mb-10">
        <RadioGroup
          v-model="registryProvider"
          name="registryProvider"
          :label="t('secret.registry.address')"
          :mode="mode"
          :options="registryAddresses"
        />
      </div>
      <div v-if="needsDockerServer" class="row mb-20">
        <LabeledInput v-model="registryURL" :label="t('secret.registry.domainName')" placeholder="e.g. index.docker.io" :mode="mode" />
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="username" :label="t('secret.registry.username')" :mode="mode" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="password" :label="t('secret.registry.password')" :mode="mode" type="password" />
        </div>
      </div>
    </template>

    <div v-else-if="isCertificate" class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="key"
          type="multiline"
          :label="t('secret.certificate.privateKey')"
          :mode="mode"
          placeholder="Paste in the private key, typically starting with -----BEGIN RSA PRIVATE KEY-----"
        />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onKeySelected" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="crt" type="multiline" :label="t('secret.certificate.caCertificate')" :mode="mode" placeholder="Paste in the CA certificate, starting with -----BEGIN CERTIFICATE----" />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCrtSelected" />
      </div>
    </div>

    <template v-else-if="isBasicAuth">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="username" :label="t('secret.basic.username')" :mode="mode" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="password" :label="t('secret.basic.password')" :mode="mode" type="password" />
        </div>
      </div>
    </template>

    <template v-else-if="isSsh">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="username"
            type="multiline"
            :label="t('secret.ssh.public')"
            :mode="mode"
            placeholder="Paste in your public key"
          />
          <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onUsernameSelected" />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="password"
            type="multiline"
            :label="t('secret.ssh.private')"
            :mode="mode"
            placeholder="Paste in your private key"
          />
          <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onPasswordSelected" />
        </div>
      </div>
    </template>

    <div v-else class="row">
      <KeyValue
        key="data"
        v-model="value.data"
        :mode="mode"
        title="Data"
        :initial-empty-row="true"
        :value-base64="true"
        read-icon=""
        add-icon=""
      />
    </div>
    <div class="spacer"></div>
    <ResourceTabs v-if="!isView" v-model="value" :mode="mode" />

    <Footer :mode="mode" :errors="errors" @save="saveSecret" @done="done" />
  </form>
</template>

<style lang='scss'>
</style>
