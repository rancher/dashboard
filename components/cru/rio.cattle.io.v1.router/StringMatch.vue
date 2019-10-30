<script>
import LabeledInput from '@/components/form/LabeledInput';
import InputWithSelect from '@/components/form/InputWithSelect';
import RadioGroup from '@/components/form/RadioGroup';
export default {
  components: { InputWithSelect },
  props:      {
    spec: {
      type:    Object,
      default: () => {
        return {}
        ;
      }
    },
    label: {
      type:    String,
      default: ''
    },
    options: {
      type:    Array,
      default: () => {}
    }
  },
  data() {
    return {
      types: this.options || ['exact', 'prefix', 'regexp'], value: Object.values(this.spec)[0] || '', type:  Object.keys(this.spec)[0] || 'exact'
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
    },
    update(input) {
      this.value = input.string;
      this.type = input.option;
      this.change();
    }
  }
};
</script>

<template>
  <div class="match-input">
    <InputWithSelect :options="types" :string-input="value" :label="label" @input="update" />
  </div>
</template>
