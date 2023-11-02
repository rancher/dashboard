<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20 header">
      <h3 class="header__title">
        <span v-if="currentHarborAccountState === harborAccountState.sync">{{ t('harborConfig.sync.title') }}</span>
        <span v-else>{{ t('harborConfig.setting.title') }}</span>
      </h3>
      <p class="header__sub-title">
        <span v-if="currentHarborAccountState === harborAccountState.sync">{{ t('harborConfig.sync.subtitle') }}</span>
        <span v-else>{{ t('harborConfig.setting.subtitle') }}</span>
      </p>
      <div
        class="header__action"
      >
        <button
          v-show="currentHarborAccountState === harborAccountState.synced"
          class="btn role-secondary"
          @click="showChangePwdView"
        >
          {{ t('imageRepoSection.action.changePwd') }}
        </button>
      </div>
    </div>
    <Banner
      v-if="methodNotSupported"
      color="warning"
      :label="t('imageRepoSection.userConfigPage.methodNotSupported', {auth: authMode, rancherAuthMode: rancherAuthMode})"
    />
    <div>
      <div v-if="currentHarborAccountState === harborAccountState.waiting">
        <Banner
          color="info"
          :label="t('harborConfig.wait')"
        />
      </div>
      <div v-else-if="currentHarborAccountState === harborAccountState.synced">
        <div class="row mb-20">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="harborServerSetting.value"
              mode="view"
              :label="t('harborConfig.form.address.label')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model.trim="harborAccount.username"
              mode="view"
              :label="t('harborConfig.form.username.label')"
            />
          </div>
        </div>
        <div>
          <Banner
            v-for="(err, i) in errors"
            :key="i"
            color="error"
            :label="err"
          />
        </div>
        <div
          v-if="errors.length > 0"
          class="actions"
        >
          <AsyncButton
            :action-label="t('imageRepoSection.userConfigPage.reSyncAccount')"
            :disabled="loading"
            @click="reSyncAccount"
          />
        </div>
      </div>
      <div v-else-if="currentHarborAccountState === harborAccountState.sync && !methodNotSupported">
        <div class="row mb-20">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="userAccount.username"
              mode="view"
              :label="t('harborConfig.form.username.label')"
            />
          </div>
        </div>
        <template v-if="!isDBAuthMode">
          <div
            v-if="requiredAuth"
            class="row mb-20"
          >
            <div class="col span-12">
              <Password
                v-model="userAccount.password"
                mode="edit"
                :label="t('harborConfig.form.pw.label')"
                :placeholder="t('harborConfig.form.pw.placeholder')"
                required
              />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="row mb-20">
            <div class="col span-12">
              <LabeledInput
                v-model.trim="userAccount.email"
                mode="edit"
                :label="t('harborConfig.form.email.label')"
                :placeholder="t('harborConfig.form.email.placeholder')"
              />
            </div>
          </div>
          <div
            v-if="requiredAuth || (rancherAuthMode === 'KEYCLOAK_USER' && isDBAuthMode)"
            class="row mb-20"
          >
            <div class="col span-12">
              <Password
                v-model="userAccount.password"
                mode="edit"
                :label="t('harborConfig.form.pw.label')"
                :placeholder="t('harborConfig.form.pw.placeholder')"
                required
              />
            </div>
          </div>
          <template v-if="rancherAuthMode === 'KEYCLOAK_USER' && isDBAuthMode">
            <Banner
              color="warning"
              :label="t('imageRepoSection.userConfigPage.keyCloakAuthWarning')"
            />
          </template>
        </template>
        <div>
          <Banner
            v-for="(err, i) in errors"
            :key="i"
            color="error"
            :label="err"
          />
        </div>
        <div
          v-if="harborSysntemInfo"
          class="actions"
        >
          <AsyncButton
            :action-label="t('imageRepoSection.userConfigPage.syncAccount')"
            :disabled="loading"
            @click="syncAccount"
          />
        </div>
      </div>
      <div v-else-if="currentHarborAccountState === harborAccountState.changePwd">
        <div class="row mb-20">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="harborServerSetting.value"
              mode="view"
              :label="t('harborConfig.form.address.label')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model.trim="harborAccount.username"
              mode="view"
              :label="t('harborConfig.form.username.label')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-12">
            <Password
              v-model="changePwdForm.oldPassword"
              mode="edit"
              :label="t('changePassword.currentPassword.label')"
              required
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-12">
            <Password
              v-model="changePwdForm.newPassword"
              mode="edit"
              :label="t('harborConfig.form.newPw.label')"
              :placeholder="t('harborConfig.form.newPw.placeholder')"
              required
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-12">
            <Password
              v-model="changePwdForm.confirmPassword"
              mode="edit"
              :label="t('harborConfig.form.confirmPw.label')"
              :placeholder="t('harborConfig.form.confirmPw.placeholder')"
              required
            />
          </div>
        </div>
        <div>
          <Banner
            v-for="(err, i) in errors"
            :key="i"
            color="error"
            :label="err"
          />
        </div>
        <div class="actions">
          <AsyncButton
            :disabled="loading"
            @click="confirmChangePwd"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable standard/no-callback-literal node/no-callback-literal standard/no-call node/no-callback */
