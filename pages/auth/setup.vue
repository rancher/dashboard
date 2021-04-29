<script>
import { randomStr } from '@/utils/string';
import LabeledInput from '@/components/form/LabeledInput';
import CopyToClipboard from '@/components/CopyToClipboard';
import AsyncButton from '@/components/AsyncButton';
import BrandImage from '@/components/BrandImage';
import { SETUP } from '@/config/query-params';
import { NORMAN, MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';
import Checkbox from '@/components/form/Checkbox';
import { getVendor, getProduct } from '@/config/private-label';
import { allHash } from '@/utils/promise';

export default {
  layout: 'unauthenticated',

  async middleware({ store, redirect, route } ) {
    const firstLoginSetting = await store.dispatch('rancher/find', {
      type: 'setting',
      id:   'first-login',
      opt:  { url: `/v3/settings/first-login` }
    });

    if (firstLoginSetting.value !== 'true') {
      return redirect('/');
    }
  },

  components: {
    AsyncButton, CopyCode, LabeledInput, CopyToClipboard, Checkbox, BrandImage
  },

  async asyncData({ route, req, store }) {
    const hash = await allHash({
      firstLoginSetting:  store.dispatch('rancher/find', {
        type: 'setting',
        id:   'first-login',
        opt:  { url: `/v3/settings/first-login` }
      }),
      telemetrySetting:  store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   'telemetry-opt',
        opt:  { url: `${ MANAGEMENT.SETTING }s/telemetry-opt` }
      }),
      serverUrlSetting: store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   'server-url',
        opt:  { url: `${ MANAGEMENT.SETTING }s/server-url` }
      }),
      principals:  store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      })
    });

    const firstLogin = hash.firstLoginSetting.value === 'true';

    if (!firstLogin) {

    }

    let eulaSetting;

    try {
      eulaSetting = await store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   'eula-accepted',
        opt:  { url: `${ MANAGEMENT.SETTING }s/eula-accepted` }
      });
    } catch {
      eulaSetting = await store.dispatch('management/create', {
        type: MANAGEMENT.SETTING, metadata: { name: 'eula-accepted' }, value: 'false', default: 'false'
      });
    }

    const current = route.query[SETUP] || 'admin';

    let serverUrl;

    if (hash.serverUrlSetting.value) {
      serverUrl = hash.serverUrlSetting.value;
    } else if ( process.server ) {
      serverUrl = req.headers.host;
    } else {
      serverUrl = window.location.origin;
    }

    return {
      vendor:            getVendor(),
      product:           getProduct(),
      firstLogin:        hash.firstLoginSetting.value === 'true',
      firstLoginSetting: hash.firstLoginSetting,
      step:              parseInt(route.query.step, 10) || 1,

      useRandom:   false,
      haveCurrent: !!current,
      username:    'admin',
      current,
      password:    '',
      confirm:     '',

      serverUrl,
      serverUrlSetting: hash.serverUrlSetting,

      telemetry:        hash.telemetrySetting.value !== 'out',
      telemetrySetting: hash.telemetrySetting,

      eula: eulaSetting.value === 'true',
      eulaSetting,

      principals: hash.principals,

      errors: []
    };
  },

  computed: {
    passwordSubmitDisabled() {
      if (!this.eula) {
        return true;
      }

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

    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

  },

  watch: {
    useRandom(neu) {
      if (neu) {
        this.password = randomStr();
      } else {
        this.password = '';
        this.$nextTick(() => {
          this.$refs.password.focus();
          this.$refs.password.select();
        });
      }
    }
  },

  mounted() {
    this.$refs.password.focus();
    this.$refs.password.select();
  },

  methods: {
    async finishPassword(buttonCb) {
      try {
        await this.$store.dispatch('loadManagement');
        this.telemetrySetting.value = this.telemetry ? 'in' : 'out';
        this.eulaSetting.value = 'true';
        this.firstLoginSetting.value = 'false';
        await Promise.all([this.eulaSetting.save(), this.telemetrySetting.save(), this.firstLoginSetting.save()]);
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=changepassword',
          method:        'post',
          headers:       { 'Content-Type': 'application/json' },
          data:          {
            currentPassword: this.current,
            newPassword:     this.password
          },
        });
        this.step = 2;
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    },

    async setServerUrl(buttonCb) {
      this.serverUrlSetting.value = this.serverUrl;
      try {
        await this.serverUrlSetting.save();
        buttonCb(true);
        this.done();
      } catch {
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
  <div class="setup">
    <div class="row">
      <div class="col span-6 pr-40 pl-40">
        <h1 class="text-center">
          {{ t('setup.welcome', {product}) }}
        </h1>

        <template v-if="step===1">
          <p class="text-center mb-20 mt-20">
            <t k="setup.setPassword" :raw="true" />
          </p>

          <!-- For password managers... -->
          <input type="hidden" name="username" autocomplete="username" :value="username" />

          <div class="row">
            <div class="col span-8">
              <div class="mb-20">
                <LabeledInput
                  ref="password"
                  v-model.trim="password"
                  :type="useRandom ? 'text' : 'password'"
                  :disabled="useRandom"
                  label-key="setup.newPassword"
                >
                  <template v-if="useRandom" #suffix>
                    <div class="addon" style="padding: 0 0 0 12px;">
                      <CopyToClipboard :text="password" class="btn-sm" />
                    </div>
                  </template>
                </LabeledInput>
              </div>
              <LabeledInput
                v-show="!useRandom"
                v-model.trim="confirm"
                autocomplete="new-password"
                type="password"
                label-key="setup.confirmPassword"
              />
            </div>
            <div class="col">
              <RadioGroup v-model="useRandom" name="password-mode" :options="[{label: t('setup.useRandom'), value: true}, {label: t('setup.useManual'), value: false}]" />
            </div>
          </div>

          <div class="checkbox mt-20">
            <<<<<<< HEAD
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
        </template>
      </div>
      <div class="col span-6">
        <BrandImage file-name="setup-step-one.svg" />
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
            =======
            <Checkbox v-model="telemetry" :label="t('setup.telemetry.label')" type="checkbox" />
            <i v-tooltip="{content:t('setup.telemetry.tip', {}, true), delay: {hide:500}, autoHide: false}" class="icon icon-info" />
            >>>>>>> initial setup flow
          </div>
          <div class="checkbox">
            <Checkbox v-model="eula" label-key="setup.eula" type="checkbox" />
          </div>

          <div class="text-center mt-20">
            <AsyncButton key="passwordSubmit" type="submit" mode="continue" :disabled="passwordSubmitDisabled" @click="finishPassword" />
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

        <template v-else>
          <p>
            <t k="setup.serverUrl.tip" :raw="true" />
          </p>
          <div class="mt-20">
            <LabeledInput v-model="serverUrl" :label="t('setup.serverUrl.label')" />
          </div>
          <div class="text-center mt-20">
            <button type="button" class="btn role-link" @click="done">
              {{ t('setup.serverUrl.skip') }}
            </button>
            <AsyncButton type="submit" mode="edit" @click="setServerUrl" />
          </div>
<<<<<<< HEAD
        </div>
        <div class="col span-6">
          <BrandImage file-name="setup-step-one.svg" />
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
          <BrandImage file-name="setup-step-one.svg" />
        </div>
      </div>
    </form>
=======
        </template>
      </div>

      <div class="col span-6 landscape" />
    </div>
>>>>>>> initial setup flow
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
    overflow: hidden;

    .row {
      align-items: center;
      & .checkbox {
        margin: auto
      }
    }

  }

      .landscape {
      background-image: url('~assets/images/pl/login-landscape.svg');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      height: 100vh;
    }
</style>
