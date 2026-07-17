<script>
import { ref, computed, provide } from 'vue';
import { useStore } from 'vuex';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import AuthConfig, { SLO_OPTION_VALUES } from '@shell/mixins/auth-config';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import FileSelector from '@shell/components/form/FileSelector';
import AuthBanner from '@shell/components/auth/AuthBanner';
import config, { OKTA, SHIBBOLETH } from '@shell/edit/auth/ldap/config';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';

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
    LabeledSelect,
    Banner,
    AllowedPrincipals,
    Checkbox,
    RadioGroup,
    FileSelector,
    config,
    AuthBanner,
    AuthProviderWarningBanners,
    RcButton,
  },

  mixins: [CreateEditView, AuthConfig],

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    const coerce = (schema) => z.preprocess((v) => v ?? '', schema);
    const requiredField = (key) => coerce(z.string().min(1, t('validation.required', { key: t(key) })));
    const requiredUrlField = (key) => coerce(z.string().min(1, t('validation.required', { key: t(key) })).url(t('validation.genericUrl')));

    const validationSchema = computed(() => toTypedSchema(
      z.object({
        displayNameField:   requiredField('authConfig.saml.displayName'),
        userNameField:      requiredField('authConfig.saml.userName'),
        uidField:           requiredField('authConfig.saml.UID'),
        groupsField:        requiredField('authConfig.saml.groups'),
        rancherApiHost:     requiredUrlField('authConfig.saml.api'),
        spKey:              requiredField('authConfig.saml.key.label'),
        spCert:             requiredField('authConfig.saml.cert.label'),
        idpMetadataContent: requiredField('authConfig.saml.metadata.label'),
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

    return { isFormValid, validateAllFields };
  },

  data() {
    return {
      showLdap:        false,
      showLdapDetails: false,
      nameIDFormatOptions: [
        { value: 'unspecified', label: 'unspecified' },
        { value: 'emailAddress', label: 'emailAddress' },
        { value: 'transient', label: 'transient' },
        { value: 'persistent', label: 'persistent' },
      ],
      signatureMethodOptions: [
        { value: 'RSA-SHA256', label: 'RSA-SHA256' },
        { value: 'RSA-SHA1', label: 'RSA-SHA1' },
        { value: 'RSA-SHA512', label: 'RSA-SHA512' },
      ],
    };
  },

  created() {
    this.registerBeforeHook(this.validateAllFields, 'willSave');

    if (this.isGenericSaml && !this.model.nameIDFormat) {
      this.model.nameIDFormat = 'unspecified';
    }
    if (this.isGenericSaml && !this.model.signatureMethod) {
      this.model.signatureMethod = 'RSA-SHA256';
    }
  },

  computed: {
    isGenericSaml() {
      return this.NAME === 'genericsaml';
    },

    validationPassed() {
      if (this.model?.enabled && !this.editConfig) {
        return true;
      }

      return this.isFormValid;
    },

    tArgs() {
      return {
        baseUrl:  this.serverSetting,
        provider: this.displayName,
        username: this.principal.loginName || this.principal.name,
      };
    },

    isLogoutAllSupported() {
      return this.model?.logoutAllSupported;
    },

    sloOptions() {
      return [
        { value: SLO_OPTION_VALUES.rancher, label: this.t('authConfig.slo.sloOptions.onlyRancher', { name: this.model?.nameDisplay }) },
        { value: SLO_OPTION_VALUES.all, label: this.t('authConfig.slo.sloOptions.logoutAll', { name: this.model?.nameDisplay }) },
        { value: SLO_OPTION_VALUES.both, label: this.t('authConfig.slo.sloOptions.choose') },
      ];
    },

    sloTypeText() {
      const sloOptionSelected = this.sloOptions.find((item) => item.value === this.sloType);

      return sloOptionSelected?.label || '';
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
        this.model['openLdapConfig'] = { ...LDAP_DEFAULTS };
      }
    },
    // sloType is defined on shell/mixins/auth-config.js
    sloType(neu) {
      switch (neu) {
      case SLO_OPTION_VALUES.rancher:
        this.model.logoutAllEnabled = false;
        this.model.logoutAllForced = false;
        break;
      case SLO_OPTION_VALUES.all:
        this.model.logoutAllEnabled = true;
        this.model.logoutAllForced = true;
        break;
      case SLO_OPTION_VALUES.both:
        this.model.logoutAllEnabled = true;
        this.model.logoutAllForced = false;
        break;
      }
    }
  },
  methods: {
    onSelected(val, key) {
      this.model[key] = val;
    }
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
            <tr><td>{{ t(`authConfig.saml.displayName`) }}: </td><td>{{ model.displayNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.userName`) }}: </td><td>{{ model.userNameField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.UID`) }}: </td><td>{{ model.uidField }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.entityID`) }}: </td><td>{{ model.entityID }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.api`) }}: </td><td>{{ model.rancherApiHost }}</td></tr>
            <tr><td>{{ t(`authConfig.saml.groups`) }}: </td><td>{{ model.groupsField }}</td></tr>
            <template v-if="isGenericSaml">
              <tr data-testid="genericsaml-view-fields"><td>{{ t(`authConfig.saml.nameIDFormat`) }}: </td><td>{{ model.nameIDFormat }}</td></tr>
              <tr><td>{{ t(`authConfig.saml.signatureMethod`) }}: </td><td>{{ model.signatureMethod }}</td></tr>
              <tr><td>{{ t(`authConfig.saml.allowIdpInitiated`) }}: </td><td>{{ model.allowIdpInitiated }}</td></tr>
              <tr><td>{{ t(`authConfig.saml.forceAuthn`) }}: </td><td>{{ model.forceAuthn }}</td></tr>
            </template>
            <tr v-if="isLogoutAllSupported">
              <td>{{ t(`authConfig.slo.sloTitle`) }}: </td><td>{{ sloTypeText }}</td>
            </tr>
          </template>

          <template
            v-if="supportsLDAPSearch"
            #footer
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
                  <rc-button
                    variant="link"
                    @click="showLdapDetails = !showLdapDetails"
                  >
                    <template v-if="showLdapDetails">
                      {{ t('authConfig.saml.search.hide') }}
                    </template>
                    <template v-else>
                      {{ t('authConfig.saml.search.show') }}
                    </template>
                  </rc-button>
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
              <tbody>
                <tr><td>{{ t('authConfig.ldap.hostname.label') }}:</td><td>{{ ldapHosts }}</td></tr>
                <tr><td>{{ t('authConfig.ldap.port') }}:</td><td>{{ model.openLdapConfig.port }}</td></tr>
                <tr><td>{{ t('authConfig.ldap.protocol') }}:</td><td>{{ ldapProtocol }}</td></tr>
                <tr><td>{{ t('authConfig.ldap.serviceAccountDN') }}:</td><td>{{ model.openLdapConfig.serviceAccountDistinguishedName }}</td></tr>
                <tr><td>{{ t('authConfig.ldap.userSearchBase.label') }}:</td><td>{{ model.openLdapConfig.userSearchBase }}</td></tr>
                <tr><td>{{ t('authConfig.ldap.groupSearchBase.label') }}:</td><td>{{ model.openLdapConfig.groupSearchBase }}</td></tr>
              </tbody>
            </table>
          </template>
        </AuthBanner>

        <hr role="none">

        <AllowedPrincipals
          :provider="NAME"
          :auth-config="model"
          :mode="mode"
        />
      </template>

      <template v-else>
        <AuthProviderWarningBanners
          v-if="!model.enabled"
          :t-args="tArgs"
        />

        <h3>{{ t(`authConfig.saml.${NAME}`) }}</h3>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.displayNameField"
              name="displayNameField"
              :label="t(`authConfig.saml.displayName`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.userNameField"
              name="userNameField"
              :label="t(`authConfig.saml.userName`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.uidField"
              name="uidField"
              :label="t(`authConfig.saml.UID`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.groupsField"
              name="groupsField"
              :label="t(`authConfig.saml.groups`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div
            v-if="NAME === 'keycloak' || NAME === 'ping' || NAME === 'genericsaml'"
            class="col span-6"
          >
            <LabeledInput
              v-model:value="model.entityID"
              :label="t(`authConfig.saml.entityID`)"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="model.rancherApiHost"
              name="rancherApiHost"
              :label="t(`authConfig.saml.api`)"
              :mode="mode"
              required
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-4">
            <LabeledInput
              v-model:value="model.spKey"
              name="spKey"
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
              @selected="onSelected($event, 'spKey')"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="model.spCert"
              name="spCert"
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
              @selected="onSelected($event, 'spCert')"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="model.idpMetadataContent"
              name="idpMetadataContent"
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
              @selected="onSelected($event, 'idpMetadataContent')"
            />
          </div>
        </div>

        <!-- Generic SAML options -->
        <template v-if="isGenericSaml">
          <div data-testid="genericsaml-fields">
            <div class="row mb-20">
              <div class="col span-6">
                <LabeledSelect
                  v-model:value="model.nameIDFormat"
                  :label="t('authConfig.saml.nameIDFormat')"
                  :options="nameIDFormatOptions"
                  :mode="mode"
                />
              </div>
              <div class="col span-6">
                <LabeledSelect
                  v-model:value="model.signatureMethod"
                  :label="t('authConfig.saml.signatureMethod')"
                  :options="signatureMethodOptions"
                  :mode="mode"
                />
              </div>
            </div>
            <div class="row mb-20">
              <div class="col span-6">
                <Checkbox
                  v-model:value="model.allowIdpInitiated"
                  :label="t('authConfig.saml.allowIdpInitiated')"
                  :mode="mode"
                />
              </div>
              <div class="col span-6">
                <Checkbox
                  v-model:value="model.forceAuthn"
                  :label="t('authConfig.saml.forceAuthn')"
                  :mode="mode"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- SLO logout -->
        <div
          v-if="isLogoutAllSupported"
          class="mt-10 mb-30"
        >
          <div class="row">
            <div class="col span-12">
              <h3>{{ t('authConfig.slo.sloTitle') }}</h3>
            </div>
          </div>
          <div class="row">
            <div class="col span-4">
              <RadioGroup
                v-model:value="sloType"
                :mode="mode"
                :options="sloOptions"
                :disabled="!model.logoutAllSupported"
                name="sloTypeRadio"
              />
            </div>
          </div>
        </div>

        <!-- LDAP search -->
        <div v-if="supportsLDAPSearch">
          <div class="row">
            <h3>{{ t('authConfig.saml.search.title') }}</h3>
          </div>
          <div class="row">
            <Banner
              label-key="authConfig.saml.search.message"
              color="info"
            />
          </div>
          <div class="row">
            <Checkbox
              v-model:value="showLdap"
              :mode="mode"
              :label="t('authConfig.saml.showLdap')"
            />
          </div>
          <div class="row mt-20 mb-20">
            <config
              v-if="showLdap && model.openLdapConfig"
              v-model:value="model.openLdapConfig"
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

    &:deep() code {
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
  }
</style>
