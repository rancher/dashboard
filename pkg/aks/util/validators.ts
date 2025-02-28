/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * These validation rules are used by the form validation mixin but work a little differently from the validators defined in @shell/utils/validators/formRules
 * Due to current limitations of the fv mixin
 */

import { get, set } from '@shell/utils/object';
import { LoadBalancerSku, OutboundType, AKSNodePool } from '../types';

// no need to try to validate any fields if the user is still selecting a credential and the rest of the form isn't visible
export const needsValidation = (ctx: any): Boolean => {
  return !!ctx.config.azureCredentialSecret && !!ctx.config.resourceLocation;
};

export const requiredTranslation = (ctx: any, labelKey = 'Value'): String => {
  return ctx.t('validation.required', { key: ctx.t(labelKey) });
};

export const requiredInCluster = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :String | undefined => {
    return needsValidation(ctx) && clusterPath && !get(ctx, clusterPath) ? requiredTranslation(ctx, labelKey) : undefined;
  };
};

// cluster name
// Alphanumerics, underscores, and hyphens. Start and end with alphanumeric.
// https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftcontainerservice
export const clusterNameChars = (ctx: any ) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = name.match(/^[a-zA-Z0-9\-_]*$/);

    return !needsValidation(ctx) || nameIsValid ? undefined : ctx.t('aks.errors.clusterName.chars');
  };
};

export const clusterNameStartEnd = (ctx: any) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = (!!name.match(/^([A-Z]|[a-z]|[0-9])+.*([A-Z]|[a-z]|[0-9])+$/) || !name.length);

    return !needsValidation(ctx) || nameIsValid ? undefined : ctx.t('aks.errors.clusterName.startEnd');
  };
};

export const clusterNameLength = (ctx: any) => {
  return () : string | undefined => {
    const { clusterName = '' } = get(ctx, 'config');
    const isValid = clusterName.length <= 63;

    return isValid ? undefined : ctx.t('aks.errors.clusterName.length');
  };
};

export const resourceGroupLength = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx, clusterPath) || '';

    const isValid = resourceGroup.length <= 80;

    return isValid ? undefined : ctx.t('aks.errors.resourceGroup.length', { key: ctx.t(labelKey) });
  };
};

// letters, numbers, -, _, (, ), ., and unicode UppercaseLetter, LowercaseLetter, TitlecaseLetter, ModifierLetter, OtherLetter
// https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftresources
export const resourceGroupChars = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx, clusterPath) || '';
    const isValid = resourceGroup.match(/^[A-Za-z0-9\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{Lm}\p{Nd}\.\-_(\)]*$/);

    return isValid || !resourceGroup.length ? undefined : ctx.t('aks.errors.resourceGroup.chars', { key: ctx.t(labelKey) });
  };
};

export const resourceGroupEnd = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx, clusterPath) || '';

    const isValid = !resourceGroup.match(/^.*\.+$/u);

    return isValid ? undefined : ctx.t('aks.errors.resourceGroup.periodEnd', { key: ctx.t(labelKey) });
  };
};

// ipv4 regex from https://stackoverflow.com/questions/5284147/validating-ipv4-addresses-with-regexp

// ipv4 with or without cidr
export const ipv4WithOrWithoutCidr = (ctx: any) => {
  // this is used for an array of inputs; each input is passed in here to validate
  return (ip = '') :string | undefined => {
    const isValid = ip.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/);

    return isValid || !ip.length ? undefined : ctx.t('aks.errors.authorizedIpRanges');
  };
};

export const ipv4WithoutCidr = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const toValidate = get(ctx, clusterPath) || '';

    const isValid = toValidate.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/);

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.ipv4', { key: ctx.t(labelKey) });
  };
};

export const ipv4WithCidr = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const toValidate = get(ctx, clusterPath) || '';

    const isValid = toValidate.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(\/([0-9]|[1-2][0-9]|3[0-2]))$/);

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.ipv4Cidr', { key: ctx.t(labelKey) });
  };
};

export const outboundTypeUserDefined = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const outboundType = get(ctx, clusterPath) as OutboundType;
    const loadBalancerSku = get(ctx, 'aksConfig.loadBalancerSku') as LoadBalancerSku;

    if (loadBalancerSku !== 'Standard' && outboundType === 'UserDefinedRouting') {
      return ctx.t('aks.errors.outboundType');
    }

    return undefined;
  };
};

// https://learn.microsoft.com/en-us/azure/aks/private-clusters?tabs=azure-portal#configure-a-private-dns-zone
export const privateDnsZone = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const toValidate = (get(ctx, clusterPath) || '').toLowerCase();
    const subscriptionRegex = /^\/subscriptions\/.+\/resourcegroups\/.+\/providers\/microsoft\.network\/privatednszones\/([a-zA-Z0-9-]{1,32}\.){0,32}private(link){0,1}\.[a-zA-Z0-9]+\.azmk8s\.io$/;
    const isValid = toValidate.match(subscriptionRegex) || toValidate === 'system';

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.privateDnsZone', {}, true);
  };
};

export const nodePoolNames = (ctx: any) => {
  return (poolName:string) :string | undefined => {
    let allAvailable = true;

    const isValid = (name:string) => name.match(/^[a-z]+[a-z0-9]*$/) && name.length <= 12;

    if (poolName || poolName === '') {
      return isValid(poolName) ? undefined : ctx.t('aks.errors.poolName');
    } else {
      ctx.nodePools.forEach((pool: AKSNodePool) => {
        const name = pool.name || '';

        if (!isValid(name)) {
          set(pool._validation, '_validName', false);

          allAvailable = false;
        } else {
          set(pool._validation, '_validName', true);
        }
      });
      if (!allAvailable) {
        return ctx.t('aks.errors.poolName');
      }
    }
  };
};

export const nodePoolNamesUnique = (ctx: any) => {
  return () :string | undefined => {
    const poolNames = (ctx.nodePools || []).map((pool: AKSNodePool) => pool.name);

    const hasDuplicates = poolNames.some((name: string, idx: number) => poolNames.indexOf(name) !== idx);

    if (hasDuplicates) {
      return ctx.t('aks.errors.poolNamesUnique');
    }
  };
};

export const nodePoolCount = (ctx:any) => {
  return (count?: number, canBeZero = false) => {
    let min = 1;
    const max = 1000;
    let errMsg = ctx.t('aks.errors.poolCount');

    if (canBeZero) {
      min = 0;
      errMsg = ctx.t('aks.errors.poolUserCount');
    }
    if (count || count === 0) {
      return count >= min && count <= max ? undefined : errMsg;
    } else {
      let allValid = true;

      ctx.nodePools.forEach((pool: AKSNodePool) => {
        const { count = 0, mode } = pool;

        if (mode === 'User') {
          min = 0;
        } else {
          min = 1;
        }

        if (count < min || count > max) {
          pool._validation['_validCount'] = false;
          allValid = false;
        } else {
          pool._validation['_validCount'] = true;
        }
      });

      return allValid ? undefined : ctx.t('aks.errors.poolCount');
    }
  };
};
