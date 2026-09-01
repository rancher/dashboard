<script>
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
  IS_SLO, IS_SESSION_IDLE
} from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';
import Password from '@shell/components/form/Password';
import { configTypeForProvider } from '@shell/models/management.cattle.io.authconfig';
import AuthProviderList from '@shell/components/auth/login/AuthProviderList.vue';
import OrDivider from '@shell/components/auth/login/OrDivider.vue';
import { LOCAL_AUTH_ID } from '@shell/utils/auth';
import {
  clearRememberedProviderId,
  getRememberedProviderId,
  resolveInitialProvider,
  setRememberedProviderId,
  toProviderOptions,
} from '@shell/utils/auth-providers';
import { mapGetters } from 'vuex';
import { markRaw } from 'vue';
import { MANAGEMENT, NORMAN, EXT } from '@shell/config/types';
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
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import TabTitle from '@shell/components/TabTitle.vue';
import { getBrandMeta } from '@shell/utils/brand';

export default {
  name:       'Login',
  components: {
    LabeledInput, AsyncButton, AuthProviderList, OrDivider, Checkbox, RcButton, BrandImage, Banner, InfoBox, CopyCode, Password, LocaleSelector, Loading, TabTitle
  },

  data() {
    return {
      username: '',
      remember: false,
      password: '',

      timedOut:           this.$route.query[TIMED_OUT] === _FLAGGED,
      loggedOut:          this.$route.query[LOGGED_OUT] === _FLAGGED,
      isSessionIdle:      this.$route.query[IS_SESSION_IDLE] === _FLAGGED,
      isSsoLogout:        this.$route.query[IS_SSO] === _FLAGGED,
      isSlo:              this.$route.query[IS_SLO] === _FLAGGED,
      err:                this.$route.query.err,
      showLocaleSelector: !process.env.loginLocaleSelector || process.env.loginLocaleSelector === 'true',

      hasLocal:           false,
      showLocal:          false,
      providers:          [],
      providerComponents: [],
      providerOptions:    [],
      selectedProviderId: null,
      rememberProvider:   false,
      listExpanded:       false,
      customLoginError:   {},
      firstLogin:         false,
      vendor:             getVendor()
    };
  },

  computed: {
    ...mapGetters(['isSingleProduct']),
    ...mapGetters({ t: 'i18n/t', hasMultipleLocales: 'i18n/hasMultipleLocales' }),

    loggedOutSuccessMsg() {
      if (this.isSessionIdle) {
        return this.t('login.loggedOutSessionIdle');
      } else if (this.isSlo) {
        return this.t('login.loggedOutFromSlo');
      } else if (this.isSsoLogout) {
        return this.t('login.loggedOutFromSso');
      }

      return this.t('login.loggedOut');
    },

    isHarvester() {
      return this.isSingleProduct?.productName === HARVESTER;
    },

    /**
     * The provider the primary login button acts on.
     */
    selectedProvider() {
      return this.providerOptions.find((option) => option.id === this.selectedProviderId);
    },

    /**
     * Counted over the options rather than the external providers, because local
     * is one of the ways in. One external provider alongside local is still a
     * choice, even though the page offers it as a link rather than as a list.
     */
    hasProviderChoice() {
      return this.providerOptions.length > 1;
    },

    /**
     * A list is how the page asks which external provider to use. One of them
     * alongside local is a straight swap between two, which reads better as a
     * link -- and leaves nothing worth remembering, since the page opens on that
     * provider either way.
     */
    hasProviderList() {
      return this.providers.length > 1;
    },

    isCredentialForm() {
      return this.showLocal || this.selectedProvider?.category === 'ldap';
    },

    showProviderList() {
      return this.hasProviderList && (!this.isCredentialForm || this.listExpanded);
    },

    /**
     * Index of the selected provider within `providers`, which `providerComponents`
     * is built in step with.
     */
    selectedProviderIndex() {
      return this.providers.findIndex((provider) => provider.id === this.selectedProviderId);
    },

    selectedProviderComponent() {
      return this.providerComponents[this.selectedProviderIndex];
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

    loginMessages() {
      if (this.errorToDisplay) {
        return [{ message: this.errorToDisplay, variant: 'error' }];
      }

      if (this.loggedOut) {
        return [{ message: this.loggedOutSuccessMsg, variant: 'success' }];
      }

      if (this.timedOut) {
        return [{ message: this.t('login.loginAgain'), variant: 'error' }];
      }

      return [];
    },

    kubectlCmd() {
      return "kubectl get secret --namespace cattle-system bootstrap-secret -o go-template='{{.data.bootstrapPassword|base64decode}}{{\"\\n\"}}'";
    },

    hasLoginMessage() {
      return this.loginMessages.length > 0;
    },

    customizations() {
      const brandMeta = getBrandMeta(this.$store.getters['management/brand']);
      const login = brandMeta?.login || {};

      return {
        welcomeLabelKey: 'login.welcome',
        logoClass:       'login-logo',
        ...login,
      };
    },

    bannerClass() {
      return this.customizations.bannerClass;
    },

    brandLogo() {
      return this.customizations.logo;
    }
  },

  async fetch() {
    const cookie = this.$store.getters['cookies/get']({ key: USERNAME, options: { parseJSON: false } });
    const username = cookie || '';

    this.username = username;
    this.remember = !!username;

    const { firstLoginSetting } = await this.loadInitialSettings();
    const { value } = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS });
    const drivers = await this.$store.dispatch('auth/getAuthProviders');

    // Carries local as well, since the list offers it alongside the external providers.
    const providerOptions = toProviderOptions(drivers, {
      t:            this.t,
      withFallback: this.$store.getters['i18n/withFallback'],
    });

    const providers = providerOptions.filter((x) => !x.isLocal);
    const hasLocal = providerOptions.some((x) => x.isLocal);
    const hasOthers = hasLocal && !!providers.length;

    this.vendor = getVendor();
    this.providerOptions = providerOptions;
    this.providers = providers;
    this.hasLocal = hasLocal;

    const rememberedId = this.rememberedProviderId();
    const initial = resolveInitialProvider(providerOptions, rememberedId);

    this.selectedProviderId = initial?.id || null;
    // Only reflect the checkbox as ticked when the saved provider still exists;
    // a stale entry shouldn't claim the page is remembering something.
    this.rememberProvider = !!rememberedId && initial?.id === rememberedId;
    this.customLoginError = JSON.parse(value).loginError;
    this.firstLogin = firstLoginSetting?.value === 'true';
    this.username = this.firstLogin ? 'admin' : this.username;

    this.showLocal = hasLocal && (
      !hasOthers ||
      this.$route.query[LOCAL] === _FLAGGED ||
      !!initial?.isLocal
    );

    this.providerComponents = this.providers.map((x) => {
      return markRaw(this.$store.getters['type-map/importLogin'](configTypeForProvider(x.type) || x.type));
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

    /**
     * The saved choice, read only where the box that sets it is on offer. An entry
     * left over from when more providers were configured must not steer a page
     * that gives the user no way to clear it.
     */
    rememberedProviderId() {
      return this.hasProviderList ? getRememberedProviderId() : null;
    },

    /**
     * Picking a provider only changes what the page is offering -- the user still
     * confirms with the primary button, so SSO, LDAP and local all behave alike.
     */
    selectProvider(option) {
      this.selectedProviderId = option.id;
      this.showLocal = option.isLocal;
      this.listExpanded = false;

      if (this.rememberProvider) {
        setRememberedProviderId(option.id);
      }

      this.$nextTick(() => {
        this.focusSomething();
      });
    },

    /**
     * The swap between the single external provider and local. There is no list
     * to choose from with only two ways in, so the link moves the panel itself.
     */
    toggleLocal() {
      this.showLocal = !this.showLocal;
      this.selectedProviderId = this.showLocal ? LOCAL_AUTH_ID : this.providers[0]?.id || null;
      // Carried in the URL so a reload lands back where the user left off, which
      // means dropping the flag on the way out as well as setting it on the way in.
      this.$router.applyQuery({ [LOCAL]: this.showLocal }, { [LOCAL]: false });

      this.$nextTick(() => {
        this.focusSomething();
      });
    },

    expandProviderList() {
      const alternatives = this.providerOptions.filter((option) => option.id !== this.selectedProviderId);
      const fallback = resolveInitialProvider(alternatives, this.rememberedProviderId());

      if (fallback) {
        // Deliberately not `selectProvider`: the page is choosing here, not the
        // user, so it must not overwrite what they asked to be remembered.
        this.selectedProviderId = fallback.id;
        this.showLocal = fallback.isLocal;

        // The box speaks for the provider on screen, and the page has just
        // stepped onto one the user didn't ask for - so it stops claiming a
        // choice is saved. Only the saved id survives, for them to come back to.
        this.rememberProvider = false;
      }

      this.listExpanded = true;

      this.$nextTick(() => {
        this.$refs.providerList?.focus?.();
      });
    },

    setRememberProvider(remember) {
      this.rememberProvider = remember;

      if (remember && this.selectedProviderId) {
        setRememberedProviderId(this.selectedProviderId);
      } else {
        clearRememberedProviderId();
      }
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

        // we have to do the XHR requests because we don't have schemas loaded yet...
        let mgmtUser;
        const selfUser = await this.$store.dispatch('management/request', {
          url:    `/v1/${ EXT.SELFUSER }`,
          method: 'POST',
          data:   {}
        });

        if (selfUser) {
          await this.$store.dispatch('auth/updateSelfUser', selfUser);
          mgmtUser = await this.$store.dispatch('management/request', { url: `/v1/${ MANAGEMENT.USER }/${ selfUser.status?.userID }` });
        }

        if (!!mgmtUser) {
          this.$store.dispatch('auth/gotUser', mgmtUser);
        }

        if ( this.remember ) {
          const options = {
            encode:   (x) => x,
            maxAge:   86400 * 365,
            path:     '/',
            sameSite: true,
            secure:   true,
          };

          this.$store.commit('cookies/set', {
            key: USERNAME, value: this.username, options
          });
        } else {
          this.$store.commit('cookies/remove', { key: USERNAME });
        }

        // User logged with local login - we don't do any redirect/reload, so the boot-time plugin will not run again to laod the plugins
        // so we manually load them here - other SSO auth providers bounce out and back to the Dashboard, so on the bounce-back
        // the plugins will load via the boot-time plugin
        await loadPlugins({
          app:        this.$store.app,
          store:      this.$store,
          $extension: this.$store.$extension,
        });

        if (this.firstLogin || mgmtUser?.mustChangePassword) {
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
  <div
    v-else
    class="main-layout login"
  >
    <TabTitle
      :show-child="false"
      :breadcrumb="false"
    >
      {{ `${vendor} - ${t('login.login')}` }}
    </TabTitle>
    <div class="row gutless mb-20">
      <div class="col span-6 p-20 login-panel">
        <p
          v-if="!brandLogo"
          class="text-center"
        >
          {{ t('login.howdy') }}
        </p>
        <BrandImage
          v-else
          :class="{[customizations.logoClass]: !!customizations.logoClass}"
          :file-name="brandLogo"
          :alt="t('login.landscapeAlt')"
        />
        <h1 class="text-center login-welcome">
          {{ t(customizations.welcomeLabelKey, {vendor}) }}
        </h1>
        <div
          class="login-messages"
          data-testid="login__messages"
          :class="{'login-messages--hasContent': hasLoginMessage}"
        >
          <Banner
            v-for="message in loginMessages"
            :key="message.variant"
            :label="message.message"
            :color="message.variant"
            :role="message.variant === 'error' ? 'alert' : 'status'"
          />
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
          v-if="(!hasLocal || (hasLocal && !showLocal)) && selectedProvider && !selectedProvider.isLocal"
          class="login-column"
          :class="{'mt-30': !hasLoginMessage}"
        >
          <component
            :is="selectedProviderComponent"
            :key="selectedProvider.id"
            :focus-on-mount="!showLocal"
            :name="selectedProvider.id"
            :type="selectedProvider.type"
            :open="!showLocal"
            @showInputs="showLocal = false"
            @error="handleProviderError"
          />
        </div>
        <template v-if="hasLocal">
          <form
            v-if="showLocal"
            class="login-column"
            :class="{'mt-30': !hasLoginMessage}"
            @submit.prevent
          >
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
            <div>
              <Password
                ref="password"
                v-model:value="password"
                data-testid="local-login-password"
                :label="t('login.password')"
                autocomplete="current-password"
              />
            </div>
            <div class="mt-20 text-center">
              <AsyncButton
                id="submit"
                class="login-column__submit"
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
          </form>
        </template>
        <div
          v-if="hasProviderChoice"
          class="login-alternatives mt-20"
        >
          <OrDivider />
          <!--
            Several external providers are weighed up in a list. One alongside
            local is a straight swap between two, offered as a link instead.
          -->
          <template v-if="hasProviderList">
            <div
              v-if="!showProviderList"
              class="mt-20 text-center"
            >
              <RcButton
                variant="link"
                data-testid="login-provider-choose"
                @click="expandProviderList"
              >
                {{ t('login.providers.chooseDifferent') }}
              </RcButton>
            </div>
            <template v-else>
              <AuthProviderList
                ref="providerList"
                class="mt-20"
                :options="providerOptions"
                :selected-id="selectedProviderId"
                @select="selectProvider"
              />
              <div class="login-remember mt-20">
                <Checkbox
                  :value="rememberProvider"
                  :label="t('login.providers.remember')"
                  data-testid="login-provider-remember"
                  @update:value="setRememberProvider"
                />
                <p class="login-remember__hint">
                  {{ t('login.providers.rememberHint') }}
                </p>
              </div>
            </template>
          </template>
          <div
            v-else
            class="mt-20 text-center"
          >
            <RcButton
              v-if="showLocal"
              variant="link"
              data-testid="login-provider-choose"
              @click="toggleLocal"
            >
              {{ t('login.providers.chooseDifferent') }}
            </RcButton>
            <RcButton
              v-else
              variant="link"
              data-testid="login-useLocal"
              @click="toggleLocal"
            >
              {{ t('login.providers.useLocal') }}
            </RcButton>
          </div>
        </div>
        <div
          v-if="showLocaleSelector && hasMultipleLocales && !isHarvester"
          class="locale-selector"
        >
          <LocaleSelector
            mode="login"
          />
        </div>
      </div>
      <BrandImage
        :class="bannerClass"
        class="col span-6 landscape"
        data-testid="login-landscape__img"
        file-name="login-landscape.svg"
        :alt="t('login.landscapeAlt')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .login {
    --login-column-width: 362px;

    overflow: hidden;
    position: relative;  // Used to keep the locale selector positioned correctly

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

    .login-logo {
      align-self: center;
      max-width: 260px;
      margin-bottom: 20px;
    }

    .login-messages {
      width: var(--login-column-width);
      max-width: 100%;
      align-self: center;

      display: flex;
      justify-content: center;
      align-items: center;

      &--hasContent {
        min-height: 70px;
      }

      .banner {
        width: 100%;
        margin: 5px 0;
      }
    }

    // The inputs, the submit button and the provider divider are one column, so
    // they share a width rather than each being sized by its own content.
    .login-column,
    .login-alternatives {
      width: var(--login-column-width);
      max-width: 100%;
      align-self: center;
    }

    // `.btn` is a flex row, so a full-width button needs telling where to put
    // its label - it packs to the start otherwise.
    .login-column__submit,
    .login-column :deep([data-testid="login-provider-submit"]) {
      width: 100%;
      justify-content: center;
    }

    .login-remember {
      &__hint {
        margin-top: 2px;
        color: var(--label-secondary);
        font-size: 12px;
        line-height: 18px;
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
      justify-content: safe center;
    }
  }

  .login-panel {
    padding-bottom: 60px;
  }

  .locale-selector {
    position: absolute;
    bottom: 30px;
  }
</style>
