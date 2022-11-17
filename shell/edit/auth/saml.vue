<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import AuthConfig from '@shell/mixins/auth-config';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import FileSelector from '@shell/components/form/FileSelector';
import AuthBanner from '@shell/components/auth/AuthBanner';
import config from '@shell/edit/auth/ldap/config';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    Banner,
    AllowedPrincipals,
    Checkbox,
    FileSelector,
    config,
    AuthBanner
  },

  mixins: [CreateEditView, AuthConfig],
  data() {
    return { showLdap: false };
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
      return { enabled: true, ...this.model };
    },

  },
  watch: {
    showLdap(neu, old) {
      if (neu && !this.model.openLdapConfig) {
        const config = {
          connectionTimeout:            5000,
          groupDNAttribute:             'entryDN',
          groupMemberMappingAttribute:  'member',
          groupMemberUserAttribute:     'entryDN',
          groupNameAttribute:           'cn',
          groupObjectClass:             'groupOfNames',
          groupSearchAttribute:         'cn',
          nestedGroupMembershipEnabled: false,
          port:                         389,
          servers:                      [],
          starttls:                     false,
          tls:                          false,
          disabledStatusBitmask:        0,
          userLoginAttribute:           'uid',
          userMemberAttribute:          'memberOf',
          userNameAttribute:            'cn',
          userObjectClass:              'inetOrgPerson',
          userSearchAttribute:          'uid|sn|givenName'
        };

        this.$set(this.model, 'openLdapConfig', config);
      }
    }
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
            <tr><td>{{ t(`authConfig.saml.displayName`) }}: </td><td>{{ model.displayNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.userName`) }}: </td><td>{{ model.userNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.UID`) }}: </td><td>{{ model.uidField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.entityID`) }}: </td><td>{{ model.entityID }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.api`) }}: </td><td>{{ model.rancherApiHost }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.groups`) }}: </td><td>{{ model.groupsField }}</td></tr>
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

        <h3>{{ t(`authConfig.saml.${NAME}`) }}</h3>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.displayNameField"
              :label="t(`authConfig.saml.displayName`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.userNameField"
              :label="t(`authConfig.saml.userName`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.uidField"
              :label="t(`authConfig.saml.UID`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.groupsField"
              :label="t(`authConfig.saml.groups`)"
              :mode="mode"
              required
            />
          </div>
        </div>
        <div class="row mb-20">
          <div
            v-if="NAME === 'keycloak' || NAME === 'ping'"
            class="col span-6"
          >
            <LabeledInput
              v-model="model.entityID"
              :label="t(`authConfig.saml.entityID`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.rancherApiHost"
              :label="t(`authConfig.saml.api`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-4">
            <LabeledInput
              v-model="model.spKey"
              :label="t(`authConfig.saml.key.label`)"
              :placeholder="t(`authConfig.saml.key.placeholder`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector
              class="role-tertiary add mt-5"
              :label="t('generic.readFromFile')"
              :mode="mode"
              @selected="$set(model, 'spKey', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="model.spCert"
              :label="t(`authConfig.saml.cert.label`)"
              :placeholder="t(`authConfig.saml.cert.placeholder`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector
              class="role-tertiary add mt-5"
              :label="t('generic.readFromFile')"
              :mode="mode"
              @selected="$set(model, 'spCert', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="model.idpMetadataContent"
              :label="t(`authConfig.saml.metadata.label`)"
              :placeholder="t(`authConfig.saml.metadata.placeholder`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector
              class="role-tertiary add mt-5"
              :label="t('generic.readFromFile')"
              :mode="mode"
              @selected="$set(model, 'idpMetadataContent', $event)"
            />
          </div>
        </div>
        <div v-if="NAME === 'shibboleth'">
          <div class="row">
            <Checkbox
              v-model="showLdap"
              :mode="mode"
              :label="t('authConfig.saml.showLdap')"
            />
          </div>
          <div class="row mt-20 mb-20">
            <config
              v-if="showLdap"
              v-model="model.openLdapConfig"
              :type="NAME"
              :mode="mode"
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
