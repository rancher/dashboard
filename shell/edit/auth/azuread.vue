<script>
import isEqual from 'lodash/isEqual';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import InfoBox from '@shell/components/InfoBox';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import AuthBanner from '@shell/components/auth/AuthBanner';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import AuthConfig from '@shell/mixins/auth-config';
import { AZURE_MIGRATED } from '@shell/config/labels-annotations';
import { get } from '@shell/utils/object';

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
    Banner,
    CopyToClipboardText,
    AllowedPrincipals,
    AuthBanner
  },

  mixins: [CreateEditView, AuthConfig],

  async fetch() {
    await this.reloadModel();

    if ( this.value?.graphEndpoint ) {
      this.setInitialEndpoint(this.value.graphEndpoint);
    }
  },

  data() {
    return {
      endpoint:          'standard',
      oldEndpoint:        false,

      // Storing the applicationSecret is necessary because norman doesn't support returning secrets and when we
      // override the steve authconfig with a norman config the applicationSecret is lost
      applicationSecret: this.value.applicationSecret
    };
  },

  computed: {
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
        this.$set(this.model, 'applicationSecret', applicationSecret);
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
          this.$set(this, 'applicationSecret', this.model.applicationSecret);
        }
      }
    },

  },

  methods: {
    setEndpoints(endpoint) {
      if (this.editConfig || !this.model.enabled) {
        const endpointType = this.oldEndpoint && endpoint !== 'custom' ? OLD_ENDPOINTS : ENDPOINT_MAPPING;

        Object.keys(endpointType[endpoint]).forEach((key) => {
          this.$set(
            this.model,
            key,
            endpointType[endpoint][key].replace(
              TENANT_ID_TOKEN,
              this.model.tenantId
            )
          );
        });
      }
    },

    setInitialEndpoint(endpoint) {
      const newEndpointKey = this.determineEndpointKeyType(ENDPOINT_MAPPING);
      const oldEndpointKey = Object.keys(OLD_ENDPOINTS).find(key => OLD_ENDPOINTS[key].graphEndpoint === endpoint);

      if ( oldEndpointKey ) {
        this.endpoint = oldEndpointKey;
        this.oldEndpoint = true;
      } else if ( newEndpointKey ) {
        this.endpoint = newEndpointKey;
      } else {
        this.endpoint = 'custom';
      }
    },

    determineEndpointKeyType(endpointTypes) {
      let out = 'custom';

      for ( const [endpointKey, endpointKeyValues] of Object.entries(endpointTypes) ) {
        const mappedValues = Object.values(endpointKeyValues).map(endpoint => endpoint.replace(TENANT_ID_TOKEN, this.model?.tenantId));
        const valuesToCheck = Object.keys(endpointKeyValues).map(key => this.value[key]);

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
        component: 'GenericPrompt',
        resources: [this.modalConfig]
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
      :validation-passed="true"
      :finish-button-mode="model && model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      :show-cancel="showCancel"
      :cancel-event="true"
      @error="e => (errors = e)"
      @finish="save"
      @cancel="cancel"
    >
      <template v-if="model.enabled && !isEnabling && !editConfig">
        <AuthBanner :t-args="tArgs" :disable="disable" :edit="goToEdit">
          <template slot="rows">
            <tr>
              <td>{{ t(`authConfig.azuread.tenantId`) }}:</td>
              <td>{{ model.tenantId }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.applicationId`) }}:</td>
              <td>{{ model.applicationId }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.endpoint`) }}:</td>
              <td>{{ model.endpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.graphEndpoint`) }}:</td>
              <td>{{ model.graphEndpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.tokenEndpoint`) }}:</td>
              <td>{{ model.tokenEndpoint }}</td>
            </tr>
            <tr>
              <td>{{ t(`authConfig.azuread.authEndpoint`) }}:</td>
              <td>{{ model.authEndpoint }}</td>
            </tr>
          </template>
          <template v-if="needsUpdate" slot="actions">
            <button
              type="button"
              class="btn btn-sm role-secondary mr-10 update"
              @click="promptUpdate"
            >
              {{ t('authConfig.azuread.updateEndpoint.button') }}
            </button>
          </template>
        </AuthBanner>

        <hr />

        <AllowedPrincipals
          provider="azuread"
          :auth-config="model"
          :mode="mode"
        />
      </template>

      <template v-else>
        <Banner
          v-if="!model.enabled"
          :label="t('authConfig.stateBanner.disabled', tArgs)"
          color="warning"
        />

        <InfoBox v-if="!model.enabled" id="reply-info" class="mt-20 mb-20 p-10">
          {{ t('authConfig.azuread.reply.info') }}
          <br />
          <label class="reply-url">{{ t('authConfig.azuread.reply.label') }} </label>
          <CopyToClipboardText :plain="true" :text="replyUrl" />
        </InfoBox>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              id="tenant-id"
              v-model="model.tenantId"
              label="Tenant ID"
              :mode="mode"
              :required="true"
              tooltip="From the Azure AD portal"
              placeholder="A long UUID string"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              id="application-id"
              v-model="model.applicationId"
              label="Application ID"
              :mode="mode"
              :required="true"
              placeholder="A long UUID string"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              id="application-secret"
              v-model="model.applicationSecret"
              type="password"
              label="Application Secret"
              :required="true"
              :mode="mode"
            />
          </div>
        </div>
        <RadioGroup
          v-model="endpoint"
          class="mb-20"
          :required="true"
          label="Endpoints"
          name="endpoints"
          :options="['standard', 'china', 'custom']"
          :mode="mode"
          :labels="['Standard', 'China', 'Custom']"
        />
        <div v-if="endpoint === 'custom'">
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="model.endpoint"
                label="Endpoint"
                :mode="mode"
                :required="true"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="model.graphEndpoint"
                label="Graph Endpoint"
                :required="true"
                :mode="mode"
              />
            </div>
          </div>
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="model.tokenEndpoint"
                label="Token Endpoint"
                :mode="mode"
                :required="true"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="model.authEndpoint"
                label="Auth Endpoint"
                :required="true"
                :mode="mode"
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
