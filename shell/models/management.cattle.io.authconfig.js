import SteveModel from '@shell/plugins/steve/steve-class';
import { requireAsset } from '@shell/utils/require-asset';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { EDIT_CONFIG } from '@shell/config/query-params';
import { promptDisableAuthProvider } from '@shell/utils/auth';

/**
 * Normalises a provider identifier to a stable key.
 *
 * The same provider is named differently depending on where it is read from - an
 * authconfig is `github`, the public provider list calls it `githubProvider` and
 * the schema calls it `githubConfig`.
 */
export const providerKey = (type) => `${ type || '' }`.toLowerCase().replace(/(config|provider)$/, '');

/**
 * Auth provider categories, keyed by `providerKey()` so that either naming works.
 */
export const configType = {
  activedirectory: 'ldap',
  openldap:        'ldap',
  freeipa:         'ldap',
  azuread:         'oauth',
  googleoauth:     'oauth',
  github:          'oauth',
  githubapp:       'oauth',
  adfs:            'saml',
  keycloak:        'saml',
  okta:            'saml',
  ping:            'saml',
  shibboleth:      'saml',
  genericsaml:     'saml',
  cognito:         'oidc',
  genericoidc:     'oidc',
  keycloakoidc:    'oidc',
  oidc:            'oidc',
  local:           '',
};

/**
 * Look up a category from any provider identifier, e.g. `keyCloakOIDCProvider`.
 */
export const configTypeForProvider = (type) => configType[providerKey(type)];

const imageOverrides = {
  azuread:      'entraid',
  genericoidc:  'openid',
  genericsaml:  'custom',
  keycloakoidc: 'keycloak',
  oidc:         'openid',
};

/**
 * Resolve a provider's vendor logo from any provider identifier.
 *
 * @returns the asset URL, or an empty string when the vendor has no logo.
 */
export const providerIcon = (type) => {
  try {
    const key = providerKey(type);

    return requireAsset(`~shell/assets/images/vendor/${ imageOverrides[key] || key }.svg`);
  } catch (e) {
    return '';
  }
};

const destructive = ['promptDisable', 'promptRemove'];

export default class AuthConfig extends SteveModel {
  get disableResourceDetailDrawer() {
    return true;
  }

  goToEdit(moreQuery = {}) {
    super.goToEdit({ [EDIT_CONFIG]: 'true', ...moreQuery });
  }

  /**
   * The base class parts each action from the next, which leaves a menu that is
   * mostly rules. These read as two groups instead: what you can do with the
   * config, and what takes it away.
 */
  get _availableActions() {
    const inherited = super._availableActions.filter((a) => !a.divider);
    const disable = {
      action:  'promptDisable',
      label:   this.t('authConfig.disable.action'),
      icon:    'icon icon-close',
      enabled: this.enabled === true,
    };

    const out = inherited.filter((a) => !destructive.includes(a.action));
    const away = [disable, ...inherited.filter((a) => destructive.includes(a.action))];

    return [...out, { divider: true }, ...away];
  }

  promptDisable() {
    return promptDisableAuthProvider({
      dispatch:  (action, payload) => this.$dispatch(action, payload, { root: true }),
      getters:   this.$rootGetters,
      id:        this.id,
      name:      this.nameDisplay,
      disableCb: () => this.disable(),
    });
  }

  async disable() {
    try {
      const norman = await this.$dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.id,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.id }`, force: true },
      }, { root: true });

      if (!await this.runDisableAction(norman)) {
        const clone = await this.$dispatch('rancher/clone', { resource: norman }, { root: true });

        clone.enabled = false;
        await clone.save();
      }

      await this.$dispatch('find', {
        type: MANAGEMENT.AUTH_CONFIG, id: this.id, opt: { force: true }
      });
    } catch (e) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('generic.notification.title.error'),
        err:   e.data || e,
      }, { root: true });
    }
  }

  async runDisableAction(norman) {
    if (!norman.hasAction('disable')) {
      return false;
    }

    try {
      await norman.doAction('disable');

      return true;
    } catch (e) {
      if ((e?.code || e?.data?.code) === 'ActionNotAvailable') {
        return false;
      }

      throw e;
    }
  }

  get detailLocation() {
    return {
      name:   'c-cluster-auth-config-id',
      params: {
        cluster: this.$rootGetters['clusterId'],
        id:      this.id,
      },
    };
  }

  /**
   * Auth configs are edited through their own route rather than the generic
   * resource detail page, so the inherited action menu (`goToEdit`, `goToViewConfig`)
   * and any detail links need pointing at it.
   */
  get detailLocation() {
    return {
      name:   'c-cluster-auth-config-id',
      params: {
        cluster: this.$rootGetters['clusterId'],
        id:      this.id,
      },
    };
  }

  /**
   * Whether the form to edit this config exists.
   *
   * Forms are registered per provider, so the base class' lookup by id finds
   * nothing for a config named anything other than its provider - which would
   * take `Edit Config` off the menu for every instance but the first.
   */
  get canCustomEdit() {
    return this.$rootGetters['type-map/hasCustomEdit'](this.type, providerKey(this._type));
  }

  /**
   * Several configs of a provider all carry the provider's label, so an instance
   * that is not the provider's own singleton is named as well - otherwise eight
   * GitHub configs are eight identical page titles.
   *
   * The id rather than the description, which is a sentence about the config
   * ("For contractors and partner organisations in the SUSE tenant.") and shown
   * in its own right on the provider list. Naming the instance matters most on
   * the disable confirmation, where the description would not say which of the
   * eight is about to be deleted.
   */
  get nameDisplay() {
    const label = this.$rootGetters['i18n/withFallback'](`model.authConfig.name."${ this.id }"`, null, this.provider);

    if (this.id === providerKey(this._type)) {
      return label;
    }

    return `${ label } — ${ this.id }`;
  }

  get provider() {
    // Keyed off `_type` rather than `id` so that several configs of the same
    // provider (each with its own arbitrary name) all resolve to one label.
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ providerKey(this._type) }"`, null, this.id);
  }

  get configType() {
    return configTypeForProvider(this._type);
  }

  get sideLabel() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.description."${ this.configType }"`, null, this.configType);
  }

  get icon() {
    return providerIcon(this._type);
  }

  get state() {
    if ( this.enabled ) {
      return 'active';
    }

    return 'inactive';
  }
}
