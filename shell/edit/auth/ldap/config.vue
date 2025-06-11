<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import UnitInput from '@shell/components/form/UnitInput';
import { Banner } from '@components/Banner';
import FileSelector from '@shell/components/form/FileSelector';

const DEFAULT_NON_TLS_PORT = 389;
const DEFAULT_TLS_PORT = 636;

export const SHIBBOLETH = 'shibboleth';
export const OKTA = 'okta';

export default {
  emits: ['update:value'],

  components: {
    RadioGroup,
    LabeledInput,
    Banner,
    Checkbox,
    UnitInput,
    FileSelector
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
        <LabeledInput
          v-model:value="model.certificate"
          required
          type="multiline"
          :mode="mode"
          :label="t('authConfig.ldap.cert')"
        />
        <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFile')"
          :mode="mode"
          @selected="model.certificate = $event"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <UnitInput
          v-model:value="model.connectionTimeout"
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
          required
          :mode="mode"
          :label="t('authConfig.ldap.serviceAccountDN')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.serviceAccountPassword"
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
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="model.userSearchBase"
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
