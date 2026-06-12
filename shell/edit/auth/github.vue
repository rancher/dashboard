<script>
import { ref, computed, provide } from 'vue';
import { useStore } from 'vuex';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
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
import { useI18n } from '@shell/composables/useI18n';
import { zodValidators } from '@shell/utils/validators/zod-helpers';

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

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    // These refs sync Options API state into the Composition API for the reactive schema.
    const isGithubAppRef = ref(false);
    const isPublicRef = ref(true);

    const { field } = zodValidators(t);

    const validationSchema = computed(() => toTypedSchema(
      z.object({
        clientId:     field('authConfig.github.clientId.label').required(),
        clientSecret: field('authConfig.github.clientSecret.label').required(),
        appId:        isGithubAppRef.value ? field('authConfig.githubapp.githubAppId.label').required() : field(),
        privateKey:   isGithubAppRef.value ? field('authConfig.githubapp.privateKey.label').required() : field(),
        targetUrl:    !isPublicRef.value ? field('authConfig.github.host.label').required().url() : field(),
      })
    ));

    const showAllErrors = ref(false);

    provide('vee-show-all-errors', showAllErrors);

    const { errors, validate } = useForm({ validationSchema });
    const isFormValid = computed(() => Object.keys(errors.value).length === 0);

    const validateAllFields = async() => {
      await validate();
      showAllErrors.value = true;
    };

    return {
      isGithubAppRef,
      isPublicRef,
      isFormValid,
      validateAllFields,
    };
  },

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
      if ( this.model.enabled && !this.editConfig ) {
        return true;
      }

      return this.isFormValid;
    },

  },

  watch: {
    'model.id': {
      handler(newVal) {
        this.isGithubAppRef = newVal === 'githubapp';
      },
      immediate: true,
    },

    targetType: {
      handler(newVal) {
        this.isPublicRef = newVal === 'public';
        this.updateHost();
      },
      immediate: true,
    },

    targetUrl: 'updateHost',
  },

  methods: {
    updateHost() {
      const match = this.targetUrl?.match(/^(((https?):)?\/\/)?([^/]+)(\/.*)?$/);

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
              name="targetUrl"
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
              name="clientId"
              required
              data-testid="client-id"
              :label="t(`authConfig.${NAME}.clientId.label`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.clientSecret"
              name="clientSecret"
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
                name="appId"
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
                name="privateKey"
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
