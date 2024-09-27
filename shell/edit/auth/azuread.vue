<script>
import isEqual from 'lodash/isEqual';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import InfoBox from '@shell/components/InfoBox';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import AuthBanner from '@shell/components/auth/AuthBanner';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import AuthConfig from '@shell/mixins/auth-config';
import { AZURE_MIGRATED } from '@shell/config/labels-annotations';
import { get } from '@shell/utils/object';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

const TENANT_ID_TOKEN = '__[[TENANT_ID]]__';

// Azure AD Graph will be deprecated end of 2022, see: https://docs.microsoft.com/en-us/graph/migrate-azure-ad-graph-overview
export const OLD_ENDPOINTS = {
  standard: {
    graphEndpoint: 'https://graph.windows.net/',
    tokenEndpoint: `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/token`,
    authEndpoint:  `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/authorize`
  },
  china: {
    graphEndpoint: 'https://graph.chinacloudapi.cn/',
    tokenEndpoint: `https://login.chinacloudapi.cn/${ TENANT_ID_TOKEN }/oauth2/token`,
    authEndpoint:  `https://login.chinacloudapi.cn/${ TENANT_ID_TOKEN }/oauth2/authorize`
  }
};

const ENDPOINT_MAPPING = {
  standard: {
    endpoint:      'https://login.microsoftonline.com/',
    graphEndpoint: 'https://graph.microsoft.com',
    tokenEndpoint: `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/v2.0/token`,
    authEndpoint:  `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/v2.0/authorize`
  },
  china: {
    endpoint:      'https://login.partner.microsoftonline.cn/',
    graphEndpoint: 'https://microsoftgraph.chinacloudapi.cn',
    tokenEndpoint: `https://login.partner.microsoftonline.cn/${ TENANT_ID_TOKEN }/oauth2/v2.0/token`,
    authEndpoint:  `https://login.partner.microsoftonline.cn/${ TENANT_ID_TOKEN }/oauth2/v2.0/authorize`
  },
  custom: {
    endpoint:      'https://login.microsoftonline.com/',
    graphEndpoint: '',
    tokenEndpoint: '',
    authEndpoint:  ''
  }
};

