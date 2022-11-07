<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  props:      {
    // LabeledInput props
    mode: {
      type:    String,
      default: _EDIT
    },
    inputLabel: {
      type:     String,
      required: true
    },
    placeholder: {
      type:     String,
      required: true
    },
    inputList: {
      type:     Array,
      required: true
    },
  },

  methods: {
    addInput() {
      this.inputList.push('');
    },

    removeRow(index) {
      this.inputList.splice(index, 1);
    }
  },

  computed: {
    isDisabled() {
      return (this.disabled || this.mode === _VIEW );
    },
  }

};
</script>
<template>
  <div>
    <label>{{ inputLabel }}</label>
    <div v-for="(item, index) of inputList" :key="index" class="mb-5 mr-5 input-row">
      <input v-model="inputList[index]" type="number" :disabled="isDisabled" :placeholder="placeholder" />
      <button :disabled="isDisabled" type="button" class="btn btn-sm bg-primary" @click.prevent="removeRow(index)">
        <i class="icon icon-minus" />
      </button>
    </div>
    <div>
      <button :disabled="isDisabled" class="btn btn-sm bg-primary" @click.prevent="addInput">
        {{ t('generic.add') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.input-row {
  display: grid;
  grid-template-columns: 95% 5%;
  grid-column-gap: 5px;
  align-items: center;

  .btn {
    height: 24px;
  }

}
</style>
