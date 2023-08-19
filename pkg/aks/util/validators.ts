/**
 * These validation rules are used by the form validation mixin but work a little differently from the validators defined in @shell/utils/validators/formRules
 * Due to current limitations of the fv mixin
 */

import { get } from '@shell/utils/object';

// ips

// resource group name

// node pool name

// no need to try to validate any fields if the user is still selecting a credential
const needsValidation = (ctx: any) => {
  return !!ctx.config.azureCredentialSecret && !!ctx.config.resourceLocation;
};

const requiredTranslation = (ctx:any, labelKey = 'Value') => {
  return ctx.t('validation.required', { key: ctx.t(labelKey) });
};

export const requiredInCluster = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const out = needsValidation(ctx) && clusterPath && !get(ctx.normanCluster, clusterPath) ? requiredTranslation(ctx, labelKey) : undefined;

    return out;
  };
};
