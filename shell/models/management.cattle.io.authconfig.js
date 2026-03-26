import { insertAt } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import { requireAsset } from '@shell/utils/require-asset';

/**
 * MISSING:
 *             "_type": "oidcConfig",
 */
export const configType = {
  activeDirectoryProvider: 'ldap',
  azureADProvider:         'oauth',
  openLdapProvider:        'ldap',
  freeIpaProvider:         'ldap',
  pingProvider:            'saml',
  adfsProvider:            'saml',
  keyCloakProvider:        'saml',
  oktaProvider:            'saml',
  shibbolethProvider:      'saml',
  googleOauthProvider:     'oauth',
  localProvider:           '',
  githubProvider:          'oauth',
  githubAppProvider:       'oauth',
  keyCloakOIDCProvider:    'oidc',
  genericOIDCProvider:     'oidc',
  cognitoProvider:         'oidc',
};

const imageOverrides = {
  azureADProvider: 'entraid',
  keyCloakOIDCProvider: 'keycloak',
  genericOIDCProvider: 'openid',
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
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.id }"`, null, this.id);
  }

  get configType() {
    return configType[this.type];
  }

  get sideLabel() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.description."${ this.configType }"`, null, this.configType);
  }

  get icon() {
    try {
      return requireAsset(`~shell/assets/images/vendor/${ imageOverrides[this.id] || this.id }.svg`);
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
