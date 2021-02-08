<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import InfoBox from '@/components/InfoBox';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import CopyToClipboard from '@/components/CopyToClipboard';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import { NORMAN, MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';
import AuthConfig from '@/mixins/auth-config';

const NAME = 'github';

export default {
  components: {
    Loading,
    CruResource,
    InfoBox,
    RadioGroup,
    LabeledInput,
    Banner,
    CopyToClipboard,
    AllowedPrincipals,
    AsyncButton
  },

  mixins: [CreateEditView, AuthConfig],

  async fetch() {
    await this.reloadModel();

    const serverUrl = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url',
      opt:  { url: `/v1/{ MANAGEMENT.SETTING }/server-url` }
    });

    if ( serverUrl ) {
      this.serverSetting = serverUrl.value;
    }

    this.targetType = (!this.model.hostname || this.model.hostname === 'github.com' ? 'public' : 'private');
    this.targetUrl = (this.model.tls ? 'https://' : 'http://') + (this.model.hostname || 'github.com');
  },

  data() {
    return {
      model:         null,
      targetType:    'public',
      targetUrl:     null,
      serverSetting: null,
      errors:        null,
    };
  },

  computed: {
    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    isPublic() {
      return this.targetType === 'public';
    },

    baseUrl() {
      return `${ this.model.tls ? 'https://' : 'http://' }${ this.model.hostname }`;
    },

    serverUrl() {
      if ( this.serverSetting ) {
        return this.serverSetting;
      } else if ( process.client ) {
        return window.location.origin;
      }

      return '';
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    displayName() {
      return this.t(`model.authConfig.provider.${ NAME }`);
    },

    tArgs() {
      return {
        baseUrl:   this.baseUrl,
        serverUrl: this.serverUrl,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
      };
    },

    NAME() {
      return NAME;
    },

    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    },

    toSave() {
      return {
        enabled:      true,
        githubConfig: this.model,
        description:  'Enable GitHub',
      };
    }
  },

  watch: {
    targetType: 'updateHost',
    targetUrl:  'updateHost',
  },

  methods: {
    updateHost() {
      const match = this.targetUrl.match(/^(((https?):)?\/\/)?([^/]+)(\/.*)?$/);

      if ( match ) {
        if ( match[3] === 'http') {
          this.model.tls = false;
        } else {
          this.model.tls = true;
        }

        this.model.hostname = match[4] || 'github.com';
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="model"
      :subtypes="[]"
      :validation-passed="true"
      :finish-button-mode="model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      @error="e=>errors = e"
      @finish="save"
      @cancel="done"
    >
      <template v-if="model.enabled && !isSaving">
        <Banner color="success clearfix">
          <div class="pull-left mt-10">
            {{ t('authConfig.stateBanner.enabled', tArgs) }}
          </div>
          <div class="pull-right">
            <AsyncButton mode="disable" size="sm" action-color="bg-error" @click="disable" />
          </div>
        </Banner>

        <div>Server: {{ baseUrl }}</div>
        <div>Client ID: {{ value.clientId }}</div>

        <hr />

        <AllowedPrincipals provider="github" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
        <Banner :label="t('authConfig.stateBanner.disabled', tArgs)" color="warning" />

        <h3 v-t="`authConfig.${NAME}.target.label`" />
        <RadioGroup
          v-model="targetType"
          name="targetType"
          :options="['public','private']"
          :mode="mode"
          :labels="[ t(`authConfig.${NAME}.target.public`), t(`authConfig.${NAME}.target.private`)]"
        />

        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-if="!isPublic"
              v-model="targetUrl"
              :label-key="`authConfig.${NAME}.host.label`"
              :placeholder="t(`authConfig.${NAME}.host.placeholder`)"
              :required="true"
              :mode="mode"
              @input="updateHost($event.selected, $event.text)"
            />
          </div>
        </div>

        <InfoBox v-if="!model.enabled" class="mt-20 mb-20 p-10">
          <ul v-html="t(`authConfig.${NAME}.form.prefix`, tArgs, true)" />
          <ul>
            <li>
              {{ t(`authConfig.${NAME}.form.instruction`, tArgs, true) }}
              <ul>
                <li><b>{{ t(`authConfig.${NAME}.form.app.label`) }}</b>: <span v-html="t(`authConfig.${NAME}.form.app.value`, tArgs, true)" /></li>
                <li><b>{{ t(`authConfig.${NAME}.form.homepage.label`) }}</b>: {{ serverUrl }} <CopyToClipboard label-as="tooltip" :text="serverUrl" class="icon-btn" action-color="bg-transparent" /></li>
                <li><b>{{ t(`authConfig.${NAME}.form.description.label`) }}</b>: <span v-html="t(`authConfig.${NAME}.form.description.value`, tArgs, true)" /></li>
                <li><b>{{ t(`authConfig.${NAME}.form.app.label`) }}</b>: {{ serverUrl }} <CopyToClipboard :text="serverUrl" label-as="tooltip" class="icon-btn" action-color="bg-transparent" /></li>
              </ul>
            </li>
          </ul>
          <ul v-html="t(`authConfig.${NAME}.form.suffix`, tArgs, true)" />
        </InfoBox>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.clientId"
              :label="t(`authConfig.${NAME}.clientId.label`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.clientSecret"
              type="password"
              :label="t(`authConfig.${NAME}.clientSecret.label`)"
              :mode="mode"
            />
          </div>
        </div>
        <div v-if="!model.enabled" class="row">
          <div class="col span-12">
            <Banner color="info" v-html="t('authConfig.associatedWarning', tArgs, true)" />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
