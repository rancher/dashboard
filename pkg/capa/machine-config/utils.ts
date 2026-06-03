import { normalizeName } from '@shell/utils/kube';
// import {
//   clone, diff, set, get, isEmpty, mergeWithReplace
// } from '@shell/utils/object';

export async function saveMachinePoolConfigs(pools: any[], cluster: any) {
  const finalPools = [];

  // eslint-disable-next-line no-console
  console.log('Saving machine pool configs', pools, cluster);

  for (const entry of pools) {
    if (entry.remove) {
      continue;
    }
    // TODO
    // await this.syncMachineConfigWithLatest(entry);

    // Capitals and such aren't allowed;
    entry.pool.name = normalizeName(entry.pool.name) || 'pool';
    const prefix = `${ cluster.metadata.name }-${ entry.pool.name }`;

    const prefixFormatted = prefix.substr(0, 50).toLowerCase();

    if (entry.create) {
      if (!entry.config.metadata?.name) {
        entry.config.metadata.generateName = `nc-${ prefixFormatted }-`;
      }

      const neu = await entry.config.save();

      entry.config = neu;
      entry.pool.machineConfigRef.name = neu.metadata.name;
      entry.create = false;
      entry.update = true;

      // this.initialMachinePoolsValues[entry.config.id] = clone(neu);
    } else if (entry.update) {
      entry.config = await entry.config.save();
    }

    finalPools.push(entry.pool);
  }

  cluster.spec.rkeConfig.machinePools = finalPools;
}
