/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { get } from '@shell/utils/object';
import { GKENodePool } from '../types';
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

export const GKEInitialCount = (ctx:any) => {
  return (val?: number) => {
    if (!ctx.isAuthenticated) {
      return;
    }
    const valid = (input?: number) => (!!input || input === 0) && input >= 0 && input <= 1000;

    if (val || val === 0) {
      return !valid(val) ? ctx.t('gke.errors.initialNodeCount') : null;
    }

    return !!ctx.nodePools.find((pool: GKENodePool) => !valid(pool.initialNodeCount) ) ? ctx.t('gke.errors.initialNodeCount') : null;
  };
};
