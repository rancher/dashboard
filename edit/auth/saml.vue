<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Banner from '@/components/Banner';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
import FileSelector from '@/components/form/FileSelector';
import config from '@/edit/auth/ldap/config';
import { NORMAN, MANAGEMENT } from '@/config/types';
import { addObject, findBy } from '@/utils/array';

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
    config
  },

  mixins: [CreateEditView],

  async fetch() {
    const NAME = this.$route.params.id;
    const originalModel = await this.$store.dispatch('rancher/find', {
      type: NORMAN.AUTH_CONFIG,
      id:   NAME,
      opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ NAME }`, force: true }
    });

    const serverUrl = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url',
      opt:  { url: `/v1/{ MANAGEMENT.SETTING }/server-url` }
    });

    if ( serverUrl ) {
      this.serverSetting = serverUrl.value;
    }

    this.model = await this.$store.dispatch(`rancher/clone`, { resource: originalModel });
    if (NAME === 'shibboleth' && !this.model.openLdapConfig) {
      this.model.openLdapConfig = {};
      this.showLdap = false;
    }
  },

  data() {
    return {
      model:         null,
      errors:        null,
      serverSetting: null,
      showLdap:      true
    };
  },

  computed: {
    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    baseUrl() {
      return `${ this.model.tls ? 'https://' : 'http://' }${ this.model.hostname }`;
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    displayName() {
      return this.t(`model.authConfig.provider.${ this.NAME }`);
    },

    tArgs() {
      return {
        baseUrl:   this.serverSetting,
        provider:  this.displayName,
        username:  this.principal.loginName || this.principal.name,
      };
    },

    NAME() {
      return this.$route.params.id;
    },

    AUTH_TYPE() {
      return AUTH_TYPE;
    },

    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    },
  },

  methods: {
    async save(btnCb) {
      this.errors = [];

      const wasEnabled = this.model.enabled;

      try {
        if ( !wasEnabled ) {
          await this.model.doAction('testAndApply', {
            enabled: true,
            ...this.model,

          }, { url: this.model.links.self });

          // Reload principals to get the new ones from GitHub
          this.principals = await this.$store.dispatch('rancher/findAll', {
            type: NORMAN.PRINCIPAL,
            opt:  { url: '/v3/principals', force: true }
          });

          this.model.allowedPrincipalIds = this.model.allowedPrincipalIds || [];

          if ( this.me && !this.model.allowedPrincipalIds.includes(this.me.id) ) {
            addObject(this.model.allowedPrincipalIds, this.me.id);
          }
        }

        btnCb(true);

        if ( wasEnabled ) {
          this.done();
        }
        this.$router.applyQuery( { mode: 'view' } );
      } catch (err) {
        this.errors = [err];
        btnCb(false);
      }
    },
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
      <template v-if="model.enabled">
        <Banner :label="t('authConfig.stateBanner.enabled', tArgs)" color="success" />

        <div>Server: {{ baseUrl }}</div>
        <div>Display Name: {{ model.displayNameField }}</div>

        <hr />

        <AllowedPrincipals provider="github" :auth-config="model" :mode="mode" />
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
