<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import AuthConfig from '@/mixins/auth-config';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Banner from '@/components/Banner';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import AsyncButton from '@/components/AsyncButton';
import FileSelector from '@/components/form/FileSelector';
import config from '@/edit/auth/ldap/config';

const AUTH_TYPE = 'ldap';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    Banner,
    AllowedPrincipals,
    Checkbox,
    FileSelector,
    AsyncButton,
    config
  },

  mixins: [CreateEditView, AuthConfig],
  data() {
    return {
      model:         null,
      errors:        null,
      serverSetting: null,
      showLdap:      false
    };
  },

  computed: {
    baseUrl() {
      return `${ this.model.tls ? 'https://' : 'http://' }${ this.model.hostname }`;
    },

    tArgs() {
      return {
        baseUrl:   this.serverSetting,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
      };
    },

    AUTH_TYPE() {
      return AUTH_TYPE;
    },

    toSave() {
      return { enabled: true, ...this.model };
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

        <div>{{ t(`authConfig.saml.displayName`) }}: {{ model.displayNameField }}</div>
        <div>{{ t(`authConfig.saml.userName`) }}:{{ model.userNameField }}</div>
        <div>{{ t(`authConfig.saml.UID`) }}: {{ model.uidField }}</div>
        <div>{{ t(`authConfig.saml.entityID`) }}: {{ model.entityID }}</div>
        <div>{{ t(`authConfig.saml.api`) }}: {{ model.rancherApiHost }}</div>
        <div>{{ t(`authConfig.saml.groups`) }}: {{ model.groupsField }}</div>

        <hr />

        <AllowedPrincipals :provider="NAME" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
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
          <div class="col span-6">
            <LabeledInput
              v-model="model.entityID"
              :label="t(`authConfig.saml.entityID`)"
              :mode="mode"
              required
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
              :label="t(`authConfig.saml.key`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'spKey', $event)" />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="model.spCert"
              :label="t(`authConfig.saml.cert`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'spCert', $event)" />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="model.idpMetadataContent"
              :label="t(`authConfig.saml.metadata`)"
              :mode="mode"
              required
              type="multiline"
            />
            <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'idpMetadataContent', $event)" />
          </div>
        </div>
        <div v-if="NAME === 'shibboleth'">
          <div class="row">
            <Checkbox v-model="showLdap" :mode="mode" :label="t('authConfig.saml.showLdap')" />
          </div>
          <div class="row mt-20 mb-20">
            <config v-if="showLdap" v-model="model.openLdapConfig" :type="NAME" :mode="mode" />
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
