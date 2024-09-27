<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { NORMAN } from '@shell/config/types';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { LabeledSelect },
  mixins:     [Question],

  async fetch() {
    this.all = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
  },

  data() {
    return { all: [] };
  },

  computed: {
    options() {
      return this.all.map((x) => {
        return {
          label: x.nameDisplay || x.name || x.metadata.name,
          value: x.id
        };
      });
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledSelect
        :mode="mode"
        :options="options"
        :disabled="$fetchState.pending || disabled"
        :label="displayLabel"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        :tooltip="displayTooltip"
        @update:value="!$fetchState.pending && $emit('update:value', $event)"
      />
    </div>
    <div class="col span-6 mt-10">
      <div v-if="showDescription">
        {{ question.description }}
      </div>
    </div>
  </div>
</template>
