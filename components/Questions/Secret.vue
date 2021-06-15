<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';
import { filterBy } from '@/utils/array';
import Question from './Question';

export default {
  components: { LabeledSelect },
  mixins:     [Question],

  async fetch() {
    this.allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    return { allSecrets: [] };
  },

  computed: {
    options() {
      return filterBy(this.allSecrets, 'metadata.namespace', this.targetNamespace).map(x => x.metadata.name);
    }
  }
};
</script>

<template>
  <div>
    Secret in namespace {{ targetNamespace }}
    <LabeledSelect
      :mode="mode"
      :disabled="$fetchState.pending"
      :label="displayLabel"
      :placeholder="question.description"
      :required="question.required"
      :value="value"
      @input="$emit('input', $event)"
    />
  </div>
</template>
