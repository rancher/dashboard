<script>
import { _CREATE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import { KUBEWARDEN } from '../../../types';

import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

export default {
  name: 'General',

  inject: ['chartType'],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    targetNamespace: {
      type:     String,
      required: true
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    NameNsDescription,
    LabeledInput,
    LabeledSelect,
    RadioGroup
  },

  async fetch() {
    this.policyServers = await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.POLICY_SERVER });

    if ( this.isGlobal ) {
      set(this.policy, 'ignoreRancherNamespaces', this.hasNamespaceSelector);
    }
  },

  data() {
    let policy = null;

    if ( this.value.policy ) {
      policy = this.value.policy;
    } else {
      policy = this.value;
    }

    return { policyServers: [], policy };
  },

  computed: {
    hasNamespaceSelector() {
      if ( !this.isCreate ) {
        return this.value.policy.namespaceSelector;
      }

      return true;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isGlobal() {
      return this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    },

    modeDisabled() {
      // Kubewarden doesn't allow switching a policy from 'protect' to 'monitor'
      if ( !this.isCreate ) {
        return this.policy.spec.mode === 'protect';
      }

      return false;
    },

    policyServerOptions() {
      if ( this.policyServers?.length > 0 ) {
        const out = [];

        this.policyServers.map(p => out.push(p.id));

        return out;
      }

      return this.policyServers || [];
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          :mode="mode"
          :value="policy"
          :description-hidden="true"
          :namespaced="!isGlobal"
          name-key="metadata.name"
          namespace-key="metadata.namespace"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="policy.spec.policyServer"
          :value="value"
          :mode="mode"
          :options="policyServerOptions"
          :label="t('kubewarden.policyConfig.serverSelect.label')"
          :tooltip="t('kubewarden.policyConfig.serverSelect.tooltip')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="policy.spec.module"
          :mode="mode"
          :label="t('kubewarden.policyConfig.module.label')"
          :tooltip="t('kubewarden.policyConfig.module.tooltip')"
          :required="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="policy.spec.mutating"
          name="mutating"
          :options="[false, true]"
          :mode="mode"
          :label="t('kubewarden.policyConfig.mutating.label')"
          :labels="['No', 'Yes']"
          :tooltip="t('kubewarden.policyConfig.mutating.tooltip')"
          required
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="policy.spec.mode"
          name="mode"
          :disabled="modeDisabled"
          :options="['monitor', 'protect']"
          :mode="mode"
          :label="t('kubewarden.policyConfig.mode.label')"
          :labels="['Monitor', 'Protect']"
          :tooltip="t('kubewarden.policyConfig.mode.tooltip')"
        />
      </div>
    </div>
    <template v-if="isGlobal">
      <div class="row mb-20">
        <div class="col span-6">
          <RadioGroup
            v-model="policy.ignoreRancherNamespaces"
            name="ignoreRancherNamespaces"
            :options="[true, false]"
            :mode="mode"
            :label="t('kubewarden.policyConfig.ignoreRancherNamespaces.label')"
            :labels="['Yes', 'No']"
            :tooltip="t('kubewarden.policyConfig.ignoreRancherNamespaces.tooltip')"
          />
        </div>
      </div>
    </template>
  </div>
</template>
