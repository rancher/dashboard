<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';

const VALID_DATA_KEY = /^[-._a-zA-Z0-9]*$/;

export default {
  components: { KeyValue },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },

    hideSensitiveData: {
      type:    Boolean,
      default: true,
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    fileModifier(name, value) {
      if (!VALID_DATA_KEY.test(name)) {
        name = name
          .split('')
          .map(c => VALID_DATA_KEY.test(c) ? c : '_')
          .join('');
      }

      return { name, value };
    },
  }
};
</script>

<template>
  <div class="row">
    <KeyValue
      key="data"
      v-model="value.data"
      :mode="mode"
      :initial-empty-row="true"
      :value-base64="true"
      :value-trim="false"
      :value-concealed="isView && hideSensitiveData"
      :file-modifier="fileModifier"
      read-icon=""
      add-icon=""
    />
  </div>
</template>
