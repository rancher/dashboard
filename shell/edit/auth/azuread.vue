<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import InfoBox from '@shell/components/InfoBox';
import RadioGroup from '@shell/components/form/RadioGroup';
import LabeledInput from '@shell/components/form/LabeledInput';
import Banner from '@shell/components/Banner';
import AuthBanner from '@shell/components/auth/AuthBanner';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import AuthConfig from '@shell/mixins/auth-config';

const TENANT_ID_TOKEN = '__[[TENANT_ID]]__';

const ENDPOINT_MAPPING = {
  standard: {
    endpoint:      'https://login.microsoftonline.com/',
    graphEndpoint: 'https://graph.windows.net/',
    tokenEndpoint: `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/token`,
    authEndpoint:  `https://login.microsoftonline.com/${ TENANT_ID_TOKEN }/oauth2/authorize`,
  },
  china: {
    endpoint:      'https://login.chinacloudapi.cn/',
    graphEndpoint: 'https://graph.chinacloudapi.cn/',
    tokenEndpoint: `https://login.chinacloudapi.cn/${ TENANT_ID_TOKEN }/oauth2/token`,
    authEndpoint:  `https://login.chinacloudapi.cn/${ TENANT_ID_TOKEN }/oauth2/authorize`,
  },
  custom: {
    endpoint:      'https://login.microsoftonline.com/',
    graphEndpoint: '',
    tokenEndpoint: '',
    authEndpoint:  '',
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
  },

  data() {
    return {
      endpoint:          'standard',
      // Storing the applicationSecret is necessary because norman doesn't support returning secrets and when we
      // override the steve authconfig with a norman config the applicationSecret is lost
      applicationSecret: this.value.applicationSecret
    };
  },

  computed: {
    tArgs() {
      return {
        baseUrl:   this.baseUrl,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
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
          enabled:           true,
          description:       'Enable AzureAD'
        }
      };
    },
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
        if (this.endpoint !== 'custom') {
          this.setEndpoints(this.endpoint);
        }

        if (this.model.applicationSecret) {
          this.$set(this, 'applicationSecret', this.model.applicationSecret);
        }
      }
    }
  },

  methods: {
    setEndpoints(endpoint) {
      Object.keys(ENDPOINT_MAPPING[endpoint]).forEach((key) => {
        this.$set(this.model, key, ENDPOINT_MAPPING[endpoint][key].replace(TENANT_ID_TOKEN, this.model.tenantId));
      });
    },

    getNewApplicationSecret() {
      const applicationSecretOrId = this.model.applicationSecret || this.applicationSecret;

      // The application secret comes back as an ID from steve API and this indicates
      // that the current application secret isn't new
      if (applicationSecretOrId.includes('cattle-global-data')) {
        return null;
      }

      return applicationSecretOrId;
    }
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
      :show-cancel="showCancel"
      :cancel-event="true"
      @error="e=>errors = e"
      @finish="save"
      @cancel="cancel"
    >
      <template v-if="model.enabled && !isEnabling && !editConfig">
        <AuthBanner :t-args="tArgs" :disable="disable" :edit="goToEdit">
          <template slot="rows">
            <tr><td>{{ t(`authConfig.azuread.tenantId`) }}: </td><td>{{ model.tenantId }}</td></tr>
            <tr><td>{{ t(`authConfig.azuread.applicationId`) }}: </td><td>{{ model.applicationId }}</td></tr>
            <tr><td>{{ t(`authConfig.azuread.endpoint`) }}: </td><td>{{ model.endpoint }}</td></tr>
            <tr><td>{{ t(`authConfig.azuread.graphEndpoint`) }}: </td><td>{{ model.graphEndpoint }}</td></tr>
            <tr><td>{{ t(`authConfig.azuread.tokenEndpoint`) }}: </td><td>{{ model.tokenEndpoint }}</td></tr>
            <tr><td>{{ t(`authConfig.azuread.authEndpoint`) }}: </td><td>{{ model.authEndpoint }}</td></tr>
          </template>
        </AuthBanner>

        <hr />

        <AllowedPrincipals provider="azuread" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
        <Banner v-if="!model.enabled" :label="t('authConfig.stateBanner.disabled', tArgs)" color="warning" />

        <InfoBox v-if="!model.enabled" class="mt-20 mb-20 p-10">
          Azure AD requires a whitelisted URL for your Rancher server before beginning this setup. Please ensure that the following URL is set in the Reply URL section of your Azure Portal. Please note that is may take up to 5 minutes for the whitelisted URL to propagate.
          <br />
          <label>Reply URL: </label> <CopyToClipboardText :plain="true" :text="replyUrl" />
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
          :options="['standard','china', 'custom']"
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
