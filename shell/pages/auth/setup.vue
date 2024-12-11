<script>
import { randomStr } from '@shell/utils/string';
import { LabeledInput } from '@components/Form/LabeledInput';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import AsyncButton from '@shell/components/AsyncButton';
import { LOGGED_OUT, SETUP } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { Checkbox } from '@components/Form/Checkbox';
import { getVendor, getProduct, setVendor } from '@shell/config/private-label';
import { RadioGroup } from '@components/Form/Radio';
import { setSetting } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Password from '@shell/components/form/Password';
import { applyProducts } from '@shell/store/type-map';
import BrandImage from '@shell/components/BrandImage';
import { waitFor } from '@shell/utils/async';
import { Banner } from '@components/Banner';
import FormValidation from '@shell/mixins/form-validation';
import isUrl from 'is-url';
import { isLocalhost } from '@shell/utils/validators/setting';
import Loading from '@shell/components/Loading';

const calcIsFirstLogin = (store) => {
  const firstLoginSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);

  return firstLoginSetting?.value === 'true';
};

const calcMustChangePassword = async(store) => {
  await store.dispatch('auth/getUser');

  const out = store.getters['auth/v3User']?.mustChangePassword;

  return out;
};

export default {
  mixins: [FormValidation],

  data() {
    return {
      passwordOptions: [
        { label: this.t('setup.useRandom'), value: true },
        { label: this.t('setup.useManual'), value: false }],
      fvFormRuleSets: [{
        path:       'serverUrl',
        rootObject: this,
        rules:      ['required', 'https', 'url', 'trailingForwardSlash']
      }],
      productName: '',
      vendor:      getVendor(),
      product:     getProduct(),
      step:        parseInt(this.$route.query.step, 10) || 1,

      useRandom:          true,
      haveCurrent:        false,
      username:           null,
      isFirstLogin:       false,
      mustChangePassword: false,
      current:            null,
      password:           randomStr(),
      confirm:            null,
      v3User:             null,
      serverUrl:          null,
      mcmEnabled:         null,
      eula:               false,
      principals:         null,
      errors:             []
    };
  },

  async beforeCreate() {
    const isFirstLogin = calcIsFirstLogin(this.$store);
    const mustChangePassword = await calcMustChangePassword(this.$store);

    if (isFirstLogin) {
      // Always show setup if this is the first log in
      return;
    } else if (mustChangePassword) {
      // If the password needs changing and this isn't the first log in ensure we have the password
      if (!!this.$store.getters['auth/initialPass']) {
        // Got it... show setup
        return;
      }
      // Haven't got it... redirect to log in so we get it
      await this.$store.dispatch('auth/logout', null, { root: true });

      return this.$router.replace(`/auth/login?${ LOGGED_OUT }`);
    }

    // For all other cases we don't need to show setup
    return this.$router.replace('/');
  },

  components: {
    AsyncButton, LabeledInput, CopyToClipboard, Checkbox, RadioGroup, Password, BrandImage, Banner, Loading
  },

  async fetch() {
    const serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    let plSetting;

    try {
      plSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);
    } catch (e) {
      // Older versions used Norman API to get these
      plSetting = await this.$store.dispatch('rancher/find', {
        type: NORMAN.SETTING,
        id:   SETTING.PL,
        opt:  { url: `/v3/settings/${ SETTING.PL }` }
      });
    }

    if (plSetting.value?.length && plSetting.value !== getVendor()) {
      setVendor(plSetting.value);
    }

    const productName = plSetting.default;

    const principals = await this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: '/v3/principals' } });
    const me = findBy(principals, 'me', true);

    const current = this.$route.query[SETUP] || this.$store.getters['auth/initialPass'];
    const v3User = this.$store.getters['auth/v3User'] ?? {};

    const mcmFeature = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.FEATURE, id: 'multi-cluster-management', opt: { url: `/v1/${ MANAGEMENT.FEATURE }/multi-cluster-management` }
    });

    const mcmEnabled = (mcmFeature?.spec?.value || mcmFeature?.status?.default) && productName !== 'Harvester';

    let serverUrl;

    if (serverUrlSetting?.value) {
      serverUrl = serverUrlSetting.value;
    } else {
      serverUrl = window.location.origin;
    }

    const isFirstLogin = await calcIsFirstLogin(this.$store);
    const mustChangePassword = await calcMustChangePassword(this.$store);

    this['productName'] = productName;
    this['haveCurrent'] = !!current;
    this['username'] = me?.loginName || 'admin';
    this['isFirstLogin'] = isFirstLogin;
    this['mustChangePassword'] = mustChangePassword;
    this['current'] = current;
    this['v3User'] = v3User;
    this['serverUrl'] = serverUrl;
    this['mcmEnabled'] = mcmEnabled;
    this['principals'] = principals;
  },

  computed: {
    saveEnabled() {
      if ( !this.eula && this.isFirstLogin) {
        return false;
      }

      if ( this.mustChangePassword ) {
        if ( !this.current ) {
          return false;
        }

        if ( !this.useRandom ) {
          if ( !this.password || this.password !== this.confirm ) {
            return false;
          }
        }
      }

      if (!isUrl(this.serverUrl) || this.fvGetPathErrors(['serverUrl']).length > 0) {
        return false;
      }

      return true;
    },

    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    showLocalhostWarning() {
      return isLocalhost(this.serverUrl);
    }
  },

  watch: {
    useRandom(neu) {
      if (neu) {
        this.password = randomStr();
      } else {
        this.password = '';
        this.$nextTick(() => {
          this.$refs.password.focus();
        });
      }
    }
  },

  methods: {
    async save(buttonCb) {
      const promises = [];

      try {
        await applyProducts(this.$store, this.$plugin);
        await this.$store.dispatch('loadManagement');

        if ( this.mustChangePassword ) {
          await this.$store.dispatch('rancher/request', {
            url:    '/v3/users?action=changepassword',
            method: 'post',
            data:   {
              currentPassword: this.current,
              newPassword:     this.password
            },
          });
        } else {
          promises.push(setSetting(this.$store, SETTING.FIRST_LOGIN, 'false'));
        }

        const user = this.v3User;

        user.mustChangePassword = false;
        this.$store.dispatch('auth/gotUser', user);

        if (this.isFirstLogin) {
          promises.push( setSetting(this.$store, SETTING.EULA_AGREED, (new Date()).toISOString()) );

          if ( this.mcmEnabled && this.serverUrl ) {
            promises.push( setSetting(this.$store, SETTING.SERVER_URL, this.serverUrl) );
          }
        }

        await Promise.all(promises);

        await waitFor(() => !calcIsFirstLogin(this.$store), 'first login to be completed', 10000, 1000, true);

        buttonCb(true);
        this.done();
      } catch (err) {
        console.error(err) ; // eslint-disable-line no-console
        buttonCb(false);
        this.errors = exceptionToErrorsArray(err);
      }
    },

    done() {
      this.$router.replace('/');
    },

    onServerUrlChange(value) {
      this.serverUrl = value.trim();
    },
  },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    mode="relative"
  />
  <form
    v-else
    class="setup"
    @submit.prevent
  >
    <div class="row">
      <div class="col span-6 form-col">
        <div>
          &nbsp;
        </div>
        <div>
          <h1 class="text-center">
            {{ t('setup.welcome', {product}) }}
          </h1>

          <template v-if="mustChangePassword">
            <p
              v-clean-html="t(isFirstLogin ? 'setup.setPassword' : 'setup.newUserSetPassword', { username }, true)"
              class="text-center mb-20 mt-20 setup-title"
            />
            <Password
              v-if="!haveCurrent"
              v-model:value.trim="current"
              autocomplete="current-password"
              type="password"
              :label="t('setup.currentPassword')"
              class="mb-20"
              :required="true"
            />

            <!-- For password managers... -->
            <input
              type="hidden"
              name="username"
              autocomplete="username"
              :value="username"
            >
            <div class="mb-20">
              <RadioGroup
                v-model:value="useRandom"
                data-testid="setup-password-mode"
                name="password-mode"
                :options="passwordOptions"
              />
            </div>
            <div class="mb-20">
              <LabeledInput
                v-if="useRandom"
                ref="password"
                v-model:value.trim="password"
                :type="useRandom ? 'text' : 'password'"
                :disabled="useRandom"
                data-testid="setup-password-random"
                label-key="setup.newPassword"
              >
                <template
                  v-if="useRandom"
                  #suffix
                >
                  <div
                    class="addon"
                    style="padding: 0 0 0 12px;"
                  >
                    <CopyToClipboard
                      :text="password"
                      class="btn-sm"
                    />
                  </div>
                </template>
              </LabeledInput>
              <Password
                v-else
                ref="password"
                v-model:value.trim="password"
                :label="t('setup.newPassword')"
                data-testid="setup-password"
                :required="true"
              />
            </div>
            <Password
              v-show="!useRandom"
              v-model:value.trim="confirm"
              autocomplete="new-password"
              data-testid="setup-password-confirm"
              :label="t('setup.confirmPassword')"
              :required="true"
            />
          </template>

          <template v-if="isFirstLogin">
            <template v-if="mcmEnabled">
              <hr
                v-if="mustChangePassword"
                class="mt-20 mb-20"
              >
              <p>
                <t
                  k="setup.serverUrl.tip"
                  :raw="true"
                />
              </p>
              <div class="mt-20">
                <Banner
                  v-if="showLocalhostWarning"
                  color="warning"
                  :label="t('validation.setting.serverUrl.localhost')"
                  data-testid="setup-serverurl-localhost-warning"
                />
                <Banner
                  v-for="(err, i) in fvGetPathErrors(['serverUrl'])"
                  :key="i"
                  color="error"
                  :label="err"
                  data-testid="setup-error-banner"
                />
                <LabeledInput
                  v-model:value="serverUrl"
                  :label="t('setup.serverUrl.label')"
                  data-testid="setup-server-url"
                  :rules="fvGetAndReportPathRules('serverUrl')"
                  :required="true"
                  @update:value="onServerUrlChange"
                />
              </div>
            </template>

            <div class="checkbox pt-10 eula">
              <Checkbox
                id="checkbox-eula"
                v-model:value="eula"
                data-testid="setup-agreement"
              >
                <template #label>
                  <t
                    k="setup.eula"
                    :raw="true"
                    :name="productName"
                  />
                </template>
              </Checkbox>
            </div>
          </template>

          <div
            id="submit"
            class="text-center mt-20"
          >
            <AsyncButton
              key="passwordSubmit"
              type="submit"
              mode="continue"
              :disabled="!saveEnabled"
              data-testid="setup-submit"
              @click="save"
            />
          </div>

          <div class="setup-errors mt-20">
            <h4
              v-for="(err, i) in errors"
              :key="i"
              class="text-error text-center"
            >
              {{ err }}
            </h4>
          </div>
        </div>
        <div>
          &nbsp;
        </div>
      </div>
      <BrandImage
        class="col span-6 landscape"
        file-name="login-landscape.svg"
      />
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .principal {
    display: block;
    background: var(--box-bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    margin: 10px 0;
    padding: 10px;
    line-height: 40px;

    img {
      vertical-align: middle;
      margin: 0 10px;
    }
  }

  .setup {
    overflow: hidden;

    .row {
      & .checkbox {
        margin: auto
      }

      .span-6 {
        padding: 0 60px;
        margin: 0;
      }

      .landscape {
        height: 100vh;
        margin: 0;
        object-fit: cover;
        padding: 0;
        width: 49%;
      }
    }

    .form-col {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      position: relative;
      height: 100vh;
      width: 51%;

      & > div:first-of-type {
        flex: 3;
      }
      & > div:nth-of-type(2) {
        flex: 9;
      }
      & > div:nth-of-type(3) {
        flex: 2;
      }
    }

    .setup-title {
      :deep() code {
        font-size: 12px;
        padding: 0;
      }
    }

    .setup-errors {
      min-height: 50px;
    }

    p {
      line-height: 20px;
    }
  }
</style>
