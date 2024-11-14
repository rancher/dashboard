<script>
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

  data() {
    return {
      username: null,
      password: null
    };
  },

  computed: {
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
          <template #rows>
            <tr><td>{{ t(`authConfig.ldap.table.server`) }}: </td><td>{{ serverUrl }}</td></tr>
            <tr><td>{{ t(`authConfig.ldap.table.clientId`) }}: </td><td>{{ model.serviceAccountDistinguishedName || model.serviceAccountUsername }}</td></tr>
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
              :label="t(`authConfig.${AUTH_TYPE}.username`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <Password
              v-model:value="password"
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
