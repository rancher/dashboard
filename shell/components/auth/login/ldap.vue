<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import AsyncButton from '@shell/components/AsyncButton';
import Password from '@shell/components/form/Password';
import Login from '@shell/mixins/login';
import loadPlugins from '@shell/plugins/plugin';

export default {
  emits: ['error', 'showInputs'],

  components: {
    LabeledInput, RcButton, AsyncButton, Password
  },
  mixins: [Login],

  props: {
    open: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { username: '', password: '' };
  },

  methods: {
    /**
     * The open form starts at its first field, as the local form does; the
     * closed one only has its button.
     */
    focus() {
      if (this.open) {
        this.$refs.username?.focus();
      } else {
        this.$refs.btn?.focus();
      }
    },

    async login(buttonCb) {
      try {
        this.err = null;
        await this.$store.dispatch('auth/login', {
          provider: this.name,
          body:     {
            username: this.username,
            password: this.password
          }
        });

        await loadPlugins({
          app:        this.$store.app,
          store:      this.$store,
          $extension: this.$store.$extension,
        });

        buttonCb(true);
        this.$router.replace('/');
      } catch (err) {
        this.err = err;

        // emit error to parent so that it can displayed on the error Banner
        this.$emit('error', err);
        buttonCb(false);
      }
    },
  },
};
</script>

<template>
  <form @submit.prevent>
    <template v-if="open">
      <div class="mb-20">
        <LabeledInput
          ref="username"
          v-model:value="username"
          data-testid="ldap-login-username"
          :label="t('login.username')"
          autocomplete="username"
        />
      </div>
      <div class="mb-20">
        <Password
          v-model:value="password"
          data-testid="ldap-login-password"
          :label="t('login.password')"
          autocomplete="current-password"
        />
      </div>
      <AsyncButton
        ref="btn"
        type="submit"
        data-testid="login-provider-submit"
        :action-label="t('login.loginWithProvider', {provider: displayName})"
        :waiting-label="t('login.loggingIn')"
        :success-label="t('login.loggedIn')"
        :error-label="t('asyncButton.default.error')"
        @click="login"
      />
    </template>
    <div
      v-else
      class="text-center"
    >
      <RcButton
        ref="btn"
        type="button"
        variant="primary"
        size="large"
        data-testid="login-provider-submit"
        @click="$emit('showInputs')"
      >
        {{ t('login.loginWithProvider', {provider: displayName}) }}
      </RcButton>
    </div>
  </form>
</template>
