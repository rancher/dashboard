<script>
import { findBy } from '@/utils/array';
import { USERNAME } from '@/config/cookies';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import { LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@/config/query-params';

export default {
  layout:     'unauthenticated',
  components: { LabeledInput, AsyncButton },

  data({ $cookies }) {
    const username = $cookies.get(USERNAME) || '';

    return {
      username,
      remember:  !!username,
      password:  '',

      timedOut:  this.$route.query[TIMED_OUT] === _FLAGGED,
      loggedOut: this.$route.query[LOGGED_OUT] === _FLAGGED,
      err:       this.$route.query.err,
    };
  },

  async asyncData({ route, store }) {
    const providers = await store.dispatch('auth/getAuthProviders');

    const hasGithub = !!findBy(providers, 'id', 'github');
    const hasLocal = !!findBy(providers, 'id', 'local');

    return {
      hasGithub,
      hasLocal,
      showLocal: !hasGithub || (route.query[LOCAL] === _FLAGGED),
    };
  },

  methods: {
    loginGithub() {
      this.$store.dispatch('auth/redirectToGithub');
    },

    toggleLocal() {
      this.showLocal = true;
      this.$router.applyQuery({ [LOCAL]: _FLAGGED });

      this.$nextTick(() => {
        let elem;

        if ( this.username ) {
          elem = this.$refs.password;
        } else {
          elem = this.$refs.username;
        }

        if ( elem ) {
          elem.focus();
          elem.select();
        }
      });
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

        buttonCb(true);
        this.$router.replace('/');
      } catch (e) {
        buttonCb(false);
      }
    },
  }
};
</script>

<template>
  <main>
    <div class="row">
      <div class="col span-5">
        <h1 class="text-center">
          Rio Dashboard
        </h1>
        <h4 v-if="loggedOut" class="text-success text-center">
          You have been logged out.
        </h4>
        <h4 v-if="timedOut" class="text-error text-center">
          Log in again to continue.
        </h4>
        <h4 v-else-if="err" class="text-error text-center">
          An error occurred logging in.  Please try again.
        </h4>

        <div v-if="hasGithub" class="text-center mt-50 mb-50">
          <button class="btn bg-primary" style="font-size: 18px;" @click="loginGithub">
            Log In with GitHub
          </button>
          <div v-if="!showLocal" class="mt-20">
            <button type="button" class="btn bg-link" @click="toggleLocal">
              Use a Local User
            </button>
          </div>
        </div>

        <form v-if="hasLocal && showLocal">
          <div class="row">
            <div class="col span-4 offset-4">
              <LabeledInput
                ref="username"
                v-model="username"
                label="Username"
                autocomplete="username"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-4 offset-4">
              <LabeledInput
                ref="password"
                v-model="password"
                type="password"
                label="Password"
                autocomplete="password"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-4 offset-4">
              <AsyncButton
                type="submit"
                action-label="Log In with Local User"
                waiting-label="Logging In..."
                success-label="Logged In"
                error-label="Error"
                @click="loginLocal"
              />
              <label class="pull-right">
                <input v-model="remember" type="checkbox" />
                Remember Username
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="col span-7">
        <img src="~/assets/images/login-landscape.svg" alt="landscape" />
      </div>
    </div>
  </main>
</template>
