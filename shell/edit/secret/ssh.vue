<script>
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import { useFormRules } from '@shell/composables/useFormValidation';
import { useI18n } from '@shell/composables/useI18n';

export default {
  components: { LabeledInput, FileSelectorTextArea },

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
          path:           'ssh-publickey',
          rules:          ['required'],
          translationKey: 'secret.ssh.public',
        },
        {
          path:           'ssh-privatekey',
          rules:          ['required'],
          translationKey: 'secret.ssh.private',
        },
      ]
    );

    return { getRules };
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
    <FileSelectorTextArea
      v-model:value="username"
      class="mb-20"
      name="ssh-publickey"
      data-testid="ssh-public-key"
      :label="t('secret.ssh.public')"
      :mode="mode"
      required
      :rules="getRules('ssh-publickey')"
      :placeholder="t('secret.ssh.publicPlaceholder')"
    />
    <FileSelectorTextArea
      v-model:value="password"
      name="ssh-privatekey"
      data-testid="ssh-private-key"
      :label="t('secret.ssh.private')"
      :mode="mode"
      required
      :rules="getRules('ssh-privatekey')"
      :placeholder="t('secret.ssh.privatePlaceholder')"
    />
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
