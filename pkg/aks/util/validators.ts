/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * These validation rules are used by the form validation mixin but work a little differently from the validators defined in @shell/utils/validators/formRules
 * Due to current limitations of the fv mixin
 */

import { get } from '@shell/utils/object';
import { LoadBalancerSku, OutboundType } from 'types';

// no need to try to validate any fields if the user is still selecting a credential and the rest of the form isn't visible
export const needsValidation = (ctx: any): Boolean => {
  return !!ctx.config.azureCredentialSecret && !!ctx.config.resourceLocation;
};

export const requiredTranslation = (ctx: any, labelKey = 'Value'): String => {
  return ctx.t('validation.required', { key: ctx.t(labelKey) });
};

export const requiredInCluster = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :String | undefined => {
    return needsValidation(ctx) && clusterPath && !get(ctx.normanCluster, clusterPath) ? requiredTranslation(ctx, labelKey) : undefined;
  };
};

// cluster name
// Alphanumerics, underscores, and hyphens. Start and end with alphanumeric.
// https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftcontainerservice
export const clusterNameChars = (ctx: any ) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = name.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);

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
    const { name = '' } = get(ctx, 'normanCluster');
    const isValid = name.length <= 63;

    return isValid ? undefined : ctx.t('aks.errors.clusterName.length');
  };
};

// letters, numbers, -, _, (, ), ., and unicode UppercaseLetter, LowercaseLetter, TitlecaseLetter, ModifierLetter, OtherLetter
// https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftresources
export const resourceGroupLength = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx.normanCluster, clusterPath) || '';

    const isValid = resourceGroup.length <= 80;

    return isValid ? undefined : ctx.t('aks.errors.resourceGroup.length', { key: ctx.t(labelKey) });
  };
};

export const resourceGroupChars = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx.normanCluster, clusterPath) || '';
    const isValid = resourceGroup.match(/^[A-Za-z0-9\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{Lm}\p{Nd}\.\-_(\)]*$/);

    return isValid || !resourceGroup.length ? undefined : ctx.t('aks.errors.resourceGroup.chars', { key: ctx.t(labelKey) });
  };
};

export const resourceGroupEnd = (ctx: any, labelKey:string, clusterPath:string) => {
  return () :string | undefined => {
    const resourceGroup = get(ctx.normanCluster, clusterPath) || '';

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
    const toValidate = get(ctx.normanCluster, clusterPath) || '';

    const isValid = toValidate.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/);

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.ipv4', { key: ctx.t(labelKey) });
  };
};

export const ipv4WithCidr = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const toValidate = get(ctx.normanCluster, clusterPath) || '';

    const isValid = toValidate.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(\/([0-9]|[1-2][0-9]|3[0-2]))$/);

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.ipv4Cidr', { key: ctx.t(labelKey) });
  };
};

export const outboundTypeUserDefined = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const outboundType = get(ctx.normanCluster, clusterPath) as OutboundType;
    const loadBalancerSku = get(ctx.normanCluster, 'aksConfig.loadBalancerSku') as LoadBalancerSku;

    if (loadBalancerSku !== 'Standard' && outboundType === 'UserDefinedRouting') {
      return ctx.t('aks.errors.outboundType');
    }

    return undefined;
  };
};

// https://learn.microsoft.com/en-us/azure/aks/private-clusters?tabs=azure-portal#configure-a-private-dns-zone
export const privateDnsZone = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :string | undefined => {
    const toValidate = get(ctx.normanCluster, clusterPath) || '';

    const isValid = toValidate.match(/^([a-zA-Z0-9-]{1,32}\.){0,32}private(link){0,1}\.[a-zA-Z0-9]+\.azmk8s\.io$/);

    return isValid || !toValidate.length ? undefined : ctx.t('aks.errors.privateDnsZone', {}, true);
  };
};
