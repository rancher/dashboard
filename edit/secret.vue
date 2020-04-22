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
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';

const types = [
  { label: 'Certificate', value: TLS },
  { label: 'Registry', value: DOCKER_JSON },
  { label: 'Secret (Opaque)', value: OPAQUE },
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
    Tabbed,
    Tab
  },

  mixins:     [CreateEditView],

  data() {
    const isNamespaced = !!this.value.metadata.namespace;

    let username;
    let password;
    let registryFQDN;

    if (this.value._type === DOCKER_JSON) {
      const json = base64Decode(this.value.data['.dockerconfigjson']);

      const { auths } = JSON.parse(json);

      registryFQDN = Object.keys(auths)[0];

      username = auths[registryFQDN].username;
      password = auths[registryFQDN].password;
    }

    return {
      types,
      isNamespaced,
      registryAddresses,
      newNS:            false,
      registryProvider: registryAddresses[0],
      username,
      password,
      registryFQDN,
      toUpload:         null,
      key:              null,
      cert:             null,
    };
  },
  computed: {
    secretSubType: {
      // when editing a secret with type other than registry, cert, or generic, like 'kubernetes.io/service-account-token', use generic layout
      get() {
        return this.isCertificate ? TLS : this.isRegistry ? DOCKER_JSON : OPAQUE;
      },
      set(neu) {
        this.$set(this.value, '_type', neu);
      }
    },

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

  methods: {
    saveSecret(buttonCb) {
      if (this.isRegistry) {
        const data = { '.dockerconfigjson': base64Encode(this.dockerconfigjson) };

        this.$set(this.value, 'data', data);
      } else if (this.isCertificate) {
        const data = { 'tls.cert': base64Encode(this.cert), 'tls.key': base64Encode(this.key) };

        this.$set(this.value, 'data', data);
      }
      this.save(buttonCb);
    },

    fileUpload(field) {
      this.toUpload = field;
      this.$refs.uploader.click();
    },

    fileChange(event) {
      const input = event.target;
      const handles = input.files;
      const names = [];

      if ( handles ) {
        for ( let i = 0 ; i < handles.length ; i++ ) {
          const reader = new FileReader();

          reader.onload = (loaded) => {
            const value = loaded.target.result;

            this[this.toUpload] = value;
          };

          reader.onerror = (err) => {
            this.$dispatch('growl/fromError', { title: 'Error reading file', err }, { root: true });
          };

          names[i] = handles[i].name;
          reader.readAsText(handles[i]);
        }

        input.value = '';
      }
    },
  }
};
</script>

<template>
  <form>
    <NameNsDescription v-model="value.metadata" :description.sync="description" :mode="mode" :extra-columns="['type']">
      <template v-slot:type>
        <LabeledSelect
          v-model="secretSubType"
          label="Type"
          :options="types"
          :mode="mode"
          :disabled="mode!=='create'"
          taggable
        />
      </template>
    </NameNsDescription>

    <template v-if="isRegistry">
      <div id="registry-type" class="row">
        Provider: &nbsp; <RadioGroup :mode="mode" :style="{'display':'flex'}" :options="registryAddresses" :value="registryProvider" @input="e=>registryProvider = e" />
      </div>
      <div v-if="needsDockerServer" class="row">
        <LabeledInput v-model="registryFQDN" label="Registry Domain Name" placeholder="e.g. index.docker.io" :mode="mode" />
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="username" label="Username" :mode="mode" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="password" label="Password" :mode="mode" />
        </div>
      </div>
    </template>

    <div v-else-if="isCertificate" class="row">
      <div class="col span-6">
        <LabeledInput v-model="key" type="multiline" label="Private Key" :mode="mode" />
        <button type="button" class="btn btn-sm bg-primary mt-10" @click="fileUpload('key')">
          Read from file
        </button>
      </div>
      <div class="col span-6">
        <LabeledInput v-model="cert" type="multiline" label="CA Certificate" :mode="mode" />
        <button type="button" class="btn btn-sm bg-primary mt-10" @click="fileUpload('cert')">
          Read from file
        </button>
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

    <Tabbed default-tab="labels">
      <Tab name="labels" label="Labels">
        <KeyValue
          key="labels"
          v-model="labels"
          :mode="mode"
          title="Labels"
          :initial-empty-row="true"
          :pad-left="false"
          :read-allowed="false"
        />
      </Tab>
      <Tab name="annotations" label="Annotations">
        <KeyValue
          key="annotations"
          v-model="annotations"
          :mode="mode"
          title="Annotations"
          :initial-empty-row="true"
          :pad-left="false"
          :read-allowed="false"
        />
      </Tab>
    </Tabbed>

    <input
      ref="uploader"
      type="file"
      class="hide"
      @change="fileChange"
    />

    <Footer :mode="mode" :errors="errors" @save="saveSecret" @done="done" />
  </form>
</template>

<style>
#registry-type {
  display: flex;
  align-items:center;
}
</style>
