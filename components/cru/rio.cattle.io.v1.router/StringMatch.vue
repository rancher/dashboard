<script>
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
export default {
  components: { LabeledInput, RadioGroup },
  props:      {
    init: {
      type:    Object,
      default: () => {}
    },
    label: {
      type:    String,
      default: ''
    }
  },
  data() {
    return {
      types: ['exact', 'prefix', 'regexp'], value: Object.values(this.init)[0], type:  Object.keys(this.init)[0] || 'exact'
    };
  },
  methods: {
    selectType(type) {
      this.type = type;
    },
    change() {
      const { type, value } = this;
      const out = {};

      out[type] = value;
      this.$emit('input', out );
    }
  }
};
</script>

<template>
  <div class="match-input" @input="change">
    <LabeledInput v-model="value" :label="label" />
    <RadioGroup :options="['exact', 'prefix', 'regexp']" :selected="types.indexOf(type)" class="match-type" @input="selectType" />
  </div>
</template>

<style lang='scss'>
.match-input {
  display: flex;
  & .match-type{
    display: flex;
  }
}
</style>
