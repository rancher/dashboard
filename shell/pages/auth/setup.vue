<script>
import { randomStr } from '@shell/utils/string';
import LabeledInput from '@shell/components/form/LabeledInput';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import AsyncButton from '@shell/components/AsyncButton';
import { LOGGED_OUT, SETUP } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import Checkbox from '@shell/components/form/Checkbox';
import { getVendor, getProduct, setVendor } from '@shell/config/private-label';
import RadioGroup from '@shell/components/form/RadioGroup';
import { setSetting, SETTING } from '@shell/config/settings';
import { _ALL_IF_AUTHED } from '@shell/plugins/steve/actions';
import { isDevBuild } from '@shell/utils/version';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Password from '@shell/components/form/Password';
import { applyProducts } from '@shell/store/type-map';

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
  layout: 'unauthenticated',

  async middleware({ store, redirect, route } ) {
    try {
      await store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
        }
      });
    } catch (e) {
    }

    const isFirstLogin = await calcIsFirstLogin(store);
    const mustChangePassword = await calcMustChangePassword(store);

    if (isFirstLogin) {
      // Always show setup if this is the first log in
      return;
    } else if (mustChangePassword) {
      // If the password needs changing and this isn't the first log in ensure we have the password
      if (!!store.getters['auth/initialPass']) {
        // Got it... show setup
        return;
      }
      // Haven't got it... redirect to log in so we get it
      await store.dispatch('auth/logout', null, { root: true });

      return redirect(302, `/auth/login?${ LOGGED_OUT }`);
    }

    // For all other cases we don't need to show setup
    return redirect('/');
  },

  components: {
    AsyncButton, LabeledInput, CopyToClipboard, Checkbox, RadioGroup, Password
  },

  async asyncData({ route, req, store }) {
    const telemetrySetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.TELEMETRY);
    const serverUrlSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);
    const rancherVersionSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_RANCHER);
    let telemetry = true;

    if (telemetrySetting?.value && telemetrySetting.value !== 'prompt') {
      telemetry = telemetrySetting.value !== 'out';
    } else if (!rancherVersionSetting?.value || isDevBuild(rancherVersionSetting?.value)) {
      telemetry = false;
    }

    let plSetting;

    try {
      await store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
        },
      });

      plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);
    } catch (e) {
      // Older versions used Norman API to get these
      plSetting = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.PL,
        opt:  { url: `/v3/settings/${ SETTING.PL }` }
      });
    }

    if (plSetting.value?.length && plSetting.value !== getVendor()) {
      setVendor(plSetting.value);
    }

    const productName = plSetting.default === 'Harvester' ? 'Harvester' : 'Rancher';

    const principals = await store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: '/v3/principals' } });
    const me = findBy(principals, 'me', true);

    const current = route.query[SETUP] || store.getters['auth/initialPass'];
    const v3User = store.getters['auth/v3User'] ?? {};

    const mcmFeature = await store.dispatch('management/find', {
      type: MANAGEMENT.FEATURE, id: 'multi-cluster-management', opt: { url: `/v1/${ MANAGEMENT.FEATURE }/multi-cluster-management` }
    });

    const mcmEnabled = mcmFeature?.spec?.value || mcmFeature?.status?.default;

    let serverUrl;

    if (serverUrlSetting?.value) {
      serverUrl = serverUrlSetting.value;
    } else if ( process.server ) {
      serverUrl = req.headers.host;
    } else {
      serverUrl = window.location.origin;
    }

    const isFirstLogin = await calcIsFirstLogin(store);
    const mustChangePassword = await calcMustChangePassword(store);

    return {
      productName,
      vendor:            getVendor(),
      product:           getProduct(),
      step:              parseInt(route.query.step, 10) || 1,

      useRandom:          true,
      haveCurrent:        !!current,
      username:           me?.loginName || 'admin',
      isFirstLogin,
      mustChangePassword,
      current,
      password:           randomStr(),
      confirm:            '',

      v3User,

      serverUrl,
      mcmEnabled,

      telemetry,

      eula: false,
      principals,

      errors: []
    };
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

      return true;
    },

    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
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
        await applyProducts(this.$store);
        await this.$store.dispatch('loadManagement');

        if ( this.mustChangePassword ) {
          await this.$store.dispatch('rancher/request', {
            url:           '/v3/users?action=changepassword',
            method:        'post',
            data:          {
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
          promises.push( setSetting(this.$store, SETTING.TELEMETRY, this.telemetry ? 'in' : 'out') );

          if ( this.mcmEnabled && this.serverUrl ) {
            promises.push( setSetting(this.$store, SETTING.SERVER_URL, this.serverUrl) );
          }
        }

        await Promise.all(promises);

        buttonCb(true);
        setTimeout(() => {
          this.done();
        }, 2000);
      } catch (err) {
        buttonCb(false);
        this.errors = exceptionToErrorsArray(err);
      }
    },

    done() {
      this.$router.replace('/');
    },
  },
};
</script>

