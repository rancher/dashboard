<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import AuthConfig from '@shell/mixins/auth-config';

import CruResource from '@shell/components/CruResource';
import InfoBox from '@shell/components/InfoBox';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import FileSelector from '@shell/components/form/FileSelector';
import AuthBanner from '@shell/components/auth/AuthBanner';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';
import AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';

const NAME = 'googleoauth';

export default {
  components: {
    Loading,
    CruResource,
    InfoBox,
    LabeledInput,
    Checkbox,
    AllowedPrincipals,
    FileSelector,
    AuthBanner,
    CopyToClipboardText,
    AuthProviderWarningBanners
  },

  mixins: [CreateEditView, AuthConfig],

  computed: {
    tArgs() {
      const hostname = window.location.hostname;

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
            <tr><td>{{ t(`authConfig.${NAME}.adminEmail`) }}: </td><td>{{ model.adminEmail }}</td></tr>
            <tr><td>{{ t(`authConfig.${NAME}.domain`) }}: </td><td>{{ model.hostname }}</td></tr>

            <tr><td>{{ t('authConfig.ldap.nestedGroupMembership.label') }}: </td><td>{{ model.nestedGroupMembershipEnabled ? t('generic.enabled') : t('generic.disabled') }}</td></tr>
          </template>
        </AuthBanner>

        <hr>

        <AllowedPrincipals
          provider="googleoauth"
          :auth-config="model"
          :mode="mode"
        />
      </template>

      <template v-else>
        <AuthProviderWarningBanners
          v-if="!model.enabled"
          :t-args="tArgs"
        />
        <div
          :style="{'align-items':'center'}"
          class="row mb-20"
        >
          <div class="col span-5">
            <LabeledInput
              v-model:value="model.adminEmail"
              :label="t(`authConfig.${NAME}.adminEmail`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-5">
            <LabeledInput
              v-model:value="model.hostname"
              :label="t(`authConfig.${NAME}.domain`)"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-2">
            <Checkbox
              v-model:value="model.nestedGroupMembershipEnabled"
              :mode="mode"
              :label="t('authConfig.ldap.nestedGroupMembership.label')"
            />
          </div>
        </div>
        <InfoBox
          :step="1"
          class=" mt-20 mb-20"
        >
          <h3 v-clean-html="t('authConfig.googleoauth.steps.1.title', tArgs, true)" />
          <ul class="mt-0 step-list">
            <li>{{ t('authConfig.googleoauth.steps.1.body.1', {}, true) }} </li>
            <li>
              <b>{{ t('authConfig.googleoauth.steps.1.body.2', {}, true) }}</b> {{ t('authConfig.googleoauth.steps.1.topPrivateDomain', {}, true) }} <CopyToClipboardText
                :plain="true"
                :text="tArgs.hostname"
              />
            </li>
            <li>
              <b>{{ t('authConfig.googleoauth.steps.1.body.3', {}, true) }}</b> <CopyToClipboardText
                :plain="true"
                :text="serverUrl"
              />
            </li>
            <li>{{ t('authConfig.googleoauth.steps.1.body.4', {}, true) }} </li>
            <li>{{ t('authConfig.googleoauth.steps.1.body.5', {}, true) }} </li>
          </ul>
        </InfoBox>
        <InfoBox
          :step="2"
          class="mb-20"
        >
          <div class="row">
            <h3 v-clean-html="t('authConfig.googleoauth.steps.2.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6">
              <ul class="mt-0 step-list">
                <li>{{ t('authConfig.googleoauth.steps.2.body.1', {}, true) }} </li>
                <li>
                  <b>{{ t('authConfig.googleoauth.steps.2.body.2', {}, true) }}</b> <CopyToClipboardText
                    :plain="true"
                    :text="serverUrl"
                  />
                </li>
                <li>
                  <b>{{ t('authConfig.googleoauth.steps.2.body.3', {}, true) }}</b> <CopyToClipboardText
                    :plain="true"
                    :text="serverUrl+'/verify-auth'"
                  />
                </li>
                <li>{{ t('authConfig.googleoauth.steps.2.body.4', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.2.body.5', {}, true) }} </li>
              </ul>
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.oauthCredential"
                :label="t(`authConfig.googleoauth.oauthCredentials.label`)"
                :mode="mode"
                required
                type="multiline-password"
                :tooltip="t(`authConfig.googleoauth.oauthCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector
                class="role-tertiary add mt-5"
                :label="t('generic.readFromFile')"
                :mode="mode"
                @selected="model.oauthCredential = $event"
              />
            </div>
          </div>
        </InfoBox>
        <InfoBox
          :step="3"
          class="mb-20"
        >
          <div class="row">
            <h3 v-clean-html="t('authConfig.googleoauth.steps.3.title', tArgs, true)" />
          </div>
          <div class="row">
            <div class="col span-6">
              <div v-clean-html="t('authConfig.googleoauth.steps.3.introduction', tArgs, true)" />
              <ul class="mt-10 step-list">
                <li>{{ t('authConfig.googleoauth.steps.3.body.1', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.3.body.2', {}, true) }} </li>
                <li>{{ t('authConfig.googleoauth.steps.3.body.3', {}, true) }} </li>
              </ul>
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="model.serviceAccountCredential"
                :label="t(`authConfig.googleoauth.serviceAccountCredentials.label`)"
                :mode="mode"
                required
                type="multiline-password"
                :tooltip="t(`authConfig.googleoauth.serviceAccountCredentials.tip`)"
                :hover-tooltip="true"
              />
              <FileSelector
                class="role-tertiary add mt-5"
                :label="t('generic.readFromFile')"
                :mode="mode"
                @selected="model.serviceAccountCredential = $event"
              />
            </div>
          </div>
        </InfoBox>
      </template>
    </CruResource>
  </div>
</template>
<style lang="scss" scoped>
  .step-list li:not(:last-child) {
    margin-bottom: 8px;
  }

  .banner {
    display: block;

    &:deep() code {
      padding: 0 3px;
      margin: 0 3px;
    }
  }
</style>
