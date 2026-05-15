export async function saveMachinePoolConfigs(pools: any[], cluster: any) {
  // console.log(pools, cluster);
  // for (const entry of this.machinePools) {
  //   if (entry.remove) {
  //     continue;
  //   }

  //   await this.syncMachineConfigWithLatest(entry);

  //   // Capitals and such aren't allowed;
  //   entry.pool.name = normalizeName(entry.pool.name) || 'pool';
  //   const prefix = `${ this.value.metadata.name }-${ entry.pool.name }`;

  //   const prefixFormatted = prefix.substr(0, 50).toLowerCase();

  //   // For Google, we need to set internal and external firewall prefixes if enabled,
  //   // but it is better to track it here since cluster and pool names are guaranteed to be set by now.
  //   if (this.provider === GOOGLE) {
  //     if (!!entry.config.setInternalFirewallRulePrefix) {
  //       entry.config.internalFirewallRulePrefix = `${ this.value.metadata.name }`;
  //     } else if (!!entry.config.internalFirewallRulePrefix) {
  //       delete entry.config.internalFirewallRulePrefix;
  //     }
  //     if (!!entry.config.setExternalFirewallRulePrefix) {
  //       entry.config.externalFirewallRulePrefix = prefix;
  //     } else if (!!entry.config.externalFirewallRulePrefix) {
  //       delete entry.config.externalFirewallRulePrefix;
  //     }
  //     // These have to be removed regardless of their value because they are not part of the object we are sending
  //     delete entry.config.setInternalFirewallRulePrefix;
  //     delete entry.config.setExternalFirewallRulePrefix;
  //   }

  //   if (entry.create) {
  //     if (!entry.config.metadata?.name) {
  //       entry.config.metadata.generateName = `nc-${ prefixFormatted }-`;
  //     }

  //     const neu = await entry.config.save();

  //     entry.config = neu;
  //     entry.pool.machineConfigRef.name = neu.metadata.name;
  //     entry.create = false;
  //     entry.update = true;

  //     this.initialMachinePoolsValues[entry.config.id] = clone(neu);
  //   } else if (entry.update) {
  //     entry.config = await entry.config.save();
  //   }

  //   // Ensure Elemental clusters have a hostname prefix
  //   if (this.isElementalCluster && !entry.pool.hostnamePrefix) {
  //     entry.pool.hostnamePrefix = `${ prefixFormatted }-`;
  //   }

  //   finalPools.push(entry.pool);
  // }

  // this.value.spec.rkeConfig.machinePools = finalPools;
}
