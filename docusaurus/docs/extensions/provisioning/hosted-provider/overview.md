The following steps are fully compatible with Rancher version v.2.13.0 and later.

# Custom Hosted Provider UI
Hosted providers are a replacement for kontainer drivers (Cluster drivers) and are used to provision clusters in a hosted environment. For example, Rancher comes with built-in AKS, EKS, and GKE provisioning UI extensions. UI extensions are the recommended way to add a new hosted provider.

Unlike other UI extensions that might add new products or pages, a hosted provider extension integrates directly into Rancher's cluster creation and management workflows. This is achieved by registering a `provisioner` object.

## Registering a Hosted Provider
Most of the information about hosted provider comes from the extension's provisioner.ts file. You can learn more about its structure from its [types declaration](https://github.com/rancher/dashboard/blob/master/shell/core/types-provisioning.ts). 

In order for it to take effect, you need to register it in your index.ts file at the root of your extension's pkg/PROVISIONER_NAME folder:
```ts
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', PROVISIONER_NAMEProvisioner.ID, PROVISIONER_NAMEProvisioner);
  plugin.register('image', 'providers/PROVISIONER_NAME.svg', require('./icon.svg'));

  // Built-in icon
  plugin.metadata.icon = require('./icon.svg');
}
```
PROVISIONER_NAME in this example is the name of your provisioner.

Here are some important points to be aware of:

Rancher determines if extension should be treated as a hosted provider by checking provisioner's group property
in provisioner.ts:
```ts
  get group(): string {
    return "hosted";
  }
```
This flag will make extension show up in `Cluster Management -> Clusters -> Create` inside the 'Create a cluster in a hosted Kubernetes provider' group. 
Additionally, it will be visible in `Cluster Management -> Providers -> Hosted Providers` table, where users can enable or disable selected hosted providers, so even if extension is installed, provisioning can be disabled there.

If provisioner.ts file also contains
```ts
  get showImport(): boolean {
    return true;
  }
```
This provider will also appear in `Cluster Management -> Clusters -> Import Existing` as part of the 'Register an existing cluster in a hosted Kubernetes provider' group. 

## Specifying Rancher compatibility
You can restrict which Rancher your extension is compatible with by setting a ["catalog.cattle.io/rancher-version" annotation](../../advanced/version-compatibility) in your pkg/PROVISIONER_NAME/package.json.

## Caveats
1. Though not required, it is best if your provisioner name matches your operator's config, ie if your operator uses aksConfig, it is best to set aks as your you provisioner's id.
2. Currently, we hide description from the provider cards and only show it in the `Cluster Management -> Providers -> Hosted Providers` table.
3. Cloud credentials can be shared between hosted providers and node drivers. If the provider for which you are creating an extension already has a cloud credential defined, you do not need to add a new one to your extension. If the name of the cloud credential doesn't match your provisioner id, you can map it inside provisioner.ts
```ts
  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, '<exisiting-credential-id>' );
  }
```
