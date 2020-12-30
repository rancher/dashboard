<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import AllowedPrincipals from '@/components/auth/AllowedPrincipals';
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

    this.model = await this.$store.dispatch(`rancher/clone`, { resource: originalModel });
    if (!this.model.servers) {
      this.model.servers = [];
    }

    if (!this.model.accessMode) {
      this.model.accessMode = 'unrestricted';
    }
    const serverUrl = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url',
      opt:  { url: `/v1/{ MANAGEMENT.SETTING }/server-url` }
    });

    if ( serverUrl ) {
      this.serverSetting = serverUrl.value;
      if (!this.model.rancherApiHost) {
        this.model.rancherApiHost = serverUrl.value;
      }
    }
  },

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
    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    serverUrl() {
      if ( this.serverSetting ) {
        return this.serverSetting;
      } else if ( process.client ) {
        return window.location.origin;
      }

      return '';
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    displayName() {
      return this.t(`model.authConfig.provider.${ this.NAME }`);
    },

    tArgs() {
      return {
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
          this.model.enabled = true;
          let obj = {
            enabled:    true,
            ldapConfig: this.model,
            username:   this.username,
            password:   this.password
          };

          if (this.NAME === 'activedirectory') {
            obj = {
              enabled:               true,
              activeDirectoryConfig: this.model,
              username:              this.username,
              password:              this.password
            };
          }

          await this.model.doAction('testAndApply', obj);

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
        this.model.enabled = wasEnabled;
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