export default {
  components: {
    Loading,
    CruResource,
    InfoBox,
    RadioGroup,
    LabeledInput,
    Checkbox,
    CopyToClipboardText,
    AllowedPrincipals,
    AuthBanner,
    AuthProviderWarningBanners
  },

  mixins: [CreateEditView, AuthConfig, FormValidation],

  async fetch() {
    await this.reloadModel();

    if ( this.value?.graphEndpoint ) {
      this.setInitialEndpoint(this.value.graphEndpoint);
    }
  },

  data() {
    return {
      isGroupMembershipFilterEnabled: !!this.value.groupMembershipFilter,
      endpoint:                       'standard',
      oldEndpoint:                    false,

      // Storing the applicationSecret is necessary because norman doesn't support returning secrets and when we
      // override the steve authconfig with a norman config the applicationSecret is lost
      applicationSecret: this.value.applicationSecret,
      fvFormRuleSets:    [
        { path: 'tenantId', rules: ['tenantIdRequired'] },
        { path: 'applicationId', rules: ['applicationIdRequired'] },
        { path: 'applicationSecret', rules: ['applicationSecretRequired'] },
        { path: 'endpoint', rules: ['endpointRequired', 'endpointMustBeURL'] },
        { path: 'graphEndpoint', rules: ['graphEndpointRequired', 'graphEndpointMustBeURL'] },
        { path: 'tokenEndpoint', rules: ['tokenEndpointRequired', 'tokenEndpointMustBeURL'] },
        { path: 'authEndpoint', rules: ['authEndpointRequired', 'authEndpointMustBeURL'] },
      ]
    };
  },

  computed: {
    // Cannot pass this.model as a rootObject because it is undefined at that point, so had to use a workaround
    fvExtraRules() {
      return {
        tenantIdRequired:          this.modelFieldRequired('tenantId', 'authConfig.azuread.tenantId.label'),
        applicationIdRequired:     this.modelFieldRequired('applicationId', 'authConfig.azuread.applicationId.label'),
        applicationSecretRequired: this.applicationSecretRequired(),
        endpointRequired:          this.modelFieldRequired('endpoint', 'authConfig.azuread.endpoint.label'),
        endpointMustBeURL:         this.modelFieldURL('endpoint'),
        graphEndpointRequired:     this.modelFieldRequired('graphEndpoint', 'authConfig.azuread.graphEndpoint.label'),
        graphEndpointMustBeURL:    this.modelFieldURL('graphEndpoint'),
        tokenEndpointRequired:     this.modelFieldRequired('tokenEndpoint', 'authConfig.azuread.tokenEndpoint.label'),
        tokenEndpointMustBeURL:    this.modelFieldURL('tokenEndpoint'),
        authEndpointRequired:      this.modelFieldRequired('authEndpoint', 'authConfig.azuread.authEndpoint.label'),
        authEndpointMustBeURL:     this.modelFieldURL('authEndpoint')
      };
    },

    tArgs() {
      return {
        baseUrl:  this.baseUrl,
        provider: this.displayName,
        username: this.principal.loginName || this.principal.name
      };
    },

    replyUrl() {
      return `${ this.serverUrl }/verify-auth-azure`;
    },

    tenantId() {
      return this.model?.tenantId;
    },

    toSave() {
      const applicationSecret = this.getNewApplicationSecret();

      if (applicationSecret) {
        this.model['applicationSecret'] = applicationSecret;
      }

      return {
        config: {
          ...this.model,
          enabled:     true,
          description: 'Enable AzureAD'
        }
      };
    },

    needsUpdate() {
      return (
        get(this.model, `annotations."${ AZURE_MIGRATED }"`) !== 'true'
      );
    },

    modalConfig() {
      return {
        applyAction: this.updateEndpoint,
        applyMode:   'update',
        title:       this.t('authConfig.azuread.updateEndpoint.modal.title'),
        body:        this.t('authConfig.azuread.updateEndpoint.modal.body', null, { raw: true })
      };
    },
    editMemberConfig() {
      return this.model.enabled && !this.isEnabling && !this.editConfig;
    }
  },

  watch: {
    endpoint(value) {
      this.setEndpoints(value);
    },

    tenantId() {
      if (this.endpoint !== 'custom') {
        this.setEndpoints(this.endpoint);
      }
    },

    model: {
      deep: true,
      handler() {
        this.model.accessMode = this.model.accessMode || 'unrestricted';
        this.model.rancherUrl = this.model.rancherUrl || this.replyUrl;

        if (this.model.applicationSecret) {
          this['applicationSecret'] = this.model.applicationSecret;
        }
      }
    },

  },

  methods: {
    toggleGroupMembershipFilter(enabled) {
      // reset the value of groupMembershipFilter when its filter gets disabled
      if (!enabled) {
        this.model.groupMembershipFilter = '';
      }
    },

    setEndpoints(endpoint) {
      if (this.editConfig || !this.model.enabled) {
        const endpointType = this.oldEndpoint && endpoint !== 'custom' ? OLD_ENDPOINTS : ENDPOINT_MAPPING;

        Object.keys(endpointType[endpoint]).forEach((key) => {
          this.model[key] = endpointType[endpoint][key].replace(TENANT_ID_TOKEN, this.model.tenantId);
        });
      }
    },

    setInitialEndpoint(endpoint) {
      const newEndpointKey = this.determineEndpointKeyType(ENDPOINT_MAPPING);
      const oldEndpointKey = Object.keys(OLD_ENDPOINTS).find((key) => OLD_ENDPOINTS[key].graphEndpoint === endpoint);

      if ( oldEndpointKey ) {
        this.endpoint = this.determineEndpointKeyType(OLD_ENDPOINTS);
        this.oldEndpoint = true;
      } else {
        this.endpoint = newEndpointKey;
      }
    },

    determineEndpointKeyType(endpointTypes) {
      let out = 'custom';

      for ( const [endpointKey, endpointKeyValues] of Object.entries(endpointTypes) ) {
        const mappedValues = Object.values(endpointKeyValues).map((endpoint) => endpoint.replace(TENANT_ID_TOKEN, this.model?.tenantId));
        const valuesToCheck = Object.keys(endpointKeyValues).map((key) => this.value[key]);

        if ( isEqual(mappedValues, valuesToCheck) ) {
          out = endpointKey;
        }
      }

      return out;
    },

    getNewApplicationSecret() {
      const applicationSecretOrId =
        this.model.applicationSecret || this.applicationSecret;

      // The application secret comes back as an ID from steve API and this indicates
      // that the current application secret isn't new
      if (applicationSecretOrId.includes('cattle-global-data')) {
        return null;
      }

      return applicationSecretOrId;
    },

    promptUpdate() {
      this.$store.dispatch('management/promptModal', {
        component:      'GenericPrompt',
        componentProps: this.modalConfig
      });
    },

    // update the authconfig to change the azure ad graph endpoint to the microsoft graph endpoint
    // only relevant for setups upgrading to 2.6.6 with azuread auth already enabled
    updateEndpoint(btnCB) {
      if (this.needsUpdate) {
        this.model
          .doAction('upgrade')
          .then(() => {
            this.reloadModel();
            this.$store.dispatch('growl/success', { message: 'Graph endpoint updated successfully.' });
            btnCB(true);
          })
          .catch((err) => {
            this.$store.dispatch('growl/fromError', {
              title: 'Error updating graph endpoint',
              err
            });
            btnCB(false);
          });
      }
    },
    modelFieldRequired(path, label) {
      return () => {
        return !this.model[path] ? `${ this.t('validation.required', { key: this.t(label) }) }` : undefined;
      };
    },
    applicationSecretRequired() {
      return () => {
        return !this.editMemberConfig && !this.model.applicationSecret ? `${ this.t('validation.required', { key: this.t('authConfig.azuread.applicationSecret.label') }) }` : undefined;
      };
    },
    modelFieldURL(path) {
      return () => {
        const rule = formRulesGenerator(this.$store.getters['i18n/t'], {}).url;

        return rule(this.model[path]);
      };
    }
  }
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
      :validation-passed="fvFormIsValid"
      :finish-button-mode="model && model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      :show-cancel="showCancel"
      :cancel-event="true"
      @error="e=>errors = e"
      @finish="save"
      @cancel="cancel"
    >
      <template v-if="editMemberConfig">
        <AuthBanner
          :t-args="tArgs"
          :disable="disable"
          :edit="goToEdit"
        >
          <template #rows>
            <tr>
              <td>{{ t(`authConfig.azuread.tenantId.label`) }}:</td>
              <td>{{ model.tenantId }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.applicationId.label`) }}:</td>
              <td>{{ model.applicationId }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.endpoint.label`) }}:</td>
              <td>{{ model.endpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.graphEndpoint.label`) }}:</td>
              <td>{{ model.graphEndpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.tokenEndpoint.label`) }}:</td>
              <td>{{ model.tokenEndpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.authEndpoint.label`) }}:</td>
              <td>{{ model.authEndpoint }}</td>
            </tr>
          </template>
          <template
            v-if="needsUpdate"
            #actions
          >
            <button
              type="button"
              class="btn btn-sm role-secondary mr-10 update"
              @click="promptUpdate"
            >
              {{ t('authConfig.azuread.updateEndpoint.button') }}
            </button>
          </template>
        </AuthBanner>

        <hr>

        <AllowedPrincipals
          provider="azuread"
          :auth-config="model"
          :mode="mode"
        />
      </template>

      <template v-else>
        <AuthProviderWarningBanners
          v-if="!model.enabled"
          :t-args="tArgs"
        />

        <InfoBox
          v-if="!model.enabled"
          id="reply-info"
          class="mt-20 mb-20 p-10"
        >
          {{ t('authConfig.azuread.reply.info') }}
          <br>
          <label class="reply-url">{{ t('authConfig.azuread.reply.label') }} </label>
          <CopyToClipboardText
            :plain="true"
            :text="replyUrl"
          />
        </InfoBox>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              id="tenant-id"
              v-model:value="model.tenantId"
              :label="t('authConfig.azuread.tenantId.label')"
              :mode="mode"
              :required="true"
              :rules="fvGetAndReportPathRules('tenantId')"
              :tooltip="t('authConfig.azuread.tenantId.tooltip')"
              :placeholder="t('authConfig.azuread.tenantId.placeholder')"
              data-testid="input-azureAD-tenantId"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              id="application-id"
              v-model:value="model.applicationId"
              :label="t('authConfig.azuread.applicationId.label')"
              :mode="mode"
              :required="true"
              :rules="fvGetAndReportPathRules('applicationId')"
              :placeholder="t('authConfig.azuread.applicationId.placeholder')"
              data-testid="input-azureAD-applcationId"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              id="application-secret"
              v-model:value="model.applicationSecret"
              type="password"
              :label="t('authConfig.azuread.applicationSecret.label')"
              :required="true"
              :rules="fvGetAndReportPathRules('applicationSecret')"
              :mode="mode"
              data-testid="input-azureAD-applicationSecret"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-12">
            <Checkbox
              v-model:value="isGroupMembershipFilterEnabled"
              class="mb-10 mr-10"
              :mode="mode"
              :label="t('authConfig.azuread.groupMembershipFilter.enable')"
              :tooltip="t('authConfig.azuread.groupMembershipFilter.tooltip')"
              data-testid="checkbox-azureAD-groupMembershipFilter"
              @update:value="toggleGroupMembershipFilter"
            />
            <div v-if="isGroupMembershipFilterEnabled">
              <LabeledInput
                v-model:value="model.groupMembershipFilter"
                :label="t('authConfig.azuread.groupMembershipFilter.label')"
                placeholder="e.g. (displayName eq 'group1') or (displayName eq 'group2')"
                :mode="mode"
                class="mb-10"
                data-testid="input-azureAD-groupMembershipFilter"
              />
              <a
                :href="t('authConfig.azuread.groupMembershipFilter.externalHelpLink')"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {{ t('authConfig.azuread.groupMembershipFilter.externalHelp') }} <i class="icon icon-external-link" />
              </a>
            </div>
          </div>
        </div>
        <RadioGroup
          v-model:value="endpoint"
          class="mb-20"
          :required="true"
          :label="t('authConfig.azuread.endpoints.label')"
          name="endpoints"
          :options="['standard', 'china', 'custom']"
          :mode="mode"
          :labels="[t('authConfig.azuread.endpoints.standard'), t('authConfig.azuread.endpoints.china'), t('authConfig.azuread.endpoints.custom')]"
          data-testid="endpoints-radio-input"
        />
        <div v-if="endpoint === 'custom'">
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.endpoint"
                :label="t('authConfig.azuread.endpoint.label')"
                :mode="mode"
                :required="true"
                :rules="fvGetAndReportPathRules('endpoint')"
                data-testid="input-azureAD-endpoint"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.graphEndpoint"
                :label="t('authConfig.azuread.graphEndpoint.label')"
                :required="true"
                :rules="fvGetAndReportPathRules('graphEndpoint')"
                :mode="mode"
                data-testid="input-azureAD-graphEndpoint"
              />
            </div>
          </div>
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.tokenEndpoint"
                :label="t('authConfig.azuread.tokenEndpoint.label')"
                :mode="mode"
                :required="true"
                :rules="fvGetAndReportPathRules('tokenEndpoint')"
                data-testid="input-azureAD-tokenEndpoint"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.authEndpoint"
                :label="t('authConfig.azuread.authEndpoint.label')"
                :required="true"
                :rules="fvGetAndReportPathRules('authEndpoint')"
                :mode="mode"
                data-testid="input-azureAD-authEndpoint"
              />
            </div>
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>

<style lang="scss">
#reply-info {
  flex-grow: 0;
}

.reply-url {
  color: inherit;
  font-weight: 700;
}
</style>
