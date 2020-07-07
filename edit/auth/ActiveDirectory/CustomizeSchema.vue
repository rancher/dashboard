<script>
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import { mapGetters } from 'vuex';
import { _CREATE } from '@/config/query-params';
export default {
  components: { LabeledInput, RadioGroup },
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    schema: {
      type:     Object,
      required: true
    }
  },

  data() {
    const fields = this.schema.resourceFields || {};
    let showSchema = false;

    for (const key in fields) {
      if (key === 'tls' || key === 'port') {
        continue;
      }
      if (fields[key].default && fields[key].default !== this.value[key]) {
        showSchema = true;
      }
    }

    return { showSchema };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  watch: {
    // reset schema fields to defaults when 'use generic' is selected
    showSchema(neu) {
      if (!neu) {
        const fields = this.schema.resourceFields || {};

        for (const key in fields) {
          if (key === 'tls' || key === 'port') {
            continue;
          }
          if (fields[key].default) {
            this.value[key] = fields[key].default;
          }
        }
      }
    }
  },

  methods: {
    update() {
      this.$emit('input', this.$data);
    }
  }
};
</script>

<template>
  <div @input="update">
    <RadioGroup v-model="showSchema" :labels="[t('auth.LDAP.schema.useGeneric', {provider: 'Active Directory'}), t('auth.LDAP.schema.customize')]" :options="[false, true]" />

    <template v-if="showSchema">
      <h3 class="mt-20">
        {{ t('auth.LDAP.schema.titles.users') }}
      </h3>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.userLoginAttribute" :label="t('auth.LDAP.schema.login')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.userMemberAttribute" :label="t('auth.LDAP.schema.userMember')" />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.userSearchAttribute" :label="t('auth.LDAP.schema.search')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.userSearchFilter" :label="t('auth.LDAP.schema.searchFilter')" />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.userEnabledAttribute" :label="t('auth.LDAP.schema.userEnabled')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.userDisabledStatusBitmask" :label="t('auth.LDAP.schema.disabledStatus')" />
        </div>
      </div>

      <h3 class="mt-20">
        {{ t('auth.LDAP.schema.titles.groups') }}
      </h3>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.groupObjectClass" :label="t('auth.LDAP.schema.objectClass')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.groupNameAttribute" :label="t('auth.LDAP.schema.name')" />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.groupMemberUserAttribute" :label="t('auth.LDAP.schema.groupMember')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.groupMemberMappingAttribute" :label="t('auth.LDAP.schema.groupMemberMapping')" />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.groupSearchAttribute" :label="t('auth.LDAP.schema.search')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.groupSearchFilter" :label="t('auth.LDAP.schema.searchFilter')" />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.groupDNAttribute" :label="t('auth.LDAP.schema.groupDN')" />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model="value.nestedGroupMembershipEnabled"
            :label="t('auth.LDAP.schema.nestedGroup.label')"
            :labels="[t('auth.LDAP.schema.nestedGroup.options.nested'),t('auth.LDAP.schema.nestedGroup.options.onlyDirect')]"
            :options="[false, true]"
          />
        </div>
      </div>
    </template>
  </div>
</template>
