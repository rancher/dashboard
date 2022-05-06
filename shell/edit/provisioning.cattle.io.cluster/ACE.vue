<script>
import RadioGroup from '@shell/components/form/RadioGroup';
import LabeledInput from '@shell/components/form/LabeledInput';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';
import { set } from '@shell/utils/object';
import isEmpty from 'lodash/isEmpty';

export default {
  components: {
    RadioGroup, LabeledInput, FileSelector
  },

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

  data() {
    if ( isEmpty(this.value?.spec?.localClusterAuthEndpoint) ) {
      set(this.value, 'spec.localClusterAuthEndpoint', {
        enabled: false,
        caCerts: '',
        fqdn:    '',
      });
    }

    return {};
  },

  computed: {
    config() {
      return this.value.spec.localClusterAuthEndpoint;
    },
  },

  methods: { onCertSelected: createOnSelected('config.caCerts') }
};
</script>

<template>
  <div>
    <h3 v-t="'cluster.tabs.ace'" />

    <RadioGroup
      v-model="config.enabled"
      name="enabled"
      :options="[false, true]"
      :labels="[t('generic.disabled'), t('generic.enabled')]"
      :mode="mode"
    />

    <template v-if="config.enabled">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="config.fqdn"
            :mode="mode"
            label="FQDN"
            :tooltip="t('cluster.rke2.address.fqdn.toolTip')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="config.caCerts"
            :mode="mode"
            :label="t('cluster.rke2.address.caCerts.label')"
            type="multiline"
            :tooltip="t('cluster.rke2.address.caCerts.toolTip')"
          />
          <FileSelector :mode="mode" class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCertSelected" />
        </div>
      </div>
    </template>
  </div>
</template>
