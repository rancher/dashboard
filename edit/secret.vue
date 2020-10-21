<script>
import { TYPES, DISPLAY_TYPES } from '@/models/secret';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import NameNsDescription from '@/components/form/NameNsDescription';
import ResourceTabs from '@/components/form/ResourceTabs';
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import CruResource from '@/components/CruResource';
import { _CREATE } from '@/config/query-params';
import Tab from '@/components/Tabbed/Tab';
import Labels from '@/components/form/Labels';

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

const VALID_DATA_KEY = /^[-._a-zA-Z0-9]*$/;

export default {
  name: 'CruSecret',

  components: {
    KeyValue,
    FileSelector,
    LabeledInput,
    RadioGroup,
    NameNsDescription,
    ResourceTabs,
    CruResource,
    Tab,
    Labels
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

    if (!this.value._type && this.mode !== _CREATE) {
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

    // array of id, label, description, initials for type selection step
    secretSubTypes() {
      const out = [];

      this.types.forEach((type) => {
        const subtype = {
          id:          type,
          label:       DISPLAY_TYPES[type] || '',
          bannerAbbrv: this.initialDisplayFor(type)
        };

        out.push(subtype);
      });

      return out;
    },

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

  methods: {
    fileModifier(name, value) {
      if (!VALID_DATA_KEY.test(name)) {
        name = name
          .split('')
          .map(c => VALID_DATA_KEY.test(c) ? c : '_')
          .join('');
      }

      return { name, value };
    },

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

    selectType(type) {
      this.$set(this.value, '_type', type);
    },

    // TODO icons for secret types?
    initialDisplayFor(type) {
      const typeDisplay = DISPLAY_TYPES[type];

      return typeDisplay.split('').filter(letter => letter.match(/[A-Z]/)).join('');
    },

    onKeySelected:      createOnSelected('key'),
    onCrtSelected:      createOnSelected('crt'),
    onUsernameSelected: createOnSelected('username'),
    onPasswordSelected: createOnSelected('password'),
  },
};
</script>

<template>
  <form>
    <CruResource
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="value._type"
      :resource="value"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="secretSubTypes"
      @finish="saveSecret"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <NameNsDescription v-model="value" :mode="mode" />

      <div class="spacer"></div>
      <ResourceTabs v-if="!isView" v-model="value" :side-tabs="true" :mode="mode">
        <Tab name="data" label="Data">
          <template v-if="isRegistry">
            <div id="registry-type" class="row mb-10">
              <div class="col span-12">
                <h3>
                  {{ t('secret.registry.address') }}
                </h3>
                <RadioGroup
                  v-model="registryProvider"
                  name="registryProvider"
                  :mode="mode"
                  :options="registryAddresses"
                />
              </div>
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
              :file-modifier="fileModifier"
              read-icon=""
              add-icon=""
            />
          </div>
        </Tab>
        <Tab name="labels" :label="t('generic.labelsAndAnnotations')">
          <Labels v-model="value" :mode="mode" />
        </Tab>
      </ResourceTabs>
    </CruResource>
  </form>
</template>

<style lang='scss'>
</style>
