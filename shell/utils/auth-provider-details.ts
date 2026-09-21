import { configTypeForProvider, providerKey } from '@shell/models/management.cattle.io.authconfig';
import type { Translation } from '@shell/types/t';

export interface AuthProviderDetail {
  label: string;
  value: string;
}

interface DetailContext {
  t: Translation;
  name: string;
}

type AuthConfig = Record<string, any>;

type Row = { label: string, value: unknown };

type Builder = (config: AuthConfig, context: DetailContext) => Row[];

const httpUrl = (config: AuthConfig): string => (config.hostname ? `${ config.tls ? 'https' : 'http' }://${ config.hostname }` : '');

const ldapServer = (config: AuthConfig): string => {
  const hosts = (config.servers || []).join(', ');

  return hosts && config.port ? `${ hosts }:${ config.port }` : hosts;
};

const toggle = (t: Translation, on: unknown): string => t(on ? 'generic.enabled' : 'generic.disabled');

const logoutBehaviour = (config: AuthConfig, { t, name }: DetailContext): string => {
  if (!config.logoutAllSupported) {
    return '';
  }

  if (!config.logoutAllEnabled) {
    return t('authConfig.slo.sloOptions.onlyRancher', { name });
  }

  return config.logoutAllForced ? t('authConfig.slo.sloOptions.logoutAll', { name }) : t('authConfig.slo.sloOptions.choose');
};

const endSessionEndpoint = (config: AuthConfig): string => (config.logoutAllEnabled ? config.endSessionEndpoint : '');

const byProvider: Record<string, Builder> = {
  github: (config, { t }) => {
    const prefix = `authConfig.${ providerKey(config.id) === 'githubapp' ? 'githubapp' : 'github' }`;

    return [
      { label: t(`${ prefix }.table.server`), value: httpUrl(config) },
      { label: t(`${ prefix }.table.clientId`), value: config.clientId },
    ];
  },

  googleoauth: (config, { t }) => [
    { label: t('authConfig.googleoauth.adminEmail'), value: config.adminEmail },
    { label: t('authConfig.googleoauth.domain'), value: config.hostname },
    { label: t('authConfig.ldap.nestedGroupMembership.label'), value: toggle(t, config.nestedGroupMembershipEnabled) },
  ],

  azuread: (config, context) => {
    const { t } = context;

    return [
      { label: t('authConfig.azuread.tenantId.label'), value: config.tenantId },
      { label: t('authConfig.azuread.applicationId.label'), value: config.applicationId },
      { label: t('authConfig.azuread.endpoint.label'), value: config.endpoint },
      { label: t('authConfig.azuread.graphEndpoint.label'), value: config.graphEndpoint },
      { label: t('authConfig.azuread.tokenEndpoint.label'), value: config.tokenEndpoint },
      { label: t('authConfig.azuread.authEndpoint.label'), value: config.authEndpoint },
      { label: t('authConfig.slo.sloTitle'), value: logoutBehaviour(config, context) },
      { label: t('authConfig.azuread.endSessionEndpoint.title'), value: endSessionEndpoint(config) },
    ];
  },
};

byProvider.githubapp = byProvider.github;

const byCategory: Record<string, Builder> = {
  ldap: (config, { t }) => [
    { label: t('authConfig.ldap.table.server'), value: ldapServer(config) },
    { label: t('authConfig.ldap.serviceAccountDN'), value: config.serviceAccountDistinguishedName || config.serviceAccountUsername },
  ],

  saml: (config, context) => {
    const { t } = context;
    const rows = [
      { label: t('authConfig.saml.entityID'), value: config.entityID },
      { label: t('authConfig.saml.api'), value: config.rancherApiHost },
      { label: t('authConfig.saml.displayName'), value: config.displayNameField },
      { label: t('authConfig.saml.userName'), value: config.userNameField },
      { label: t('authConfig.saml.UID'), value: config.uidField },
      { label: t('authConfig.saml.groups'), value: config.groupsField },
    ];

    if (providerKey(config.id) === 'genericsaml') {
      rows.push(
        { label: t('authConfig.saml.nameIDFormat'), value: config.nameIDFormat ? t(`authConfig.saml.nameIDFormatOptions.${ config.nameIDFormat }`) : '' },
        { label: t('authConfig.saml.signatureMethod'), value: config.signatureMethod },
        { label: t('authConfig.saml.allowIdpInitiated'), value: toggle(t, config.allowIdpInitiated) },
        { label: t('authConfig.saml.forceAuthn'), value: toggle(t, config.forceAuthn) },
      );
    }

    rows.push({ label: t('authConfig.slo.sloTitle'), value: logoutBehaviour(config, context) });

    return rows;
  },

  oidc: (config, context) => {
    const { t } = context;

    return [
      { label: t('authConfig.oidc.rancherUrl'), value: config.rancherUrl },
      { label: t('authConfig.oidc.clientId'), value: config.clientId },
      { label: t('authConfig.oidc.issuer'), value: config.issuer },
      { label: t('authConfig.oidc.authEndpoint'), value: config.authEndpoint },
      { label: t('authConfig.oidc.pkceMethod.label'), value: config.pkceMethod },
      { label: t('authConfig.slo.sloTitle'), value: logoutBehaviour(config, context) },
      { label: t('authConfig.oidc.endSessionEndpoint.title'), value: endSessionEndpoint(config) },
    ];
  },
};

/**
 * Key/value pairs that describe a provider's configuration
 *
 * @param config the provider's Norman config
 * @param t translation function
 * @param name the provider's display name
 */
export const authProviderDetails = (config: AuthConfig | null | undefined, t: Translation, name = ''): AuthProviderDetail[] => {
  if (!config?.id) {
    return [];
  }

  const category = configTypeForProvider(config.id);
  const build = byProvider[providerKey(config.id)] || byCategory[category];

  const type = category ? [{ label: t('authConfig.access.type'), value: t(`model.authConfig.description.${ category }`) }] : [];
  const rows = build ? build(config, { t, name }) : [];

  return [...type, ...rows]
    .filter((row) => !!row.value)
    .map(({ label, value }) => ({ label, value: `${ value }` }));
};
