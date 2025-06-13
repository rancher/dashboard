<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import Login from '@shell/mixins/login';
import loadPlugins from '@shell/plugins/plugin';

export default {
  emits: ['error', 'showInputs'],

  components: { LabeledInput, AsyncButton },
  mixins:     [Login],

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
          app:     this.$store.app,
          store:   this.$store,
          $plugin: this.$store.$plugin
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
      <div class="span-6 offset-3">
        <div class="mb-20">
          <LabeledInput
            v-model:value="username"
            :label="t('login.username')"
            autocomplete="username"
          />
        </div>
        <div class="mb-20">
          <LabeledInput
            v-model:value="password"
            type="password"
            :label="t('login.password')"
            autocomplete="password"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-12 text-center">
          <AsyncButton
            ref="btn"
            type="submit"
            :action-label="t('login.loginWithProvider', {provider: displayName})"
            :waiting-label="t('login.loggingIn')"
            :success-label="t('login.loggedIn')"
            :error-label="t('asyncButton.default.error')"
            class="btn bg-primary"
            style="font-size: 18px;"
            @click="login"
          />
        </div>
      </div>
    </template>
    <div
      v-else
      class="text-center"
    >
      <button
        style="font-size: 18px;"
        type="button"
        class="btn bg-primary"
        @click="$emit('showInputs')"
      >
        {{ t('login.loginWithProvider', {provider: displayName}) }}
      </button>
    </div>
  </form>
</template>
