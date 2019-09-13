<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  computed: {},

  methods: {},
};
</script>

<template>
  <form>
    <LabeledInput
      v-model="value.name"
      label="Secret Name"
      placeholder="Placeholder"
      :required="true"
    />
  </form>
</template>
