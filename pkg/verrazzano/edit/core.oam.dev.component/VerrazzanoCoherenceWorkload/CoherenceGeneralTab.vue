<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import ImagePullSecrets from '@pkg/components/ImagePullSecrets';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { NAMESPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'CoherenceGeneralTab',
  components: {
    Checkbox,
    ImagePullSecrets,
    LabeledInput,
    LabeledSelect,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      // the VerrazzanoCoherenceWorkload spec
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create',
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
      default: '',
    },
  },
  data() {
    return {
      treeTabName:        this.tabName,
      treeTabLabel:       this.tabLabel,
      allNamespaces:      [],
    };
  },
  async fetch() {
    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };
    const hash = await allHash(requests);

    this.allNamespaces = hash.namespaces;
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.general');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #default>
      <div class="row">
        <div class="col span-9">
          <LabeledInput
            :value="getField('image')"
            :mode="mode"
            :label="t('verrazzano.common.fields.image')"
            :placeholder="getNotSetPlaceholder(value, 'image')"
            @input="setFieldIfNotEmpty('image', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('imagePullPolicy')"
            :mode="mode"
            :options="imagePullPolicyOptions"
            option-key="value"
            option-label="label"
            :close-on-select="false"
            :placeholder="getNotSetPlaceholder(value, 'imagePullPolicy')"
            :label="t('verrazzano.common.fields.imagePullPolicy')"
            @input="setFieldIfNotEmpty('imagePullPolicy', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-9">
          <LabeledInput
            :value="getField('coherenceUtils.image')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.coherenceUtilsImage')"
            :placeholder="getNotSetPlaceholder(value, 'coherenceUtils.image')"
            @input="setFieldIfNotEmpty('coherenceUtils.image', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('coherenceUtils.imagePullPolicy')"
            :mode="mode"
            :options="imagePullPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'coherenceUtils.imagePullPolicy')"
            :label="t('verrazzano.coherence.fields.coherenceUtilsImagePullPolicy')"
            @input="setFieldIfNotEmpty('coherenceUtils.imagePullPolicy', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-9">
          <ImagePullSecrets
            :value="getListField('imagePullSecrets')"
            :mode="mode"
            :namespaced-object="namespacedObject"
            @input="setFieldIfNotEmpty('imagePullSecrets', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('replicas')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'replicas')"
            :label="t('verrazzano.common.fields.replicas')"
            @input="setNumberField('replicas', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('cluster')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'cluster')"
            :label="t('verrazzano.coherence.fields.cluster')"
            @input="setFieldIfNotEmpty('cluster', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('role')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'role')"
            :label="t('verrazzano.coherence.fields.role')"
            @input="setFieldIfNotEmpty('role', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('appLabel')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'appLabel')"
            :label="t('verrazzano.coherence.fields.appLabel')"
            @input="setFieldIfNotEmpty('appLabel', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('versionLabel')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'versionLabel')"
            :label="t('verrazzano.coherence.fields.versionLabel')"
            @input="setFieldIfNotEmpty('versionLabel', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('rackLabel')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'rackLabel')"
            :label="t('verrazzano.coherence.fields.rackLabel')"
            @input="setFieldIfNotEmpty('rackLabel', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('siteLabel')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'siteLabel')"
            :label="t('verrazzano.coherence.fields.siteLabel')"
            @input="setFieldIfNotEmpty('siteLabel', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('serviceAccountName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'serviceAccountName')"
            :label="t('verrazzano.common.fields.podSpec.serviceAccountName')"
            @input="setFieldIfNotEmpty('serviceAccountName', $event)"
          />
        </div>
        <div class="col span-4">
          <Checkbox
            :value="getField('automountServiceAccountToken')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.automountServiceAccountToken')"
            @input="setBooleanField('automountServiceAccountToken', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('enableServiceLinks')"
            :mode="mode"
            :label="t('verrazzano.common.fields.podSpec.enableServiceLinks')"
            @input="setBooleanField('enableServiceLinks', $event)"
          />
        </div>
        <div class="col span-4">
          <Checkbox
            :value="getField('shareProcessNamespace')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.shareProcessNamespace')"
            @input="setBooleanField('shareProcessNamespace', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('hostIPC')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.hostIPC')"
            @input="setBooleanField('hostIPC', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('healthPort')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'healthPort')"
            :label="t('verrazzano.coherence.fields.healthPort')"
            @input="setNumberField('healthPort', $event)"
          />
        </div>
        <div class="col span-4">
          <div class="spacer-small" />
          <Checkbox
            :value="getField('haBeforeUpdate')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.haBeforeUpdate')"
            @input="setBooleanField('haBeforeUpdate', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('operatorRequestTimeout')"
            :mode="mode"
            type="Number"
            :min="0"
            :placeholder="getNotSetPlaceholder(value, 'operatorRequestTimeout')"
            :label="t('verrazzano.coherence.fields.operatorRequestTimeout')"
            @input="setNumberField('operatorRequestTimeout', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('activeDeadlineSeconds')"
            :mode="mode"
            type="Number"
            :min="0"
            :placeholder="getNotSetPlaceholder(value, 'activeDeadlineSeconds')"
            :label="t('verrazzano.coherence.fields.activeDeadlineSeconds')"
            @input="setNumberField('activeDeadlineSeconds', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('suspendServiceTimeout')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'suspendServiceTimeout')"
            :label="t('verrazzano.coherence.field.suspendServiceTimeout')"
            @input="setNumberField('suspendServiceTimeout', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('runtimeClassName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'runtimeClassName')"
            :label="t('verrazzano.coherence.fields.runtimeClassName')"
            @input="setFieldIfNotEmpty('runtimeClassName', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('priorityClassName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'priorityClassName')"
            :label="t('verrazzano.coherence.fields.priorityClassName')"
            @input="setFieldIfNotEmpty('priorityClassName', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('schedulerName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'schedulerName')"
            :label="t('verrazzano.coherence.fields.schedulerName')"
            @input="setFieldIfNotEmpty('schedulerName', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            :value="getField('preemptionPolicy')"
            :mode="mode"
            :options="preemptionPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'preemptionPolicy')"
            :label="t('verrazzano.coherence.fields.preemptionPolicy')"
            @input="setFieldIfNotEmpty('preemptionPolicy', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('restartPolicy')"
            :mode="mode"
            :options="restartPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'restartPolicy')"
            :label="t('verrazzano.coherence.fields.restartPolicy')"
            @input="setFieldIfNotEmpty('restartPolicy', $event)"
          />
        </div>
        <div class="col span-4">
          <Checkbox
            :value="getField('suspendServicesOnShutdown')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.suspendServicesOnShutdown')"
            @input="setBooleanField('suspendServicesOnShutdown', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('resumeServicesOnStartup')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.resumeServicesOnStartup')"
            @input="setBooleanField('resumeServicesOnStartup', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <KeyValue
          :value="getField('autoResumeServices')"
          :mode="mode"
          :title="t('verrazzano.coherence.titles.autoResumeServices')"
          :add-label="t('verrazzano.coherence.buttons.addAutoResumeServiceSetting')"
          @input="setFieldIfNotEmpty('autoResumeServices', $event)"
        />
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
