<script>
import Select from '@/components/form/Select';
import UnitInput from '@/components/form/UnitInput';
import { RELATIVE_TYPES, ALL_TYPES } from '@/components/form/SuperDatePicker/util';

export default {
  components: {
    Select,
    UnitInput
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
  },

  data() {
    if (!RELATIVE_TYPES.find(t => t.key === this.value.type)) {
      this.$set(this.value, 'value', 15);
      this.$set(this.value, 'type', ALL_TYPES.MINUTES_AGO.key);
    }

    return {
      relativeOptions: RELATIVE_TYPES.map(type => ({
        value: type.key,
        label: this.t(`superDatePicker.${ type.key }`)
      }))
    };
  }
};
</script>

<template>
  <div class="relative">
    <div class="row">
      <div class="col span-6">
        <UnitInput v-model="value.value" :suffix="false" class="input-sm" />
      </div>
      <div class="col span-6">
        <Select v-model="value.type" class="input-sm" :options="relativeOptions" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-time {
  display: flex;
  flex-direction: row;
  height: 267px;
}
</style>
