<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import { RcContentGroup } from '@components/Layout';

/**
 * A copy of ACE laid out for use inside RcSection: the radio group and fields
 * are stacked with RcContentGroup, so they sit 16px apart.
 */
export default {
  name: 'RcACE',

  components: {
    RadioGroup, LabeledInput, FileSelectorTextArea, RcContentGroup
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
};
</script>

<template>
  <RcContentGroup>
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
      <div class="row">
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
      </div>
      <div class="row">
        <div class="col span-6">
          <FileSelectorTextArea
            :value="value.caCerts"
            :mode="mode"
            :label="t('cluster.rke2.address.caCerts.label')"
            data-testid="ace-cacerts-input"
            :tooltip="t('cluster.rke2.address.caCerts.toolTip')"
            @update:value="$emit('ca-certs-changed', $event)"
          />
        </div>
      </div>
    </template>
  </RcContentGroup>
</template>
