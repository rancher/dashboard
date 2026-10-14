import { EDIT_CONFIG, _EDIT } from '@shell/config/query-params';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { isRancherPrime } from '@shell/config/version';
import { providerKey } from '@shell/models/management.cattle.io.authconfig';
import { canEnableAuthProvider, isValidAuthConfigName } from '@shell/utils/auth-providers';
import { MULTIPLE_AUTH_PROVIDERS } from '@shell/store/features';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { BASE_SCOPES, SLO_AUTH_PROVIDERS } from '@shell/store/auth';
import { addObject, findBy } from '@shell/utils/array';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { clone } from '@shell/utils/object';
import difference from 'lodash/difference';

/**
 * Fields a form never owns, so they survive from the config the server created
 * rather than from the blank model the form was filled in against.
 */
const SERVER_OWNED_FIELDS = ['id', 'name', 'type', 'baseType', 'links', 'actions', 'created', 'createdTS', 'creatorId', 'uuid', 'annotations', 'labels', 'status'];

export const SLO_OPTION_VALUES = {
  /**
   * Log out of only rancher, leaving auth provider logged in
   */
  rancher: 'rancher',
  /**
   * Log out of rancher AND auth provider
   */
  all:     'all',
  /**
   * Offer user chose of `rancher` or `all`
   */
  both:    'both',
};

