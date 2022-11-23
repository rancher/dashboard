<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import AuthConfig from '@shell/mixins/auth-config';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import FileSelector from '@shell/components/form/FileSelector';
import AuthBanner from '@shell/components/auth/AuthBanner';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    Banner,
    AllowedPrincipals,
    FileSelector,
    AuthBanner,
    RadioGroup
  },

  mixins: [CreateEditView, AuthConfig],
  data() {
    return {
      customEndpoint: {
        value:  false,
        labels: [
          this.t('authConfig.oidc.customEndpoint.standard'),
          this.t('authConfig.oidc.customEndpoint.custom'),
        ],
        options: [
          false,
          true
        ]
      },
      keycloakUrls: {
        url:   null,
        realm: null
      }
    };
  },

  computed: {
    tArgs() {
      return {
        baseUrl:  this.serverSetting,
        provider: this.displayName,
        username: this.principal.loginName || this.principal.name,
      };
    },

    toSave() {
      return {
        enabled:    true,
        oidcConfig: this.model
      };
    },

  },
  watch: {
    'keycloakUrls.url'() {
      this.updateIssuerEndpoint();
    },
    'keycloakUrls.realm'() {
      this.updateIssuerEndpoint();
    },
    'model.enabled'(neu) {
      // Cover case where oidc gets disabled and we return to the edit screen with a reset model
      if (!neu) {
        this.keycloakUrls = {
          url:   null,
          realm: null
        };
        this.customEndpoint.value = false;
      }
    },
    editConfig(neu, old) {
      // Cover use case where user edits existing oidc (keycloakUrls aren't persisted, so if we have issuer & authEndpoint set custom endpoints to true)
      if (!old && neu) {
        this.customEndpoint.value = (!this.keycloakUrls.url && !this.keycloakUrls.authEndpoint) && (!!this.model.issuer && !!this.model.authEndpoint);
      }
    }
  },

  methods: {
    updateIssuerEndpoint() {
      if (!this.keycloakUrls.url) {
        return;
      }
      const url = this.keycloakUrls.url.replaceAll(' ', '');

      this.model.issuer = `${ url }/auth/realms/${ this.keycloakUrls.realm || '' }`;
      this.model.authEndpoint = `${ this.model.issuer || '' }/protocol/openid-connect/auth`;
    },
  }
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
          <template slot="rows">
            <tr><td>{{ t(`authConfig.oidc.rancherUrl`) }}: </td><td>{{ model.rancherUrl }}</td></tr>
            <tr><td>{{ t(`authConfig.oidc.clientId`) }}: </td><td>{{ model.clientId }}</td></tr>
            <tr><td>{{ t(`authConfig.oidc.issuer`) }}: </td><td>{{ model.issuer }}</td></tr>
            <tr><td>{{ t(`authConfig.oidc.authEndpoint`) }}: </td><td>{{ model.authEndpoint }}</td></tr>
          </template>
        </AuthBanner>

        <hr>

        <AllowedPrincipals
          :provider="NAME"
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

        <h3>{{ t(`authConfig.oidc.${NAME}`) }}</h3>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.clientId"
              :label="t(`authConfig.oidc.clientId`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.clientSecret"
              :label="t(`authConfig.oidc.clientSecret`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.privateKey"
              :label="t(`authConfig.oidc.key.label`)"
              :placeholder="t(`authConfig.oidc.key.placeholder`)"
              :mode="mode"
              type="multiline"
            />
            <FileSelector
              class="role-tertiary add mt-5"
              :label="t('generic.readFromFile')"
              :mode="mode"
              @selected="$set(model, 'privateKey', $event)"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.certificate"
              :label="t(`authConfig.oidc.cert.label`)"
              :placeholder="t(`authConfig.oidc.cert.placeholder`)"
              :mode="mode"
              type="multiline"
            />
            <FileSelector
              class="role-tertiary add mt-5"
              :label="t('generic.readFromFile')"
              :mode="mode"
              @selected="$set(model, 'certificate', $event)"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <RadioGroup
              v-model="customEndpoint.value"
              name="customEndpoint"
              label-key="authConfig.oidc.customEndpoint.label"
              :labels="customEndpoint.labels"
              :options="customEndpoint.options"
            >
              <template #label>
                <h4>{{ t('authConfig.oidc.customEndpoint.label') }}</h4>
              </template>
            </RadioGroup>
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="keycloakUrls.url"
              :label="t(`authConfig.oidc.keycloak.url`)"
              :mode="mode"
              :required="!customEndpoint.value"
              :disabled="customEndpoint.value"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="keycloakUrls.realm"
              :label="t(`authConfig.oidc.keycloak.realm`)"
              :mode="mode"
              :required="!customEndpoint.value"
              :disabled="customEndpoint.value"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.rancherUrl"
              :label="t(`authConfig.oidc.rancherUrl`)"
              :mode="mode"
              required
              :disabled="!customEndpoint.value"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.issuer"
              :label="t(`authConfig.oidc.issuer`)"
              :mode="mode"
              required
              :disabled="!customEndpoint.value"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.authEndpoint"
              :label="t(`authConfig.oidc.authEndpoint`)"
              :mode="mode"
              required
              :disabled="!customEndpoint.value"
            />
          </div>
        </div>
      </template>
      <div
        v-if="!model.enabled"
        class="row"
      >
        <div class="col span-12">
          <Banner
            color="info"
            v-html="t('authConfig.associatedWarning', tArgs, true)"
          />
        </div>
      </div>
    </CruResource>
  </div>
</template>
