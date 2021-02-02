<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import AsyncButton from '@/components/AsyncButton';
import config from '@/edit/auth/ldap/config';
import AuthConfig from '@/mixins/auth-config';

const AUTH_TYPE = 'ldap';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    Banner,
    AllowedPrincipals,
    AsyncButton,
    config
  },

  mixins: [CreateEditView, AuthConfig],

  data() {
    return {
      model:         null,
      serverSetting: null,
      errors:        null,
      username:      null,
      password:      null
    };
  },

  computed: {
    tArgs() {
      return {
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
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
    }
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="model"
      :subtypes="[]"
      :validation-passed="true"
      :finish-button-mode="model.enabled ? 'edit' : 'enable'"
      :can-yaml="false"
      :errors="errors"
      @error="e=>errors = e"
      @finish="save"
      @cancel="done"
    >
      <template v-if="model.enabled && !isEnabling">
        <Banner color="success clearfix">
          <div class="pull-left mt-10">
            {{ t('authConfig.stateBanner.enabled', tArgs) }}
          </div>
          <div class="pull-right">
            <AsyncButton mode="disable" size="sm" action-color="bg-error" @click="disable" />
          </div>
        </Banner>
        <div>Server: {{ serverUrl }}</div>
        <div>Client ID: {{ model.serviceAccountDistinguishedName || model.serviceAccountUsername }}</div>

        <hr />

        <AllowedPrincipals :provider="NAME" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
        <h3>{{ t(`authConfig.ldap.${NAME}`) }}</h3>
        <config v-model="model" :type="NAME" :mode="mode" />

        <h4>{{ t('authConfig.testAndEnable') }}</h4>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="username"
              :label="t(`authConfig.${AUTH_TYPE}.username`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="password"
              type="password"
              :label="t(`authConfig.${AUTH_TYPE}.password`)"
              :mode="mode"
              required
            />
          </div>
        </div>
      </template>
    </CruResource>

    <div v-if="!model.enabled" class="row">
      <div class="col span-12">
        <Banner color="info" v-html="t('authConfig.associatedWarning', tArgs, true)" />
      </div>
    </div>
  </div>
</template>
