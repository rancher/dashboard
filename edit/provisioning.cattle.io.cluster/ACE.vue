<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import { set } from '@/utils/object';
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
    if ( isEmpty(this.value?.spec?.rkeConfig?.localClusterAuthEndpoint) ) {
      set(this.value, 'spec.rkeConfig.localClusterAuthEndpoint', {
        enabled: false,
        caCerts: '',
        fqdn:    '',
      });
    }

    return {};
  },

  computed: {
    config() {
      return this.value.spec.rkeConfig.localClusterAuthEndpoint;
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
      :labels="['Disabled','Enabled']"
      :mode="mode"
    />

    <template v-if="config.enabled">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="config.fqdn"
            :mode="mode"
            label="FQDN"
            tooltip="A FQDN which will resolve to the healthy control plane nodes of the cluster."
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="config.caCerts"
            :mode="mode"
            label="CA Certificates"
            type="multiline"
            tooltip="Certificates required for the client to successfully verify the validity of the certificate returned by the endpoint."
          />
          <FileSelector :mode="mode" class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCertSelected" />
        </div>
      </div>
    </template>
  </div>
</template>
