<script>
import { ref, computed, provide } from 'vue';
import { useStore } from 'vuex';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import config from '@shell/edit/auth/ldap/config';
import AuthConfig from '@shell/mixins/auth-config';
import AuthBanner from '@shell/components/auth/AuthBanner';
import Password from '@shell/components/form/Password';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';
import { useI18n } from '@shell/composables/useI18n';
import { zodValidators } from 'utils/validators/zod-helpers';

const AUTH_TYPE = 'ldap';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    AllowedPrincipals,
    config,
    AuthBanner,
    Password,
    AuthProviderWarningBanners
  },

  mixins: [CreateEditView, AuthConfig],

  setup() {
    const store = useStore();
    const { t } = useI18n(store);
    const { field } = zodValidators(t);

    const tlsEnabledRef = ref(false);
    const isActiveDirectoryRef = ref(false);

    const validationSchema = computed(() => toTypedSchema(
      z.object({
        hostname:                        field('authConfig.ldap.hostname.label').required(),
        port:                            field('authConfig.ldap.port').required(),
        certificate:                     tlsEnabledRef.value ? field('authConfig.ldap.cert').required() : field(),
        connectionTimeout:               field('authConfig.ldap.serverConnectionTimeout').required(),
        serviceAccountUsername:          isActiveDirectoryRef.value ? field('authConfig.ldap.serviceAccountDN').required() : field(),
        serviceAccountDistinguishedName: !isActiveDirectoryRef.value ? field('authConfig.ldap.serviceAccountDN').required() : field(),
        serviceAccountPassword:          field('authConfig.ldap.serviceAccountPassword').required(),
        userSearchBase:                  field('authConfig.ldap.userSearchBase.label').required(),
        username:                        field(`authConfig.${ AUTH_TYPE }.username`).required(),
        password:                        field(`authConfig.${ AUTH_TYPE }.password`).required(),
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

    return {
      isFormValid, validateAllFields, tlsEnabledRef, isActiveDirectoryRef
    };
  },

  data() {
    return {
      username: null,
      password: null
    };
  },

  created() {
    this.tlsEnabledRef = !!(this.model?.tls || this.model?.starttls);
    this.isActiveDirectoryRef = this.NAME === 'activedirectory';
    this.registerBeforeHook(this.validateAllFields, 'willSave');
  },

  computed: {
    validationPassed() {
      if (this.model?.enabled && !this.editConfig) {
        return true;
      }

      return this.isFormValid;
    },

    tArgs() {
      return {
        provider: this.displayName,
        username: this.principal.loginName || this.principal.name,
      };
    },

    AUTH_TYPE() {
      return AUTH_TYPE;
    },

    toSave() {
      let out = {
        enabled:    true,
        ldapConfig: this.model,
        username:   this.username,
        password:   this.password
      };

      if (this.NAME === 'activedirectory') {
        out = {
          enabled:               true,
          activeDirectoryConfig: this.model,
          username:              this.username,
          password:              this.password
        };
      }

      return out;
    },
  },

  watch: {
    'model.tls'(neu) {
      this.tlsEnabledRef = !!(neu || this.model?.starttls);
    },
    'model.starttls'(neu) {
      this.tlsEnabledRef = !!(this.model?.tls || neu);
    },
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
            <tr><td>{{ t(`authConfig.ldap.table.server`) }}: </td><td>{{ serverUrl }}</td></tr>
            <tr><td>{{ t(`authConfig.ldap.table.clientId`) }}: </td><td>{{ model.serviceAccountDistinguishedName || model.serviceAccountUsername }}</td></tr>
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

        <h3>{{ t(`authConfig.ldap.${NAME}`) }}</h3>
        <config
          v-model:value="model"
          :type="NAME"
          :mode="mode"
        />

        <h4>{{ t('authConfig.testAndEnable') }}</h4>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="username"
              name="username"
              :label="t(`authConfig.${AUTH_TYPE}.username`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <Password
              v-model:value="password"
              name="password"
              :label="t(`authConfig.${AUTH_TYPE}.password`)"
              :mode="mode"
              required
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
</style>
