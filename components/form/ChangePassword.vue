<script>
import { mapGetters } from 'vuex';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import Password from '@/components/form/Password';
import { NORMAN } from '@/config/types';

export default {
  components: {
    Checkbox, Banner, Password
  },
  props: {
    value: {
      type:    [String],
      default: ''
    },
  },
  async fetch() {
    if (this.principal.provider === 'local' && !!this.principal.loginName) {
      this.username = this.principal.loginName;
    }

    const users = await this.$store.dispatch('rancher/findAll', {
      type: NORMAN.USER,
      opt:  { url: '/v3/users', filter: { me: true } }
    });

    if (users && users.length === 1) {
      this.username = users[0].username;
    }
  },
  data(ctx) {
    return {
      username:                    '',
      errorMessages:               [],
      pCanShowMissmatchedPassword: false,
      pIsRandomGenerated:            false,
      form:                        {
        deleteKeys: false,
        currentP:   '',
        newP:       '',
        genP:       '',
        confirmP:   ''
      },
    };
  },
  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    isRandomGenerated: {
      get() {
        return this.pIsRandomGenerated;
      },

      set(isRandomGenerated) {
        this.pIsRandomGenerated = isRandomGenerated;
        this.errorMessages = [];
        this.validate();
      }
    },

    passwordGen: {
      get() {
        return this.form.genP;
      },

      set(p) {
        this.form.genP = p;
        this.validate();
      }
    },

    passwordCurrent: {
      get() {
        return this.form.currentP;
      },

      set(p) {
        this.form.currentP = p;
        this.validate();
      }
    },

    passwordNew: {
      get() {
        return this.form.newP;
      },

      set(p) {
        this.form.newP = p;
        this.validate();
      }
    },

    passwordConfirm: {
      get() {
        return this.form.confirmP;
      },

      set(p) {
        this.form.confirmP = p;
        this.validate();
      }
    },

    passwordConfirmBlurred: {
      get() {
        return this.pCanShowMissmatchedPassword;
      },

      set(p) {
        this.pCanShowMissmatchedPassword = p;
        this.validate();
      }
    },

    password() {
      return this.isRandomGenerated ? this.passwordGen : this.passwordNew;
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },
  },
  methods: {
    passwordsMatch() {
      const match = this.passwordNew === this.passwordConfirm;

      this.errorMessages = this.passwordConfirmBlurred && !match ? [this.t('changePassword.errors.missmatchedPassword')] : [];

      return match;
    },
    validate() {
      this.$emit('valid', this.isRandomGenerated ? !!this.passwordCurrent : this.passwordsMatch() && !!this.passwordCurrent && this.passwordNew);
      this.$emit('input', this.password);
    },
    async submit() {
      await this.changePassword();
      if (this.form.deleteKeys) {
        await this.deleteKeys();
      }
    },
    async changePassword() {
      try {
        await this.$store.dispatch('rancher/collectionAction', {
          type:       NORMAN.USER,
          actionName: 'changepassword',
          body:          {
            currentPassword: this.form.currentP,
            newPassword:     this.isRandomGenerated ? this.form.genP : this.form.newP
          },
        });
      } catch (err) {
        this.errorMessages = [err.message || this.t('changePassword.errors.failedToChange')];
        throw err;
      }
    },
    async deleteKeys() {
      try {
        const tokens = await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.TOKEN,
          opt:  {
            // Ensure we have any new tokens since last fetched... and that we don't attempt to delete previously deleted tokens
            force: true
          }
        });

        await Promise.all(tokens.reduce((res, token) => {
          if (!token.current) {
            res.push(token.remove());
          }

          return res;
        }, []));
      } catch (err) {
        if (err.message) {
          this.errorMessages = [err.message];
        } else if (err.length > 1) {
          this.errorMessages = [this.t('changePassword.errors.failedDeleteKeys')];
        } else {
          this.errorMessages = [this.t('changePassword.errors.failedDeleteKey')];
        }
        throw err;
      }
    },
  },
};
</script>

<template>
  <div class="change-password">
    <div class="form">
      <div class="fields">
        <Checkbox v-model="form.deleteKeys" :label="t('changePassword.keys')" class="mt-10" />
        <input
          id="username"
          type="text"
          name="username"
          autocomplete="username"
          :value="username"
          tabindex="-1"
        >
        <input
          id="password"
          type="password"
          name="password"
          autocomplete="password"
          :value="password"
          tabindex="-1"
        >
        <Password
          v-model="passwordCurrent"
          class="mt-10"
          :label="t('changePassword.currentPassword')"
        ></Password>
        <Password
          v-if="isRandomGenerated"
          v-model="passwordGen"
          class="mt-10"
          :is-random="true"
          :label="t('changePassword.randomGen.generated')"
        />
        <div v-else class="userGen">
          <Password
            v-model="passwordNew"
            class="mt-10"
            :label="t('changePassword.userGen.newPassword')"
          />
          <Password
            v-model="passwordConfirm"
            class="mt-10"
            :label="t('changePassword.userGen.confirmPassword')"
            @blur="passwordConfirmBlurred = true"
          />
        </div>
      </div>
      <Checkbox v-model="isRandomGenerated" :label="t('changePassword.generatePassword')" class="mt-10 type" />
    </div>
    <div v-if="errorMessages && errorMessages.length" class="text-error">
      <Banner v-for="(err, i) in errorMessages" :key="i" color="error" :label="err" class="mb-0" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .change-password {
    display: flex;
    flex-direction: column;

    .form {
      display: flex;
      flex-direction: column;
      .fields{
        height: 225px;
        #username, #password {
          height: 0;
          width: 0;
          background-size: 0;
          padding: 0;
          border: none;
        }
      }
    }
  }

</style>
