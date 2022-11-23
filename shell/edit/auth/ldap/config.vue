<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import UnitInput from '@shell/components/form/UnitInput';
import { Banner } from '@components/Banner';
import FileSelector from '@shell/components/form/FileSelector';

const DEFAULT_NON_TLS_PORT = 389;
const DEFAULT_TLS_PORT = 636;

export default {
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
    };
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
  <div @input="$emit('input', model)">
    <template>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="hostname"
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
            @input="e=>$set(model, 'port', e.replace(/[^0-9]*/g, ''))"
          />
        </div>

        <div class="col">
          <Checkbox
            v-model="model.tls"
            :mode="mode"
            class="full-height"
            :label="t('authConfig.ldap.tls')"
          />
        </div>
        <div class="col span-1">
          <Checkbox
            v-model="model.starttls"
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
            v-model="model.certificate"
            required
            type="multiline"
            :mode="mode"
            :label="t('authConfig.ldap.cert')"
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
          <UnitInput
            v-model="model.connectionTimeout"
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
            v-model="model.serviceAccountUsername"
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
            v-model="model.serviceAccountDistinguishedName"
            required
            :mode="mode"
            :label="t('authConfig.ldap.serviceAccountDN')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.serviceAccountPassword"
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
            v-model="model.defaultLoginDomain"
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
            v-model="model.userSearchBase"
            required
            :mode="mode"
            :label="t('authConfig.ldap.userSearchBase.label')"
            :placeholder="t('authConfig.ldap.userSearchBase.placeholder')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupSearchBase"
            :mode="mode"
            :placeholder="t('authConfig.ldap.groupSearchBase.placeholder')"
            :label="t('authConfig.ldap.groupSearchBase.label')"
          />
        </div>
      </div>

      <div class="row">
        <h3>  {{ t('authConfig.ldap.customizeSchema') }}</h3>
      </div>
      <div class="row">
        <div class="col span-6">
          <h4>{{ t('authConfig.ldap.users') }}</h4>
        </div>
        <div class="col span-6">
          <h4>{{ t('authConfig.ldap.groups') }}</h4>
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userObjectClass"
            :mode="mode"
            :label="t('authConfig.ldap.objectClass')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupObjectClass"
            :mode="mode"
            :label="t('authConfig.ldap.objectClass')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userNameAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.usernameAttribute')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupNameAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.nameAttribute')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userLoginAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.loginAttribute')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupMemberUserAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.groupMemberUserAttribute')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userMemberAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.userMemberAttribute')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupSearchAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.searchAttribute')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userSearchAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.searchAttribute')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupSearchFilter"
            :mode="mode"
            :label="t('authConfig.ldap.searchFilter')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userSearchFilter"
            :mode="mode"
            :label="t('authConfig.ldap.searchFilter')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupMemberMappingAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.groupMemberMappingAttribute')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.userEnabledAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.userEnabledAttribute')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="model.groupDNAttribute"
            :mode="mode"
            :label="t('authConfig.ldap.groupDNAttribute')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="model.disabledStatusBitmask"
            :mode="mode"
            :label="t('authConfig.ldap.disabledStatusBitmask')"
          />
        </div>
        <div
          v-if="type!=='shibboleth'"
          class=" col span-6"
        >
          <RadioGroup
            v-model="model.nestedGroupMembershipEnabled"
            :mode="mode"
            name="nested"
            class="full-height"
            :options="[true, false]"
            :labels="[t('authConfig.ldap.nestedGroupMembership.options.nested'), t('authConfig.ldap.nestedGroupMembership.options.direct')]"
          />
        </div>
      </div>
    </template>
  </div>
</template>
