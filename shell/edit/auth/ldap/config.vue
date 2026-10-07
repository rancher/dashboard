<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import UnitInput from '@shell/components/form/UnitInput';
import { Banner } from '@components/Banner';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';

const DEFAULT_NON_TLS_PORT = 389;
const DEFAULT_TLS_PORT = 636;

export const SHIBBOLETH = 'shibboleth';
export const OKTA = 'okta';
export const OPEN_LDAP = 'openldap';
export const FREE_IPA = 'freeipa';

export default {
  emits: ['update:value'],

  components: {
    RadioGroup,
    LabeledInput,
    Banner,
    Checkbox,
    UnitInput,
    FileSelectorTextArea
  },

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    type: {
      type:     String,
      required: true
    },

    isCreate: {
      type:    Boolean,
      default: false
    }

  },

  data() {
    if (!this.value.servers) {
      this.value.servers = [];
    }

    return {
      model:         this.value,
      hostname:      this.value.servers.join(','),
      serverSetting: null,
      OKTA
    };
  },

  computed: {
    // Does the auth provider support LDAP for search in addition to SAML?
    isSamlProvider() {
      return this.type === SHIBBOLETH || this.type === OKTA;
    },

    // Allow to enable user search just for these providers
    isSearchAllowed() {
      return this.type === OPEN_LDAP || this.type === FREE_IPA;
    },

    // LDAP and AD build principal IDs from the identifier attributes, so they are fixed once the provider
    // is enabled. SAML providers get their principal IDs from the assertion, and the LDAP search attributes
    // only have to match it, so they stay editable.
    idAttributeLocked() {
      return !this.isSamlProvider && !this.isCreate;
    },

    idAttributeTooltip() {
      if (this.isSamlProvider) {
        return this.t('authConfig.ldap.idAttribute.samlTip');
      }

      return this.idAttributeLocked ? this.t('authConfig.ldap.idAttribute.locked') : this.t('authConfig.ldap.idAttribute.tip');
    }
  },

  watch: {
    hostname(neu, old) {
      this.value.servers = neu.split(',');
    },
    'model.starttls'(neu) {
      if (neu) {
        this.model.tls = false;
      }
    },
    'model.tls'(neu) {
      if (neu) {
        this.model.starttls = false;
      }

      const expectedCurrentDefault = neu ? DEFAULT_NON_TLS_PORT : DEFAULT_TLS_PORT;
      const newDefault = neu ? DEFAULT_TLS_PORT : DEFAULT_NON_TLS_PORT;

      // Note: The default port value is a number
      // If the user edits this value, the type will be a string
      // Thus, we will only change the value when the user toggles the TLS flag if they have
      // NOT edited the port value in any way
      if (this.model.port === expectedCurrentDefault) {
        this.value.port = newDefault;
      }
    }
  },

};
</script>

