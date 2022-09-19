<script>
// Added by Verrazzano
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import SecretHelper from '@pkg/mixins/secret-helper';

export default {
  name:       'SSHSecret',
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
      publicKey:  '',
      privateKey: '',
    };
  },
  methods: {
    onPublicKeySelected:  createOnSelected('publicKey'),
    onPrivateKeySelected: createOnSelected('privateKey'),
    getPublicKey() {
      return this.decodedData['ssh-publickey'] || '';
    },
    getPrivateKey() {
      return this.decodedData['ssh-privatekey'] || '';
    },
  },
  created() {
    if (!this.publicKey) {
      this.publicKey = this.getPublicKey();
    }
    if (!this.privateKey) {
      this.privateKey = this.getPrivateKey();
    }
  },
  watch: {
    publicKey() {
      this.setData('ssh-publickey', this.publicKey);
    },
    privateKey() {
      this.setData('ssh-privatekey', this.privateKey);
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="publicKey"
          type="multiline"
          :label="t('secret.ssh.public')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.publicPlaceholder')"
        />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onPublicKeySelected" />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="privateKey"
          type="multiline"
          :label="t('secret.ssh.private')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.privatePlaceholder')"
        />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onPrivateKeySelected" />
      </div>
    </div>
  </div>
</template>
