<script>
import { removeObject } from '@/utils/array';
import { USERNAME } from '@/config/cookies';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import BrandImage from '@/components/BrandImage';
import { LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@/config/query-params';
import Checkbox from '@/components/form/Checkbox';
import { sortBy } from '@/utils/sort';
import { configType } from '@/models/management.cattle.io.authconfig';
import { mapGetters } from 'vuex';
import { importLogin } from '@/utils/dynamic-importer';
import { _ALL_IF_AUTHED } from '@/plugins/steve/actions';
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import { LOGIN_ERRORS } from '@/store/auth';
import { getVendor, getProduct, setVendor } from '../../config/private-label';

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput, AsyncButton, Checkbox, BrandImage,
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

    let firstLoginSetting, plSetting;

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
    }

    if (plSetting.value?.length && plSetting.value !== getVendor()) {
      setVendor(plSetting.value);
    }
    const needsSetup = firstLoginSetting?.value === 'true';

    let singleProvider;

    if (providers.length === 1) {
      singleProvider = providers[0];
    }

    return {
      vendor:    getVendor(),
      providers,
      hasOthers,
      hasLocal,
      showLocal: !hasOthers || (route.query[LOCAL] === _FLAGGED),
      needsSetup,
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
    }
  },

  created() {
    this.providerComponents = this.providers.map((name) => {
      return importLogin(configType[name]);
    });
  },

  mounted() {
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
        this.err = null;
        this.timedOut = null;
        this.loggedOut = null;
        await this.$store.dispatch('auth/login', {
          provider: 'local',
          body:     {
            username: this.username,
            password: this.password
          }
        });
        if ( this.remember ) {
          this.$cookies.set(USERNAME, this.username, {
            encode: x => x,
            maxAge: 86400 * 365,
            secure: true,
            path:   '/',
          });
        } else {
          this.$cookies.remove(USERNAME);
        }

        if (this.needsSetup) {
          this.$router.push({ name: 'auth-setup', query: { setup: this.password } });
        } else {
          this.$router.replace('/');
        }
      } catch (err) {
        if (err === LOGIN_ERRORS.CLIENT_UNAUTHORIZED) {
          this.err = this.t('login.clientError');
        } else if (err === LOGIN_ERRORS.CLIENT || err === LOGIN_ERRORS.SERVER) {
          this.err = this.t('login.error');
        } else {
          this.err = err;
        }
        buttonCb(false);
      }
    },
  }
};
</script>

<template>
  <main class="login">
    <div class="row mb-20">
      <div class="col span-6">
        <p class="text-center">
          {{ t('login.howdy') }}
        </p>
        <h1 class="text-center">
          {{ t('login.welcome', {vendor}) }}
        </h1>
        <div class="login-messages">
          <h4 v-if="err" class="text-error text-center">
            {{ err }}
          </h4>
          <h4 v-else-if="loggedOut" class="text-success text-center">
            {{ t('login.loggedOut') }}
          </h4>
          <h4 v-else-if="timedOut" class="text-error text-center">
            {{ t('login.loginAgain') }}
          </h4>
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
          <form v-if="showLocal" class="mt-50">
            <div class="span-6 offset-3">
              <div class="mb-20">
                <LabeledInput
                  ref="username"
                  v-model="username"
                  :label="t('login.username')"
                  autocomplete="username"
                />
              </div>
              <div class="">
                <LabeledInput
                  ref="password"
                  v-model="password"
                  type="password"
                  :label="t('login.password')"
                  autocomplete="password"
                />
              </div>
            </div>
            <div class="mt-20">
              <div class="col span-12 text-center">
                <AsyncButton
                  type="submit"
                  :action-label="t('login.loginWithLocal')"
                  :waiting-label="t('login.loggingIn')"
                  :success-label="t('login.loggedIn')"
                  :error-label="t('asyncButton.default.error')"
                  @click="loginLocal"
                />
                <div class="mt-20">
                  <Checkbox v-model="remember" label="Remember Username" type="checkbox" />
                </div>
              </div>
            </div>
          </form>
          <div v-if="hasLocal && !showLocal" class="mt-20 text-center">
            <a role="button" @click="toggleLocal">
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

    .login-messages {
      height: 20px
    }
  }
</style>
