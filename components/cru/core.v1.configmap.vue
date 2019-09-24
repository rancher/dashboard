<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import KeyValue from '@/components/form/KeyValue';
import { NAMESPACE } from '@/utils/types';

export default {
  components: {
    LabeledInput, LabeledSelect, KeyValue
  },
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
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.name"
          label="Config Map Name"
          placeholder="Placeholder"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.metadata.namespace"
          :options="namespaces"
          label="Namespace"
          placeholder="Select a namespace"
          :required="true"
        />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col span-12">
        <KeyValue
          v-model="value.data"
          title="Text Data"
          :inital-empty-row="true"
        />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col span-12">
        ...Binary Data...
      </div>
    </div>
  </form>
</template>
