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
import { LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import Password from '@shell/components/form/Password';
import { sortBy } from '@shell/utils/sort';
import { configType } from '@shell/models/management.cattle.io.authconfig';
import { mapGetters } from 'vuex';
import { importLogin } from '@shell/utils/dynamic-importer';
import { _ALL_IF_AUTHED, _MULTI } from '@shell/plugins/dashboard-store/actions';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { LOGIN_ERRORS } from '@shell/store/auth';
import {
  getBrand,
  getVendor,
  getProduct,
  setBrand,
  setVendor
} from '@shell/config/private-label';

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput, AsyncButton, Checkbox, BrandImage, Banner, InfoBox, CopyCode, Password, LocaleSelector
  },

  async asyncData({ route, redirect, store }) {
    const drivers = await store.dispatch('auth/getAuthProviders');
    const providers = sortBy(drivers.map(x => x.id), ['id']);

    const hasLocal = providers.includes('local');
    const hasOthers = hasLocal && !!providers.find(x => x !== 'local');

    if ( hasLocal ) {
      // Local is special and handled here so that it can be toggled
      removeObject(providers, 'local');
    }

    let firstLoginSetting, plSetting, brand;

    // Load settings.
    // For newer versions this will return all settings if you are somehow logged in,
    // and just the public ones if you aren't.
    try {
      await store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
        },
      });

      firstLoginSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);
      plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);
      brand = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BRAND);
    } catch (e) {
      // Older versions used Norman API to get these
      firstLoginSetting = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.FIRST_LOGIN,
        opt:  { url: `/v3/settings/${ SETTING.FIRST_LOGIN }` }
      });

      plSetting = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.PL,
        opt:  { url: `/v3/settings/${ SETTING.PL }` }
      });

      brand = await store.dispatch('rancher/find', {
        type: 'setting',
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

    let singleProvider;

    if (providers.length === 1) {
      singleProvider = providers[0];
    }

    return {
      vendor:     getVendor(),
      providers,
      hasOthers,
      hasLocal,
      showLocal:  !hasOthers || (route.query[LOCAL] === _FLAGGED),
      firstLogin: firstLoginSetting?.value === 'true',
      singleProvider
    };
  },

  data({ $cookies }) {
    const username = $cookies.get(USERNAME, { parseJSON: false }) || '';

    return {
      product: getProduct(),

      username,
      remember:  !!username,
      password:  '',

      timedOut:  this.$route.query[TIMED_OUT] === _FLAGGED,
      loggedOut: this.$route.query[LOGGED_OUT] === _FLAGGED,
      err:       this.$route.query.err,

      providers:          [],
      providerComponents: [],
      customLoginError:    {}
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    nonLocalPrompt() {
      if (this.singleProvider) {
        const provider = this.displayName(this.singleProvider);

        return this.t('login.useProvider', { provider });
      }

      return this.t('login.useNonLocal');
    },

    errorMessage() {
      if (this.err === LOGIN_ERRORS.CLIENT_UNAUTHORIZED) {
        return this.t('login.clientError');
      } else if (this.err === LOGIN_ERRORS.CLIENT || this.err === LOGIN_ERRORS.SERVER) {
        return this.t('login.error');
      }

      return this.err;
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

  },

  created() {
    this.providerComponents = this.providers.map((name) => {
      return importLogin(configType[name]);
    });
  },

  async fetch() {
    const { value } = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS });

    this.customLoginError = JSON.parse(value).loginError;
  },

  mounted() {
    this.username = this.firstLogin ? 'admin' : this.username;
    this.$nextTick(() => {
      this.focusSomething();
    });
  },

  methods: {
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
            encode:   x => x,
            maxAge:   86400 * 365,
            path:     '/',
            sameSite: true,
            secure:   true,
          });
        } else {
          this.$cookies.remove(USERNAME);
        }

        if (this.firstLogin || user[0]?.mustChangePassword) {
          this.$store.dispatch('auth/setInitialPass', this.password);
          this.$router.push({ name: 'auth-setup' });
        } else {
          this.$router.replace('/');
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
  <main class="login">
    <div class="row gutless mb-20">
      <div class="col span-6 p-20">
        <p class="text-center">
          {{ t('login.howdy') }}
        </p>
        <h1 class="text-center">
          {{ t('login.welcome', {vendor}) }}
        </h1>
        <div class="login-messages">
          <Banner v-if="errorToDisplay" :label="errorToDisplay" color="error" />
          <h4 v-else-if="loggedOut" class="text-success text-center">
            {{ t('login.loggedOut') }}
          </h4>
          <h4 v-else-if="timedOut" class="text-error text-center">
            {{ t('login.loginAgain') }}
          </h4>
        </div>
        <div
          v-if="firstLogin"
          class="first-login-message"
          data-testid="first-login-message"
        >
          <InfoBox color="info">
            <t k="setup.defaultPassword.intro" :raw="true" />

            <div><t k="setup.defaultPassword.dockerPrefix" :raw="true" /></div>
            <ul>
              <li>
                <t k="setup.defaultPassword.dockerPs" :raw="true" />
              </li>
              <li>
                <CopyCode>
                  docker logs <u>container-id</u> 2&gt;&amp;1 | grep "Bootstrap Password:"
                </CopyCode>
              </li>
            </ul>
            <div><t k="setup.defaultPassword.dockerSuffix" :raw="true" /></div>

            <br />
            <div><t k="setup.defaultPassword.helmPrefix" :raw="true" /></div>
            <br />
            <CopyCode>
              {{ kubectlCmd }}
            </CopyCode>
            <br />
            <div><t k="setup.defaultPassword.helmSuffix" :raw="true" /></div>
          </InfoBox>
        </div>

        <div v-if="(!hasLocal || (hasLocal && !showLocal)) && providers.length" class="mt-30">
          <component
            :is="providerComponents[idx]"
            v-for="(name, idx) in providers"
            :key="name"
            class="mb-10"
            :focus-on-mount="(idx === 0 && !showLocal)"
            :name="name"
            :open="!showLocal"
            @showInputs="showLocal = false"
          />
        </div>
        <template v-if="hasLocal">
          <form v-if="showLocal" class="mt-40">
            <div class="span-6 offset-3">
              <div class="mb-20">
                <LabeledInput
                  v-if="!firstLogin"
                  id="username"
                  ref="username"
                  v-model.trim="username"
                  data-testid="local-login-username"
                  :label="t('login.username')"
                  autocomplete="username"
                />
              </div>
              <div class="">
                <Password
                  id="password"
                  ref="password"
                  v-model="password"
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
                <div v-if="!firstLogin" class="mt-20">
                  <Checkbox v-model="remember" :label="t('login.remember.label')" type="checkbox" />
                </div>
              </div>
            </div>
          </form>
          <div v-if="hasLocal && !showLocal" class="mt-20 text-center">
            <a
              id="login-useLocal"
              data-testid="login-useLocal"
              role="button"
              @click="toggleLocal"
            >
              {{ t('login.useLocal') }}
            </a>
          </div>
          <div v-if="hasLocal && showLocal && providers.length" class="mt-20 text-center">
            <a role="button" @click="toggleLocal">
              {{ nonLocalPrompt }}
            </a>
          </div>
          <div class="locale-elector">
            <LocaleSelector mode="login" />
          </div>
        </template>
      </div>

      <BrandImage class="col span-6 landscape" file-name="login-landscape.svg" />
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

    .login-messages, .first-login-message {
      display: flex;
      justify-content: center;
      .text-error, .banner {
        max-width: 80%;
      }
    }

    .first-login-message {
      .banner {
        margin-bottom: 0;
        border-left: 0;

        ::v-deep code {
          font-size: 12px;
          padding: 0;
        }
      }
    }
  }

  .locale-elector {
    position: absolute;
    bottom: 30px;
  }
</style>