import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import Password from '@shell/components/form/Password';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { harborAPI } from '../api/image-repo.js';
import { Banner } from '@components/Banner';
import { stringify } from '@shell/utils/error';
import Schema from 'async-validator';
import { mapGetters } from 'vuex';
import { findBy } from '@shell/utils/array';
import { NORMAN } from '@shell/config/types';

const syncedHarborAccount = 'syncedAccount'; // user is synced harbor account
const syncHarborAccount = 'syncAccount'; // user need to sync harbor account
const changeHarborPwd = 'changeAccountPwd';// user will change pwd
const waitingSyncHarborAccount = 'waiting';
const supportAccountSyncAuthModes = [
  {
    rancherAuthMode: 'keycloak_user',
    harborAuthMode:  'db_auth',
  },
  {
    rancherAuthMode: 'local',
    harborAuthMode:  'db_auth',
  },
  {
    rancherAuthMode: 'activedirectory_user_uid',
    harborAuthMode:  'db_auth',
  },
  {
    rancherAuthMode: 'activedirectory_user_uid',
    harborAuthMode:  'ldap_auth',
  },
  {
    rancherAuthMode: 'openldap_user_uid',
    harborAuthMode:  'db_auth',
  },
  {
    rancherAuthMode: 'openldap_user_uid',
    harborAuthMode:  'ldap_auth',
  },
];

