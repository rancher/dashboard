<script>
import { randomStr } from '@/utils/string';
import LabeledInput from '@/components/form/LabeledInput';
import CopyToClipboard from '@/components/CopyToClipboard';
import AsyncButton from '@/components/AsyncButton';
import { SETUP } from '@/config/query-params';
import { NORMAN, MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';
import Checkbox from '@/components/form/Checkbox';
import { getVendor, getProduct } from '@/config/private-label';
import RadioGroup from '@/components/form/RadioGroup';
import { allHash } from '@/utils/promise';
import { SETTING } from '@/config/settings';
import { _ALL_IF_AUTHED } from '@/plugins/steve/actions';

export default {
  layout: 'unauthenticated',

  async middleware({ store, redirect, route } ) {
    await store.dispatch('management/findAll', { type: MANAGEMENT.SETTING, load: _ALL_IF_AUTHED });

    const firstLoginSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);

    if (firstLoginSetting?.value !== 'true') {
      return redirect('/');
    }
  },

  components: {
    AsyncButton, LabeledInput, CopyToClipboard, Checkbox, RadioGroup
  },

  async asyncData({ route, req, store }) {
    const hash = await allHash({
      firstLoginSetting:  store.dispatch('rancher/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.FIRST_LOGIN,
      }),
      telemetrySetting:  store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.TELEMETRY
      }),
      serverUrlSetting: store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SERVER_URL,
      }),
      eulaSetting: await store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.EULA_AGREED,
      }),
      principals: store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL })
    });

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

      eula:        hash.eulaSetting.value !== '',
      eulaSetting: hash.eulaSetting,

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
        this.eulaSetting.value = (new Date()).toISOString();
        this.firstLoginSetting.value = 'false';
        await Promise.all([this.eulaSetting.save(), this.telemetrySetting.save(), this.firstLoginSetting.save()]);
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=changepassword',
          method:        'post',
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
      <div class="col span-6">
        <h1 class="text-center">
          {{ t('setup.welcome', {product}) }}
        </h1>

        <template v-if="step===1">
          <p class="text-center mb-40 mt-20">
            <t k="setup.setPassword" :raw="true" />
          </p>

          <!-- For password managers... -->
          <input type="hidden" name="username" autocomplete="username" :value="username" />
          <div class="mb-20">
            <RadioGroup v-model="useRandom" name="password-mode" :options="[{label: t('setup.useRandom'), value: true}, {label: t('setup.useManual'), value: false}]" />
          </div>
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

          <hr class="mt-40 mb-40 " />

          <div class="checkbox">
            <Checkbox v-model="telemetry" :label="t('setup.telemetry.label')" type="checkbox" />
            <i v-tooltip="{content:t('setup.telemetry.tip', {}, true), delay: {hide:500}, autoHide: false}" class="icon icon-info" />
          </div>
          <div class="checkbox">
            <Checkbox v-model="eula" label-key="setup.eula" type="checkbox" />
          </div>

          <div class="text-center mt-20">
            <AsyncButton key="passwordSubmit" type="submit" mode="continue" :disabled="passwordSubmitDisabled" @click="finishPassword" />
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
        </template>
      </div>

      <div class="col span-6 landscape" />
    </div>
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

      .span-6 {
        padding: 0 60px;
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
