import { insertAt } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';

export const configType = {
  activedirectory: 'ldap',
  azuread:         'oauth',
  openldap:        'ldap',
  freeipa:         'ldap',
  ping:            'saml',
  adfs:            'saml',
  keycloak:        'saml',
  okta:            'saml',
  shibboleth:      'saml',
  googleoauth:     'oauth',
  local:           '',
  github:          'oauth',
  keycloakoidc:    'oidc'
};

const imageOverrides = { keycloakoidc: 'keycloak' };

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
    return configType[this.id];
  }

  get sideLabel() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.description."${ this.configType }"`, null, this.configType);
  }

  get icon() {
    try {
      return require(`~shell/assets/images/vendor/${ imageOverrides[this.id] || this.id }.svg`);
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
