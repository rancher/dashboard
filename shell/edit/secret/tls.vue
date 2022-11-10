<script>
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';

export default {
  components: { LabeledInput, FileSelector },

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
    onKeySelected: createOnSelected('key'),
    onCrtSelected: createOnSelected('crt'),

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
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="key"
          type="multiline"
          :label="t('secret.certificate.privateKey')"
          :mode="mode"
          :placeholder="t('secret.certificate.privateKeyPlaceholder')"
        />
        <FileSelector
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          @selected="onKeySelected"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="crt"
          required
          type="multiline"
          :label="t('secret.certificate.certificate')"
          :mode="mode"
          :placeholder="t('secret.certificate.certificatePlaceholder')"
        />
        <FileSelector
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          @selected="onCrtSelected"
        />
      </div>
    </div>
  </div>
</template>
