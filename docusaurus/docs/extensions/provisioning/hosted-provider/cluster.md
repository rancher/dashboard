
# Cluster Resource
Even though provisioning wizard will open `provisioning.cattle.io.cluster` as an underlying resource, most of the information will be coming from the `management.cattle.io.cluster` resource. Therefore, most changes will need to apply to it instead.

When retrieving or configuring original configuration:
```js
//This.value refers to the provisioning.cattle.io.cluster.
if (this.value.id) { // This covers edit scenario
  // We need to find the corresponding management.cattle.io.cluster
  const liveNormanCluster = await this.value.findNormanCluster();
  this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
  if (!(this.isNew || this.isInactive) ) {
    //Ensure the object users are editing reflects any values that were set outside of Rancher
    syncUpstreamConfig('<your operator>', this.normanCluster);
  }
  //... 
} else { // This is needed for creation
  // You can pass any required default configuration as defaultCluster
  this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
}
```

When saving:
```ts
//If you are using shell's CruResource component
async actuallySave(): Promise<void> {
    await this.normanCluster.save();
    return await this.normanCluster.waitForCondition('InitialRolesPopulated');
}
```
