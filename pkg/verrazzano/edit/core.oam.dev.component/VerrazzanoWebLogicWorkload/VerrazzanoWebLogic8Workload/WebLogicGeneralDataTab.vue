<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import ImagePullSecrets from '@pkg/components/ImagePullSecrets';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

import { NAMESPACE, SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'WebLogicGeneralDataTab',
  components: {
    Checkbox,
    ImagePullSecrets,
    LabeledInput,
    LabeledSelect,
    TreeTab,
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      // the root VerrazzanoWebLogicWorkload template object
      // this allows us to access both the metadata and spec structures from the template.
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true,
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:        this.tabName,
      treeTabLabel:       this.tabLabel,
      fetchInProgress:    true,
      allNamespaces:      [],
      allSecrets:         {},
      secrets:            [],
    };
  },
  async fetch() {
    this.allSecrets = {};

    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    if (this.$store.getters['cluster/schemaFor'](SECRET)) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    if (hash.namespaces) {
      this.allNamespaces = hash.namespaces;
    }

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    domainHomeSourceTypeOptions() {
      return [
        { value: 'FromModel', label: this.t('verrazzano.weblogic.types.domainHomeSourceType.modelInImage') },
        { value: 'Image', label: this.t('verrazzano.weblogic.types.domainHomeSourceType.image') },
        { value: 'PersistentVolume', label: this.t('verrazzano.weblogic.types.domainHomeSourceType.domainOnPV') },
      ];
    },
    isLogHomeEnabled() {
      return this.getField('spec.logHomeEnabled');
    }
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    },
    setDomainUID(value) {
      this.setFieldIfNotEmpty('metadata.labels.weblogic.domainUID', value);
      this.setFieldIfNotEmpty('spec.domainUID', value);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.general');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #default>
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('metadata.name')"
              :mode="mode"
              required
              :placeholder="getNotSetPlaceholder(value,'metadata.name')"
              :label="t('verrazzano.common.fields.name')"
              @input="setFieldIfNotEmpty('metadata.name', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('metadata.namespace')"
              :mode="mode"
              :options="allNamespaces"
              option-label="metadata.name"
              :reduce="namespace => namespace.metadata.name"
              :placeholder="getNotSetPlaceholder(value,'metadata.namespace')"
              :label="t('verrazzano.common.fields.namespace')"
              @input="setField('metadata.namespace', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.introspectVersion')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.introspectVersion')"
              :label="t('verrazzano.weblogic.fields.introspectVersion')"
              @input="setFieldIfNotEmpty('spec.introspectVersion', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <h3>{{ t('verrazzano.common.titles.image') }}</h3>
        <div class="row">
          <div class="col span-9">
            <LabeledInput
              :value="getField('spec.image')"
              :mode="mode"
              required
              :placeholder="getNotSetPlaceholder(value, 'spec.image')"
              :label="t('verrazzano.common.fields.image')"
              @input="setFieldIfNotEmpty('spec.image', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledSelect
              :value="getField('spec.imagePullPolicy')"
              :mode="mode"
              :options="imagePullPolicyOptions"
              option-key="value"
              :placeholder="getNotSetPlaceholder(value, 'spec.imagePullPolicy')"
              :label="t('verrazzano.common.fields.imagePullPolicy')"
              @input="setFieldIfNotEmpty('spec.imagePullPolicy', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <ImagePullSecrets
              :value="getListField('spec.imagePullSecrets')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('spec.imagePullSecrets', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <h3>{{ t('verrazzano.weblogic.titles.domainSettings') }}</h3>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.domainUID')"
              :mode="mode"
              required
              :placeholder="getNotSetPlaceholder(value, 'spec.domainUID')"
              :label="t('verrazzano.weblogic.fields.domainUID')"
              @input="setDomainUID($event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('spec.domainHomeSourceType')"
              :mode="mode"
              required
              :options="domainHomeSourceTypeOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value,'spec.domainHomeSourceType')"
              :label="t('verrazzano.weblogic.fields.domainHomeSourceType')"
              @input="setFieldIfNotEmpty('spec.domainHomeSourceType', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('spec.webLogicCredentialsSecret.name')"
              :mode="mode"
              required
              :options="secrets"
              option-label="metadata.name"
              :reduce="secret => secret.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'spec.webLogicCredentialsSecret.name')"
              :label="t('verrazzano.weblogic.fields.webLogicCredentialsSecret')"
              @input="setFieldIfNotEmpty('spec.webLogicCredentialsSecret.name', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              :value="getField('spec.domainHome')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.domainHome')"
              :label="t('verrazzano.weblogic.fields.domainHome')"
              @input="setFieldIfNotEmpty('spec.domainHome', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <h3>{{ t('verrazzano.weblogic.titles.advanced') }}</h3>
        <div class="row">
          <div class="col span-6">
            <Checkbox
              :value="getField('spec.logHomeEnabled')"
              :mode="mode"
              :label="t('verrazzano.weblogic.fields.logHomeEnabled')"
              @input="setBooleanField('spec.logHomeEnabled', $event)"
            />
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('spec.httpAccessLogInLogHome')"
              :mode="mode"
              :label="t('verrazzano.weblogic.fields.httpAccessLogInLogHome')"
              @input="setBooleanField('spec.httpAccessLogInLogHome', $event)"
            />
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('spec.includeServerOutInPodLog')"
              :mode="mode"
              :label="t('verrazzano.weblogic.fields.includeServerOutInPodLog')"
              @input="setBooleanField('spec.includeServerOutInPodLog', $event)"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-if="isLogHomeEnabled"
              :value="getField('spec.logHome')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.logHome')"
              :label="t('verrazzano.weblogic.fields.logHome')"
              @input="setFieldIfNotEmpty('spec.logHome', $event)"
            />
            <div class="spacer-tiny" />
            <LabeledInput
              :value="getField('spec.dataHome')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.dataHome')"
              :label="t('verrazzano.weblogic.fields.dataHome')"
              @input="setFieldIfNotEmpty('spec.dataHome', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <h4>{{ t('verrazzano.weblogic.titles.domainLifecycleSettings') }}</h4>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.replicas')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'spec.replicas')"
              :label="t('verrazzano.common.fields.replicas')"
              @input="setFieldIfNotEmpty('spec.replicas', $event)"
            />
          </div>
          <div class="col span-2" />
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.restartVersion')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.restartVersion')"
              :label="t('verrazzano.weblogic.fields.restartVersion')"
              @input="setFieldIfNotEmpty('spec.restartVersion', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('spec.serverStartPolicy')"
              :mode="mode"
              :options="serverStartPolicyOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'spec.serverStartPolicy')"
              :label="t('verrazzano.weblogic.fields.serverStartPolicy')"
              @input="setFieldIfNotEmpty('spec.serverStartPolicy', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('spec.serverStartState')"
              :mode="mode"
              :options="serverStartStateOptions"
              option-label="label"
              option-key="value"
              :placeholder="getNotSetPlaceholder(value, 'spec.serverStartState')"
              :label="t('verrazzano.weblogic.fields.serverStartState')"
              @input="setFieldIfNotEmpty('spec.serverStartState', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.maxClusterConcurrentStartup')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'spec.maxClusterConcurrentStartup')"
              :label="t('verrazzano.weblogic.fields.maxClusterConcurrentStartup')"
              @input="setFieldIfNotEmpty('spec.maxClusterConcurrentStartup', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.maxClusterConcurrentShutdown')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'spec.maxClusterConcurrentShutdown')"
              :label="t('verrazzano.weblogic.fields.maxClusterConcurrentShutdown')"
              @input="setFieldIfNotEmpty('spec.maxClusterConcurrentShutdown', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('spec.livenessProbeCustomScript')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'spec.livenessProbeCustomScript')"
              :label="t('verrazzano.weblogic.fields.livenessProbeCustomScript')"
              @input="setFieldIfNotEmpty('spec.livenessProbeCustomScript', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
