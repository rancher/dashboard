<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import Login from '@shell/mixins/login';
import AESEncrypt from '@shell/utils/aes-encrypt';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  components: { LabeledInput, AsyncButton },
  mixins:     [Login],

  props: {
    open: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      username: '', password: '', disabledEncryption: null
    };
  },

  created() {
    this.disabledEncryption = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PWD_ENCRYPT);
  },

  methods: {
    async login(buttonCb) {
      try {
        this.err = null;
        await this.$store.dispatch('auth/login', {
          provider: this.name,
          body:     {
            username: this.username,
            password: this.encryptPassword(this.password)
          }
        });

        buttonCb(true);
        this.$router.replace('/');
      } catch (err) {
        this.err = err;
        buttonCb(false);
      }
    },

    encryptPassword(password) {
      if (this.disabledEncryption?.value === 'true') {
        return password;
      }

      return AESEncrypt(password.trim());
    }
  },
};
</script>

<template>
  <form>
    <template v-if="open">
      <div class="span-6 offset-3">
        <div class="mb-20">
          <LabeledInput
            v-model="username"
            :label="t('login.username')"
            autocomplete="username"
          />
        </div>
        <div class="mb-20">
          <LabeledInput
            v-model="password"
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
    <div v-else class="text-center">
      <button style="font-size: 18px;" type="button" class="btn bg-primary" @click="$emit('showInputs')">
        {{ t('login.loginWithProvider', {provider: displayName}) }}
      </button>
    </div>
  </form>
</template>
