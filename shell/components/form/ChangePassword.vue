<script>
import { mapGetters } from 'vuex';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import Password from '@shell/components/form/Password';
import PasswordStrength from '@shell/components/PasswordStrength';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { SETTING } from '@shell/config/settings';
import AESEncrypt from '@shell/utils/aes-encrypt';

// Component handles three use cases
// 1) isChange - Current user is changing their own password
// 2) isCreate - New password is for a new user
// 3) isEdit - New password is for an existing user
export default {
  components: {
    Checkbox, Banner, Password, PasswordStrength
  },
  props: {
    mode: {
      type:    String,
      default: null
    },
    mustChangePassword: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    if (this.isChange) {
      // Fetch the username for hidden input fields. The value itself is not needed if create or changing another user's password
      const users = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.USER,
        opt:  { url: '/v3/users', filter: { me: true } }
      });
      const user = users?.[0];

      this.username = user?.username;
    }
    this.userChangeOnLogin = this.mustChangePassword;

    const disabledEncryption = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.DISABLE_PWD_ENCRYPT);

    this.disabledEncryption = disabledEncryption;
  },
  data(ctx) {
    return {
      username:                   '',
      errorMessages:              [],
      pCanShowMismatchedPassword: false,
      pIsRandomGenerated:         false,
      form:                       {
        deleteKeys:        false,
        currentP:          '',
        newP:              '',
        genP:              '',
        confirmP:          '',
        userChangeOnLogin: false,
      },
      disabledEncryption: null,
      passwordStrength:   0,
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

    userChangeOnLogin: {
      get() {
        return this.form.userChangeOnLogin;
      },

      set(p) {
        this.form.userChangeOnLogin = p;
        this.validate();
      }
    },

    passwordConfirmBlurred: {
      get() {
        return this.pCanShowMismatchedPassword;
      },

      set(p) {
        this.pCanShowMismatchedPassword = p;
        this.validate();
      }
    },

    password() {
      return this.isRandomGenerated ? this.passwordGen : this.passwordNew;
    },

    isChange() {
      // Change password prompt
      return !this.mode;
    },

    isCreateEdit() {
      return this.isCreate || this.isEdit;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      // Edit user prompt
      return this.mode === _EDIT;
    },

    userGeneratedPasswordsRequired() {
      if (this.isChange) {
        return true;
      }
      if (this.isCreate) {
        return !this.isRandomGenerated;
      }
      if (this.isEdit) {
        return !!this.passwordNew || !!this.passwordConfirm;
      }

      return false;
    }
  },
  created() {
    // Catch the 'create' case and there's no content
    this.validate();
  },

  methods: {
    passwordsMatch() {
      const match = this.passwordNew === this.passwordConfirm;

      this.errorMessages = this.passwordConfirmBlurred && !match ? [this.t('changePassword.errors.mismatchedPassword')] : [];

      return match;
    },

    baseIsUserGenPasswordValid() {
      return this.passwordsMatch() && !!this.passwordNew;
    },

    isValid() {
      if (this.isChange) {
        return !!this.passwordCurrent && (this.isRandomGenerated ? true : this.baseIsUserGenPasswordValid());
      }

      if (this.isRandomGenerated) {
        // If we're not changing current user... and password is randomly generated... there'll be no new/confirm mismatch
        return true;
      }

      if (this.isCreate) {
        return this.baseIsUserGenPasswordValid();
      }

      if (this.isEdit) {
        // If the user generated password is required... ensure it's valid
        return this.userGeneratedPasswordsRequired ? this.baseIsUserGenPasswordValid() : true;
      }

      return false;
    },

    validate() {
      const isValid = this.isValid();

      if (isValid) {
        // Covers the case where we don't re-evaluate the error messages (don't need to at the time)
        this.errorMessages = [];
      }

      this.$emit('valid', isValid);
      this.$emit('input', {
        password:          this.password,
        userChangeOnLogin: this.userChangeOnLogin
      });
    },

    async save(user) {
      if (this.passwordStrength < 2) {
        this.errorMessages = [this.t('changePassword.errors.strengthError')];
        throw new Error(this.t('changePassword.errors.strengthError'));
      }
      if (this.isChange) {
        await this.changePassword();
        if (this.form.deleteKeys) {
          await this.deleteKeys();
        }
      } else if (this.isEdit) {
        return this.setPassword(user);
      }
    },

    async setPassword(user) {
      // Error handling is catered for by caller
      await this.$store.dispatch('rancher/resourceAction', {
        type:       NORMAN.USER,
        actionName: 'setpassword',
        resource:   user,
        body:          { newPassword: this.isRandomGenerated ? this.encryptPassword(this.form.genP) : this.encryptPassword(this.form.newP) },
      });
    },

    async changePassword() {
      try {
        await this.$store.dispatch('rancher/collectionAction', {
          type:       NORMAN.USER,
          actionName: 'changepassword',
          body:          {
            currentPassword: this.encryptPassword(this.form.currentP),
            newPassword:     this.isRandomGenerated ? this.encryptPassword(this.form.genP) : this.encryptPassword(this.form.newP)
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

    encryptPassword(password) {
      if (this.disabledEncryption?.value === 'true') {
        return password;
      }

      return AESEncrypt(password.trim());
    },

    handlePasswordStrength(v) {
      this.passwordStrength = v;
      this.$emit('strengthChange', v);
    }
  },
};
</script>

<template>
  <div class="change-password" :class="{'change': isChange, 'create': isCreate, 'edit': isEdit}">
    <div class="form">
      <div class="fields">
        <Checkbox v-if="isChange" v-model="form.deleteKeys" label-key="changePassword.deleteKeys.label" class="mt-10" />
        <Checkbox v-if="isCreateEdit" v-model="userChangeOnLogin" label-key="changePassword.changeOnLogin.label" class="mt-10 type" />
        <Checkbox v-if="isCreateEdit" v-model="isRandomGenerated" label-key="changePassword.generatePassword.label" class="mt-10 type" />

        <!-- Create two 'invisible fields' for password managers -->
        <input
          id="username"
          type="text"
          name="username"
          autocomplete="username"
          :value="username"
          tabindex="-1"
          :data-lpignore="!isChange"
        >
        <input
          id="password"
          type="password"
          name="password"
          autocomplete="password"
          :value="password"
          tabindex="-1"
          :data-lpignore="!isChange"
        >
        <Password
          v-if="isChange"
          v-model="passwordCurrent"
          class="mt-10"
          :required="true"
          :label="t('changePassword.currentPassword.label')"
        ></Password>
        <div v-if="isRandomGenerated" :class="{'row': isCreateEdit}">
          <div :class="{'col': isCreateEdit, 'span-8': isCreateEdit}">
            <Password
              v-model="passwordGen"
              class="mt-10"
              :is-random="true"
              :required="false"
              :label="t('changePassword.randomGen.generated.label')"
            />
          </div>
        </div>
        <div v-else class="userGen" :class="{'row': isCreateEdit}">
          <div :class="{'col': isCreateEdit, 'span-4': isCreateEdit}">
            <Password
              v-model="passwordNew"
              class="mt-10"
              :label="t('changePassword.userGen.newPassword.label')"
              :required="userGeneratedPasswordsRequired"
              :ignore-password-managers="!isChange"
            />
          </div>
          <div :class="{'col': isCreateEdit, 'span-4': isCreateEdit}">
            <Password
              v-model="passwordConfirm"
              class="mt-10"
              :label="t('changePassword.userGen.confirmPassword.label')"
              :required="userGeneratedPasswordsRequired"
              :ignore-password-managers="!isChange"
              @blur="passwordConfirmBlurred = true"
            />
          </div>
        </div>
      </div>
      <Checkbox v-if="isChange" v-model="isRandomGenerated" label-key="changePassword.generatePassword.label" class="mt-10 type" />
      <div :class="{row: !isChange}">
        <div :class="{col: !isChange, 'span-4': !isChange}">
          <PasswordStrength class="mt-10" :password="isRandomGenerated ? passwordGen: passwordNew" @strengthChange="handlePasswordStrength"></PasswordStrength>
        </div>
      </div>
    </div>
    <div v-if="errorMessages && errorMessages.length" class="text-error" :class="{'row': isCreateEdit}">
      <div :class="{'col': isCreateEdit, 'span-8': isCreateEdit}">
        <Banner v-for="(err, i) in errorMessages" :key="i" color="error" :label="err" class="mb-0" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .change-password {
    display: flex;
    flex-direction: column;

    &.change {
      .form .fields {
        height: 240px;
      }
    }

    &.create, &.edit {
      .form {
        .fields {
          display: flex;
          flex-direction: column;
        }
      }
    }

    .form {
      display: flex;
      flex-direction: column;
      .fields{
        #username, #password {
          height: 0;
          width: 0;
          background-size: 0;
          padding: 0;
          border: none;
        }
      }
    }

    .text-error {
      height: 53px;
    }
  }

</style>
