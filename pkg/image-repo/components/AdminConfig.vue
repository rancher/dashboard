<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20 header">
      <h3 class="header__title">
        {{ t('harborConfig.access.title') }}
      <!-- <i
        v-clean-tooltip="t('harborConfig.access.subtitle')"
        class="icon icon-info icon-lg"
      /> -->
      </h3>
      <p class="header__sub-title">
        {{ t('harborConfig.access.subtitle') }}
      </p>
      <div
        class="header__action"
      >
        <button
          v-show="harborAccountValid && currentView === 'view'"
          class="btn role-secondary"
          @click="showChangePwdView"
        >
          <t k="imageRepoSection.action.changePwd" />
        </button>
        <button
          v-show="currentView === 'view'"
          class="btn role-secondary"
          @click="showEditView"
        >
          <t k="imageRepoSection.action.edit" />
        </button>
      </div>
    </div>
    <Banner
      v-if="methodNotSupported"
      color="warning"
      :label="t('imageRepoSection.adminConfigPage.methodNotSupported', {auth: authMode, rancherAuthMode: rancherAuthMode})"
    />
    <div>
      <div class="row mb-20">
        <div class="col span-12">
          <LabeledInput
            v-model.trim="harborConfig.url"
            :mode="mode"
            :label="t('harborConfig.form.address.label')"
            :placeholder="t('harborConfig.form.address.placeholder')"
            required
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model.trim="harborConfig.username"
            :mode="mode"
            :label="t('harborConfig.form.username.label')"
            :placeholder="t('harborConfig.form.username.placeholder')"
            required
          />
        </div>
        <div
          v-show="mode === 'edit'"
          class="col span-6"
        >
          <Password
            v-model="harborConfig.password"
            :mode="mode"
            :label="t('harborConfig.form.pw.label')"
            :placeholder="t('harborConfig.form.pw.placeholder')"
            required
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="harborConfig.version"
            name="version"
            :options="['v1', 'v2.0']"
            :label="t('harborConfig.form.version.label')"
            :labels="[
              'V1',
              'V2',
            ]"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model="harborConfig.insecureSkipVerify"
            :mode="mode"
            :label="t('harborConfig.form.harborInsecureSkipVerify')"
          />
        </div>
      </div>

      <div
        v-show="currentView === 'changePwd'"
        class="change-pwd-view mt-20 mb-20"
      >
        <Password
          v-model="changePwdForm.oldPwd"
          :label="t('changePassword.currentPassword.label')"
          :placeholder="t('harborConfig.form.pw.placeholder')"
          required
        />
        <Password
          v-model="changePwdForm.newPwd"
          :label="t('harborConfig.form.newPw.label')"
          :placeholder="t('harborConfig.form.pw.placeholder')"
          required
        />
        <Password
          v-model="changePwdForm.confirmPwd"
          :label="t('harborConfig.form.confirmPw.label')"
          :placeholder="t('harborConfig.form.pw.placeholder')"
          required
        />
      </div>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </div>
    <div
      v-show="currentView === 'edit'"
      class="actions"
    >
      <button
        class="btn role-secondary"
        @click="showView()"
      >
        <t k="generic.cancel" />
      </button>
      <AsyncButton
        :mode="mode"
        :disabled="loading"
        @click="save"
      />
      <AsyncButton
        mode="delete"
        class="btn bg-error"
        @click="removeHarborAccount"
      />
    </div>
    <div
      v-show="currentView === 'changePwd'"
      class="actions"
    >
      <button
        class="btn role-secondary"
        @click="showView()"
      >
        <t k="generic.cancel" />
      </button>
      <AsyncButton
        mode="apply"
        :disabled="loading"
        @click="changePwd"
      />
    </div>
    <div v-if="harborAccountValid && currentView === 'view'">
      <div>
        <hr class="mt-20 mb-20">
        <p
          v-clean-html="t('harborConfig.advanced.harborLink', { harborServer: harborConfig.url }, true)"
          class="mb-20"
        />
        <div class="mb-20 label-header">
          <h3 class="label-title">
            {{ t('harborConfig.advanced.label.title') }}
          </h3>
          <p
            class="label-sub-title"
          >
            {{ t('harborConfig.advanced.label.subtitle') }}
          </p>
          <div class="label-action">
            <button
              class="btn role-primary"
              @click="showAddLabelModal"
            >
              <t k="harborConfig.formTag.btn.add" />
            </button>
          </div>
        </div>
      </div>
      <LabelsV1
        ref="labelRef"
        :api-request="harborAPIRequest"
      />
    </div>
  </div>
