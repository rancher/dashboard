<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import AuthConfig from '@shell/mixins/auth-config';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals';
import AuthBanner from '@shell/components/auth/AuthBanner';
import UnitInput from '@shell/components/form/UnitInput';
import { NORMAN } from '@shell/config/types';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { exceptionToErrorsArray } from '@shell/utils/error';
import difference from 'lodash/difference';
import { addObject } from '@shell/utils/array';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
    Banner,
    AllowedPrincipals,
    Checkbox,
    AuthBanner,
    UnitInput
  },

  mixins: [CreateEditView, AuthConfig],
  data() {
    return { showLdap: false };
  },

  computed: {
    tArgs() {
      return {
        baseUrl:  this.serverSetting,
        provider: this.displayName,
        username: this.principal.loginName || this.principal.name,
      };
    },

    toSave() {
      return { enabled: true, casConfig: this.model };
    },
  },

  methods: {
    async save(btnCb) {
      await this.applyHooks(BEFORE_SAVE_HOOKS);

      this.errors = [];
      const wasEnabled = this.model.enabled;

      if (!wasEnabled) {
        this.isEnabling = true;
      }
      let obj = this.toSave;

      if (!obj) {
        obj = this.model;
      }
      try {
        if (this.editConfig || !wasEnabled) {
          const ticket = await this.$store.dispatch('auth/test', { provider: this.model.id, body: this.model });

          obj.ticket = ticket;

          this.model.enabled = true;
          if (!this.model.accessMode) {
            this.model.accessMode = 'unrestricted';
          }
          await this.model.doAction('testAndApply', obj, { redirectUnauthorized: false });

          // Reload auth config to get any changes made during testAndApply
          const newModel = await this.$store.dispatch('rancher/find', {
            type: NORMAN.AUTH_CONFIG,
            id:   this.authConfigName,
            opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.authConfigName }`, force: true }
          });

          // We want to find and add keys that are in the original model that are missing from the new model.
          // This is specifically intended for adding secretKeys which aren't returned when fetching. One example
          // is the applicationSecret key that is present for azureAD auth.
          const oldKeys = Object.keys(this.model);
          const newKeys = Object.keys(newModel);
          const missingNewKeys = difference(oldKeys, newKeys);

          missingNewKeys.forEach((key) => {
            newModel[key] = this.model[key];
          });

          this.model = await this.$store.dispatch(`rancher/clone`, { resource: newModel });

          // Reload principals to get the new ones from the provider (including 'me')
          this.principals = await this.$store.dispatch('rancher/findAll', {
            type: NORMAN.PRINCIPAL,
            opt:  { url: '/v3/principals', force: true }
          });

          this.model.allowedPrincipalIds = this.model.allowedPrincipalIds || [];

          if ( this.principal) {
            if (!this.model.allowedPrincipalIds.includes(this.principal.id) ) {
              addObject(this.model.allowedPrincipalIds, this.principal.id);
            }
            // Session has switched to new 'me', ensure we react
            this.$store.commit('auth/loggedInAs', this.principal.id);
          } else {
            console.warn(`Unable to find principal marked as 'me'`); // eslint-disable-line no-console
          }
        }
        await this.model.save();
        await this.reloadModel();
        this.isEnabling = false;
        this.editConfig = false;
        await this.applyHooks(AFTER_SAVE_HOOKS);

        btnCb(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
        this.model.enabled = wasEnabled;
        this.isEnabling = false;
      }
    },
  }
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
          <template slot="rows">
            <tr><td>{{ t(`authConfig.cas.hostUrl.label`) }}: </td><td>{{ model.hostname }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.enableTLS`) }}(https://): </td><td>{{ model.tls }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.port.label`) }}: </td><td>{{ model.port }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.connectionTimeout.label`) }}: </td><td>{{ model.connectionTimeout }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.callbackURL.label'`) }}: </td><td>{{ model.service }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.loginEndpoint.label`) }}: </td><td>{{ model.loginEndpoint }}</td></tr>
            <tr><td>{{ t(`authConfig.cas.logoutEndpoint.label`) }}: </td><td>{{ model.logoutEndpoint }}</td></tr>
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
        <Banner
          v-if="!model.enabled"
          :label="t('authConfig.stateBanner.disabled', tArgs)"
          color="warning"
        />

        <h3>{{ t(`authConfig.cas.${NAME}`) }}</h3>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.hostname"
              :label="t('authConfig.cas.hostUrl.label')"
              :placeholder="t('authConfig.cas.hostUrl.placeholder')"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              :value="model.port"
              type="number"
              required
              :min="0"
              :step="1"
              :mode="mode"
              :label="t('authConfig.cas.port.label')"
              @input="e=>$set(model, 'port', e.replace(/[^0-9]*/g, ''))"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <Checkbox
              v-model="model.tls"
              :mode="mode"
              class="full-height"
              :label="`${t('authConfig.cas.enableTLS')}(https://)`"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <UnitInput
              v-model="model.connectionTimeout"
              required
              :mode="mode"
              :label="t('authConfig.cas.connectionTimeout.label')"
              suffix="milliseconds"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.service"
              :label="t('authConfig.cas.callbackURL.label')"
              :placeholder="t('authConfig.cas.callbackURL.placeholder')"
              :mode="mode"
              disabled
              required
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="model.loginEndpoint"
              :label="t(`authConfig.cas.loginEndpoint.label`)"
              :placeholder="t('authConfig.cas.loginEndpoint.placeholder')"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="model.logoutEndpoint"
              :label="t(`authConfig.cas.logoutEndpoint.label`)"
              :placeholder="t('authConfig.cas.logoutEndpoint.placeholder')"
              :mode="mode"
              required
            />
          </div>
        </div>
      </template>
    </CruResource>
    <div
      v-if="!model.enabled"
      class="row"
    >
      <div class="col span-12">
        <Banner
          v-clean-html="t('authConfig.associatedWarning', tArgs, true)"
          color="info"
        />
      </div>
    </div>
  </div>
</template>
