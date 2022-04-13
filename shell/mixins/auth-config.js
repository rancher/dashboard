import { _EDIT } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { BASE_SCOPES } from '@shell/store/auth';
import { addObject, findBy } from '@shell/utils/array';
import { set } from '@shell/utils/object';
import { exceptionToErrorsArray } from '@shell/utils/error';
import difference from 'lodash/difference';

export default {
  beforeCreate() {
    const { query } = this.$route;

    if (query.mode !== _EDIT) {
      this.$router.applyQuery({ mode: _EDIT });
    }
  },

  async fetch() {
    await this.mixinFetch();
  },

  data() {
    return {
      isEnabling:     false,
      editConfig:     false,
      model:          null,
      serverSetting:  null,
      errors:         null,
      originalModel:  null,
      principals:     [],
      authConfigName: this.$route.params.id,
    };
  },

  computed: {
    doneLocationOverride() {
      return {
        name:   this.$route.name,
        params: this.$route.params
      };
    },

    serverUrl() {
      if (process.client) {
        // Client-side rendered: use the current window location
        return window.location.origin;
      }

      // Server-side rendered
      return this.serverSetting || '';
    },

    baseUrl() {
      return `${ this.model.tls ? 'https://' : 'http://' }${ this.model.hostname }`;
    },

    principal() {
      return findBy(this.principals, 'me', true) || {};
    },

    displayName() {
      return this.t(`model.authConfig.provider.${ this.NAME }`);
    },

    NAME() {
      return this.$route.params.id;
    },

    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    },

    showCancel() {
      return this.editConfig || !this.model.enabled;
    }
  },

  methods: {
    async mixinFetch() {
      this.authConfigName = this.$route.params.id;

      this.originalModel = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.authConfigName,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.authConfigName }`, force: true }
      });

      const serverUrl = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   'server-url',
        opt:  { url: `/v1/${ MANAGEMENT.SETTING }/server-url` }
      });

      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals', force: true }
      });

      if ( serverUrl ) {
        this.serverSetting = serverUrl.value;
      }
      this.model = await this.$store.dispatch(`rancher/clone`, { resource: this.originalModel });
      if (this.model.openLdapConfig) {
        this.showLdap = true;
      }
      if (this.value.configType === 'saml') {
        if (!this.model.rancherApiHost || !this.model.rancherApiHost.length) {
          this.$set(this.model, 'rancherApiHost', this.serverUrl);
        }
      }

      if (!this.model.enabled) {
        this.applyDefaults();
      }
    },

    async save(btnCb) {
      await this.applyHooks(BEFORE_SAVE_HOOKS);

      const configType = this.value.configType;

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
          if (configType === 'oauth' || configType === 'oidc') {
            const code = await this.$store.dispatch('auth/test', { provider: this.model.id, body: this.model });

            obj.code = code;
          }

          if (configType === 'saml') {
            if (!this.model.accessMode) {
              this.model.accessMode = 'unrestricted';
            }
            if (this.model.openLdapConfig && !this.showLdap) {
              delete this.model.openLdapConfig;
            }
            await this.model.save();
            await this.$store.dispatch('auth/test', { provider: this.model.id, body: this.model });
            this.model.enabled = true;
          } else {
            this.model.enabled = true;
            if (!this.model.accessMode) {
              this.model.accessMode = 'unrestricted';
            }
            await this.model.doAction('testAndApply', obj, { redirectUnauthorized: false });
          }

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
        if (wasEnabled && configType === 'oauth') {
          await this.model.save({ ignoreFields: ['oauthCredential', 'serviceAccountCredential'] });
        } else {
          await this.model.save();
        }
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

    async disable(btnCb) {
      try {
        if (this.model.hasAction('disable')) {
          await this.model.doAction('disable');
        } else {
          const clone = await this.$store.dispatch(`rancher/clone`, { resource: this.model });

          clone.enabled = false;
          await clone.save();
        }
        await this.reloadModel();
        // Covers case where user disables... then enables in same visit to page
        this.applyDefaults();

        this.principals = await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.PRINCIPAL,
          opt:  { url: '/v3/principals', force: true }
        });
        this.showLdap = false;
        btnCb(true);
      } catch (err) {
        this.errors = [err];
        btnCb(false);
      }
    },

    async reloadModel() {
      this.originalModel = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.NAME,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.NAME }`, force: true }
      });

      this.model = await this.$store.dispatch(`rancher/clone`, { resource: this.originalModel });

      return this.model;
    },

    goToEdit() {
      this.editConfig = true;
    },

    cancel() {
      // go back to provider selection screen
      if (!this.model.enabled) {
        this.$router.go(-1);
      } else {
        // must be cancelling edit of an enabled config; reset any changes and return to add users/groups view for that config
        this.$store.dispatch(`rancher/clone`, { resource: this.originalModel }).then((cloned) => {
          this.model = cloned;
          this.editConfig = false;
        });
      }
    },

    applyDefaults() {
      switch (this.value.configType) {
      case 'oidc': {
        const serverUrl = this.serverUrl.endsWith('/') ? this.serverUrl.slice(0, this.serverUrl.length - 1) : this.serverUrl;

        // AuthConfig
        set(this.model, 'accessMode', 'unrestricted'); // This should remain as unrestricted, enabling will fail otherwise

        // KeyCloakOIDCConfig --> OIDCConfig
        set(this.model, 'rancherUrl', `${ serverUrl }/verify-auth`);
        set(this.model, 'scope', BASE_SCOPES.keycloakoidc[0]);
        break;
      }

      case 'saml':
        set(this.model, 'accessMode', 'unrestricted');
        break;
      case 'ldap':
        set(this.model, 'servers', []);
        set(this.model, 'accessMode', 'unrestricted');
        set(this.model, 'starttls', false);
        if (this.model.id === 'activedirectory') {
          set(this.model, 'disabledStatusBitmask', 2);
        } else {
          set(this.model, 'disabledStatusBitmask', 0);
        }
        break;
      default:
        break;
      }
    }
  },
};
