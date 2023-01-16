<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import WorkLoadMixin from '@shell/edit/workload/mixins/workload';
import Workload from '@shell/edit/workload/index.vue';

export default {
  name:       'WorkloadDeployments',
  components: { Workload },
  mixins:     [CreateEditView, FormValidation, WorkLoadMixin],
  props:      {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
};
</script>

<template>
  <Workload v-bind="$props" />
</template>
