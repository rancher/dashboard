<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import Tab from '@/components/Tabbed/Tab';
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import { set } from '@/utils/object';

export default {
  components: {
    RadioGroup, LabeledInput, Tab, FileSelector
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
    if ( !this.value?.spec?.rkeConfig?.localClusterAuthEndpoint ) {
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
  <Tab name="ace" label-key="cluster.tabs.ace">
    <RadioGroup
      v-model="config.enabled"
      name="enabled"
      :options="[false, true]"
      :labels="['Disabled','Enabled']"
      :mode="mode"
    />

    <template v-if="config.enabled">
      <div class="spacer" />

      <LabeledInput
        v-model="config.fqdn"
        label="FQDN"
        tooltip="A FQDN which will resolve to the healthy control plane nodes of the cluster."
      />

      <div class="spacer" />

      <LabeledInput
        v-model="config.caCerts"
        label="CA Certificates"
        type="multiline"
        tooltip="Certificates required for the client to successfully verify the validity of the certificate returned by the endpoint."
      />
      <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCertSelected" />
    </template>
  </Tab>
</template>
