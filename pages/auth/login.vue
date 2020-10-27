<script>
import { findBy } from '@/utils/array';
import { USERNAME } from '@/config/cookies';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import {
  LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED, SPA
} from '@/config/query-params';
import Checkbox from '@/components/form/Checkbox';
import { getVendor, getProduct } from '../../config/private-label';

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput, AsyncButton, Checkbox
  },

  async asyncData({ route, redirect, store }) {
    const providers = await store.dispatch('auth/getAuthProviders');

    const hasGithub = !!findBy(providers, 'id', 'github');
    const hasLocal = !!findBy(providers, 'id', 'local');

    if ( !process.env.dev && !route.query[SPA] ) {
      redirect(302, `${ store.getters['rancherLink'] }login`);

      return;
    }

    return {
      hasGithub,
      hasLocal,
      showLocal: !hasGithub || (route.query[LOCAL] === _FLAGGED),
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
    };
  },

  mounted() {
    this.focusSomething();
  },

  methods: {
    loginGithub() {
      this.$store.dispatch('auth/redirectToGithub');
    },

    toggleLocal() {
      this.showLocal = true;
      this.$router.applyQuery({ [LOCAL]: _FLAGGED });

      this.$nextTick(() => {
        this.focusSomething();
      });
    },

    focusSomething() {
      let elem;

      if ( this.hasGithub && !this.showLocal ) {
        elem = this.$refs.github;
      } else if ( this.username ) {
        elem = this.$refs.password;
      } else {
        elem = this.$refs.username;
      }

      if ( elem ) {
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
          Howdy!
        </p>
        <h1 class="text-center">
          Welcome to {{ vendor }}
        </h1>
        <h4 v-if="err" class="text-error text-center">
          An error occurred logging in.  Please try again.
        </h4>
        <h4 v-else-if="loggedOut" class="text-success text-center">
          You have been logged out.
        </h4>
        <h4 v-else-if="timedOut" class="text-error text-center">
          Log in again to continue.
        </h4>

        <div v-if="hasGithub" class="text-center mt-50 mb-50">
          <button ref="github" class="btn bg-primary" style="font-size: 18px;" @click="loginGithub">
            Log In with GitHub
          </button>
          <div v-if="!showLocal" class="mt-20">
            <button type="button" class="btn bg-link" @click="toggleLocal">
              Use a Local User
            </button>
          </div>
        </div>

        <form v-if="hasLocal && showLocal" class="mt-50">
          <div class="span-6 offset-3">
            <div class="mb-20">
              <LabeledInput
                ref="username"
                v-model="username"
                label="Username"
                autocomplete="username"
              />
            </div>
            <div class="">
              <LabeledInput
                ref="password"
                v-model="password"
                type="password"
                label="Password"
                autocomplete="password"
              />
            </div>
          </div>
          <div class="mt-20">
            <div class="col span-12 text-center">
              <AsyncButton
                type="submit"
                action-label="Log In with Local User"
                waiting-label="Logging In..."
                success-label="Logged In"
                error-label="Error"
                @click="loginLocal"
              />
              <div class="mt-20">
                <Checkbox v-model="remember" label="Remember Username" type="checkbox" />
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="col span-6 landscape">
        <!-- <img src="~/assets/images/login-landscape.svg" alt="landscape" /> -->
      </div>
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
