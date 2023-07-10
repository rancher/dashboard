# Cluster Provisioning (RKE2 / Custom)

The Rancher UI provides a number of hooks to support custom components and processes when managing RKE2/Custom clusters.

## Custom Components
To implement components for an existing node driver see [Custom Node Driver UI](components/node-drivers.md). For example new / replacement components to manage cloud credentials and/or machine configs can be supplied.

## Custom Create/Edit

### Resources
Creating an cluster revolves around two resources
- The machine configuration
  - The machine configuration defines how the individual nodes within a node pool will be provisioned. For instance which region and size they may be
  - These normally have an type of `rke-machine-config.cattle.io.<provider name>config`, which matches the id of it's schema object
- The provisioning cluster
  - The `provisioning.cattle.io.cluster` which, aside from machine configuration, contains all details of the cluster
  - In the UI this is an instance of the `rancher/dashboard` `shell/models/provisioning.cattle.io.cluster.js` class
     - This has lots of great helper functions, most importantly `save`
  - This process will create a cluster of type `custom`

### Provisioner Class
To customise the process of creating or editing these resources the extension should register a provisioner class which implements the `IClusterProvisioner` interface.

```
  plugin.register('provisioner', 'my-provisioner', ExampleProvisioner);
```

> Note that `register` allows us to register an arbitrary extension and we introduce the type `provisioner`.

Below is outline for the functionality the class provides, for detail about the `IClusterProvisioner` interface see the inline documentation.

The class provides a way to...
1. show a card for the new cluster type to the user when selecting the type of cluster to provision
1. handle custom machine configs that haven't necessarily been provided by the usual node driver way
1. hooks to extend/override the cluster save process. Either..
    - Override all of the cluster save process
    - Extend/Override parts of the cluster save process. This allows a lot of the boilerplate code to manage addons, member bindings, etc to run
    - run code before the cluster resource is saved
    - replace the code that saves the core cluster
    - run code after the cluster resource is saved
1. show a custom label for the provider of the custom cluster
    - This is done by setting the `ui.rancher/provider` annotation in the cluster
1. show custom tabs on the Detail page of the custom cluster

> To make API calls from the UI to a different domain see [here](../../code-base-works/machine-drivers.md#api-calls). For instance to fetch region or machine size information used to create a machine config

### Components
In addition to the provisioner class, the user can provide components as per the `Custom Components` section.

```
  plugin.register('cloud-credential', 'my-provisioner', false);
  plugin.register('machine-config', 'my-provisioner', () => import('./src/test.vue'));
```

This example registers that no cloud credential is needed and registers a custom component to be used for Machine Configuration within a node/machine pool - this is the same as with Node Drivers - e.g. with the OpenStack node driver example. 

### Custom tabs in the Cluster's detail page

When clicking on a created cluster in the UI the user is shown details for the cluster. This page has some tabs which may not be applicable
to the custom provider. The provider class has a way to hide these. To add a new custom tab the following can be used

```
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    customParams:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });
```

Note we use the new `customParams` to allow us to target the tab only when the cluster is of our provider type.

### Localisation

The custom cluster type's label is defined as per any other extension text in `l10n/en-us.yaml` as `cluster.provider.<provider name>`.