<script>
import { mapGetters } from 'vuex';
import { _CREATE } from '@/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import UnitInput from '@/components/form/UnitInput';
import Banner from '@/components/Banner';
import ReadFile from '@/components/form/ReadFile';
import pickBy from 'lodash/pickBy';
import InputWithSelect from '@/components/form/InputWithSelect';

export default {
  components: {
    LabeledInput,
    Checkbox,
    UnitInput,
    Banner,
    ReadFile,
    InputWithSelect
  },
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },
    // authConfig
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

  computed: {
    requiredFields() {
      return pickBy(this.schema.resourceFields, (value, key) => {
        return !!value.required;
      });
    },

    hostname: {
      get() {
        return (this.value.servers || [])[0];
      },
      set(neu) {
        if (!this.value.servers) {
          this.$set(this.value, 'servers', []);
        }
        this.$set(this.value.servers, 0, neu);
      }
    },

    isReady() {
      let ready = true;

      for (const key in this.requiredFields) {
        if (!this.value[key]) {
          ready = false;
        }
      }

      this.$emit('ready', ready);

      return ready;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    isReady() {},

    'value.tls'(neu) {
      if (neu && this.value.port === 389) {
        this.value.port = 636;
      } else if (!neu && this.value.port === 636) {
        this.value.port = 389;
      }
    }
  },

  created() {
    if (this.requiredFields.accessMode && !this.value.accessMode) {
      this.value.accessMode = 'unrestricted';
    }
  },

};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput v-model="hostname" required :label="t('auth.LDAP.hostname')" />
      </div>
      <div class="col span-4">
        <InputWithSelect :text-label="t('auth.LDAP.port')" :select-before-text="false" :text-value="port" :select-value="tls" :options="[{label: t('auth.LDAP.tls.options.false'), value: false},{label: t('auth.LDAP.tls.options.true'), value: true}]" />
      </div>
      <div class="col span-4">
        <UnitInput v-model="value.connectionTimeout" required :label="t('auth.LDAP.connectionTimeout')" :suffix="t('suffix.milliseconds')" />
      </div>
    </div>

    <div v-if="value.tls" class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="value.certificate" :label="t('auth.LDAP.caCertificate')" type="multiline" required />
        <ReadFile class="mt-10" @input="e=>value.certificate = e.value" />
      </div>
    </div>

    <div class="spacer" />

    <Banner :label="t('auth.LDAP.configBanner')" color="info" />

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.serviceAccountUsername" required :label="t('auth.LDAP.serviceAccountUsername')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.serviceAccountPassword" required type="password" :label="t('auth.LDAP.serviceAccountPassword')" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.defaultLoginDomain" :protip="t('auth.LDAP.defaultLoginDomain.label')" :label="t('auth.LDAP.defaultLoginDomain.label')" />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.userSearchBase" :protip="t('auth.LDAP.userSearchBase.tip')" required :label="t('auth.LDAP.userSearchBase.label')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.groupSearchBase" :protip="t('auth.LDAP.groupSearchBase.tip')" :label="t('auth.LDAP.groupSearchBase.label')" />
      </div>
    </div>
  </div>
</template>
