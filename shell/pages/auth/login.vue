<script>
import { removeObject } from '@shell/utils/array';
import { USERNAME } from '@shell/config/cookies';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
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
    LabeledInput, AsyncButton, Checkbox, BrandImage, Banner, InfoBox, CopyCode, Password
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
    }

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
    <div>
      <div class="app-blue-header">
        <div class="top-logo-svg">
          <BrandImage file-name="k4edge_logo.svg" />
        </div>
        <!-- <div class="k4edge-logo-text">k4edge</div> -->
        <div class="k4edge-version-text">
          Version 0.0.1
        </div>
        <div class="dell-svg-logo">
          <svg
            width="168"
            height="22"
            viewBox="0 0 168 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M65.0928 1.88099V1.25399L64.8838 1.045H53.1817L52.9727 1.25399V1.88099L53.1817 2.09H58.0922L58.3013 2.29899V16.4042L58.5103 16.6132H59.4508L59.6598 16.4042V2.40349L59.8687 2.19449H64.7793L65.0928 1.88099ZM71.3619 10.4486H64.5703L64.3613 10.2396C64.3023 9.30306 64.6177 8.38142 65.2381 7.67733C65.8585 6.97323 66.7331 6.54434 67.6696 6.48495C67.7507 6.47991 67.8327 6.47716 67.9139 6.47854C68.3701 6.46677 68.8242 6.54501 69.2502 6.70878C69.6762 6.87255 70.0658 7.11865 70.3967 7.43302C70.7276 7.74738 70.9933 8.12386 71.1786 8.54094C71.364 8.95802 71.4654 9.40753 71.4769 9.86379C71.4806 9.98932 71.4771 10.115 71.4664 10.2401L71.3619 10.4486ZM72.6159 11.4936L72.8249 11.2846V10.6576C72.8249 7.52308 71.0489 5.32904 67.9143 5.32904C64.7798 5.32904 63.0037 7.52308 63.0037 10.6576V11.0756C63.0037 14.2102 64.5713 16.9267 68.1233 16.9267C69.1563 17.042 70.1945 16.761 71.0283 16.1404C71.862 15.5197 72.4291 14.6058 72.615 13.5832L72.406 13.3742H71.57L71.361 13.5832C71.1889 14.2642 70.7775 14.8607 70.202 15.2635C69.6265 15.6663 68.9253 15.8487 68.2264 15.7772C67.2069 15.7554 66.2378 15.3296 65.5322 14.5933C64.8266 13.857 64.4424 12.8707 64.464 11.8511V11.8053L64.673 11.5963H72.6136L72.6159 11.4936ZM75.1234 11.0756C75.1234 7.94108 76.6905 6.37404 78.885 6.37404C79.6864 6.3017 80.4844 6.54518 81.109 7.05261C81.7335 7.56004 82.1352 8.2913 82.2285 9.09058L82.4375 9.29958H83.378L83.587 9.09058C83.378 6.89654 81.602 5.32904 78.8854 5.32904C75.9599 5.32904 73.7659 7.10508 73.7659 11.1801C73.7659 15.1507 75.9599 17.0312 78.8854 17.0312C81.602 17.0312 83.3771 15.4642 83.587 13.2697L83.378 12.8517H82.4375L82.2285 13.0607C82.135 13.8598 81.7333 14.591 81.1088 15.0983C80.4843 15.6057 79.6864 15.8493 78.885 15.7772C76.691 15.7772 75.1234 14.2102 75.1234 11.0756ZM94.3482 16.4042V9.71712C94.3482 6.79157 92.7812 5.22545 90.3782 5.22545C89.681 5.17488 88.9832 5.31315 88.358 5.62569C87.7329 5.93824 87.2035 6.4135 86.8256 7.00149H86.5121V1.14949L86.3031 0.940491H85.3626L85.1536 1.14949V16.2997L85.3626 16.5087H86.3031L86.5121 16.2997V10.2396C86.5121 7.73207 87.6616 6.26908 90.0647 6.26908C91.8407 6.26908 92.9902 7.41858 92.9902 9.61262V16.2997L93.1992 16.5087H94.1397L94.3482 16.4042ZM105.737 16.4042V9.71712C105.737 6.79157 104.17 5.22545 101.766 5.22545C101.069 5.17483 100.371 5.31308 99.7462 5.62562C99.121 5.93817 98.5917 6.41347 98.2138 7.00149H97.9003L97.6913 5.643L97.4823 5.5385H96.749L96.54 5.74749V16.5092L96.749 16.7182H97.6895L97.8985 16.5092V10.4486C97.8985 7.94108 99.048 6.47807 101.451 6.47807C103.227 6.47807 104.377 7.62757 104.377 9.82162V16.5092L104.586 16.7182H105.526L105.737 16.4042ZM112.215 16.9267C115.141 16.9267 117.335 14.9417 117.335 11.0756C117.335 7.20958 115.141 5.22453 112.215 5.22453C109.289 5.22453 107.095 7.20958 107.095 11.0756C107.095 14.9417 109.289 16.9267 112.215 16.9267ZM112.215 6.37404C114.409 6.37404 115.977 8.15008 115.977 11.0756C115.977 14.0012 114.409 15.7772 112.215 15.7772C110.02 15.7772 108.453 14.0012 108.453 11.0756C108.453 8.15008 110.02 6.37404 112.215 6.37404ZM120.261 16.4042V1.25399L120.052 1.045H119.11L118.901 1.25399V16.4042L119.11 16.6132H120.051L120.261 16.4042ZM126.948 16.9267C129.873 16.9267 132.067 14.9417 132.067 11.0756C132.067 7.20958 129.873 5.22453 126.948 5.22453C124.022 5.22453 121.828 7.20958 121.828 11.0756C121.828 14.9417 124.019 16.9262 126.947 16.9262L126.948 16.9267ZM126.947 6.37358C129.141 6.37358 130.708 8.14962 130.708 11.0752C130.708 14.0007 129.141 15.7767 126.947 15.7767C124.753 15.7767 123.185 14.0007 123.185 11.0752C123.185 8.14962 124.752 6.37358 126.947 6.37358ZM141.47 15.1502C141.47 18.0757 140.843 20.2698 138.126 20.2698C136.141 20.2698 135.41 19.3293 135.201 18.2847L134.992 18.0757H134.051L133.842 18.2847C134.051 20.0608 135.409 21.4193 138.126 21.4193C141.052 21.4193 142.828 19.6432 142.828 15.1502V5.74658L142.619 5.53757H141.992L141.783 5.74658L141.574 7.10508H141.365C141.012 6.4932 140.488 5.99857 139.856 5.68277C139.224 5.36697 138.514 5.24395 137.812 5.32904C134.678 5.32904 133.111 7.83658 133.111 11.1801C133.111 14.5237 134.678 17.0312 137.812 17.0312C138.511 17.0928 139.213 16.9594 139.84 16.6459C140.467 16.3323 140.995 15.8509 141.365 15.2552H141.469L141.47 15.1502ZM137.917 15.7772C135.723 15.7772 134.365 14.2102 134.365 11.0756C134.365 7.94108 135.723 6.37404 137.917 6.37404C140.112 6.37404 141.47 7.94108 141.47 11.0756C141.47 14.2102 140.111 15.7772 137.917 15.7772ZM146.381 3.44804V2.09L146.172 1.88099H145.231L145.022 2.09V3.44666L145.231 3.65566H146.172L146.381 3.44804ZM146.381 16.4037V5.64208L146.172 5.43307H145.231L145.022 5.64208V16.4037L145.231 16.6127H146.172L146.381 16.4037ZM156.202 10.4482H149.515L149.306 10.2392C149.275 9.76929 149.337 9.29788 149.489 8.85224C149.641 8.40661 149.881 7.99564 150.193 7.64315C150.505 7.29067 150.884 7.00368 151.308 6.79884C151.732 6.59401 152.193 6.4754 152.663 6.44988C153.133 6.42437 153.604 6.49246 154.048 6.65022C154.491 6.80797 154.899 7.05225 155.248 7.36888C155.596 7.68551 155.879 8.06819 156.078 8.49474C156.278 8.92128 156.391 9.3832 156.41 9.8537C156.417 9.9821 156.417 10.1108 156.41 10.2392L156.202 10.4482ZM157.56 11.4932L157.769 11.2842V10.6572C157.769 7.52262 155.993 5.32858 152.859 5.32858C149.724 5.32858 147.948 7.52262 147.948 10.6572V11.0752C147.948 14.2097 149.515 16.9262 153.068 16.9262C154.101 17.0417 155.139 16.7607 155.973 16.14C156.806 15.5194 157.374 14.6054 157.559 13.5827L157.35 13.3737H156.41L156.201 13.5827C156.029 14.2638 155.617 14.8602 155.042 15.2631C154.466 15.6659 153.765 15.8482 153.066 15.7767C152.047 15.755 151.078 15.3291 150.372 14.5929C149.666 13.8566 149.282 12.8702 149.304 11.8507V11.8048L149.513 11.5958H157.558L157.56 11.4932ZM167.173 13.7917C167.173 11.8067 166.023 10.8662 163.829 10.4482C161.635 10.0302 160.277 9.82116 160.277 8.25412C160.277 7.10462 161.217 6.47807 162.784 6.47807C164.769 6.47807 165.501 7.41858 165.501 8.46312L165.71 8.67212H166.65L166.859 8.46312C166.859 6.26908 165.083 5.32858 162.889 5.32858C160.382 5.32858 159.128 6.68707 159.128 8.25412C159.128 10.0302 160.486 10.9707 162.68 11.3887C164.875 11.8067 166.024 12.0157 166.024 13.8962C166.024 15.0457 165.397 15.8812 163.098 15.8812C161.113 15.8812 160.173 14.7317 160.173 13.3737L159.964 13.1647H159.023L158.814 13.3737C158.814 15.3587 160.381 16.9262 163.098 16.9262C165.814 16.9262 167.173 15.5677 167.173 13.7917Z"
              fill="white"
            />
            <path
              d="M6.37359 13.5827H3.55256V4.17954H6.37359C6.96049 4.20355 7.53691 4.34292 8.06996 4.5897C8.603 4.83649 9.08224 5.18585 9.48026 5.61784C9.87829 6.04982 10.1873 6.55598 10.3897 7.1074C10.5921 7.65883 10.6839 8.24472 10.6599 8.83163L10.6572 8.88113C10.7005 10.0696 10.276 11.2276 9.47509 12.1066C8.67412 12.9856 7.56046 13.5156 6.37314 13.5827H6.37359ZM35.1061 1.04454H31.5535V6.89563L23.0908 13.4782L21.2117 12.0157L25.2867 8.88113L29.6748 5.43308L27.1672 3.44805L18.7023 10.032L16.8231 8.56946L25.2862 1.98505L22.7787 0L13.8976 6.89609C13.461 5.22963 12.4876 3.75344 11.1278 2.69579C9.76797 1.63815 8.0976 1.05798 6.37496 1.04501H0V16.7172H6.37359C8.10025 16.7199 9.77831 16.1457 11.1412 15.0856C12.5042 14.0255 13.4739 12.5404 13.8962 10.8662L22.7773 17.7623L31.6571 10.8662V16.7172H41.7918V13.5827H35.1047L35.1061 1.04454ZM52.9728 13.5827V16.7172H42.9426V1.04501H46.4952V13.5832L52.9728 13.5827Z"
              fill="white"
            />
          </svg>
        </div>
        <div class="copyright-text">
          Copyright © 2018-2022 Dell Inc. or its subsidiaries. All Rights Reserved.
        </div>
      </div>
      <div>
        <!-- <p class="text-center">
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
          </h4> -->
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
          <div class="margin-left-33">
            <div class="mb-20">
              <LabeledInput
                v-if="!firstLogin"
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
            <div class="text-below-login">
              <div v-if="!firstLogin">
                <input style="vertical-align: -2px;" name="remember" type="checkbox" />
                <label for="remember">Remember Me</label>
              </div>
              <a style="cursor:pointer;">Forgot your password?</a>
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
      </template>
    </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>

  .login {
    .margin-left-33{
      margin : auto;
      width: 20%;
    }

    .text-below-login{
      padding-top: 20px;
      padding-bottom: 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      vertical-align: -2px;
      color: black;
      font-size: 14px;
      font-weight: 400;
      .forgot-password{
      }
    }
    overflow: hidden;
    .app-blue-header {
    background-color: var(--primary);
    width: 100%;
    height: 464px;
    text-align: center;
    .top-logo-svg {
      padding-top: 20px;
      margin-right: 14px;
    }
    .k4edge-logo-text{
      font-size: 28px;
      font-weight: 400;
      color: white;
    }
    .k4edge-version-text{
      padding-top: 8px;
      font-size: 14px;
      color: white;
    }
    .dell-svg-logo{
      padding-top: 80px;
    }
    .copyright-text{
      padding-top: 8px;
      font-size: 12px;
      color: white;
    }
  }
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
</style>
