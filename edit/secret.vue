<script>
import { DOCKER_JSON, OPAQUE, TLS } from '@/models/secret';
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
import ReadFile from '@/components/form/ReadFile';

const types = [
  { label: 'Certificate', value: TLS },
  { label: 'Registry', value: DOCKER_JSON },
  { label: 'Opaque', value: OPAQUE },
];
const registryAddresses = [
  'DockerHub', 'Quay.io', 'Artifactory', 'Custom'
];

export default {
  name: 'CruSecret',

  components: {
    KeyValue,
    Footer,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    NameNsDescription,
    ResourceTabs,
    ReadFile
  },

  mixins: [CreateEditView],

  data() {
    const isNamespaced = !!this.value.metadata.namespace;

    let username;
    let password;
    let registryFQDN;
    let registryProvider = 'Custom';
    let key;
    let crt;

    if (this.value._type === DOCKER_JSON) {
      const json = base64Decode(this.value.data['.dockerconfigjson']);

      const { auths } = JSON.parse(json);

      registryFQDN = Object.keys(auths)[0];

      if (registryFQDN === 'index.dockerhub.io/v1/') {
        registryProvider = 'DockerHub';
      } else if (registryFQDN === 'quay.io') {
        registryProvider = 'Quay.io';
      }

      username = auths[registryFQDN].username;
      password = auths[registryFQDN].password;
    }

    if (this.value._type === TLS) {
      // do not show existing key when editing
      key = this.mode === 'edit' ? '' : base64Decode((this.value.data || {})['tls.key']);

      crt = base64Decode((this.value.data || {})['tls.crt']);
    }

    if (!this.value._type) {
      this.$set(this.value, '_type', OPAQUE);
    }

    return {
      types,
      isNamespaced,
      registryAddresses,
      newNS: false,
      registryProvider,
      username,
      password,
      registryFQDN,
      key,
      crt,
    };
  },

  computed: {
    dockerconfigjson() {
      let dockerServer = this.registryProvider === 'DockerHub' ? 'index.dockerhub.io/v1/' : 'quay.io';

      if (this.needsDockerServer) {
        dockerServer = this.registryFQDN;
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

    isCertificate() {
      return this.value._type === TLS;
    },

    isRegistry() {
      return this.value._type === DOCKER_JSON;
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
      }
      this.save(buttonCb);
    },

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
      <div id="registry-type" class="row">
        <RadioGroup label="Address:" :mode="mode" :options="registryAddresses" :value="registryProvider" @input="e=>registryProvider = e" />
      </div>
      <div v-if="needsDockerServer" class="row">
        <LabeledInput v-model="registryFQDN" :label="t('secret.registry.domainName')" placeholder="e.g. index.docker.io" :mode="mode" />
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="username" :label="t('secret.registry.username')" :mode="mode" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="password" :label="t('secret.registry.password')" :mode="mode" type="password" />
        </div>
      </div>
    </template>

    <div v-else-if="isCertificate" class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="key"
          type="multiline"
          :label="t('secret.certificate.privateKey')"
          :mode="mode"
          placeholder="Paste in the private key, typically starting with -----BEGIN RSA PRIVATE KEY-----"
        />
        <ReadFile :multiple="false" @input="e=>key = e.value" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="crt" type="multiline" :label="t('secret.certificate.caCertificate')" :mode="mode" placeholder="Paste in the CA certificate, starting with -----BEGIN CERTIFICATE----" />
        <ReadFile :multiple="false" @input="e=>crt = e.value" />
      </div>
    </div>

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
    <ResourceTabs v-model="value" :mode="mode" />

    <Footer :mode="mode" :errors="errors" @save="saveSecret" @done="done" />
  </form>
</template>

<style lang='scss'>
</style>
