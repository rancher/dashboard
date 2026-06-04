import { normalizeName } from '@shell/utils/kube';
import { DEFAULT_WORKSPACE } from '@shell/config/types';

const ADDITIONAL_MANIFEST = `apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: aws-cloud-controller-manager
  namespace: kube-system
spec:
  chart: aws-cloud-controller-manager
  repo: https://kubernetes.github.io/cloud-provider-aws
  targetNamespace: kube-system
  bootstrap: true
  valuesContent: |-
    hostNetworking: true
    nodeSelector:
      node-role.kubernetes.io/control-plane: "true"
    args:
      - --configure-cloud-routes=false
      - --v=5
      - --cloud-provider=aws`;

export async function initInfrastructureCluster(value: any, clusterSchema: string, context: any, isEdit = false): Promise<void> {
  let config;
  let configMissing = false;

  if (!clusterSchema) {
    // eslint-disable-next-line no-console
    console.warn('initCapiCluster: missing clusterSchema, cluster object creation skipped');
  }

  if (clusterSchema && context.getters['management/canList'](clusterSchema)) {
    try {
      const infraRef = value.spec?.rkeConfig?.infrastructureRef;

      if (infraRef?.name && infraRef?.namespace) {
        config = await context.dispatch('management/find', {
          type: clusterSchema,
          id:   `${ infraRef.namespace }/${ infraRef.name }`,
        });
        // label-based fallback
      } else if (value.metadata?.name) {
        config = await context.dispatch('management/find', {
          type:     clusterSchema,
          selector: `cluster.x-k8s.io/cluster-name=${ value.metadata.name }`,
        });
      }

      if (!config) {
        configMissing = true;
      }
    } catch (e) {
      configMissing = true;
    }
    if (configMissing) {
      try {
        config = await context.dispatch('management/createPopulated', {
          type:     clusterSchema,
          metadata: { namespace: DEFAULT_WORKSPACE }
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error creating cluster config', e);
      }
    }

    // TODO handle case where config is still missing and make sure spec is setup correctly
    // TODO apply defaults
    // console.log('config', config);
    return config || {};
  }
}

export async function saveMachinePoolConfigs(pools: any[], cluster: any, dispatch: Function) {
  const finalPools = [];

  for (const entry of pools) {
    if (entry.remove) {
      continue;
    }
    // Capitals and such aren't allowed;
    entry.pool.name = normalizeName(entry.pool.name) || 'pool';
    const prefix = `${ cluster.metadata.name }-${ entry.pool.name }`;

    const prefixFormatted = prefix.substr(0, 50).toLowerCase();

    if (entry.create) {
      console.log('CREATE');
      if (!entry.config.metadata?.name) {
        entry.config.metadata.generateName = `nc-${ prefixFormatted }-`;
      }

      const neu = await entry.config.save();

      entry.config = neu;
      entry.pool.machineConfigRef.name = neu.metadata.name;
      entry.create = false;
      entry.update = true;
      entry.config.spec.template.spec.additionalTags = { created: 'created' };

      // this.initialMachinePoolsValues[entry.config.id] = clone(neu);
    } else if (entry.update) {
      console.log('UPDATE');
      // Upstream CAPI machine templates are immutable: create a replacement resource
      // with the current spec values, update the pool reference, then remove the old one.
      const oldConfig = entry.config;

      // Clone before mutating so oldConfig retains its identity (links/id) for removal.
      const newConfig = await dispatch('management/clone', { resource: oldConfig });

      delete newConfig.id;
      delete newConfig.metadata.name;
      delete newConfig.metadata.resourceVersion;
      delete newConfig.metadata.uid;
      delete newConfig.links;
      newConfig.metadata.generateName = `nc-${ prefixFormatted }-`;
      newConfig.spec.template.spec.instanceType = 't3.large';
      console.log('newConfig', newConfig);

      const neu = await newConfig.save();

      entry.config = neu;
      entry.pool.machineConfigRef.name = neu.metadata.name;

      try {
        await oldConfig.remove();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to remove old machine config', e);
      }
    }

    finalPools.push(entry.pool);
  }

  cluster.spec.rkeConfig.machinePools = finalPools;
}

export async function saveInfrastructureCluster(value: any, infrastructureCluster: any, isEdit = false): Promise<void> {
  if (!infrastructureCluster) {
    return;
  }

  infrastructureCluster.metadata = infrastructureCluster.metadata || {};
  if (!isEdit) {
    infrastructureCluster.metadata.namespace = value.metadata?.namespace || DEFAULT_WORKSPACE;
    if (!value.metadata?.name) {
      infrastructureCluster.metadata.generateName = `infra-`;
    } else {
      infrastructureCluster.metadata.name = value.metadata.name;
    }
  } else {
    infrastructureCluster.spec.additionalTags = { updated: 'updated' };
  }
  try {
    const infraCluster = await infrastructureCluster.save();

    if (!isEdit) {
      if (!value.spec.rkeConfig) {
        value.spec.rkeConfig = {};
      }

      value.spec.rkeConfig.infrastructureRef = {
        kind:       'AWSCluster',
        name:       infraCluster.metadata.name,
        namespace:  DEFAULT_WORKSPACE,
        apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2',
      };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error saving infrastructure cluster', e);
  }
}

export async function updateProvCluster(value: any): Promise<void> {
  if (!value?.spec?.rkeConfig?.additionalManifest) {
    value.spec.rkeConfig.additionalManifest = ADDITIONAL_MANIFEST;
  }
  if (!value.spec.rkeConfig?.machineGlobalConfig) {
    value.spec.rkeConfig.machineGlobalConfig = {};
  }
  if (value.spec.rkeConfig.machineGlobalConfig['cloud-provider-name'] !== 'external') {
    value.spec.rkeConfig.machineGlobalConfig['cloud-provider-name'] = 'external';
  }
  if (value.spec.rkeConfig.machineGlobalConfig['node-name-from-cloud-provider-metadata'] !== true) {
    value.spec.rkeConfig.machineGlobalConfig['node-name-from-cloud-provider-metadata'] = true;
  }
}

export function removeEmptyFields(input: any): any {
  if (Array.isArray(input)) {
    const cleanedArray = input
      .map((item) => removeEmptyFields(item))
      .filter((item) => item !== undefined);

    return cleanedArray.length ? cleanedArray : undefined;
  }

  if (input && typeof input === 'object') {
    const cleanedObject = Object.entries(input).reduce((acc: Record<string, any>, [key, val]) => {
      const cleanedValue = removeEmptyFields(val);

      if (cleanedValue !== undefined) {
        acc[key] = cleanedValue;
      }

      return acc;
    }, {});

    return Object.keys(cleanedObject).length ? cleanedObject : undefined;
  }

  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  return input;
}
