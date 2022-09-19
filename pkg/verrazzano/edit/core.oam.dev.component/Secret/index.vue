// Added by Verrazzano
<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabelsTab from '@pkg/components/LabelsTab';
import SecretHelper from '@pkg/mixins/secret-helper';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

import { HIDE_SENSITIVE } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';

// For now, support these 5 basic types of secrets.
const TYPES = {
  OPAQUE:           'Opaque',
  // SERVICE_ACCT:     'kubernetes.io/service-account-token',
  DOCKER:           'kubernetes.io/dockercfg',
  // DOCKER_JSON:      'kubernetes.io/dockerconfigjson',
  BASIC:            'kubernetes.io/basic-auth',
  SSH:              'kubernetes.io/ssh-auth',
  TLS:              'kubernetes.io/tls',
  // BOOTSTRAP:        'bootstrap.kubernetes.io/token',
  // ISTIO_TLS:        'istio.io/key-and-cert',
  // HELM_RELEASE:     'helm.sh/release.v1',
  // FLEET_CLUSTER:    'fleet.cattle.io/cluster-registration-values',
  // CLOUD_CREDENTIAL: 'provisioning.cattle.io/cloud-credential',
  // RKE_AUTH_CONFIG:  'rke.cattle.io/auth-config'
};

export default {
  name:       'Secret',
  components: {
    LabeledSelect,
    LabeledInput,
    LabelsTab,
    TreeTab,
    TreeTabbed,
  },
  mixins: [SecretHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    return { dataLabel: '' };
  },
  computed: {
    type: {
      get() {
        return this.getWorkloadField('type');
      },
      set(neu) {
        this.setWorkloadFieldIfNotEmpty('type', neu);
      }
    },
    typeKey() {
      switch (this.type) {
      case TYPES.TLS: return 'tls';
      case TYPES.BASIC: return 'basic';
      case TYPES.DOCKER: return 'registry';
      case TYPES.SSH: return 'ssh';
      case TYPES.OPAQUE: return 'generic';
      default: return undefined;
      }
    },
    dataComponent() {
      return require(`./${ this.typeKey }`).default;
    },
    secretOptions() {
      const out = Object.values(TYPES).map((secretType) => {
        return {
          value: secretType,
          label: this.typeDisplay(secretType)
        };
      });

      return sortBy(out, 'label');
    },
    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },
  },
  methods: {
    initSpec() {
      const newSecret = {
        apiVersion: this.secretApiVersion,
        kind:       'Secret',
        metadata:   { namespace: this.value.metadata.namespace },
      };

      this.setField('spec.workload', newSecret );
    },
    getDataLabel() {
      switch (this.type) {
      case TYPES.TLS:
        return this.t('secret.certificate.certificate');
      case TYPES.SSH:
        return this.t('secret.ssh.keys');
      case TYPES.BASIC:
        return this.t('secret.authentication');
      default:
        return this.t('secret.data');
      }
    },
    typeDisplay(type) {
      const fallback = type.replace(/^kubernetes.io\//, '');

      return this.$store.getters['i18n/withFallback'](`secret.types."${ type }"`, null, fallback);
    },
  },
  created() {
    if (!this.value.spec?.workload) {
      this.initSpec();
    }
    this.dataLabel = this.getDataLabel();
  },
  watch: {
    type(neu, old) {
      if (neu !== old) {
        this.setWorkloadFieldIfNotEmpty('data', undefined);
        this.dataLabel = this.getDataLabel();
      }
    },
  },
};
</script>

<template>
  <form class="filled-height">
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="type"
          :options="secretOptions"
          :label="t('verrazzano.common.fields.workloadSecretType')"
          :placeholder="getNotSetPlaceholder(value,'spec.workload.type')"
          :required="true"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <TreeTabbed>
      <template #nestedTabs>
        <TreeTab name="data" :label="dataLabel">
          <template #default>
            <div class="row">
              <div class="col span-6">
                <LabeledInput
                  :value="getWorkloadField('metadata.name')"
                  :mode="mode"
                  required
                  :placeholder="getWorkloadMetadataNotSetPlaceholder('name')"
                  :label="t('verrazzano.common.fields.workloadSecretName')"
                  @input="setWorkloadMetadataFieldIfNotEmpty('name', $event)"
                />
              </div>
            </div>
            <div class="spacer-small" />
            <component
              :is="dataComponent"
              v-if="typeKey"
              :value="value"
              :mode="mode"
              :hide-sensitive-data="hideSensitiveData"
            />
          </template>
        </TreeTab>
        <LabelsTab
          :value="getWorkloadField('metadata')"
          :mode="mode"
          tab-name="labels"
          @input="setWorkloadFieldIfNotEmpty('metadata', $event)"
        />
        <template>
        </template>
      </template>
    </TreeTabbed>
  </form>
</template>

<style lang='scss'>
</style>
