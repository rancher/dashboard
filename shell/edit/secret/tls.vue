<script>
import { _EDIT } from '@shell/config/query-params';
import { useStore } from 'vuex';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import { useFormRules } from '@shell/composables/useFormValidation';
import { useI18n } from '@shell/composables/useI18n';

export default {
  components: { FileSelectorTextArea },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);
    const { getRules } = useFormRules(
      t,
      [
        {
          path:           'tls.key',
          rules:          ['required'],
          translationKey: 'secret.certificate.privateKey',
        },
        {
          path:           'tls.crt',
          rules:          ['required'],
          translationKey: 'secret.certificate.certificate',
        },
      ]
    );

    return { getRules };
  },

  data() {
    // do not show existing key when editing
    const originalKey = this.value.decodedData['tls.key'] || '';
    const key = this.mode === _EDIT ? '' : originalKey;
    const crt = this.value.decodedData['tls.crt'] || '';

    return {
      originalKey,
      key,
      crt,
    };
  },

  watch: {
    key: 'update',
    crt: 'update',
  },

  methods: {
    update() {
      let keyToSave;

      // use preexisting key if no new one was provided while editing
      if (this.mode === _EDIT && !this.key.length) {
        keyToSave = this.originalKey;
      } else {
        keyToSave = this.key;
      }

      this.value.setData('tls.crt', this.crt);
      this.value.setData('tls.key', keyToSave);
    }
  },
};
</script>

<template>
  <div>
    <FileSelectorTextArea
      v-model:value="key"
      class="mb-20"
      name="tls.key"
      required
      :label="t('secret.certificate.privateKey')"
      :mode="mode"
      :rules="getRules('tls.key')"
      :placeholder="t('secret.certificate.privateKeyPlaceholder')"
    />
    <FileSelectorTextArea
      v-model:value="crt"
      name="tls.crt"
      required
      :label="t('secret.certificate.certificate')"
      :mode="mode"
      :rules="getRules('tls.crt')"
      :placeholder="t('secret.certificate.certificatePlaceholder')"
    />
  </div>
</template>
