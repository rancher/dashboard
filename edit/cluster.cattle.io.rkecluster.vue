<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import NameNsDescription from '@/components/form/NameNsDescription';
import Checkbox from '@/components/form/Checkbox';
import Tab from '@/components/Tabbed/Tab';
import Credential from '@/components/cluster/Credential';
import { CAPI, MANAGEMENT, SECRET } from '@/config/types';
import { nlToBr } from '@/utils/string';
import { sortable } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    NameNsDescription,
    CruResource,
    Loading,
    Tabbed,
    Tab,
    Credential,
    LabeledInput,
    LabeledSelect,
    Checkbox,
    ArrayListGrouped,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:    String,
      default: null,
    }
  },

  async fetch() {
    const setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'k8s-version-to-images' });

    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
    this.versions = Object.keys(JSON.parse(setting.value));

    if ( !this.value.spec.kubernetesVersion ) {
      this.value.spec.kubernetesVersion = this.versionOptions[0].value;
    }

    if ( !this.value.spec.nodePools?.length ) {
      this.value.spec.nodePools = [this.emptyNodePool()];
    }

    this.allNodeConfigs = await this.$store.dispatch('management/findAll', { type: `node-config.cattle.io.${ this.provider }config` });
  },

  data() {
    return {
      allSecrets:     null,
      allNodeConfigs: null,
      nodeComponent:  null,
      credentialId:   null,
      credential:     null,
    };
  },

  computed: {
    credentialOptions() {
      // @TODO better thing to filter by, better display name
      return this.allSecrets.filter((obj) => {
        return obj.metadata.namespace === this.value.metadata.namespace && obj.metadata.generateName === 'cc-';
      });
    },

    versionOptions() {
      try {
        const out = sortBy(this.versions.map((v) => {
          return {
            label: v,
            value: v,
            sort:  sortable(v)
          };
        }), 'sort:desc');

        // @TODO add existing version on edit if it's missing

        return out;
      } catch (err) {
        this.$store.dispatch('growl/fromError', { err });

        return [];
      }
    },

    nodeConfigOptions() {
      return this.allNodeConfigs.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.metadata.name
        };
      });
    },
  },

  watch: {
    credentialId(val) {
      if ( val ) {
        this.credential = this.$store.getters['management/byId'](SECRET, this.credentialId);

        if ( this.credential ) {
          this.value.spec.cloudCredentialSecretName = this.credential.metadata.name;
        } else {
          this.value.spec.cloudCredentialSecretName = null;
        }
      }
    },
  },

  methods: {
    nlToBr,

    emptyNodePool() {
      const schema = this.$store.getters['management/schemaFor'](`node-config.cattle.io.${ this.provider }config`);

      return {
        name:           '',
        controlPlane:   true,
        etcd:           true,
        worker:         true,
        hostnamePrefix: '',
        quantity:       1,
        nodeConfig:     {
          apiVersion: `${ schema.attributes.group }/${ schema.attributes.version }`,
          kind:       schema.attributes.kind,
          name:       null,
        },
      };
    },

    async save(btnCb) {
      try {
        await this.value.save();

        const schema = this.value.schema;

        const capiCluster = await this.$store.dispatch(`management/create`, {
          type:     CAPI.CAPI_CLUSTER,
          metadata: {
            name:      this.value.metadata.name,
            namespace: this.value.metadata.namespace,
          },
          spec: {
            infrastructureRef: {
              apiVersion: `${ schema.attributes.group }/${ schema.attributes.version }`,
              kind:       schema.attributes.kind,
              name:       this.value.metadata.name,
            }
          }
        });

        await capiCluster.save();

        btnCb(true);
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        btnCb(false);
      }
    },

    validationPassed() {
      return !!this.credentialId;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="validationPassed()"
    :resource="value"
    :errors="errors"
    :done-route="doneRoute"
    @finish="save"
    @error="e=>errors = e"
  >
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />
    <Tabbed :side-tabs="true">
      <Tab name="credential" label="Credentials" :weight="10">
        <Credential
          v-model="credentialId"
          :mode="mode"
          :provider="provider"
        />
      </Tab>
      <Tab name="pools" label="Node Pools" :weight="9">
        <ArrayListGrouped
          v-if="credentialId"
          v-model="value.spec.nodePools"
          :default-add-value="emptyNodePool()"
          add-label="Add Node Pool"
        >
          <template #default="{row}">
            <div class="row">
              <div class="col span-4">
                <LabeledInput v-model="row.value.name" label="Pool Name" />
              </div>
              <div class="col span-2">
                <LabeledInput v-model="row.value.quantity" label="Node Count" type="number" min="0" />
              </div>
              <div class="col span-6 pt-20">
                <Checkbox v-model="row.value.etcd" label="etcd" />
                <Checkbox v-model="row.value.controlPlane" label="Control Plane" />
                <Checkbox v-model="row.value.worker" label="Worker" />
              </div>
            </div>

            <div class="spacer" />

            <div class="row">
              <div class="col span-6">
                <LabeledSelect
                  v-model="row.value.nodeConfig.name"
                  :options="nodeConfigOptions"
                  label="Node Config"
                />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="row.value.hostnamePrefix" label="Node Hostname Prefix" />
              </div>
            </div>
          </template>
        </ArrayListGrouped>
        <div v-else>
          Select a credential first...
        </div>
      </Tab>
      <Tab name="cluster" label="Cluster Options" :weight="8">
        <LabeledSelect
          v-model="value.spec.kubernetesVersion"
          :options="versionOptions"
          label-key="cluster.kubernetesVersion.label"
        />

        Other options... probably more tabs to organize them...
      </Tab>
      <Tab name="debug" label="(Debug)">
        <pre><code v-html="nlToBr(JSON.stringify(value, null, 2))" /></pre>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
