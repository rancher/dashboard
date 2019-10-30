<script>
import { randomStr } from '@/utils/string';
import LabeledInput from '@/components/form/LabeledInput';
import CopyToClipboard from '@/components/CopyToClipboard';
import AsyncButton from '@/components/AsyncButton';
import { SETUP, _DELETE } from '@/config/query-params';
import { RANCHER } from '@/config/types';

export default {
  layout: 'plain',

  components: {
    AsyncButton, CopyToClipboard, LabeledInput
  },

  computed: {
    passwordSubmitDisabled() {
      if ( this.useRandom ) {
        return false;
      }

      if ( !this.password || this.password !== this.confirm ) {
        return true;
      }

      if ( !this.current ) {
        return true;
      }

      return false;
    },

    serverSubmitDisabled() {
      if ( !this.serverUrl ) {
        return true;
      }

      return false;
    },
  },

  async asyncData({ route, req, store }) {
    const current = route.query[SETUP] || '';
    const password = randomStr();

    const serverUrlSetting = await store.dispatch('rancher/find', {
      type: RANCHER.SETTING,
      id:   'server-url',
      opt:  { url: '/v3/settings/server-url' }
    });

    const telemetrySetting = await store.dispatch('rancher/find', {
      type: RANCHER.SETTING,
      id:   'telemetry-opt',
      opt:  { url: '/v3/settings/telemetry-opt' }
    });

    let serverUrl = serverUrlSetting.value;

    if ( !serverUrl ) {
      if ( process.server ) {
        serverUrl = req.headers.host;
      } else {
        serverUrl = window.location.origin;
      }
    }

    const telemetry = telemetrySetting.value !== 'out';

    return {
      step:        parseInt(route.query.step, 10) || 1,
      useRandom:   true,
      haveCurrent: !!current,
      username:    'admin',
      current,
      password,
      confirm:     '',
      serverUrl,
      serverUrlSetting,
      telemetry,
      telemetrySetting,
    };
  },

  methods: {
    manual() {
      this.useRandom = false;
      this.password = '';
      this.$nextTick(() => {
        this.$refs.password.focus();
        this.$refs.password.select();
      });
    },

    async finishPassword(buttonCb) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=changepassword',
          method:        'post',
          headers:       { 'Content-Type': 'application/json' },
          data:          {
            currentPassword: this.current,
            newPassword:     this.password
          },
        });

        this.$router.applyQuery({ [SETUP]: _DELETE });

        buttonCb(true);
        this.step = 2;
      } catch (err) {
        buttonCb(false);
      }
    },

    async finishServerSettings(buttonCb) {
      try {
        this.serverUrlSetting.value = this.serverUrl;
        await this.serverUrlSetting.save();

        this.telemetrySetting.value = this.telemetry ? 'in' : 'out';
        await this.telemetrySetting.save();

        buttonCb(true);
        this.step = 3;
      } catch (err) {
        console.log(err);
        buttonCb(false);
      }
    },

    finishGithub(buttonCb) {
      this.$router.replace('/');
    },
  },
};
</script>
<template>
  <form>
    <div v-if="step === 1">
      <div class="text-center mb-40">
        <div style="width: 50%; margin: 50px auto; height: 300px; line-height: 300px; border: 1px solid var(--border); text-align: center; background-color: var(--border);">
          <h1>A snazzy picture</h1>
        </div>

        <h1>Welcome to Rio</h1>

        <h4>The first order of business is to set a strong password for the default <code>admin</code> user.</h4>

        <p>
          We suggest using this random one generated just for you, but you enter your own if you like.
        </p>
      </div>

      <!-- For password managers... -->
      <div class="row">
        <div class="col span-6 offset-3">
          <LabeledInput
            ref="username"
            v-model="username"
            autocomplete="username"
            label="Username"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3">
          <LabeledInput
            v-if="!haveCurrent"
            v-model.trim="current"
            autocomplete="current-password"
            type="password"
            label="Current Password"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3">
          <LabeledInput
            ref="password"
            v-model.trim="password"
            :type="useRandom ? 'text' : 'password'"
            autocomplete="new-password"
            label="New Password"
          >
            <template v-if="useRandom" #suffix>
              <div class="addon">
                <CopyToClipboard :text="password" stlye="display: inline;" />
              </div>
            </template>
          </LabeledInput>
          <div v-if="useRandom" class="mt-5">
            <a href="#" @click.prevent.stop="manual">Choose a password manually</a>
          </div>
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3">
          <LabeledInput
            v-show="!useRandom"
            v-model.trim="confirm"
            autocomplete="new-password"
            type="password"
            label="Confirm New Password"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3 text-center" style="font-size: 24pt">
          <AsyncButton mode="continue" :disabled="passwordSubmitDisabled" @click="finishPassword" />
        </div>
      </div>
    </div>

    <div v-if="step === 2">
      <div class="text-center mb-40">
        <div style="width: 50%; margin: 50px auto; height: 300px; padding-top: 100px; border: 1px solid var(--border); text-align: center; background-color: var(--border);">
          <h1>A snazzier picture</h1>
        </div>

        <h1>Server Configuration</h1>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3">
          <LabeledInput
            v-model.trim="serverUrl"
            type="url"
            label="Server URL"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3">
          <div class="checkbox">
            <label>
              <input v-model="telemetry" type="checkbox" disabled />
              Allow collection of anonymous statistics (required during beta period).
            </label>
          </div>
          <p>
            Rancher Labs would like to collect anonymous information about
            the configuration of your installation to help make Rio better.
            Your data will not be shared with anyone else, and no specific
            resource names or addresses are collected.
          </p>
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3 text-center" style="font-size: 24pt">
          <AsyncButton mode="continue" :disabled="serverSubmitDisabled" @click="finishServerSettings" />
        </div>
      </div>
    </div>

    <div v-if="step === 3">
      <div class="text-center mb-40">
        <div style="width: 50%; margin: 50px auto; height: 300px; padding-top: 100px; border: 1px solid var(--border); text-align: center; background-color: var(--border);">
          <h1>An even snazzier picture, with octocats</h1>
        </div>

        <h1>GitHub Integration</h1>
        <p>
          Rio can optionally integrate with GitHub to read resources from
          repositories and automatically update them when code is pushed.
        </p>
      </div>

      <div class="row mt-20">
        <div class="col span-6 offset-3 text-center" style="font-size: 24pt">
          <AsyncButton mode="continue" :disabled="serverSubmitDisabled" @click="finishGithub" />
        </div>
      </div>
    </div>
  </form>
</template>
