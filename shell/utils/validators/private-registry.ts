import { Translation } from '@shell/types/t';
import formRulesGenerator from '@shell/utils/validators/formRules';

interface PrivateRegistryRuleContext {
  t: Translation;
  privateRegistryEnabled: boolean;
  normanCluster: { importedConfig?: { privateRegistryURL?: string | null } } | null;
  isImportedCluster?: boolean;
}

export function privateRegistryRequired(ctx: PrivateRegistryRuleContext) {
  return () => {
    // Check existence using `in` rather than direct access to avoid Vue's render-time warning
    const isImported = 'isImportedCluster' in ctx ? !!ctx.isImportedCluster : true;

    if (!isImported || !ctx.privateRegistryEnabled) {
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