export default {
  /**
   * Set by the page that adds a provider (see `auth/config/create/_provider.vue`).
   * Its presence means no config exists on the server yet, and that this form is
   * responsible for creating one when it first saves.
   */
  inject: { authConfigCreate: { default: null } },

  beforeCreate() {
    const { query } = this.$route;

    if (query.mode !== _EDIT) {
      this.$router.applyQuery({ mode: _EDIT });
    }
  },

  created() {
    this.registerAfterHook(this.updateAuthProviders, 'force-update-auth-providers');

    if (this.openedOnConfig) {
      this.editConfig = true;
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
      errors:         [],
      originalModel:  null,
      principals:     [],
      authConfigName: this.$route.params.id,
      sloType:        '',
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
      // Client-side rendered: use the current window location
      return window.location.origin;
    },

    baseUrl() {
      return `${ this.model.tls ? 'https://' : 'http://' }${ this.model.hostname }`;
    },

    principal() {
      return findBy(this.principals, 'me', true) || {};
    },

    displayName() {
      // i18n-uses model.authConfig.provider.*
      return this.t(`model.authConfig.provider.${ this.NAME }`);
    },

    /**
     * How this config is named in the UI, e.g. `GitHub — github-2`. Mirrors the
     * Steve model's `nameDisplay`, which these pages cannot reach - they work
     * from a Norman clone. A provider's own singleton is just the provider.
     */
    authConfigDisplayName() {
      const name = this.configName;

      return !name || name === this.NAME ? this.displayName : `${ this.displayName } — ${ name }`;
    },

    /**
     * The provider a config is an instance of, e.g. `github` for a config named
     * `github-2`. Forms are per provider, so their labels, defaults and branching
     * all key off this rather than off the config's own name.
     *
     * Forms read this before their model exists - in `created()`, to decide which
     * fields to require - so the provider being added answers for it until then.
     * The route only names the config on the page that edits one.
     */
    NAME() {
      return providerKey(this.model?.type) || providerKey(this.authConfigCreate?.normanType) || this.$route.params.id;
    },

    isCreate() {
      return !!this.authConfigCreate;
    },

    /**
     * The config's name. It is `metadata.name`, which the API rejects on update,
     * so it can only be set while the config is still being added.
     */
    configName: {
      get() {
        // While adding, the name is still being chosen, and the page holds it -
        // `authConfigName` is only settled once the config exists.
        return this.configNameFixed ? this.authConfigName : this.authConfigCreate.name;
      },
      set(value) {
        if (!this.configNameFixed) {
          this.authConfigCreate.name = value;
        }
      },
    },

    /**
     * Whether the name is settled.
     *
     * Enabling can fail after the config has been written - on bad credentials,
     * say - and the form stays on the page to be corrected and saved again. The
     * config exists by then, so its name is no longer the form's to choose: a
     * rename would leave the page saving one config under another's name.
     */
    configNameFixed() {
      return !this.isCreate || this.authConfigCreate.created;
    },

    /** Why the name cannot be used, or null. Only a new config has a say in it. */
    configNameError() {
      if (this.configNameFixed) {
        return null;
      }

      const name = this.authConfigCreate.name;

      if (!name) {
        return this.t('authConfig.create.name.required');
      }

      if (!isValidAuthConfigName(name)) {
        return this.t('authConfig.create.name.invalid');
      }

      if ((this.authConfigCreate.takenIds || []).includes(name)) {
        return this.t('authConfig.create.name.taken', { name });
      }

      return null;
    },

    /**
     * What the admin called this connection. The API has no field for one, so it
     * lives in the annotation the rest of the UI reads descriptions from.
     */
    configDescription: {
      get() {
        return this.model?.annotations?.[DESCRIPTION] || '';
      },
      set(value) {
        if (!this.model) {
          return;
        }

        const annotations = { ...(this.model.annotations || {}) };

        if (value) {
          annotations[DESCRIPTION] = value;
        } else if (DESCRIPTION in annotations) {
          // Norman keeps a `field.cattle.io/` annotation an update leaves out, so
          // clearing one means sending it empty.
          annotations[DESCRIPTION] = '';
        }

        this.model.annotations = annotations;
      },
    },

    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    },

    showCancel() {
      return this.editConfig || !this.model.enabled;
    },

    openedOnConfig() {
      return this.$route.query?.[EDIT_CONFIG] === 'true';
    }
  },

  methods: {
    async canEnable() {
      const configs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.AUTH_CONFIG });

      return canEnableAuthProvider(configs, this.$store.getters['features/get'](MULTIPLE_AUTH_PROVIDERS), this.authConfigName || this.model.id);
    },

    updateAuthProviders() {
      // we need to forcefully re-fetch the authProviders list so that we can update the logout method
      // this is to satisfy the SLO usecase where after setting an auth provider the logout method
      // wasn't being updated because the resource is not watchable
      this.$store.dispatch('auth/getAuthProviders', { force: true });
    },

    setSloType(selectedModel) {
      if (!selectedModel.logoutAllEnabled && !selectedModel.logoutAllForced) {
        this.sloType = SLO_OPTION_VALUES.rancher;
      } else if (selectedModel.logoutAllEnabled && selectedModel.logoutAllForced) {
        this.sloType = SLO_OPTION_VALUES.all;
      } else if (selectedModel.logoutAllEnabled && !selectedModel.logoutAllForced) {
        this.sloType = SLO_OPTION_VALUES.both;
      }
    },

    /**
     * The values Rancher gives a config of this type when nobody has set them.
     *
     * Rancher used to create a config for every provider up front, with these
     * filled in. A config added here starts empty, and some of them are required -
     * an LDAP config cannot be enabled without its connection timeout.
     */
    schemaDefaults(type) {
      const fields = this.$store.getters['rancher/schemaFor']?.(type)?.resourceFields || {};

      return Object.entries(fields).reduce((defaults, [key, field]) => {
        if (field?.default !== undefined && field.default !== null) {
          defaults[key] = clone(field.default);
        }

        return defaults;
      }, {});
    },

    async mixinFetch() {
      this.authConfigName = this.authConfigCreate?.name || this.$route.params.id;

      // Nothing exists to fetch until the form saves for the first time, so the
      // form is filled in against an empty config of the chosen provider's type.
      this.originalModel = this.isCreate ? await this.$store.dispatch('rancher/create', { ...this.schemaDefaults(this.authConfigCreate.normanType), type: this.authConfigCreate.normanType }) : await this.$store.dispatch('rancher/find', {
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

      // Logic for Single Logout/SLO for auth providers
      if (this.value?.configType && SLO_AUTH_PROVIDERS.includes(this.value?.configType)) {
        if (!this.model.rancherApiHost || !this.model.rancherApiHost.length) {
          this.model['rancherApiHost'] = this.serverUrl;
        }

        // setting data for SLO
        if (this.model && Object.keys(this.model).includes('logoutAllSupported')) {
          this.setSloType(this.model);
        }
      }

      if (!this.model.enabled) {
        this.applyDefaults();
      }
    },

    /**
     * On save several operations are executed to return a URL or open pop-up:
     * - Retrieve data from the UI
     * - "Test" the configuration through action and override the model
     * - Retrieve scopes from redirect URL
     * - Set default scopes and merge them with the ones from the redirect URL and from the "test" action
     * @param {*} btnCb
     */
    async save(btnCb) {
      await this.applyHooks(BEFORE_SAVE_HOOKS);

      const configType = this.value.configType;

      this.errors = [];
      const wasEnabled = this.model.enabled;
      const description = this.configDescription;

      let canEnable;

      try {
        canEnable = wasEnabled || await this.canEnable();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);

        return;
      }

      if (!canEnable) {
        this.errors = [this.t(isRancherPrime() ? 'authConfig.enableLimitReachedPrime' : 'authConfig.enableLimitReached')];
        btnCb(false);

        return;
      }

      if (!wasEnabled) {
        this.isEnabling = true;
      }
      try {
        if (this.isCreate) {
          await this.createAuthConfig();
        }
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
        this.isEnabling = false;

        return;
      }

      // Which of a provider's configs is being applied is read from the root of
      // the request, rather than from the provider's own config nested in it.
      const obj = {
        ...(this.toSave || this.model),
        configName: this.configName,
      };

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
              this.model.openLdapConfig = null;
            }
            await this.model.save();
            await this.$store.dispatch('auth/test', { provider: this.model.id, body: this.model });
            this.model.enabled = true;
          } else {
            this.model.enabled = true;
            if (!this.model.accessMode) {
              this.model.accessMode = 'unrestricted';
            }
            if (this.NAME === 'github' || this.NAME === 'githubapp') {
              this.model.accessMode = 'restricted';
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

          // testAndApply keeps the stored annotations, so the description entered
          // in the form is only written by the save that follows.
          this.configDescription = description;

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
            this.$store.dispatch('auth/loggedInAs', this.principal.id);
          } else {
            console.warn(`Unable to find principal marked as 'me'`); // eslint-disable-line no-console
          }

          if (!wasEnabled) {
            this.model.accessMode = 'required';
          }
        }
        if (wasEnabled && configType === 'oauth') {
          await this.model.save({ ignoreFields: ['oauthCredential', 'serviceAccountCredential'] } );
        } else {
          await this.model.save();
        }
        await this.reloadModel();
        this.isEnabling = false;
        this.editConfig = false;
        await this.applyHooks(AFTER_SAVE_HOOKS);

        btnCb(true);

        if (this.isCreate || this.openedOnConfig) {
          // Replaced rather than pushed, so going back does not return to the
          // page that creates providers - a reload of which would start over -
          // or to the edit form of a config that has just been saved.
          this.$router.replace({
            name:   'c-cluster-auth-config',
            params: { cluster: this.$route.params.cluster },
          });
        }
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
        this.model.enabled = wasEnabled;
        this.isEnabling = false;
      }
    },

    async disable() {
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
      } catch (err) {
        this.errors = [err];
      }
    },

    /**
     * Writes the config this form was filled in against.
     *
     * `metadata.name` is rejected on update, so a provider cannot be created and
     * then renamed - the name has to be settled first. Neither Steve nor Norman
     * offers a POST on the collection, so the config is created through the
     * Kubernetes API and then picked back up from Norman, whose actions the rest
     * of the save path needs.
     */
    async createAuthConfig() {
      const { name, normanType } = this.authConfigCreate;

      // Enabling can fail after the config has been written - on bad credentials,
      // say - and the config is still there on the next attempt.
      if (!this.authConfigCreate.created) {
        const description = this.configDescription;
        const metadata = { name };

        if (description) {
          metadata.annotations = { [DESCRIPTION]: description };
        }

        // Auth configs are only ever stored on the management cluster.
        await this.$store.dispatch('management/request', {
          url:    '/k8s/clusters/local/apis/management.cattle.io/v3/authconfigs',
          method: 'POST',
          data:   {
            apiVersion: 'management.cattle.io/v3',
            kind:       'AuthConfig',
            metadata,
            type:       normanType,
            enabled:    false,
          },
        });

        // The name is the config's from here, even if picking it back up fails:
        // writing it again would only be told it already exists.
        this.authConfigCreate.created = true;
      }

      if (this.model.id === name) {
        return;
      }

      const entered = { ...this.model };

      this.originalModel = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   name,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ name }`, force: true }
      });

      const model = await this.$store.dispatch('rancher/clone', { resource: this.originalModel });

      Object.keys(entered).forEach((key) => {
        if (!SERVER_OWNED_FIELDS.includes(key)) {
          model[key] = entered[key];
        }
      });

      this.authConfigName = name;
      this.model = model;
    },

    /**
     * Picks the config back up from the server.
     *
     * There is nothing to pick up while a provider is still being added - the
     * config has no name yet, let alone a record to read - so the form keeps
     * what the admin has filled in.
     */
    async reloadModel() {
      if (!this.configNameFixed) {
        return this.model;
      }

      this.originalModel = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.authConfigName,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.authConfigName }`, force: true }
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
      } else if (this.openedOnConfig) {
        this.$router.push({
          name:   'c-cluster-auth-config',
          params: { cluster: this.$route.params.cluster },
        });
      } else {
        // must be cancelling edit of an enabled config; reset any changes and return to add users/groups view for that config
        this.$store.dispatch(`rancher/clone`, { resource: this.originalModel }).then((cloned) => {
          this.model = cloned;

          // reset SLO type (radio option)
          if (cloned && Object.keys(cloned).includes('logoutAllSupported')) {
            this.setSloType(cloned);
          }

          this.editConfig = false;
        });
      }
    },

    applyDefaults() {
      switch (this.value.configType) {
      case 'oidc': {
        const serverUrl = this.serverUrl.endsWith('/') ? this.serverUrl.slice(0, this.serverUrl.length - 1) : this.serverUrl;

        // AuthConfig
        this.model.accessMode = 'unrestricted'; // This should remain as unrestricted, enabling will fail otherwise

        // KeyCloakOIDCConfig --> OIDCConfig
        this.model.rancherUrl = `${ serverUrl }/verify-auth`;

        // If there are base scopes defined for this provider, use those
        if (Array.isArray(BASE_SCOPES[this.NAME])) {
          this.model.scope = BASE_SCOPES[this.NAME][0];
        } else {
          // Default if base scopes not defined for this auth provider
          this.model.scope = BASE_SCOPES.genericoidc[0];
        }
        break;
      }

      case 'saml':
        this.model.accessMode = 'unrestricted';
        if (this.NAME === 'genericsaml') {
          this.model.nameIDFormat = this.model.nameIDFormat || 'unspecified';
          this.model.signatureMethod = this.model.signatureMethod || 'RSA-SHA256';
        }
        break;
      case 'ldap':
        this.model.servers = [];
        this.model.accessMode = 'unrestricted';
        this.model.starttls = false;
        if (this.NAME === 'activedirectory') {
          this.model.disabledStatusBitmask = 2;
        } else {
          this.model.disabledStatusBitmask = 0;
        }
        break;
      default:
        break;
      }
    }
  },
};
