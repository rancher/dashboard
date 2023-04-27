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

export const SHIBBOLETH = 'shibboleth';
export const OKTA = 'okta';

// Standard LDAP defaults
const LDAP_DEFAULTS = {
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
    return {
      showLdap:        false,
      showLdapDetails: false,
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
      return { enabled: true, ...this.model };
    },

    // Does the auth provider support LDAP for search in addition to SAML?
    supportsLDAPSearch() {
      return this.NAME === SHIBBOLETH || this.NAME === OKTA;
    },

    ldapHosts() {
      const hosts = this.model?.openLdapConfig.servers || [];

      return hosts.join(',');
    },

    ldapProtocol() {
      if (this.model?.openLdapConfig?.starttls) {
        return this.t('authConfig.ldap.protocols.starttls');
      } else if (this.model?.openLdapConfig?.tls) {
        return this.t('authConfig.ldap.protocols.tls');
      }

      return this.t('authConfig.ldap.protocols.ldap');
    }
  },
  watch: {
    showLdap(neu, old) {
      if (neu && !this.model.openLdapConfig) {
        // Use a spread of config, so that if don't make changes to the defaults if the user edits them
        this.$set(this.model, 'openLdapConfig', { ...LDAP_DEFAULTS });
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
          <template
            slot="rows"
          >
            <tr><td>{{ t(`authConfig.saml.displayName`) }}: </td><td>{{ model.displayNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.userName`) }}: </td><td>{{ model.userNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.UID`) }}: </td><td>{{ model.uidField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.entityID`) }}: </td><td>{{ model.entityID }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.api`) }}: </td><td>{{ model.rancherApiHost }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.groups`) }}: </td><td>{{ model.groupsField }}</td></tr>
          </template>

          <template
            v-if="supportsLDAPSearch"
            slot="footer"
          >
            <Banner
              v-if="showLdap"
              color="success"
              class="banner"
            >
              <div
                class="advanced-ldap-banner"
              >
                <div>{{ t('authConfig.saml.search.on') }}</div>
                <div>
                  <a
                    class="toggle-btn"
                    @click="showLdapDetails = !showLdapDetails"
                  >
                    <template v-if="showLdapDetails">{{ t('authConfig.saml.search.hide') }}</template>
                    <template v-else>{{ t('authConfig.saml.search.show') }}</template>
                  </a>
                </div>
              </div>
            </Banner>
            <Banner
              v-else
              color="info"
            >
              {{ t('authConfig.saml.search.off') }}
            </Banner>

            <table v-if="showLdapDetails && model.openLdapConfig">
              <tr><td>{{ t('authConfig.ldap.hostname.label') }}:</td><td>{{ ldapHosts }}</td></tr>
              <tr><td>{{ t('authConfig.ldap.port') }}:</td><td>{{ model.openLdapConfig.port }}</td></tr>
              <tr><td>{{ t('authConfig.ldap.protocol') }}:</td><td>{{ ldapProtocol }}</td></tr>
              <tr><td>{{ t('authConfig.ldap.serviceAccountDN') }}:</td><td>{{ model.openLdapConfig.serviceAccountDistinguishedName }}</td></tr>
              <tr><td>{{ t('authConfig.ldap.userSearchBase.label') }}:</td><td>{{ model.openLdapConfig.userSearchBase }}</td></tr>
              <tr><td>{{ t('authConfig.ldap.groupSearchBase.label') }}:</td><td>{{ model.openLdapConfig.groupSearchBase }}</td></tr>
            </table>
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
        <div
          v-if="!model.enabled"
          class="row"
        >
          <div class="col span-12">
            <Banner color="info">
              <div v-clean-html="t('authConfig.associatedWarning', tArgs, true)" />
            </Banner>
          </div>
        </div>
        <div v-if="supportsLDAPSearch">
          <div class="row">
            <h2>{{ t('authConfig.saml.search.title') }}</h2>
          </div>
          <div class="row">
            <Banner
              label-key="authConfig.saml.search.message"
              color="info"
            />
          </div>
          <div class="row">
            <Checkbox
              v-model="showLdap"
              :mode="mode"
              :label="t('authConfig.saml.showLdap')"
            />
          </div>
          <div class="row mt-20 mb-20">
            <config
              v-if="showLdap && model.openLdapConfig"
              v-model="model.openLdapConfig"
              :type="NAME"
              :mode="mode"
              :is-create="!model.enabled"
            />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
<style lang="scss" scoped>
  .banner {
    display: block;

    &::v-deep code {
      padding: 0 3px;
      margin: 0 3px;
    }
  }

  // Banner shows message and link formatted right aligned
  .advanced-ldap-banner {
    display: flex;
    flex: 1;

    > :first-child {
      flex: 1;
    }

    .toggle-btn {
      cursor: pointer;
      user-select: none;
    }
  }
</style>
