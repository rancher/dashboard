<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import { MANAGEMENT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import AuthConfig from '@shell/mixins/auth-config';
import AuthBanner from '@shell/components/auth/AuthBanner';
import InfoBox from '@shell/components/InfoBox';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';

const NAME = 'github';

export default {
  components: {
    Loading,
    CruResource,
    RadioGroup,
    LabeledInput,
    CopyToClipboard,
    AllowedPrincipals,
    AuthBanner,
    InfoBox,
    AuthProviderWarningBanners
  },

  mixins: [CreateEditView, AuthConfig],

  async fetch() {
    await this.mixinFetch();

    this.targetType = (!this.model.hostname || this.model.hostname === 'github.com' ? 'public' : 'private');
    this.targetUrl = (this.model.tls ? 'https://' : 'http://') + (this.model.hostname || 'github.com');
  },

  data() {
    return {
      targetType: 'public',
      targetUrl:  null,
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
      :cancel-event="true"
      :done-route="doneRoute"
      :mode="mode"
      :resource="model"
      :subtypes="[]"
      :validation-passed="true"
      :finish-button-mode="model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      :show-cancel="showCancel"
      @error="e=>errors = e"
      @finish="save"
      @cancel="cancel"
    >
      <template v-if="model.enabled && !isEnabling && !editConfig">
        <AuthBanner
          :t-args="tArgs"
          :disable="disable"
          :edit="goToEdit"
        >
          <template #rows>
            <tr><td>{{ t(`authConfig.${ NAME }.table.server`) }}: </td><td>{{ baseUrl }}</td></tr>
            <tr><td>{{ t(`authConfig.${ NAME }.table.clientId`) }}: </td><td>{{ value.clientId }}</td></tr>
          </template>
        </AuthBanner>

        <hr>

        <AllowedPrincipals
          provider="github"
          :auth-config="model"
          :mode="mode"
        />
      </template>

      <template v-else>
        <AuthProviderWarningBanners
          v-if="!model.enabled"
          :t-args="tArgs"
        />

        <h3 v-t="`authConfig.${NAME}.target.label`" />
        <RadioGroup
          v-model:value="targetType"
          name="targetType"
          data-testid="authConfig-gitHub"
          :options="['public','private']"
          :mode="mode"
          :labels="[ t(`authConfig.${NAME}.target.public`), t(`authConfig.${NAME}.target.private`)]"
        />

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-if="!isPublic"
              v-model:value="targetUrl"
              :label-key="`authConfig.${NAME}.host.label`"
              :placeholder="t(`authConfig.${NAME}.host.placeholder`)"
              :required="true"
              :mode="mode"
              @input="updateHost($event.selected, $event.text)"
            />
          </div>
        </div>

        <InfoBox
          :step="1"
          class="step-box"
        >
          <ul class="step-list">
            <li v-clean-html="t(`authConfig.${NAME}.form.prefix.1`, tArgs, true)" />
            <li v-clean-html="t(`authConfig.${NAME}.form.prefix.2`, tArgs, true)" />
            <li v-clean-html="t(`authConfig.${NAME}.form.prefix.3`, tArgs, true)" />
          </ul>
        </InfoBox>
        <InfoBox
          :step="2"
          class="step-box"
        >
          <ul class="step-list">
            <li>
              {{ t(`authConfig.${NAME}.form.instruction`, tArgs, true) }}
              <ul class="mt-10">
                <li><b>{{ t(`authConfig.${NAME}.form.app.label`) }}</b>: <span v-clean-html="t(`authConfig.${NAME}.form.app.value`, tArgs, true)" /></li>
                <li>
                  <b>{{ t(`authConfig.${NAME}.form.homepage.label`) }}</b>: {{ serverUrl }} <CopyToClipboard
                    label-as="tooltip"
                    :text="serverUrl"
                    class="icon-btn"
                    action-color="bg-transparent"
                  />
                </li>
                <li><b>{{ t(`authConfig.${NAME}.form.description.label`) }}</b>: <span v-clean-html="t(`authConfig.${NAME}.form.description.value`, tArgs, true)" /></li>
                <li>
                  <b>{{ t(`authConfig.${NAME}.form.callback.label`) }}</b>: {{ serverUrl }} <CopyToClipboard
                    :text="serverUrl"
                    label-as="tooltip"
                    class="icon-btn"
                    action-color="bg-transparent"
                  />
                </li>
              </ul>
            </li>
          </ul>
        </InfoBox>
        <InfoBox
          :step="3"
          class="mb-20"
        >
          <ul class="step-list">
            <li v-clean-html="t(`authConfig.${NAME}.form.suffix.1`, tArgs, true)" />
            <li v-clean-html="t(`authConfig.${NAME}.form.suffix.2`, tArgs, true)" />
          </ul>
        </InfoBox>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.clientId"
              :label="t(`authConfig.${NAME}.clientId.label`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.clientSecret"
              type="password"
              :label="t(`authConfig.${NAME}.clientSecret.label`)"
              :mode="mode"
            />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
  .step-list li:not(:last-child) {
    margin-bottom: 8px;
  }
  .banner {
    display: block;

    &:deep() code {
      padding: 0 3px;
      margin: 0 3px;
    }
  }
</style>