</template>
<script>
/* eslint-disable standard/no-callback-literal node/no-callback-literal */
import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import Password from '@shell/components/form/Password';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { harborAPI } from '../api/image-repo.js';
import { Banner } from '@components/Banner';
import LabelsV1 from './LabelsV1.vue';
import { stringify } from '@shell/utils/error';
import Schema from 'async-validator';
import { mapGetters } from 'vuex';

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

const urlReg = /^http(s)?:\/\/.+/i;

function extractDomainNameOrIP(url) {
  const result = /^https?:\/\/([a-zA-Z0-9-.]+)/.exec(url);

  if (result && result.length === 2) {
    return result[1];
  }

  return '';
}

export default {
  components: {
    LabeledInput,
    AsyncButton,
    Password,
    RadioGroup,
    Checkbox,
    Banner,
    Loading,
    LabelsV1
  },

  async fetch() {
    await this.initForm();
  },

  data() {
    const descriptor = {
      url: [
        {
          type:     'string',
          required: true,
          message:  () => this.t('harborConfig.validate.urlReq')
        }, {
          validator: (rule, value, callback, source, options) => {
            const errors = [];

            if (!urlReg.test(value)) {
              errors.push(this.t('harborConfig.validate.urlFormatError'));
            }

            return errors;
          }
        }
      ],
      username:
      {
        type:     'string',
        required: true,
        message:  () => this.t('harborConfig.validate.usernameReq')
      },

      password: {
        type:     'string',
        required: true,
        message:  () => this.t('harborConfig.validate.pwReq')
      },

    };

    return {
      mode:               'edit',
      descriptor,
      loading:            false,
      harborAccountValid: false,
      currentAccount:     null,
      harborConfig:       {
        url:                '',
        username:           '',
        password:           '',
        version:            '',
        insecureSkipVerify: false,
      },
      changePwdForm: {
        oldPwd:     '',
        newPwd:     '',
        confirmPwd: ''
      },
      harborAPIRequest:          null,
      errors:                    [],
      insecureSkipVerifySetting: null,
      harborSysntemInfo:         null,
      currentView:               'view', // view, edit, changePwd
    };
  },
  computed: {
    ...mapGetters({ me: 'auth/me', principalId: 'auth/principalId' }),
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
    }
  },
  methods: {
    showAddLabelModal() {
      this.$refs.labelRef.showAddModal();
    },
    async initForm() {
      this.harborAccountValid = false;
      const harborAPIRequest = harborAPI({ store: this.$store });

      const versionP = harborAPIRequest.fetchHarborVersion();

      const harborServerP = harborAPIRequest.fetchHarborServerUrl();

      const insecureSkipVerifyP = harborAPIRequest.fetchInsecureSkipVerify();

      const [version, harborServer, insecureSkipVerifySetting] = await Promise.all([versionP, harborServerP, insecureSkipVerifyP]);

      if (harborServer.value) {
        await harborAPIRequest.initAPIRequest(version.value, harborServer.value);
        const harborUser = await harborAPIRequest.fetchHarborUserInfo();

        this.harborConfig.username = harborUser.value;
      }

      this.harborAPIRequest = harborAPIRequest;
      if (version.value) {
        this.harborConfig.version = version.value;
      } else {
        this.harborConfig.version = 'v1';
      }

      this.harborConfig.url = harborServer.value;
      this.harborConfig.insecureSkipVerify = insecureSkipVerifySetting.value === 'true';
      this.insecureSkipVerifySetting = insecureSkipVerifySetting;
      if (this.harborConfig.url && this.harborConfig.username) {
        try {
          await harborAPIRequest.fetchSystemInfo();
        } catch (err) {
          this.mode = 'edit';
          this.currentView = 'edit';
          this.errors = [this.t('harborConfig.validate.unableAccess')];

          return;
        }
        try {
          await this.testHarborAccount();
          this.mode = 'view';
          this.currentView = 'view';
        } catch (err) {
          this.mode = 'edit';
          this.currentView = 'edit';
          this.errors = [err];
        }

        return;
      }

      this.mode = 'edit';
      this.currentView = 'edit';
    },
    async removeHarborAccount(cb) {
      this.loading = true;
      try {
        await this.harborAPIRequest.removeHarborAccount();
        cb(true);
      } catch (err) {
        this.errors = [stringify(err)];
        cb(false);
      }
      this.loading = false;
      await this.initForm();
    },
    async save(cb) {
      this.loading = true;
      try {
        await this.validate();
      } catch (err) {
        this.errors = err.errors.map((e) => e.message);
        cb(false);
        this.loading = false;

        return;
      }

      const {
        url, username, password, version, insecureSkipVerify
      } = this.harborConfig;

      try {
        this.insecureSkipVerifySetting.value = `${ insecureSkipVerify }`;
        await this.insecureSkipVerifySetting.save();
        await this.harborAPIRequest.addWhitelist(extractDomainNameOrIP(url));
        this.harborAPIRequest.setHarborServer(url);
        this.harborAPIRequest.setHarborVersion(version);
        this.harborAPIRequest.updateBaseUrl();
        let sysntemInfo;

        try {
          sysntemInfo = await this.harborAPIRequest.fetchSystemInfoToTest(url, version);
        } catch (err) {
          const info = await this.testHarborVersion(url, ['v2.0']);

          if (info.harbor_version) {
            this.errors = [this.t('harborConfig.validate.harborInfoVersionError')];
          } else {
            this.errors = [stringify(err)];
          }
          this.loading = false;

          return cb(false);
        }
        await this.harborAPIRequest.saveHarborAccount(url, username, password, version, sysntemInfo);
        this.harborSysntemInfo = sysntemInfo;
        await this.testHarborAccount();
        this.mode = 'view';
        this.currentView = 'view';
      } catch (err) {
        if (typeof err === 'string') {
          this.errors = [err];
        } else if ( err && err.status > 500) {
          this.errors = [this.t('harborConfig.validate.unableAccess')];
        } else {
          this.errors = [this.t('harborConfig.validate.harborInfoError')];
        }
        cb(false);
        this.loading = false;

        return;
      }

      cb(true);
      this.loading = false;
    },
    validate() {
      const validator = new Schema(this.descriptor);

      return validator.validate(this.harborConfig);
    },

    async testHarborVersion(url, versions) {
      const requests = versions.map((v) => this.harborAPIRequest.fetchSystemInfoToTest(url, v));
      const results = await Promise.allSettled(requests);

      return results.find((r) => r.status === 'fulfilled' && r.value)?.value;
    },
    async testHarborAccount() {
      const account = await this.harborAPIRequest.fetchCurrentHarborUser();

      if (account.has_admin_role || account.sysadmin_flag) {
        this.harborAccountValid = true;
        this.currentAccount = account;
        this.errors = [];

        return account;
      }

      this.harborAccountValid = false;
      this.currentAccount = null;
      let err = this.t('harborConfig.validate.notAdmin');

      if (typeof account === 'string') {
        err = this.t('harborConfig.validate.addressError');
      }

      throw err;
    },
    showChangePwdView() {
      this.currentView = 'changePwd';
      this.mode = 'view';
    },
    showView() {
      this.currentView = 'view';
      this.mode = 'view';
    },
    showEditView() {
      this.currentView = 'edit';
      this.mode = 'edit';
    },
    async changePwd(cb) {
      this.loading = true;
      const result = this.validateNewPwd();

      if (!result) {
        this.loading = false;
        cb(false);

        return;
      }

      if (!this.currentAccount?.user_id) {
        this.errors = [this.t('harborConfig.validate.errorAndResetHarbor')];
        cb(false);
        this.loading = false;

        return;
      }
      const userId = this.$store.getters['auth/me']?.id;
      const { newPwd: newPassword, oldPwd: oldPassword } = this.changePwdForm;

      try {
        await this.harborAPIRequest.updateHarborPwd(userId, { newPassword, oldPassword });
        this.showView();
        cb(true);
        this.loading = false;
      } catch (err) {
        const status = parseInt(err.status, 10);

        if ([403, 401].includes(status)) {
          this.errors = [this.t('harborConfig.validate.errorAndResetHarbor')];
        } else if (status === 400) {
          this.errors = [this.t('harborConfig.validate.errorOldPwdSameAsNew')];
        } else {
          this.errors = [stringify(err && err.body)];
        }
        this.loading = false;
        cb(false);
      }
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

  .label-header {
    display: grid;
    grid-template-areas: 'title action'
                          'sub-title action';
    grid-template-columns: 1fr auto;
  }
  .label-title {
    grid-area: title;
  }
  .label-sub-title {
    grid-area: sub-title;
  }
  .label-action {
    grid-area: action;
  }
</style>
