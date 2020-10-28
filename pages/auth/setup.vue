<script>
import { randomStr } from '@/utils/string';
import LabeledInput from '@/components/form/LabeledInput';
import CopyCode from '@/components/CopyCode';
import CopyToClipboard from '@/components/CopyToClipboard';
import AsyncButton from '@/components/AsyncButton';
import { SETUP, STEP, _UNFLAG } from '@/config/query-params';
import { NORMAN, MANAGEMENT } from '@/config/types';
import { open, popupWindowOptions } from '@/utils/window';
import { findBy, filterBy, addObject, removeObject } from '@/utils/array';
import Checkbox from '@/components/form/Checkbox';
import { getVendor, getProduct } from '@/config/private-label';

export default {
  layout: 'blank',

  components: {
    AsyncButton, CopyCode, LabeledInput, CopyToClipboard, Checkbox
  },

  async asyncData({ route, req, store }) {
    const current = route.query[SETUP] || '';
    const password = randomStr();

    const firstLoginSetting = await store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'first-login',
      opt:  { url: `${ MANAGEMENT.SETTING }s/first-login` }
    });

    const telemetrySetting = await store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'telemetry-opt',
      opt:  { url: `${ MANAGEMENT.SETTING }s/telemetry-opt` }
    });

    let githubConfig = await store.dispatch('rancher/find', {
      type: NORMAN.AUTH_CONFIG,
      id:   'github',
      opt:  { url: '/v3/authConfigs/github' }
    });

    githubConfig = await store.dispatch('rancher/clone', { resource: githubConfig });

    const principals = await store.dispatch('rancher/findAll', {
      type: NORMAN.PRINCIPAL,
      opt:  { url: '/v3/principals' }
    });

    let serverUrl;

    if ( process.server ) {
      serverUrl = req.headers.host;
    } else {
      serverUrl = window.location.origin;
    }

    const telemetry = telemetrySetting.value !== 'out';

    const kind = githubConfig.hostname && githubConfig.hostname !== 'github.com' ? 'enterprise' : 'public' ;

    const clientId = githubConfig.clientId;
    /*
    const mapping = githubConfig.hostnameToClientId;
    if ( mapping && mapping[origin] ) {

    }
    */

    return {
      vendor:      getVendor(),
      product:     getProduct(),
      firstLogin:  firstLoginSetting.value === 'true',
      step:        parseInt(route.query.step, 10) || 1,

      useRandom:   true,
      haveCurrent: !!current,
      username:    'admin',
      current,
      password,
      confirm:     '',

      serverUrl,

      telemetry,
      telemetrySetting,

      githubConfig,
      kind,
      clientId,
      clientSecret: githubConfig.clientSecret || '',
      hostname:     githubConfig.hostname || 'github.com',
      tls:          kind === 'public' || githubConfig.tls,
      githubError:  null,

      principals
    };
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

    githubSubmitDisabled() {
      if ( !this.clientId || !this.clientSecret ) {
        return true;
      }

      return false;
    },

    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    orgs() {
      const out = filterBy(this.principals, 'principalType', 'org');

      return out;
    }
  },

  methods: {
    goToStep(num) {
      this.step = num;
      this.$router.applyQuery({
        [SETUP]: _UNFLAG,
        [STEP]:  this.step,
      });
    },

    skipPassword() {
      this.goToStep(2);
    },

    async finishPassword(buttonCb) {
      try {
        this.telemetrySetting.value = this.telemetry ? 'in' : 'out';
        await this.telemetrySetting.save();

        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=changepassword',
          method:        'post',
          headers:       { 'Content-Type': 'application/json' },
          data:          {
            currentPassword: this.current,
            newPassword:     this.password
          },
        });

        buttonCb(true);
        this.goToStep(2);
      } catch (err) {
        buttonCb(false);
      }
    },

    manual() {
      this.useRandom = false;
      this.password = '';
      this.$nextTick(() => {
        this.$refs.password.focus();
        this.$refs.password.select();
      });
    },

    configureTest(c) {
      return new Promise((resolve, reject) => {
        window.authTestConfig = c;

        window.onAuthTest = (code) => {
          resolve(code);
        };

        let popup;

        const timer = setInterval(() => {
          if ( popup && popup.closed ) {
            clearInterval(timer);

            return reject(new Error('Access was not authorized'));
          } else if ( popup === null || popup === undefined ) {
            clearInterval(timer);

            return reject(new Error('Please disable your popup blocker for this site'));
          }
        }, 500);

        c.doAction('configureTest', c).then((res) => {
          this.$store.dispatch('auth/redirectToGithub', {
            redirectUrl: res.redirectUrl,
            test:        true,
            redirect:    false
          }).then((url) => {
            popup = open(url, 'auth-test', popupWindowOptions());
          }).catch((err) => {
            reject(err);
          });
        });
      });
    },

    async testGithub(buttonCb) {
      try {
        this.githubError = null;

        const c = this.githubConfig;

        c.clientId = this.clientId;
        c.clientSecret = this.clientSecret;
        c.enabled = true;
        c.allowedPrincipalIds = c.allowedPrincipalIds || [];

        if ( this.kind === 'public' ) {
          c.hostname = 'github.com';
          c.tls = true;
          c.accessMode = 'restricted';
        } else {
          c.accessMode = c.accessMode || 'unrestricted';
          c.tls = this.tls;
        }

        const code = await this.configureTest(c);

        await c.doAction('testAndApply', {
          code,
          enabled:      true,
          githubConfig: c,
          description:  'Initial setup session',
        });

        const githubConfig = await this.$store.dispatch('rancher/find', {
          type: NORMAN.AUTH_CONFIG,
          id:   'github',
          opt:  { url: '/v3/authConfigs/github', force: true }
        });

        this.principals = await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.PRINCIPAL,
          opt:  { url: '/v3/principals', force: true }
        });

        this.githubConfig = await this.$store.dispatch('rancher/clone', { resource: githubConfig });

        this.githubConfig.allowedPrincipalIds = this.githubConfig.allowedPrincipalIds || [];

        if ( this.me ) {
          addObject(this.githubConfig.allowedPrincipalIds, this.me.id);
        }

        buttonCb(true);
        this.goToStep(3);
      } catch (e) {
        buttonCb(false);
        this.githubError = e;
      }
    },

    togglePrincipal(e) {
      const target = e.target;

      let ary = this.githubConfig.allowedPrincipalIds;

      if ( !ary ) {
        ary = [];
        this.githubConfig.allowedPrincipalIds = ary;
      }

      if ( target.checked ) {
        addObject(ary, target.value);
      } else {
        removeObject(ary, target.value);
      }
    },

    async setAuthorized(buttonCb) {
      try {
        window.z = this.githubConfig;
        console.log(this.githubConfig); // eslint-disable-line no-console
        await this.githubConfig.save();
        buttonCb(true);
        this.done();
      } catch (e) {
        buttonCb(false);
      }
    },

    done() {
      this.$router.replace('/');
    },
  },
};
</script>
<template>
  <div class="container setup">
    <form v-if="step === 1">
      <div class="row">
        <div class="col span-6">
          <h1>Welcome to {{ product }}!</h1>

          <p class="text-muted mb-20 mt-20" style="line-height: 1.2em;">
            The first order of business is to set a strong password for the default <code>admin</code> user.
          </p>
          <p class="text-muted mb-40">
            We suggest using this random one generated just for you, but you enter your own if you like.
          </p>

          <!-- For password managers... -->
          <input type="hidden" name="username" autocomplete="username" :value="username" />

          <div class="mt-20">
            <div>
              <LabeledInput
                v-if="!haveCurrent"
                v-model.trim="current"
                autocomplete="current-password"
                type="password"
                label="Current Password"
              />
            </div>
          </div>
          <div class="mt-20">
            <div>
              <LabeledInput
                ref="password"
                v-model.trim="password"
                :type="useRandom ? 'text' : 'password'"
                :readonly="useRandom"
                autocomplete="new-password"
                label="New Password"
              >
                <template v-if="useRandom" #suffix>
                  <div class="addon" style="padding: 0 0 0 12px;">
                    <CopyToClipboard :text="password" class="btn-sm" />
                  </div>
                </template>
              </LabeledInput>
              <div v-if="useRandom" class="mt-5">
                <a href="#" @click.prevent.stop="manual">Choose a password manually</a>
              </div>
            </div>
          </div>

          <div class="mt-20">
            <div>
              <LabeledInput
                v-show="!useRandom"
                v-model.trim="confirm"
                autocomplete="new-password"
                type="password"
                label="Confirm New Password"
              />
            </div>
          </div>

          <div class="checkbox mt-20">
            <Checkbox v-model="telemetry" label="Allow collection of anonymous statistics to help us improve Rio" type="checkbox" />
            <v-popover placement="right">
              <i class="icon icon-info" />
              <span slot="popover">
                Rancher Labs would like to collect a bit of anonymized information<br />
                about the configuration of your installation to help make Rio better.<br /><br />
                Your data will not be shared with anyone else, and no information about<br />
                what specific resources or endpoints you are deploying is included.<br />
                Once enabled you can view exactly what data will be sent at <code>/v1-telemetry</code>.<br /><br />
                <a href="https://rancher.com/docs/rancher/v2.x/en/faq/telemetry/" target="_blank">More Info</a>
              </span>
            </v-popover>
          </div>

          <div class="mt-20">
            <button v-if="!firstLogin" type="button" class="btn bg-default mr-20" @click="skipPassword">
              Skip
            </button>
            <AsyncButton key="passwordSubmit" type="submit" mode="continue" :disabled="passwordSubmitDisabled" @click="finishPassword" />
          </div>
        </div>
        <div class="col span-6">
          <img src="~/assets/images/pl/setup-step-one.svg" />
        </div>
      </div>
    </form>

    <form v-if="step === 2">
      <div class="row">
        <div class="col span-6">
          <h1 class="mb-20">
            GitHub Integration
          </h1>
          <p class="text-muted mb-40">
            Rio can optionally integrate with GitHub to read resources from
            repositories and automatically update them when code is pushed.
          </p>
          <div class="mt-20">
            <div>
              <label class="radio">
                <input
                  v-model="kind"
                  type="radio"
                  value="public"
                > Use public GitHub.com
              </label>
            </div>
            <div>
              <label class="radio">
                <input
                  v-model="kind"
                  type="radio"
                  value="enterprise"
                > Use a private GitHub Enterprise installation
              </label>
            </div>
          </div>

          <div class="mt-20 text-muted">
            <p>
              1. Create an <a v-if="kind === 'public'" href="https://github.com/settings/developers" target="_blank" rel="nofollow noopener noreferrer">OAuth App</a>
              <span v-else>OAuth App</span>
              with <CopyCode>{{ serverUrl }}</CopyCode>
              as the Homepage and Authorization callback URLs.
            </p>
            <p>&nbsp;</p>
            <p>2. Then copy the Client ID and Client Secret from the new app and fill them in here:</p>
            <div v-if="kind === 'enterprise'" class="mt-20">
              <LabeledInput
                ref="hostname"
                v-model.trim="hostname"
                autocomplete="off"
                label="GitHub Enterprise Hostname"
              />
              <div>
                <label class="checkbox"><input v-model="tls" type="checkbox" /> Use TLS (https://) connection</label>
              </div>
            </div>
          </div>

          <div class="mt-20">
            <LabeledInput
              ref="clientId"
              v-model.trim="clientId"
              autocomplete="username"
              label="GitHub Client ID"
            />
          </div>

          <div class="mt-20">
            <LabeledInput
              ref="clientSecret"
              v-model.trim="clientSecret"
              type="password"
              autocomplete="password"
              label="GitHub Client Secret"
            />
          </div>

          <div v-if="githubError" class="mt-20">
            <div class="text-center text-error">
              {{ githubError }}
            </div>
          </div>

          <div class="mt-20">
            <button type="button" class="btn bg-default mr-20" @click="done">
              Skip
            </button>
            <AsyncButton key="githubSubmit" type="submit" mode="continue" :disabled="githubSubmitDisabled" @click="testGithub" />
          </div>
        </div>
        <div class="col span-6">
          <img src="~/assets/images/pl/setup-step-one.svg" />
        </div>
      </div>
    </form>

    <form v-if="step === 3">
      <div class="row">
        <div class="col span-6">
          <h1>GitHub Integration, Part Deux</h1>
          <p class="text-muted mb-20 mt-20">
            Who should be able to login?
          </p>
          <div>
            <label v-if="me" class="principal">
              <input type="checkbox" checked disabled />
              <img :src="me.avatarSrc" width="40" height="40" />
              <span class="login">
                {{ me.loginName }}
              </span>
            </label>

            <label v-for="org in orgs" :key="org.id" class="principal">
              <input type="checkbox" :checked="(githubConfig.allowedPrincipalIds || []).includes(org.id)" :value="org.id" @click="togglePrincipal" />
              <img :src="org.avatarSrc" width="40" height="40" />
              <span class="login">
                Members of <b>{{ org.loginName }}</b>
              </span>
            </label>
          </div>
          <div class="mt-20">
            <AsyncButton key="setAuthorized" type="submit" mode="done" @click="setAuthorized" />
          </div>
        </div>
        <div class="col span-6">
          <img src="~/assets/images/pl/setup-step-one.svg" />
        </div>
      </div>
    </form>
  </div>
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
    .row {
      align-items: center;
      & .checkbox {
        display: flex;
        align-items: center;
      }
    }

    code {
      background: var(--accent-btn);
      padding: 2.5px 5px;
      border-radius: 3px;
    }
  }
</style>
