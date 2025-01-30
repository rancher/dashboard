<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';

export default {
  components: {
    RadioGroup, LabeledInput, FileSelector
  },

  emits: ['fqdn-changed', 'ca-certs-changed', 'local-cluster-auth-endpoint-changed'],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  methods: { onCertSelected: createOnSelected('value.caCerts') }
};
</script>

<template>
  <div>
    <RadioGroup
      v-model:value="value.enabled"
      name="enabled"
      data-testid="ace-enabled-radio-input"
      :options="[false, true]"
      :labels="[t('generic.disabled'), t('generic.enabled')]"
      :mode="mode"
      @update:value="$emit('local-cluster-auth-endpoint-changed', $event)"
    />

    <template v-if="value.enabled">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            :value="value.fqdn"
            :mode="mode"
            :label="t('cluster.rke2.address.fqdn.label')"
            data-testid="ace-fqdn-input"
            :tooltip="t('cluster.rke2.address.fqdn.toolTip')"
            @update:value="$emit('fqdn-changed', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            :value="value.caCerts"
            :mode="mode"
            :label="t('cluster.rke2.address.caCerts.label')"
            type="multiline"
            data-testid="ace-cacerts-input"
            :tooltip="t('cluster.rke2.address.caCerts.toolTip')"
            @update:value="$emit('ca-certs-changed', $event)"
          />
          <FileSelector
            :mode="mode"
            class="btn btn-sm bg-primary mt-10"
            :label="t('generic.readFromFile')"
            @selected="onCertSelected"
          />
        </div>
      </div>
    </template>
  </div>
</template>
