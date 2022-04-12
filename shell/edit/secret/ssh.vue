<script>
import LabeledInput from '@shell/components/form/LabeledInput';
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
    const username = this.value.decodedData['ssh-publickey'] || '';
    const password = this.value.decodedData['ssh-privatekey'] || '';

    return {
      username,
      password,
    };
  },

  watch: {
    username: 'update',
    password: 'update',
  },

  methods: {
    onUsernameSelected: createOnSelected('username'),
    onPasswordSelected: createOnSelected('password'),

    update() {
      this.value.setData('ssh-publickey', this.username);
      this.value.setData('ssh-privatekey', this.password);
    }
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="username"
          type="multiline"
          :label="t('secret.ssh.public')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.publicPlaceholder')"
        />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onUsernameSelected" />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="password"
          type="multiline"
          :label="t('secret.ssh.private')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.privatePlaceholder')"
        />
        <FileSelector class="btn btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onPasswordSelected" />
      </div>
    </div>
  </div>
</template>