<template>
  <div @update:value="$emit('update:value', model)">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="hostname"
          name="hostname"
          data-testid="ldap-hostname"
          required
          :mode="mode"
          :hoover-tooltip="true"
          :tooltip="t('authConfig.ldap.hostname.hint')"
          :label="t('authConfig.ldap.hostname.label')"
          :placeholder="t('authConfig.ldap.hostname.placeholder')"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="model.port"
          name="port"
          data-testid="ldap-port"
          type="number"
          required
          :min="0"
          :step="1"
          :mode="mode"
          :label="t('authConfig.ldap.port')"
          @update:value="e=> model.port = e.replace(/[^0-9]*/g, '')"
        />
      </div>

      <div class="col">
        <Checkbox
          v-model:value="model.tls"
          :mode="mode"
          class="full-height"
          :label="t('authConfig.ldap.tls')"
        />
      </div>
      <div class="col span-1">
        <Checkbox
          v-model:value="model.starttls"
          :tooltip="t('authConfig.ldap.starttls.tip')"
          :mode="mode"
          class="full-height"
          :label="t('authConfig.ldap.starttls.label')"
        />
      </div>
    </div>
    <div
      v-if="model.tls || model.starttls"
      class="row mb-20"
    >
      <div class="col span-12">
        <FileSelectorTextArea
          v-model:value="model.certificate"
          name="certificate"
          required
          :mode="mode"
          :label="t('authConfig.ldap.cert')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <UnitInput
          v-model:value="model.connectionTimeout"
          name="connectionTimeout"
          required
          :mode="mode"
          :label="t('authConfig.ldap.serverConnectionTimeout')"
          suffix="milliseconds"
        />
      </div>
    </div>
    <Banner
      color="info"
      :label="t('authConfig.ldap.serviceAccountInfo')"
    />
    <div class="row mb-20">
      <div
        v-if="type==='activedirectory'"
        class="col span-6"
      >
        <LabeledInput
          v-model:value="model.serviceAccountUsername"
          name="serviceAccountUsername"
          data-testid="ldap-service-account-username"
          required
          :mode="mode"
          :label="t('authConfig.ldap.serviceAccountDN')"
        />
      </div>

      <div
        v-else
        class="col span-6"
      >
        <LabeledInput
          v-model:value="model.serviceAccountDistinguishedName"
          name="serviceAccountDistinguishedName"
          data-testid="ldap-service-account-dn"
          required
          :mode="mode"
          :label="t('authConfig.ldap.serviceAccountDN')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.serviceAccountPassword"
          name="serviceAccountPassword"
          data-testid="ldap-service-account-password"
          required
          type="password"
          :mode="mode"
          :label="t('authConfig.ldap.serviceAccountPassword')"
        />
      </div>
    </div>
    <div
      v-if="type==='activedirectory'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.defaultLoginDomain"
          :hoover-tooltip="true"
          :tooltip="t('authConfig.ldap.defaultLoginDomain.hint')"
          :placeholder="t('authConfig.ldap.defaultLoginDomain.placeholder')"
          :mode="mode"
          :label="t('authConfig.ldap.defaultLoginDomain.label')"
        />
      </div>
    </div>

    <div
      v-if="isSearchAllowed"
      class="row mb-20"
    >
      <div class="col">
        <Checkbox
          v-model:value="model.searchUsingServiceAccount"
          :mode="mode"
          data-testid="searchUsingServiceAccount"
          class="full-height"
          :label="t('authConfig.ldap.searchUsingServiceAccount.label')"
          :tooltip="t('authConfig.ldap.searchUsingServiceAccount.tip')"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.userSearchBase"
          name="userSearchBase"
          data-testid="ldap-user-search-base"
          required
          :mode="mode"
          :label="t('authConfig.ldap.userSearchBase.label')"
          :placeholder="t('authConfig.ldap.userSearchBase.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.groupSearchBase"
          :mode="mode"
          :placeholder="t('authConfig.ldap.groupSearchBase.placeholder')"
          :label="t('authConfig.ldap.groupSearchBase.label')"
        />
      </div>
    </div>

    <div class="row">
      <h3>  {{ t('authConfig.ldap.customizeSchema') }}</h3>
    </div>
    <Banner
      v-if="type === OKTA && isCreate"
      class="row"
      color="info"
      label-key="authConfig.ldap.oktaSchema"
    />
    <div class="schema-container">
      <div class="schema-column">
        <h4>{{ t('authConfig.ldap.users') }}</h4>
        <LabeledInput
          v-model:value="model.userObjectClass"
          :mode="mode"
          :label="t('authConfig.ldap.objectClass')"
        />
        <LabeledInput
          v-model:value="model.userNameAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.usernameAttribute')"
        />
        <LabeledInput
          v-model:value="model.userLoginAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.loginAttribute')"
        />
        <LabeledInput
          v-model:value="model.userIDAttribute"
          data-testid="ldap-user-id-attribute"
          :mode="mode"
          :disabled="idAttributeLocked"
          :label="t('authConfig.ldap.userIDAttribute')"
          :tooltip="idAttributeTooltip"
        />
        <LabeledInput
          v-model:value="model.userMemberAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.userMemberAttribute')"
        />
        <LabeledInput
          v-model:value="model.userLoginFilter"
          data-testid="user-login-filter"
          :mode="mode"
          :label="t('authConfig.ldap.userLoginFilter')"
        />
        <LabeledInput
          v-model:value="model.userSearchAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.searchAttribute')"
        />
        <LabeledInput
          v-model:value="model.userSearchFilter"
          :mode="mode"
          :label="t('authConfig.ldap.searchFilter')"
        />
        <LabeledInput
          v-model:value="model.userEnabledAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.userEnabledAttribute')"
        />
        <LabeledInput
          v-model:value="model.disabledStatusBitmask"
          :mode="mode"
          :label="t('authConfig.ldap.disabledStatusBitmask')"
        />
      </div>
      <div class="schema-column">
        <h4>{{ t('authConfig.ldap.groups') }}</h4>
        <LabeledInput
          v-model:value="model.groupObjectClass"
          :mode="mode"
          :label="t('authConfig.ldap.objectClass')"
        />
        <LabeledInput
          v-model:value="model.groupNameAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.nameAttribute')"
        />
        <LabeledInput
          v-model:value="model.groupIDAttribute"
          data-testid="ldap-group-id-attribute"
          :mode="mode"
          :disabled="idAttributeLocked"
          :label="t('authConfig.ldap.groupIDAttribute')"
          :tooltip="idAttributeTooltip"
        />
        <LabeledInput
          v-model:value="model.groupMemberUserAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.groupMemberUserAttribute')"
        />
        <LabeledInput
          v-model:value="model.groupSearchAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.searchAttribute')"
        />
        <LabeledInput
          v-model:value="model.groupSearchFilter"
          :mode="mode"
          :label="t('authConfig.ldap.searchFilter')"
        />
        <LabeledInput
          v-model:value="model.groupMemberMappingAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.groupMemberMappingAttribute')"
        />
        <LabeledInput
          v-model:value="model.groupDNAttribute"
          :mode="mode"
          :label="t('authConfig.ldap.groupDNAttribute')"
        />
        <template
          v-if="!isSamlProvider"
        >
          <RadioGroup
            v-model:value="model.nestedGroupMembershipEnabled"
            :mode="mode"
            name="nested"
            class="full-height"
            :options="[true, false]"
            :labels="[t('authConfig.ldap.nestedGroupMembership.options.nested'), t('authConfig.ldap.nestedGroupMembership.options.direct')]"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .schema-container {
    display: flex;
    gap: 1.75%;
    flex-wrap: wrap;
  }

  .schema-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 16rem;

    > :not(:first-child) {
      margin-bottom: 20px;
    }
  }
</style>
