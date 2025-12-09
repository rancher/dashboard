<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import { MANAGEMENT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import AuthConfig from '@shell/mixins/auth-config';
import AuthBanner from '@shell/components/auth/AuthBanner';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';
import FileSelector from '@shell/components/form/FileSelector';
import GithubSteps from '@shell/edit/auth/github-steps.vue';
import GithubAppSteps from '@shell/edit/auth/github-app-steps.vue';

export default {
  components: {
    Loading,
    CruResource,
    RadioGroup,
    LabeledInput,
    AllowedPrincipals,
    AuthBanner,
    AuthProviderWarningBanners,
    FileSelector,
    GithubSteps,
    GithubAppSteps,
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
      return this.t(`model.authConfig.provider.${ this.NAME }`);
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
      return this.isGithubApp ? 'githubapp' : 'github';
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
    },

    isGithubApp() {
      return this.model?.id === 'githubapp';
    },

    steps() {
      return this.isGithubApp ? GithubAppSteps : GithubSteps;
    },

    validationPassed() {
      // Allows for configuring authorized users and groups
      if ( this.model.enabled && !this.editConfig ) {
        return true;
      }

      if (!this.model.clientId || !this.model.clientSecret) {
        return false;
      }

      if (this.isGithubApp && (!this.model.appId || !this.model.privateKey)) {
        return false;
      }

      return true;
    },

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

    updatePrivateKey(content) {
      this.model.privateKey = content;
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
      :validation-passed="validationPassed"
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
            <tr><td>{{ t(`authConfig.${ NAME }.table.clientId`) }}: </td><td>{{ model.clientId }}</td></tr>
          </template>
        </AuthBanner>

        <hr role="none">

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
        >
          <template
            v-if="isGithubApp"
            #additional-warning
          >
            <span
              v-clean-html="t(`authConfig.${NAME}.warning`, {}, true)"
              data-testid="github-app-banner"
            />
          </template>
        </AuthProviderWarningBanners>

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

        <component
          :is="steps"
          :t-args="tArgs"
          :name="NAME"
        />

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.clientId"
              required
              data-testid="client-id"
              :label="t(`authConfig.${NAME}.clientId.label`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.clientSecret"
              required
              data-testid="client-secret"
              type="password"
              :label="t(`authConfig.${NAME}.clientSecret.label`)"
              :mode="mode"
            />
          </div>
        </div>
        <template v-if="isGithubApp">
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.appId"
                required
                data-testid="app-id"
                :label="t(`authConfig.${NAME}.githubAppId.label`)"
                :mode="mode"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.installationId"
                data-testid="installation-id"
                :label="t(`authConfig.${NAME}.installationId.label`)"
                :mode="mode"
              />
            </div>
          </div>
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.privateKey"
                required
                data-testid="private-key"
                type="multiline"
                :label="t(`authConfig.${NAME}.privateKey.label`)"
                :mode="mode"
              />
              <FileSelector
                class="btn btn-sm role-secondary mt-10"
                :label="t('generic.readFromFile')"
                @selected="updatePrivateKey"
              />
            </div>
          </div>
        </template>
      </template>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
  .banner {
    display: block;

    &:deep() code {
      padding: 0 3px;
      margin: 0 3px;
    }
  }
</style>
