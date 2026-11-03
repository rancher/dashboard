<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useField } from 'vee-validate';
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';
import { useI18n } from '@shell/composables/useI18n';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

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

  setup(props) {
    const store = useStore();
    const { t } = useI18n(store);

    // Each invalid key, mapped to its message, for KeyValue's key tooltips
    const dataKeyErrors = (data) => Object.keys(data || {}).reduce((acc, key) => {
      const message = formRulesGenerator(t, { key }).dataKey(key);

      if (message) {
        acc[key] = message;
      }

      return acc;
    }, {});

    const keyErrors = computed(() => dataKeyErrors(props.value.data));

    // Register the keys with the parent form, so an invalid key blocks saving
    const { setValue } = useField(
      'data',
      (data) => Object.values(dataKeyErrors(data))[0] || true,
      { initialValue: props.value.data, validateOnMount: true }
    );

    watch(() => props.value.data, (data) => setValue(data), { deep: true });

    return { keyErrors };
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
          .map((c) => VALID_DATA_KEY.test(c) ? c : '_')
          .join('');
      }

      return { name, value };
    },
  }
};
</script>

<template>
  <KeyValue
    key="data"
    v-model:value="value.data"
    :mode="mode"
    :initial-empty-row="true"
    :value-can-be-empty="true"
    :handle-base64="true"
    :value-trim="false"
    :add-allowed="true"
    :read-allowed="true"
    :value-concealed="isView && hideSensitiveData"
    :file-modifier="fileModifier"
    :key-errors="keyErrors"
    :parse-lines-from-file="true"
    read-icon=""
    add-icon=""
  />
</template>
