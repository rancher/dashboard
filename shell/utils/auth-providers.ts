import { configTypeForProvider, providerIcon, providerKey } from '@shell/models/management.cattle.io.authconfig';
import { LOCAL_AUTH_ID } from '@shell/utils/auth';
import { sortBy } from '@shell/utils/sort';

export const LOCAL_PROVIDER = 'localProvider';
export const REMEMBERED_PROVIDER_KEY = 'rancher-login-provider';

export interface AuthProviderDriver {
  id: string;
  type: string;
  /** Free text the admin gave the config, when the server has one for it. */
  description?: string;
}

export interface AuthProviderOption {
  id: string;
  type: string;
  key: string;
  category?: string;
  name: string;
  description: string;
  meta: string;
  icon: string;
  isLocal: boolean;
}

interface I18n {
  t: (key: string, args?: object) => string;
  withFallback: (key: string, args: object | null, fallback: string) => string;
}

const displayNameFor = (id: string, key: string, vendorLabel: string): string => {
  return id.toLowerCase() === key ? vendorLabel : id;
};

/**
 * The providers to offer on the login page, in the order they are offered.
 *
 * Built from `/v1-public/authproviders`, which is all an unauthenticated visitor
 * can see: an id, a provider type, and whatever the admin wrote about the config.
 */
export const toProviderOptions = (drivers: AuthProviderDriver[], i18n: I18n): AuthProviderOption[] => {
  const { t, withFallback } = i18n;

  const external = sortBy(
    drivers.filter((driver) => driver.type !== LOCAL_PROVIDER),
    ['type', 'id']
  ).map((driver: AuthProviderDriver): AuthProviderOption => {
    const key = providerKey(driver.type);
    const category = configTypeForProvider(driver.type);
    const vendorLabel = withFallback(`model.authConfig.provider."${ key }"`, null, key);
    const protocolLabel = category ? withFallback(`model.authConfig.description."${ category }"`, null, category.toUpperCase()) : '';

    return {
      id:          driver.id,
      type:        driver.type,
      key,
      category,
      name:        displayNameFor(driver.id, key, vendorLabel),
      description: driver.description || '',
      meta:        protocolLabel ? t('login.providers.meta', { vendor: vendorLabel, protocol: protocolLabel }) : vendorLabel,
      icon:        providerIcon(driver.type),
      isLocal:     false,
    };
  });

  const hasLocal = drivers.some((driver) => driver.type === LOCAL_PROVIDER);

  if (!hasLocal) {
    return external;
  }

  return [
    ...external,
    {
      id:          LOCAL_AUTH_ID,
      type:        LOCAL_PROVIDER,
      key:         LOCAL_AUTH_ID,
      category:    '',
      name:        t('login.providers.local.name'),
      description: t('login.providers.local.description'),
      meta:        t('login.providers.local.meta'),
      icon:        '',
      isLocal:     true,
    },
  ];
};

export const getRememberedProviderId = (): string | null => {
  try {
    return window.localStorage.getItem(REMEMBERED_PROVIDER_KEY);
  } catch (e) {
    return null;
  }
};

export const setRememberedProviderId = (id: string): void => {
  try {
    window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, id);
  } catch (e) {}
};

export const clearRememberedProviderId = (): void => {
  try {
    window.localStorage.removeItem(REMEMBERED_PROVIDER_KEY);
  } catch (e) {}
};

/**
 * The provider the page should open on: the one the visitor asked to be
 * remembered, or the first on offer when there is no usable saved choice.
 */
export const resolveInitialProvider = (
  options: AuthProviderOption[],
  rememberedId: string | null
): AuthProviderOption | undefined => {
  const remembered = rememberedId ? options.find((option) => option.id === rememberedId) : undefined;

  return remembered || options[0];
};