<template>
  <form class="setup">
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
              class="text-center mb-20 mt-20 setup-title"
              v-html="t(isFirstLogin ? 'setup.setPassword' : 'setup.newUserSetPassword', { username }, true)"
            ></p>

            <Password
              v-if="!haveCurrent"
              v-model.trim="current"
              autocomplete="current-password"
              type="password"
              :label="t('setup.currentPassword')"
              class="mb-20"
              :required="true"
            />

            <!-- For password managers... -->
            <input type="hidden" name="username" autocomplete="username" :value="username" />
            <div class="mb-20">
              <RadioGroup v-model="useRandom" name="password-mode" :options="[{label: t('setup.useRandom'), value: true}, {label: t('setup.useManual'), value: false}]" />
            </div>
            <div class="mb-20">
              <LabeledInput
                v-if="useRandom"
                ref="password"
                v-model.trim="password"
                :type="useRandom ? 'text' : 'password'"
                :disabled="useRandom"
                label-key="setup.newPassword"
              >
                <template v-if="useRandom" #suffix>
                  <div class="addon" style="padding: 0 0 0 12px;">
                    <CopyToClipboard :text="password" class="btn-sm" />
                  </div>
                </template>
              </LabeledInput>
              <Password
                v-else
                ref="password"
                v-model.trim="password"
                :label="t('setup.newPassword')"
                :required="true"
              />
            </div>
            <Password
              v-show="!useRandom"
              v-model.trim="confirm"
              autocomplete="new-password"
              :label="t('setup.confirmPassword')"
              :required="true"
            />
          </template>

          <template v-if="isFirstLogin">
            <template v-if="mcmEnabled">
              <hr v-if="mustChangePassword" class="mt-20 mb-20" />
              <p>
                <t k="setup.serverUrl.tip" :raw="true" />
              </p>
              <div class="mt-20">
                <LabeledInput v-model="serverUrl" :label="t('setup.serverUrl.label')" />
              </div>
            </template>

            <div class="checkbox mt-40">
              <Checkbox id="checkbox-telemetry" v-model="telemetry" label-key="setup.telemetry" />
            </div>
            <div class="checkbox pt-10 eula">
              <Checkbox id="checkbox-eula" v-model="eula">
                <template #label>
                  <t k="setup.eula" :raw="true" :name="productName" />
                </template>
              </Checkbox>
            </div>
          </template>

          <div id="submit" class="text-center mt-20">
            <AsyncButton key="passwordSubmit" type="submit" mode="continue" :disabled="!saveEnabled" @click="save" />
          </div>

          <div class="setup-errors mt-20">
            <h4 v-for="err in errors" :key="err" class="text-error text-center">
              {{ err }}
            </h4>
          </div>
        </div>
      </div>

      <div class="col span-6 landscape" />
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
      }
    }

    .form-col {
      display: flex;
      flex-direction: column;
      & > div:first-of-type {
        flex:3;
      }
      & > div:nth-of-type(2) {
        flex: 9;
      }
    }

    .setup-title {
      ::v-deep code {
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

  .landscape {
    background-image: url('~shell/assets/images/pl/login-landscape.svg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 100vh;
  }
</style>
