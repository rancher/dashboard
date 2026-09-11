import SteveModel from '@shell/plugins/steve/steve-class';
import { requireAsset } from '@shell/utils/require-asset';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

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
    this.$dispatch('promptModal', {
      component:      'DisableAuthProviderDialog',
      customClass:    'remove-modal',
      modalWidth:     '640',
      height:         'auto',
      styles:         'max-height: 100vh;',
      componentProps: {
        name:      this.nameDisplay,
        disableCb: () => this.disable(),
      },
    });
  }

  async disable() {
    try {
      const norman = await this.$dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.id,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.id }`, force: true },
      }, { root: true });

      if (norman.hasAction('disable')) {
        await norman.doAction('disable');
      } else {
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

  get detailLocation() {
    return {
      name:   'c-cluster-auth-config-id',
      params: {
        cluster: this.$rootGetters['clusterId'],
        id:      this.id,
      },
    };
  }

  get nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.name."${ this.id }"`, null, this.provider);
  }

  get provider() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.id }"`, null, this.id);
  }

  get configType() {
    return configTypeForProvider(this.id);
  }

  get sideLabel() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.description."${ this.configType }"`, null, this.configType);
  }

  get icon() {
    return providerIcon(this.id);
  }

  get state() {
    if ( this.enabled ) {
      return 'active';
    }

    return 'inactive';
  }
}
