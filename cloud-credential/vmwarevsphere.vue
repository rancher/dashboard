<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    value: {
      deep: true,
      handler(neu) {
        this.$emit('validationChanged', !!neu);
      }
    }
  },

  methods: {
    test() {
      // Vsphere doesn't have a test function. The credential has to be created before we can make calls.
      return true;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.vcenter"
          label-key="cluster.credential.vmwarevsphere.server.label"
          placeholder-key="cluster.credential.vmwarevsphere.server.placeholder"
          :required="true"
          :mode="mode"
          @input="value.setData('vcenter', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.vcenterPort"
          label-key="cluster.credential.vmwarevsphere.port.label"
          :required="true"
          type="number"
          min="1"
          max="65535"
          :mode="mode"
          @input="value.setData('vcenterPort', $event);"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.username"
          label-key="cluster.credential.vmwarevsphere.username.label"
          :required="true"
          :mode="mode"
          @input="value.setData('username', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.password"
          label-key="cluster.credential.vmwarevsphere.password.label"
          :required="true"
          type="password"
          :mode="mode"
          @input="value.setData('password', $event);"
        />
      </div>
    </div>
    <p class="text-muted">
      {{ t('cluster.credential.vmwarevsphere.note', {}, true) }}
    </p>
  </div>
</template>
