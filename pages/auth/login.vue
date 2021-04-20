<script>
import { removeObject } from '@/utils/array';
import { USERNAME } from '@/config/cookies';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import { LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@/config/query-params';
import Checkbox from '@/components/form/Checkbox';
import { sortBy } from '@/utils/sort';
import { configType } from '@/models/management.cattle.io.authconfig';
import { mapGetters } from 'vuex';
import { importLogin } from '@/utils/dynamic-importer';
import { getVendor, getProduct } from '../../config/private-label';

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput, AsyncButton, Checkbox
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

    return {
      providers,
      hasOthers,
      hasLocal,
      showLocal: !hasOthers || (route.query[LOCAL] === _FLAGGED),
    };
  },

  data({ $cookies }) {
    const username = $cookies.get(USERNAME, { parseJSON: false }) || '';

    return {
      vendor:  getVendor(),
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

  computed: { ...mapGetters({ t: 'i18n/t' }) },

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
      this.showLocal = true;
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
        buttonCb(true);
        this.$router.replace('/');
      } catch (err) {
        this.err = err;
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
        <h4 v-if="err" class="text-error text-center">
          {{ t('login.error') }}
        </h4>
        <h4 v-else-if="loggedOut" class="text-success text-center">
          {{ t('login.loggedOut') }}
        </h4>
        <h4 v-else-if="timedOut" class="text-error text-center">
          {{ t('login.loginAgain') }}
        </h4>

        <div v-if="providers.length" class="mt-50">
          <component
            :is="providerComponents[idx]"
            v-for="(name, idx) in providers"
            :key="name"
            class="mb-10"
            :focus-on-mount="(idx === 0 && !showLocal)"
            :name="name"
            :only-option="providers.length === 1 && !showLocal"
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
                  style="font-size: 18px;"
                  @click="loginLocal"
                />
                <div class="mt-20">
                  <Checkbox v-model="remember" label="Remember Username" type="checkbox" />
                </div>
              </div>
            </div>
          </form>
          <div v-if="hasLocal && !showLocal" class="mt-20 text-center">
            <button type="button" class="btn bg-link" @click="toggleLocal">
              {{ t('login.useLocal') }}
            </button>
          </div>
        </template>
      </div>

      <div class="col span-6 landscape" />
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
      background-image: url('~assets/images/pl/login-landscape.svg');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      height: 100vh;
    }
  }
</style>
