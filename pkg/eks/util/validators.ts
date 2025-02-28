import { set } from '@shell/utils/object';
import { EKSConfig, EKSNodeGroup, NormanCluster } from 'types';

export interface CruEKSContext {
  t: Function,
  config: EKSConfig,
  nodeGroups: EKSNodeGroup[],
  normanCluster: NormanCluster
}

const displayNameRequired = (ctx: CruEKSContext) => {
  return (): string | null => {
    return !ctx.config.displayName ? ctx.t('validation.required', { key: ctx.t('eks.clusterName.label') }) : null;
  };
};

const clusterNameRequired = (ctx: CruEKSContext) => {
  return (): string | null => {
    return !ctx.normanCluster?.name ? ctx.t('validation.required', { key: ctx.t('eks.clusterName.label') }) : null;
  };
};

const nodeGroupNamesRequired = (ctx: CruEKSContext) => {
  return (nodeName: string | undefined): null | string => {
    if (nodeName !== undefined) {
      return nodeName === '' ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.name.label') }) : null;
    }

    return !!ctx.nodeGroups.find((group) => !group.nodegroupName) ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.name.label') }) : null;
  };
};

const nodeGroupNamesUnique = (ctx: CruEKSContext) => {
  return (nodeName: string | undefined): null | string => {
    let out = null as null|string;

    const names = ctx.nodeGroups.map((node) => node.nodegroupName);

    if (nodeName !== undefined) {
      const matchingNames = names.filter((n) => n === nodeName);

      return matchingNames.length > 1 ? ctx.t('eks.errors.nodeGroups.nameUnique') : null;
    }
    ctx.nodeGroups.forEach((group) => {
      const name = group.nodegroupName;

      if (names.filter((n) => n === name).length > 1) {
        set(group, '__nameUnique', false);
        if (!out) {
          out = ctx.t('eks.errors.nodeGroups.nameUnique');
        }
      }
    });

    return out;
  };
};

const maxSize = (ctx: CruEKSContext) => {
  return (size: number): null | string => {
    const msg = ctx.t('eks.errors.greaterThanZero', { key: ctx.t('eks.nodeGroups.maxSize.label') });

    if (size !== undefined) {
      return size > 0 ? null : msg;
    }

    return !!ctx.nodeGroups.find((group) => !group.maxSize || group.maxSize <= 0) ? msg : null;
  };
};

const minSize = (ctx: CruEKSContext) => {
  return (size?: number): null | string => {
    const msg = ctx.t('eks.errors.atLeastZero', { key: ctx.t('eks.nodeGroups.minSize.label') });

    if (size !== undefined) {
      return size >= 0 ? null : msg;
    }

    return !!ctx.nodeGroups.find((group) => (!group.minSize && group.minSize !== 0) || group.minSize < 0) ? msg : null;
  };
};

const diskSize = (ctx: CruEKSContext) => {
  return (size: string): null | string => {
    if (size || size === '') {
      return !size ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.diskSize.label') }) : null;
    }

    return !!ctx.nodeGroups.find((group: EKSNodeGroup) => !group.diskSize ) ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.instanceType.label') }) : null;
  };
};

const instanceType = (ctx: CruEKSContext) => {
  return (type: string): null | string => {
    if (type || type === '') {
      return !type ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.instanceType.label') }) : null;
    }

    return !!ctx.nodeGroups.find((group: EKSNodeGroup) => !group.instanceType && !group.requestSpotInstances) ? ctx.t('validation.required', { key: ctx.t('eks.nodeGroups.instanceType.label') }) : null;
  };
};

const desiredSize = (ctx: CruEKSContext) => {
  return (size: number): null | string => {
    const msg = ctx.t('eks.errors.greaterThanZero', { key: ctx.t('eks.nodeGroups.desiredSize.label') });

    if (size !== undefined) {
      return size > 0 ? null : msg;
    }

    return !!ctx.nodeGroups.find((group) => !group.desiredSize || group.desiredSize <= 0) ? msg : null;
  };
};

const subnets = (ctx: CruEKSContext) => {
  return (val: string[]): null | string => {
    const subnets = val || ctx.config.subnets;

    return subnets && subnets.length === 1 ? ctx.t('eks.errors.minimumSubnets') : undefined;
  };
};

const publicPrivateAccess = (ctx: CruEKSContext) => {
  return (): string | null => {
    const { publicAccess, privateAccess } = ctx.config;

    return publicAccess || privateAccess ? undefined : ctx.t('eks.errors.publicOrPrivate');
  };
};

const minMaxDesired = (ctx: CruEKSContext) => {
  return (sizes?: {minSize: number, maxSize: number, desiredSize: number}): undefined | string => {
    const isValid = (min = 0, max = 0, desired = 0) => {
      if ((desired < min) || (desired > max)) {
        return false;
      }

      return true;
    };

    if (sizes) {
      // validate given node group - run in node group component to display error
      return isValid(sizes.minSize, sizes.maxSize, sizes.desiredSize) ? undefined : ctx.t('eks.errors.minMaxDesired');
    } else {
      // validate ALL node groups - run in crueks to determine whether or not to disable save button
      return !!ctx.nodeGroups.find((nodeGroup) => !isValid(nodeGroup.minSize, nodeGroup.maxSize, nodeGroup.desiredSize)) ? ctx.t('eks.errors.minMaxDesired') : undefined;
    }
  };
};

const minLessThanMax = (ctx: CruEKSContext) => {
  return (sizes?: {minSize: number, maxSize: number}): undefined | string => {
    const isValid = (min = 0, max = 0 ) => {
      if ((min > max) ) {
        return false;
      }

      return true;
    };

    if (sizes) {
      // validate given node group - run in node group component to display error
      return isValid(sizes.minSize, sizes.maxSize) ? undefined : ctx.t('eks.errors.minLessThanMax');
    } else {
      // validate ALL node groups - run in crueks to determine whether or not to disable save button
      return !!ctx.nodeGroups.find((nodeGroup) => !isValid(nodeGroup.minSize, nodeGroup.maxSize)) ? ctx.t('eks.errors.minLessThanMax') : undefined;
    }
  };
};

const nodeGroupsRequired = (ctx: CruEKSContext) => {
  return (): string | undefined => {
    const nodeGroups = ctx.nodeGroups || [];

    return !nodeGroups.length ? ctx.t('eks.errors.nodeGroupsRequired') : undefined;
  };
};

export default {
  displayNameRequired,
  clusterNameRequired,
  nodeGroupNamesRequired,
  nodeGroupNamesUnique,
  maxSize,
  minSize,
  diskSize,
  instanceType,
  desiredSize,
  subnets,
  publicPrivateAccess,
  minMaxDesired,
  minLessThanMax,
  nodeGroupsRequired
};
