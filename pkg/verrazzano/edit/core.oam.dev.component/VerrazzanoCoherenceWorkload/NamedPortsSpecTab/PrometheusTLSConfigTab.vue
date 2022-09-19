<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretKeySelector from '@pkg/components/SecretKeySelector';
import SecretOrConfigMapSelector from '@pkg/components/SecretOrConfigMapSelector';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'PrometheusTLSConfigTab',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SecretKeySelector,
    SecretOrConfigMapSelector,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      isLoading:    true,
      caType:       'file',
      certType:     'file',
      keyType:      'file'
    };
  },
  computed: {
    typeOptions() {
      return [
        { value: 'file', label: this.t('verrazzano.coherence.types.prometheusTLS.file') },
        { value: 'k8s', label: this.t('verrazzano.coherence.types.prometheusTLS.k8s') },
      ];
    }
  },
  methods: {
    deleteCA() {
      this.setField('ca', undefined);
      this.setField('caFile', undefined);
    },
    deleteCert() {
      this.setField('cert', undefined);
      this.setField('certFile', undefined);
    },
    deleteKey() {
      this.setField('keySecret', undefined);
      this.setField('keyFile', undefined);
    },
    resetOldType(neu, old, fileFieldName, k8sFieldName) {
      if (old === 'file' && neu !== 'file') {
        this.setField(fileFieldName, undefined);
      } else if (old === 'k8s' && neu !== 'k8s') {
        this.setField(k8sFieldName, undefined);
      }
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.serviceMonitor');
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    caType(neu, old) {
      if (!this.isLoading && old) {
        this.resetOldType(neu, old, 'caFile', 'ca');
      }
    },
    certType(neu, old) {
      if (!this.isLoading && old) {
        this.resetOldType(neu, old, 'certFile', 'cert');
      }
    },
    keyType(neu, old) {
      if (!this.isLoading && old) {
        this.resetOldType(neu, old, 'keyFile', 'keySecret');
      }
    },
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <div class="spacer-small" />
          <Checkbox
            :value="getField('insecureSkipVerify')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.tlsConfig.insecureSkipVerify')"
            @input="setBooleanField('insecureSkipVerify', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('serverName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'serverName')"
            :label="t('verrazzano.coherence.fields.tlsConfig.serverName')"
            @input="setFieldIfNotEmpty('serverName', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'ca')" :label="t('verrazzano.coherence.tabs.prometheusCA')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.tabs.prometheusCA')"
            :mode="mode"
            @click="deleteCA()"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                v-model="caType"
                :mode="mode"
                :options="typeOptions"
                option-key="value"
                option-label="label"
                :label="t('verrazzano.coherence.fields.serviceMonitor.caType')"
              />
            </div>
            <div v-if="caType === 'file'" class="col span-4">
              <LabeledInput
                :value="getField('caFile')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'caFile')"
                :label="t('verrazzano.coherence.fields.tlsConfig.caFile')"
                @input="setFieldIfNotEmpty('caFile', $event)"
              />
            </div>
          </div>
          <div v-if="caType === 'k8s'">
            <div class="spacer" />
            <h3>{{ t('verrazzano.coherence.fields.serviceMonitor.caKubernetes') }}</h3>
            <SecretOrConfigMapSelector
              :value="getField('ca')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('ca', $event)"
            />
          </div>
        </template>
      </TreeTab>

      <TreeTab :name="createTabName(treeTabName, 'cert')" :label="t('verrazzano.coherence.tabs.prometheusCert')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.tabs.prometheusCert')"
            :mode="mode"
            @click="deleteCert()"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                v-model="certType"
                :mode="mode"
                :options="typeOptions"
                option-key="value"
                option-label="label"
                :label="t('verrazzano.coherence.fields.serviceMonitor.certType')"
              />
            </div>
            <div v-if="certType === 'file'" class="col span-4">
              <LabeledInput
                :value="getField('certFile')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'certFile')"
                :label="t('verrazzano.coherence.fields.tlsConfig.certFile')"
                @input="setFieldIfNotEmpty('certFile', $event)"
              />
            </div>
          </div>
          <div v-if="certType === 'k8s'">
            <div class="spacer" />
            <h3>{{ t('verrazzano.coherence.fields.serviceMonitor.certKubernetes') }}</h3>
            <SecretOrConfigMapSelector
              :value="getField('cert')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('cert', $event)"
            />
          </div>
        </template>
      </TreeTab>

      <TreeTab :name="createTabName(treeTabName, 'key')" :label="t('verrazzano.coherence.tabs.prometheusKey')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.tabs.prometheusKey')"
            :mode="mode"
            @click="deleteKey()"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                v-model="keyType"
                :mode="mode"
                :options="typeOptions"
                option-key="value"
                option-label="label"
                :label="t('verrazzano.coherence.fields.serviceMonitor.keyType')"
              />
            </div>
            <div v-if="keyType === 'file'" class="col span-4">
              <LabeledInput
                :value="getField('keyFile')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'keyFile')"
                :label="t('verrazzano.coherence.fields.tlsConfig.keyFile')"
                @input="setFieldIfNotEmpty('keyFile', $event)"
              />
            </div>
          </div>
          <div v-if="keyType === 'k8s'">
            <div class="spacer" />
            <h3>{{ t('verrazzano.coherence.fields.serviceMonitor.keyKubernetes') }}</h3>
            <SecretKeySelector
              :value="getField('keySecret')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('keySecret', $event)"
            />
          </div>
        </template>
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
