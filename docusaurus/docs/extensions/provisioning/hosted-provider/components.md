# Components

Rancher uses dynamic [components](../../api/components/components.md) in the Dashboard UI. Extensions can add new components for Rancher to discover and use. 

For a hosted provider extension, the main component is called 'CruPROVISIONER_NAME' and contains fields required to provision a cluster. This is the main component which is being loaded when provider is selected in `Cluster Management -> Clusters -> Create` and `Cluster Management -> Clusters -> Import Existing`, and when an existing cluster of this provider type is being edited.

Most of the components will be picked up automatically if placed in the correct folder. For example, if you are trying to add a new cloud credential, just create a 'cloud-credential' folder in your extension's package. More on the folder structure [here](./structure.md)

The only exception is your main Cru Component, which needs to be registered in your provisioner.ts file.
```ts
  get component(): Component {
    return Cru<PROVISIONER_NAME>;
  }
```