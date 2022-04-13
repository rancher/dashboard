<script>
import KeyValue from '@/components/form/KeyValue';
import { _VIEW, _EDIT } from '@/config/query-params';

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
    isEdit() {
      return this.mode === _EDIT;
    },
    hasData() {
      return this.value?.data ? Object.keys(this.value?.data).length > 0 : false;
    }
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
  <div v-if="hasData">
    <KeyValue
      key="data"
      v-model="value.data"
      :mode="mode"
      :handle-base64="true"
      :value-trim="false"
      :add-allowed="true"
      :read-allowed="true"
      :value-concealed="isView && hideSensitiveData"
      :file-modifier="fileModifier"
      read-icon=""
      add-icon=""
    />
  </div>
  <div v-else>
    <p class="no-data mt-20">
      {{ t('secret.noData') }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.no-data {
  opacity: 0.8;
}
</style>
