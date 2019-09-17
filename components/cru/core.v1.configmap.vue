<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/LabeledInput';
import { NAMESPACE } from '@/utils/types';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  computed: {
    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      return choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    }
  },
};
</script>

<template>
  <form>
    <LabeledInput
      v-model="value.name"
      label="Config Map Name"
      placeholder="Placeholder"
      :required="true"
    />

    <select v-model="value.metadata.namespace">
      <option disabled value="">
        Select a Namespace
      </option>
      <option v-for="opt in namespaces" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </form>
</template>