export default {
  components: {
    LabeledInput,
    AsyncButton,
    Password,
    RadioGroup,
    Checkbox,
    Banner,
    Loading
  },

  async fetch() {
    await this.initForm();
  },

  data() {
    return {
      mode:                 'edit',
      loading:              false,
      harborServerSetting:  null,
      harborVersionSetting: null,
      errors:               [],
      harborSysntemInfo:    null,
      requiredAuth:         false,
      harborAccount:        { username: '' },
      userAccount:          {
        username: '',
        password: '',
        email:    ''
      },
      changePwdForm: {
        oldPassword:     '',
        newPassword:     '',
        confirmPassword: ''
      },
      harborAccountState: {
        synced:    syncedHarborAccount,
        sync:      syncHarborAccount,
        waiting:   waitingSyncHarborAccount,
        changePwd: changeHarborPwd
      },
      principals:      [],
      changeHarborPwd: false,
    };
  },
  computed: {
    ...mapGetters({ me: 'auth/me', principalId: 'auth/principalId' }),
    principal() {
      return findBy(this.principals, 'me', true) || {};
    },
    isDBAuthMode() {
      return this.harborSysntemInfo?.auth_mode === 'db_auth';
    },
    authMode() {
      const m = this.harborSysntemInfo?.auth_mode ?? '';

      return m.split('_')[0].toUpperCase();
    },
    rancherAuthMode() {
      return this.principalId?.split(':')[0].toUpperCase();
    },
    methodNotSupported() {
      const rancherAuthMode = this.principalId?.split(':')[0];
      const authMode = this.harborSysntemInfo?.auth_mode;

      if (!authMode) {
        return false;
      }

      return !supportAccountSyncAuthModes.some((m) => m.rancherAuthMode === rancherAuthMode && m.harborAuthMode === authMode);
    },
    currentHarborAccountState() {
      const url = this.harborServerSetting?.value;
      const syncComplete = this.me?.annotations?.['management.harbor.pandaria.io/synccomplete'] === 'true';

      if (this.changeHarborPwd) {
        return this.harborAccountState.changePwd;
      }
      if (url) {
        if (syncComplete) {
          return this.harborAccountState.synced;
        }

        return this.harborAccountState.sync;
      }

      return this.harborAccountState.waiting;
    },
    harborAPIRequest() {
      const harborAPIRequest = harborAPI({ store: this.$store });

      if (this.harborServerAndVersionConfigured) {
        harborAPIRequest.initAPIRequest(this.harborVersionSetting?.value, this.harborServerSetting?.value);
      }

      return harborAPIRequest;
    },
    harborServerAndVersionConfigured() {
      if (!this.harborServerSetting?.value) {
        return false;
      }

      return this.harborServerSetting?.value && (this.harborVersionSetting?.value ?? 'v1');
    }
  },
  watch: {
    principal(p) {
      if (!p) {
        return;
      }
      this.userAccount.username = p.loginName ?? p.name;
      this.userAccount.password = '';
    },
    me: {
      handler(me) {
        this.userAccount.email = me?.annotations?.['authz.management.cattle.io.cn/harboremail'] ?? '';
      },
      immediate: true,
    },
    async harborServerAndVersionConfigured(v) {
      if (!v) {
        return;
      }
      const harborUserSetting = await this.harborAPIRequest.fetchHarborUserInfo();

      this.harborUserSetting = harborUserSetting;

      try {
        const sysntemInfo = await this.harborAPIRequest.fetchSystemInfo();

        this.harborSysntemInfo = sysntemInfo;
      } catch (err) {
        this.errors = [this.t('harborConfig.validate.unableAccess')];
      }
    },
    async currentHarborAccountState(s) {
      if (s === this.harborAccountState.synced) {
        try {
          const harborAccount = await this.harborAPIRequest.fetchCurrentHarborUser();

          if (typeof harborAccount === 'string') {
            this.errors = [this.t('harborConfig.validate.addressError')];
          } else {
            this.harborAccount = harborAccount;
          }
        } catch (err) {
          if (err.status === 410) {
            this.requiredAuth = true;
          }
        }
      }
    }
  },
  methods: {
    async initForm() {
      const harborAPIRequest = harborAPI({ store: this.$store });

      const versionP = harborAPIRequest.fetchHarborVersion();

      const harborServerP = harborAPIRequest.fetchHarborServerUrl();

      const [harborVersionSetting, harborServerSetting] = await Promise.all([versionP, harborServerP]);

      this.harborServerSetting = harborServerSetting;
      this.harborVersionSetting = harborVersionSetting;
      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals', force: true }
      });
    },
    save() {},
    reSyncAccount() {},
    async syncAccount(cb) {
      this.errors = [];
      const { email, password, username } = { ...this.userAccount };
      const passwordRule = {
        type:     'string',
        required: true,
        message:  () => this.t('harborConfig.validate.pwReq')
      };
      const emailRule = [{
        type:     'string',
        required: true,
        message:  () => this.t('harborConfig.validate.emailReq')
      }, {
        type:    'email',
        message: () => this.t('harborConfig.validate.emailUrlError')
      }];

      if (!this.isDBAuthMode) {
        if (this.requiredAuth) {
          const validator = new Schema({ password: passwordRule });

          try {
            await validator.validate({ password });
          } catch (err) {
            this.errors = err.errors.map((e) => e.message);
          }
        }
      } else {
        const rule = { email: emailRule };

        if (this.requiredAuth || (this.rancherAuthMode === 'KEYCLOAK_USER' && this.isDBAuthMode)) {
          rule.password = passwordRule;
        }

        const validator = new Schema(rule);

        try {
          await validator.validate({ email, password });
        } catch (err) {
          this.errors = err.errors.map((e) => e.message);
        }
      }
      if (this.errors.length > 0) {
        cb(false);

        return;
      }

      const form = {};

      if (!this.isDBAuthMode) {
        if (this.requiredAuth) {
          form.username = username;
          form.password = password;
        }
      } else {
        form.username = username;
        form.email = email;
        if (this.requiredAuth || (this.rancherAuthMode === 'KEYCLOAK_USER' && this.isDBAuthMode)) {
          form.password = password;
        }
      }

      try {
        await this.harborAPIRequest.syncHarborAccount(form);
        this.requiredAuth = false;
        cb(true);
      } catch (err) {
        if (err?.status === 410) {
          this.requiredAuth = true;
          const message = err?.message;

          if (message?.indexOf('"code":401') !== -1) {
            this.errors = [this.t('harborConfig.validate.pwdError')];
          } else {
            this.errors = [stringify(err)];
          }
        } else {
          this.errors(stringify(err));
        }

        cb(false);
      }
    },
    async confirmChangePwd(cb) {
      this.errors = [];
      const { oldPassword, newPassword, confirmPassword } = this.changePwdForm;

      if ((newPassword !== '' || confirmPassword !== '') && newPassword !== confirmPassword) {
        this.errors = [this.t('harborConfig.validate.confirmError')];
      }
      if (this.errors.length > 0) {
        cb(false);

        return;
      }

      const { user_id: harborUserId } = this.harborAccount;

      if (!harborUserId) {
        this.errors = [this.t('harborConfig.validate.errorAndResetHarbor')];
        cb(false);

        return;
      }
      const form = { newPassword, oldPassword };
      const userId = this.me.id;

      try {
        await this.harborAPIRequest.updateHarborPwd(userId, form);
        this.changeHarborPwd = false;
      } catch (err) {
        cb(false);
        this.errors = [stringify(err)];
      }
    },
    showChangePwdView() {
      this.changeHarborPwd = true;
      this.changePwdForm.newPassword = '';
      this.changePwdForm.oldPassword = '';
      this.changePwdForm.confirmPassword = '';
      this.email = this.userAccount.email;
    },
    validateNewPwd() {
      const pwdReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,20}$/;
      const { newPwd, oldPwd, confirmPwd } = this.changePwdForm;
      const errors = [];

      if (newPwd !== confirmPwd) {
        errors.push(this.t('harborConfig.validate.confirmError'));
      }
      if (!pwdReg.test(newPwd)) {
        errors.push(this.t('harborConfig.validate.formatError'));
      }
      if (!pwdReg.test(oldPwd)) {
        errors.push(this.t('harborConfig.validate.formatError'));
      }
      if (errors.length > 0) {
        this.errors = errors;

        return false;
      }

      return true;
    },
  }
};
</script>
<style scoped>
  .actions {
    display: flex;
    gap: 20px;
    justify-content: center;
  }
  .header {
    display: grid;
    grid-template-areas: 'title action'
                          'sub-tile action';
    grid-template-columns: 1fr auto;
  }
  .header__title {
    grid-area: title;
  }
  .header__sub-title {
    grid-area: sub-tile;
  }
  .header__action {
    grid-area: action;
  }
  .change-pwd-view {
    display: grid;
    gap: 20px;
  }
</style>
