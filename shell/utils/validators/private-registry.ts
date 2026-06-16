import { VuexStore } from 'types/store/vuex';
import { Translation } from '@shell/types/t';
import formRulesGenerator from '@shell/utils/validators/formRules';
import { SETTING } from 'config/settings';
import { MANAGEMENT } from '@shell/config/types';

interface PrivateRegistryRuleContext {
  t: Translation;
  privateRegistryEnabled: boolean;
  normanCluster: { importedConfig?: { privateRegistryURL?: string | null } } | null;
  isImportedCluster?: boolean;
  $store: VuexStore
}

// TODO nb update this? private registry is not required if a global default system registry is defined
export function privateRegistryRequired(ctx: PrivateRegistryRuleContext) {
  return () => {
    // Check existence using `in` rather than direct access to avoid Vue's render-time warning
    const isImported = 'isImportedCluster' in ctx ? !!ctx.isImportedCluster : true;
    let hasGlobalDefault = false;

    try {
      // settings are loaded when the dashboard loads so using a synchronous getter is reliable here
      const globalRegistrySetting = ctx.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SYSTEM_DEFAULT_REGISTRY);

      hasGlobalDefault = !!globalRegistrySetting?.value;
    } catch {
      // no global default to be found
    }

    if (!isImported || !ctx.privateRegistryEnabled || hasGlobalDefault) {
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
