<script>
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
    const username = this.value.decodedData['ssh-publickey'] || '';
    const password = this.value.decodedData['ssh-privatekey'] || '';
    const knownHosts = this.value.decodedData['known_hosts'] || '';
    const showKnownHosts = this.value.supportsSshKnownHosts;

    return {
      username,
      password,
      knownHosts,
      showKnownHosts,
    };
  },

  watch: {
    username:   'update',
    password:   'update',
    knownHosts: 'update'
  },

  methods: {
    onUsernameSelected: createOnSelected('username'),
    onPasswordSelected: createOnSelected('password'),

    update() {
      this.value.setData('ssh-publickey', this.username);
      this.value.setData('ssh-privatekey', this.password);

      if (this.showKnownHosts) {
        this.value.setData('known_hosts', this.knownHosts);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="username"
          type="multiline"
          data-testid="ssh-public-key"
          :label="t('secret.ssh.public')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.publicPlaceholder')"
        />
        <FileSelector
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          @selected="onUsernameSelected"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="password"
          type="multiline"
          data-testid="ssh-private-key"
          :label="t('secret.ssh.private')"
          :mode="mode"
          required
          :placeholder="t('secret.ssh.privatePlaceholder')"
        />
        <FileSelector
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          @selected="onPasswordSelected"
        />
      </div>
    </div>
    <div class="row mt-40">
      <div class="col span-12">
        <LabeledInput
          v-if="showKnownHosts"
          v-model:value="knownHosts"
          type="multiline"
          data-testid="ssh-known-hosts"
          :label="t('secret.ssh.knownHosts')"
          :mode="mode"
          :placeholder="t('secret.ssh.knownHostsPlaceholder')"
        />
      </div>
    </div>
  </div>
</template>
