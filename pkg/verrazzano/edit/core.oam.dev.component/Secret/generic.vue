<script>
// Added by Verrazzano
import KeyValue from '@shell/components/form/KeyValue';
import SecretHelper from '@pkg/mixins/secret-helper';

const VALID_DATA_KEY = /^[-._a-zA-Z0-9]*$/;

export default {
  name:       'GenericSecret',
  components: { KeyValue },
  mixins:     [SecretHelper],
  props:      {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
    hideSensitiveData: {
      type:    Boolean,
      default: true,
    }
  },
  computed: {
    specData: {
      get() {
        return this.getWorkloadField('data');
      },
      set(neu) {
        this.setWorkloadFieldIfNotEmpty('data', neu);
      }
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
  },
};
</script>

<template>
  <KeyValue
    key="data"
    v-model="specData"
    :mode="mode"
    :initial-empty-row="true"
    :handle-base64="true"
    :value-trim="false"
    :add-allowed="true"
    :read-allowed="true"
    :value-concealed="isView && hideSensitiveData"
    :file-modifier="fileModifier"
    read-icon=""
    add-icon=""
  />
</template>
