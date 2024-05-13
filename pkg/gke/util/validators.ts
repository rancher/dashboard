/**
 * NODE POOLS
 * x initialNodeCount >=1
 * x minNodeCount >= 1
 * x maxNodeCount >=1
 * x maxNodeCount >= minNodeCount
 * x diskSizeGb >=10
 * x ssdCount >=0
 * x name required
 * x name must be unique within the cluster
 *
 *
 *
 * CONFIG
 * x on edit, logging and monitoring both need to be enabled or both disabled
 * x if enablePrivateNodes is true, masterIpv4CidrBlock is required
 * x if useIpAliases is NOT true, subnetwork is required
 * x cluster name is required
 * minimal cidr validation
 */

import { get } from '@shell/utils/object';
import ipaddr from 'ipaddr.js';

// no need to try to validate any fields if the user is still selecting a credential and the rest of the form isn't visible
export const needsValidation = (ctx: any): Boolean => {
  return !!ctx.isAuthenticated;
};

export const requiredTranslation = (ctx: any, labelKey = 'Value'): String => {
  return ctx.t('validation.required', { key: ctx.t(labelKey) });
};

export const requiredInCluster = (ctx: any, labelKey: string, clusterPath: string) => {
  return () :String | undefined => {
    return needsValidation(ctx) && clusterPath && !get(ctx.normanCluster, clusterPath) ? requiredTranslation(ctx, labelKey) : undefined;
  };
};

export const clusterNameChars = (ctx: any ) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = name.match(/^[a-z0-9\-]*$/);

    return !needsValidation(ctx) || nameIsValid ? undefined : ctx.t('gke.errors.clusterNameChars');
  };
};

export const clusterNameStartEnd = (ctx: any) => {
  return () :string | undefined => {
    const { name = '' } = get(ctx, 'normanCluster');
    const nameIsValid = (!!name.match(/^([a-z0-9])+.*([a-z0-9])+$/) || !name.length);

    return !needsValidation(ctx) || nameIsValid ? undefined : ctx.t('gke.errors.clusterNameStartEnd');
  };
};

export const ipv4WithCidr = (ctx: any, labelKey: string, clusterPath: string) => {
  return (val: string) :string | undefined => {
    let toValidate = get(ctx.normanCluster, clusterPath);

    if (!toValidate) {
      toValidate = val || '';
    }
    // const isValid = toValidate.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(\/([0-9]|[1-2][0-9]|3[0-2]))$/);
    let isValidCIDR = false;
    let isIpv4 = false;

    try {
      isValidCIDR = ipaddr.isValidCIDR(toValidate);
      isIpv4 = ipaddr.parseCIDR(toValidate)[0].kind() === 'ipv4';
    } catch (err) {
    }

    const isValid = isValidCIDR && isIpv4;

    return isValid || !toValidate.length ? undefined : ctx.t('gke.errors.ipv4Cidr', { key: ctx.t(labelKey) || ctx.t('gke.errors.genericKey') });
  };
};

export const ipv4oripv6WithCidr = (ctx: any, labelKey: string, clusterPath: string) => {
  return (val: string) :string | undefined => {
    let toValidate = get(ctx.normanCluster, clusterPath);

    if (!toValidate) {
      toValidate = val || '';
    }
    const isValid = ipaddr.isValidCIDR(toValidate);

    return isValid || !toValidate.length ? undefined : ctx.t('gke.errors.ipv4Cidr', { key: ctx.t(labelKey) || ctx.t('gke.errors.genericKey') });
  };
};
