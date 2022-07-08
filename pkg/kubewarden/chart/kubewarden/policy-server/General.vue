<script>
import { _CREATE } from '@shell/config/query-params';
import { SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

import NameNsDescription from '@shell/components/form/NameNsDescription';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio/RadioGroup';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    LabeledInput, NameNsDescription, RadioGroup, ServiceNameSelect
  },

  async fetch() {
    const serviceAccountSchema = await this.$store.getters['cluster/schemaFor'](SERVICE_ACCOUNT);
    const requests = {};

    // Only fetch types if the user can see them
    if ( serviceAccountSchema ) {
      Object.assign(requests, { serviceAccount: SERVICE_ACCOUNT });

      requests.serviceAccount = this.$store.dispatch('cluster/findAll', { type: SERVICE_ACCOUNT });
    }

    const hash = await allHash(requests);

    this.serviceAccounts = hash.serviceAccount || [];
  },

  data() {
    return {
      defaultImage:          true,
      defaultServiceAccount: this.value?.spec?.serviceAccountName || null,
      serviceAccounts:       [],
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    namespacedServiceNames() {
      if ( this.selectedNamespace ) {
        return this.serviceAccounts.filter(s => s.metadata.namespace === this.selectedNamespace);
      }

      return this.serviceAccounts;
    },
  }
};
</script>

<template>
  <div>
    <div class="row mt-10">
      <div class="col span-12">
        <NameNsDescription
          :mode="mode"
          :value="value"
          :namespaced="false"
          :description-hidden="true"
          name-key="metadata.name"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="defaultImage"
          name="defaultImage"
          :options="[true, false]"
          :mode="mode"
          class="mb-10"
          :label="t('kubewarden.policyServerConfig.defaultImage.label')"
          :labels="['Yes', 'No']"
          :tooltip="t('kubewarden.policyServerConfig.defaultImage.tooltip')"
        />
        <template v-if="!defaultImage">
          <LabeledInput
            v-model="value.spec.image"
            :mode="mode"
            :label="t('kubewarden.policyServerConfig.image.label')"
            :tooltip="t('kubewarden.policyServerConfig.image.tooltip')"
          />
        </template>
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <ServiceNameSelect
          v-model="value.spec.serviceAccountName"
          :mode="mode"
          :select-label="t('workload.serviceAccountName.label')"
          :select-placeholder="t('workload.serviceAccountName.label')"
          :options="namespacedServiceNames"
          :default-option="value.spec.serviceAccountName"
          option-label="metadata.name"
        />
      </div>
    </div>

    <div class="spacer"></div>

    <div class="row">
      <div class="col span-6">
        <h3>
          {{ t('kubewarden.policyServerConfig.replicas') }}
        </h3>
        <LabeledInput
          v-model.number="value.spec.replicas"
          type="number"
          min="0"
          required
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.replicas')"
        />
      </div>
    </div>
  </div>
</template>
