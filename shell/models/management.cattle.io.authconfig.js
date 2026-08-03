import { insertAt } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import { requireAsset } from '@shell/utils/require-asset';

/**
 * Normalises a provider identifier to a stable key.
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
  keycloakoidc: 'keycloak',
  oidc:         'openid',
};

export default class AuthConfig extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:  'disable',
      label:   'Disable',
      icon:    'icon icon-spinner',
      enabled: this.enabled === true,
    });

    insertAt(out, 1, { divider: true });

    return out;
  }

  get nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.name."${ this.id }"`, null, this.provider);
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
    try {
      const key = providerKey(this._type);

      return requireAsset(`~shell/assets/images/vendor/${ imageOverrides[key] || key }.svg`);
    } catch (e) {
      return '';
    }
  }

  get state() {
    if ( this.enabled ) {
      return 'active';
    }

    return 'inactive';
  }
}
