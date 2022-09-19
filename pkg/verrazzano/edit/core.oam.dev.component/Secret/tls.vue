<script>
// Added by Verrazzano
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import SecretHelper from '@pkg/mixins/secret-helper';

export default {
  name:       'TLSSecret',
  components: {
    FileSelector,
    LabeledInput,
  },
  mixins: [SecretHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    return {
      originalKey: '',
      key:         '',
      crt:         '',
    };
  },
  methods: {
    onKeySelected: createOnSelected('key'),
    onCrtSelected: createOnSelected('crt'),
    update() {
      let keyToSave;

      // use preexisting key if no new one was provided while editing
      if (this.isEdit && !this.key.length) {
        keyToSave = this.originalKey;
      } else {
        keyToSave = this.key;
      }

      this.setData('tls.crt', this.crt);
      this.setData('tls.key', keyToSave);
    }
  },
  created() {
    if (!this.originalKey) {
      this.originalKey = this.decodedData['tls.key'] || '';
    }
    if (!this.key) {
      // do not show existing key when editing
      this.key = this.isEdit ? '' : this.originalKey;
    }
    if (!this.crt) {
      this.crt = this.decodedData['tls.crt'] || '';
    }
  },
  watch: {
    key: 'update',
    crt: 'update',
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
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onKeySelected" />
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
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCrtSelected" />
      </div>
    </div>
  </div>
</template>
