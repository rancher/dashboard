import { VuexStore } from 'types/store/vuex';
import { Translation } from '@shell/types/t';
import formRulesGenerator from '@shell/utils/validators/formRules';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';

interface PrivateRegistryRuleContext {
  t: Translation;
  privateRegistryEnabled: boolean;
  normanCluster: { importedConfig?: { privateRegistryURL?: string | null } } | null;
  $store: VuexStore
}

export function privateRegistryRequired(ctx: PrivateRegistryRuleContext) {
  return () => {
    let hasGlobalDefault = false;

    try {
      // settings are loaded when the dashboard loads so using a synchronous getter is reliable here
      const globalRegistrySetting = ctx.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SYSTEM_DEFAULT_REGISTRY);

      hasGlobalDefault = !!globalRegistrySetting?.value;
    } catch {
      // if no setting proceed like there's no global default
    }

    if (!ctx.privateRegistryEnabled || hasGlobalDefault) {
      return undefined;
    }
    const url = ctx.normanCluster?.importedConfig?.privateRegistryURL;

    if (!url) {
      return ctx.t('validation.required', { key: ctx.t('cluster.privateRegistry.label') });
    }
    const { registryUrl } = formRulesGenerator(ctx.t, { key: ctx.t('cluster.privateRegistry.label') });

    return (registryUrl as (val: string) => string | undefined)(url);
  };
}
