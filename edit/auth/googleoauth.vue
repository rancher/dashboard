<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import AuthConfig from '@/mixins/auth-config';

import CruResource from '@/components/CruResource';
import InfoBox from '@/components/InfoBox';
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import FileSelector from '@/components/form/FileSelector';

const NAME = 'googleoauth';

export default {
  components: {
    Loading,
    CruResource,
    InfoBox,
    LabeledInput,
    Banner,
    Checkbox,
    AllowedPrincipals,
    AsyncButton,
    FileSelector
  },

  mixins: [CreateEditView, AuthConfig],

  data() {
    return {
      model:         null,
      serverSetting: null,
      errors:        null,
    };
  },

  computed: {
    tArgs() {
      let hostname = '';

      if (process.client) {
        hostname = window.location.hostname;
      }

      return {
        hostname,
        serverUrl: this.serverUrl,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
      };
    },

    NAME() {
      return NAME;
    },

    toSave() {
      return {
        enabled:           true,
        googleOauthConfig: this.model,
        description:       'Enable Google OAuth',
      };
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

        <div>{{ t(`authConfig.${NAME}.adminEmail`) }}: {{ model.adminEmail }}</div>
        <div>{{ t(`authConfig.${NAME}.domain`) }}: {{ model.hostname }}</div>

        <hr />

        <AllowedPrincipals provider="googleoauth" :auth-config="model" :mode="mode" />
      </template>

      <template v-else>
        <Banner :label="t('authConfig.stateBanner.disabled', tArgs)" color="warning" />
        <div :style="{'align-items':'center'}" class="row mb-20">
          <div class="col span-5">
            <LabeledInput
              v-model="model.adminEmail"
              :label="t(`authConfig.${NAME}.adminEmail`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-5">
            <LabeledInput
              v-model="model.hostname"
              :label="t(`authConfig.${NAME}.domain`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-2">
            <Checkbox v-model="model.nestedGroupMembershipEnabled" :mode="mode" :label="t('authConfig.ldap.nestedGroupMembership.label')" />
          </div>
        </div>
        <InfoBox class=" mt-20 mb-20 p-10">
          <h3 v-html="t('authConfig.googleoauth.steps.1.title', tArgs, true)" />
          <div v-html="t('authConfig.googleoauth.steps.1.body', tArgs, true)" />
        </InfoBox>
        <InfoBox class="mb-20 p-10">
          <div class="row">
            <h3 v-html="t('authConfig.googleoauth.steps.2.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6" v-html="t('authConfig.googleoauth.steps.2.body', tArgs, true)" />
            <div class="col span-6">
              <LabeledInput
                v-model="model.oauthCredential"
                :label="t(`authConfig.googleoauth.oauthCredentials.label`)"
                :mode="mode"
                required
                type="multiline"
                :tooltip="t(`authConfig.googleoauth.oauthCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'oauthCredential', $event)" />
            </div>
          </div>
        </InfoBox>
        <InfoBox class="mb-20 p-10">
          <div class="row">
            <h3 v-html="t('authConfig.googleoauth.steps.3.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6" v-html="t('authConfig.googleoauth.steps.3.body', tArgs, true)" />
            <div class="col span-6">
              <LabeledInput
                v-model="model.serviceAccountCredential"
                :label="t(`authConfig.googleoauth.serviceAccountCredentials.label`)"
                :mode="mode"
                required
                type="multiline"
                :tooltip="t(`authConfig.googleoauth.serviceAccountCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :mode="mode" @selected="$set(model, 'serviceAccountCredential', $event)" />
            </div>
          </div>
        </InfoBox>

        <div v-if="!model.enabled" class="row">
          <div class="col span-12">
            <Banner color="info" v-html="t('authConfig.associatedWarning', tArgs, true)" />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
