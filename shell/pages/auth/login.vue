<script>
import { removeObject } from '@shell/utils/array';
import { USERNAME } from '@shell/config/cookies';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import LocaleSelector from '@shell/components/LocaleSelector';
import BrandImage from '@shell/components/BrandImage';
import InfoBox from '@shell/components/InfoBox';
import CopyCode from '@shell/components/CopyCode';
import { Banner } from '@components/Banner';
import {
  LOCAL, LOGGED_OUT, TIMED_OUT, IS_SSO, _FLAGGED,
  IS_SLO
} from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import Password from '@shell/components/form/Password';
import { sortBy } from '@shell/utils/sort';
import { configType } from '@shell/models/management.cattle.io.authconfig';
import { mapGetters } from 'vuex';
import { markRaw } from 'vue';
import { _MULTI } from '@shell/plugins/dashboard-store/actions';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { LOGIN_ERRORS } from '@shell/store/auth';
import {
  getBrand,
  getVendor,
  setBrand,
  setVendor
} from '@shell/config/private-label';
import loadPlugins from '@shell/plugins/plugin';
import Loading from '@shell/components/Loading';
import { getGlobalBannerFontSizes } from '@shell/utils/banners';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';

export default {
  name:       'Login',
  components: {
    LabeledInput, AsyncButton, Checkbox, BrandImage, Banner, InfoBox, CopyCode, Password, LocaleSelector, Loading
  },

  data() {
    const username = this.$cookies.get(USERNAME, { parseJSON: false }) || '';

    return {
      username,
      remember: !!username,
      password: '',

      timedOut:           this.$route.query[TIMED_OUT] === _FLAGGED,
      loggedOut:          this.$route.query[LOGGED_OUT] === _FLAGGED,
      isSsoLogout:        this.$route.query[IS_SSO] === _FLAGGED,
      isSlo:              this.$route.query[IS_SLO] === _FLAGGED,
      err:                this.$route.query.err,
      showLocaleSelector: !process.env.loginLocaleSelector || process.env.loginLocaleSelector === 'true',

      hasLocal:           false,
      showLocal:          false,
      providers:          [],
      providerComponents: [],
      customLoginError:   {},
      firstLogin:         false,
      vendor:             getVendor()
    };
  },

  computed: {
    ...mapGetters(['isSingleProduct']),
    ...mapGetters({ t: 'i18n/t', hasMultipleLocales: 'i18n/hasMultipleLocales' }),

    loggedOutSuccessMsg() {
      if (this.isSlo) {
        return this.t('login.loggedOutFromSlo');
      } else if (this.isSsoLogout) {
        return this.t('login.loggedOutFromSso');
      }

      return this.t('login.loggedOut');
    },

    isHarvester() {
      return this.isSingleProduct?.productName === HARVESTER;
    },

    singleProvider() {
      return this.providers.length === 1 ? this.providers[0] : undefined;
    },

    nonLocalPrompt() {
      if (this.singleProvider) {
        const provider = this.displayName(this.singleProvider);

        return this.t('login.useProvider', { provider });
      }

      return this.t('login.useNonLocal');
    },

    errorMessage() {
      if (this.isSlo) {
        return this.err?.length ? this.t('logout.error', { msg: this.err }) : '';
      }

      if (this.err === LOGIN_ERRORS.CLIENT_UNAUTHORIZED) {
        return this.t('login.clientError');
      } else if (this.err === LOGIN_ERRORS.CLIENT || this.err === LOGIN_ERRORS.SERVER) {
        return this.t('login.error');
      } else if (this.err === LOGIN_ERRORS.NONCE) {
        return this.t('login.invalidResponseError');
      } else if (this.err === LOGIN_ERRORS.USER_UNAUTHORIZED) {
        return this.t('login.userUnauthorized');
      }

      return this.err?.length ? this.t('login.specificError', { msg: this.err }) : '';
    },

    errorToDisplay() {
      if (this.customLoginError?.showMessage === 'true' && this.customLoginError?.message && this.errorMessage) {
        return `${ this.customLoginError.message } \n ${ this.errorMessage }`;
      }

      if (this.errorMessage) {
        return this.errorMessage;
      }

      return '';
    },

    kubectlCmd() {
      return "kubectl get secret --namespace cattle-system bootstrap-secret -o go-template='{{.data.bootstrapPassword|base64decode}}{{\"\\n\"}}'";
    },

    hasLoginMessage() {
      return this.errorToDisplay || this.loggedOut || this.timedOut;
    },

    // Apply bottom margin so that the locale secletor control lifts up to avoid the footer fixed banner, if it is shown
    localeSelectorStyle() {
      const globalBannerSettings = getGlobalBannerFontSizes(this.$store);

      return { marginBottom: globalBannerSettings?.footerFont };
    }
  },

  async fetch() {
    const { firstLoginSetting } = await this.loadInitialSettings();
    const { value } = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS });
    const drivers = await this.$store.dispatch('auth/getAuthProviders');
    const providers = sortBy(drivers.map((x) => x.id), ['id']);
    const hasLocal = providers.includes('local');
    const hasOthers = hasLocal && !!providers.find((x) => x !== 'local');

    if ( hasLocal ) {
      // Local is special and handled here so that it can be toggled
      removeObject(providers, 'local');
    }

    this.vendor = getVendor();
    this.providers = providers;
    this.hasLocal = hasLocal;
    this.showLocal = !hasOthers || (this.$route.query[LOCAL] === _FLAGGED);
    this.customLoginError = JSON.parse(value).loginError;
    this.firstLogin = firstLoginSetting?.value === 'true';
    this.username = this.firstLogin ? 'admin' : this.username;

    this.providerComponents = this.providers.map((name) => {
      return markRaw(this.$store.getters['type-map/importLogin'](configType[name] || name));
    });

    this.$nextTick(() => {
      this.focusSomething();
    });
  },

  methods: {
    async loadInitialSettings() {
      let firstLoginSetting, plSetting, brand;

      // Load settings.
      // For newer versions this will return all settings if you are somehow logged in,
      // and just the public ones if you aren't.
      try {
        firstLoginSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);
        plSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);
        brand = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BRAND);
      } catch (e) {
        // Older versions used Norman API to get these
        firstLoginSetting = await this.$store.dispatch('rancher/find', {
          type: NORMAN.SETTING,
          id:   SETTING.FIRST_LOGIN,
          opt:  { url: `/v3/settings/${ SETTING.FIRST_LOGIN }` }
        });

        plSetting = await this.$store.dispatch('rancher/find', {
          type: NORMAN.SETTING,
          id:   SETTING.PL,
          opt:  { url: `/v3/settings/${ SETTING.PL }` }
        });

        brand = await this.$store.dispatch('rancher/find', {
          type: NORMAN.SETTING,
          id:   SETTING.BRAND,
          opt:  { url: `/v3/settings/${ SETTING.BRAND }` }
        });
      }

      if (plSetting.value?.length && plSetting.value !== getVendor()) {
        setVendor(plSetting.value);
      }

      if (brand?.value?.length && brand.value !== getBrand()) {
        setBrand(brand.value);
      }

      return {
        firstLoginSetting, plSetting, brand
      };
    },

    displayName(provider) {
      return this.t(`model.authConfig.provider.${ provider }`);
    },

    toggleLocal() {
      this.showLocal = !this.showLocal;
      this.$router.applyQuery({ [LOCAL]: _FLAGGED });
      this.$nextTick(() => {
        this.focusSomething();
      });
    },

    focusSomething() {
      if ( !this.showLocal ) {
        // One of the provider components will handle it
        return;
      }

      let elem;

      if ( this.username ) {
        elem = this.$refs.password;
      } else {
        elem = this.$refs.username;
      }

      if ( elem?.focus ) {
        elem.focus();

        if ( elem.select ) {
          elem.select();
        }
      }
    },

    handleProviderError(err) {
      this.err = err;
    },

    async loginLocal(buttonCb) {
      try {
        await this.$store.dispatch('auth/login', {
          provider: 'local',
          body:     {
            username: this.username,
            password: this.password
          }
        });

        const user = await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.USER,
          opt:  { url: '/v3/users?me=true', load: _MULTI }
        });

        if (!!user?.[0]) {
          this.$store.dispatch('auth/gotUser', user[0]);
        }

        if ( this.remember ) {
          this.$cookies.set(USERNAME, this.username, {
            encode:   (x) => x,
            maxAge:   86400 * 365,
            path:     '/',
            sameSite: true,
            secure:   true,
          });
        } else {
          this.$cookies.remove(USERNAME);
        }

        // User logged with local login - we don't do any redirect/reload, so the boot-time plugin will not run again to laod the plugins
        // so we manually load them here - other SSO auth providers bounce out and back to the Dashboard, so on the bounce-back
        // the plugins will load via the boot-time plugin
        await loadPlugins({
          app:     this.$store.app,
          store:   this.$store,
          $plugin: this.$store.$plugin
        });

        if (this.firstLogin || user[0]?.mustChangePassword) {
          this.$store.dispatch('auth/setInitialPass', this.password);
          this.$router.push({ name: 'auth-setup' });
        } else {
          this.$router.push({ name: 'index' });
        }
      } catch (err) {
        this.err = err;
        this.timedOut = null;
        this.loggedOut = null;

        buttonCb(false);
      }
    },
  }
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    mode="relative"
  />
  <main
    v-else
    class="main-layout login"
  >
    <div class="row gutless mb-20">
      <div class="col span-6 p-20">
        <p class="text-center">
          {{ t('login.howdy') }}
        </p>
        <h1 class="text-center login-welcome">
          {{ t('login.welcome', {vendor}) }}
        </h1>
        <div
          class="login-messages"
          data-testid="login__messages"
          :class="{'login-messages--hasContent': hasLoginMessage}"
        >
          <Banner
            v-if="errorToDisplay"
            :label="errorToDisplay"
            color="error"
          />
          <h4
            v-else-if="loggedOut"
            class="text-success text-center"
          >
            {{ loggedOutSuccessMsg }}
          </h4>
          <h4
            v-else-if="timedOut"
            class="text-error text-center"
          >
            {{ t('login.loginAgain') }}
          </h4>
        </div>
        <div
          v-if="firstLogin"
          class="first-login-message pl-10 pr-10"
          :class="{'mt-30': !hasLoginMessage}"
          data-testid="first-login-message"
        >
          <t
            k="setup.defaultPassword.intro"
            :raw="true"
          />

          <div>
            <t
              k="setup.defaultPassword.dockerPrefix"
              :raw="true"
            />
          </div>
          <ul>
            <li>
              <t
                k="setup.defaultPassword.dockerPs"
                :raw="true"
              />
            </li>
            <li>
              <CopyCode>
                docker logs <u>container-id</u> 2&gt;&amp;1 | grep "Bootstrap Password:"
              </CopyCode>
            </li>
          </ul>
          <div>
            <t
              k="setup.defaultPassword.dockerSuffix"
              :raw="true"
            />
          </div>

          <br>
          <div>
            <t
              k="setup.defaultPassword.helmPrefix"
              :raw="true"
            />
          </div>
          <br>
          <CopyCode>
            {{ kubectlCmd }}
          </CopyCode>
          <br>
          <div>
            <t
              k="setup.defaultPassword.helmSuffix"
              :raw="true"
            />
          </div>
        </div>

        <div
          v-if="(!hasLocal || (hasLocal && !showLocal)) && providers.length"
          :class="{'mt-30': !hasLoginMessage}"
        >
          <component
            :is="providerComponents[idx]"
            v-for="(name, idx) in providers"
            :key="idx"
            class="mb-10"
            :focus-on-mount="(idx === 0 && !showLocal)"
            :name="name"
            :open="!showLocal"
            @showInputs="showLocal = false"
            @error="handleProviderError"
          />
        </div>
        <template v-if="hasLocal">
          <form
            v-if="showLocal"
            :class="{'mt-30': !hasLoginMessage}"
            @submit.prevent
          >
            <div class="span-6 offset-3">
              <div class="mb-20">
                <LabeledInput
                  v-if="!firstLogin"
                  ref="username"
                  v-model:value.trim="username"
                  data-testid="local-login-username"
                  :label="t('login.username')"
                  autocomplete="username"
                />
              </div>
              <div class="">
                <Password
                  ref="password"
                  v-model:value="password"
                  data-testid="local-login-password"
                  :label="t('login.password')"
                  autocomplete="password"
                />
              </div>
            </div>
            <div class="mt-20">
              <div class="col span-12 text-center">
                <AsyncButton
                  id="submit"
                  data-testid="login-submit"
                  type="submit"
                  :action-label="t('login.loginWithLocal')"
                  :waiting-label="t('login.loggingIn')"
                  :success-label="t('login.loggedIn')"
                  :error-label="t('asyncButton.default.error')"
                  @click="loginLocal"
                />
                <div
                  v-if="!firstLogin"
                  class="mt-20"
                >
                  <Checkbox
                    v-model:value="remember"
                    :label="t('login.remember.label')"
                    type="checkbox"
                  />
                </div>
              </div>
            </div>
          </form>
          <div
            v-if="hasLocal && !showLocal"
            class="mt-20 text-center"
          >
            <a
              id="login-useLocal"
              data-testid="login-useLocal"
              role="button"
              @click="toggleLocal"
            >
              {{ t('login.useLocal') }}
            </a>
          </div>
          <div
            v-if="hasLocal && showLocal && providers.length"
            class="mt-20 text-center"
          >
            <a
              role="button"
              @click="toggleLocal"
            >
              {{ nonLocalPrompt }}
            </a>
          </div>
        </template>
        <div
          v-if="showLocaleSelector && hasMultipleLocales && !isHarvester"
          class="locale-selector"
        >
          <LocaleSelector
            :style="localeSelectorStyle"
            mode="login"
          />
        </div>
      </div>
      <BrandImage
        class="col span-6 landscape"
        data-testid="login-landscape__img"
        file-name="login-landscape.svg"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
  .login {
    overflow: hidden;

    .row {
      align-items: center;
    }

    .landscape {
      height: 100vh;
      margin: 0;
      object-fit: cover;
    }

    .login-welcome {
      margin: 0
    }

    .login-messages {
      display: flex;
      justify-content: center;
      align-items: center;

      .banner {
        margin: 5px;
      }
      h4 {
        margin: 0;
      }
      &--hasContent {
        min-height: 70px;
      }

      .text-error, .banner {
        max-width: 80%;
      }
    }

    .first-login-message {
      .banner {
        margin-bottom: 0;
        border-left: 0;

        :deep() code {
          font-size: 12px;
          padding: 0;
        }
      }
    }
  }

  .gutless {
    height: 100vh;
    & > .span-6 {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      place-content: center;
    }
  }
  .locale-selector {
    position: absolute;
    bottom: 30px;
  }
</style>
