import { get } from '@shell/utils/object';

class GenericImportedClusterValidators {
  clusterNameRequired(ctx: any): () => string | undefined {
    return function() :string | undefined {
      return !ctx.isEdit && !get(ctx.normanCluster, 'name') ? ctx.t('imported.errors.clusterName.required') : undefined;
    };
  }

  clusterNameChars(ctx: any): () => string | undefined {
    return function() :string | undefined {
      const { name = '' } = get(ctx, 'normanCluster');
      const nameIsValid = name.match(/^[a-z0-9\-]*$/);

      return nameIsValid ? undefined : ctx.t('imported.errors.clusterName.chars');
    };
  }

  clusterNameStartEnd(ctx: any): () => string | undefined {
    return function() :string | undefined {
      const { name = '' } = get(ctx, 'normanCluster');
      const nameIsValid = !!name.match(/^[a-z0-9]$|^[a-z0-9].*[a-z0-9]$/) || !name.length;

      return nameIsValid ? undefined : ctx.t('imported.errors.clusterName.startEnd');
    };
  }

  clusterNameLength(ctx: any): () => string | undefined {
    return function() :string | undefined {
      const { name = '' } = get(ctx, 'normanCluster');
      const isValid = name.length <= 63;

      return isValid ? undefined : ctx.t('imported.errors.clusterName.length');
    };
  }

  workerConcurrency(ctx: any): () => string | undefined {
    return function() :string | undefined {
      const val = ctx.normanCluster?.k3sConfig?.k3supgradeStrategy?.workerConcurrency || ctx?.normanCluster?.rke2Config?.rke2upgradeStrategy?.workerConcurrency || '';
      const exists = ctx.normanCluster?.k3sConfig?.k3supgradeStrategy || ctx?.normanCluster?.rke2Config?.rke2upgradeStrategy;
      // BE is only checking that the value is an integer >= 1
      const valIsInvalid = Number(val) < 1 || !Number.isInteger(+val) || `${ val }`.match(/\.+/g);

      return !!exists && valIsInvalid ? ctx.t('imported.errors.concurrency', { key: 'Worker Concurrency' }) : undefined ;
    };
  }

  controlPlaneConcurrency(ctx: any): () => string | undefined {
    return function() :string | undefined {
      const val = ctx?.normanCluster?.k3sConfig?.k3supgradeStrategy?.serverConcurrency || ctx?.normanCluster?.rke2Config?.rke2upgradeStrategy?.serverConcurrency || '';
      const exists = ctx?.normanCluster?.k3sConfig?.k3supgradeStrategy || ctx?.normanCluster?.rke2Config?.rke2upgradeStrategy;
      // BE is only checking that the value is an integer >= 1
      const valIsInvalid = Number(val) < 1 || !Number.isInteger(+val) || `${ val }`.match(/\.+/g);

      return !!exists && valIsInvalid ? ctx.t('imported.errors.concurrency', { key: 'Control Plane Concurrency' }) : undefined ;
    };
  }
}

export default new GenericImportedClusterValidators();
