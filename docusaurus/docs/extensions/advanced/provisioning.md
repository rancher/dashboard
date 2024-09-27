# Cluster Provisioning (RKE2 / Custom)

The UI provides a number of ways to customise the processes that creates RKE2/Custom clusters. This includes
- Adding additional Cluster Provisioner types
- Customising or replacing components used in the create process
- Additional tabs
- Hooks in to the processes that persist cluster resources
- Overrides that replace the process to persist cluster resources

## Custom Components
Existing components that manage cloud credentials and machine configuration can be replaced as per [Custom Node Driver UI](../api/components/node-drivers.md). 

## Custom Cluster Provisioner
New cluster provisioners can be added that can tailor the create/edit experience for their own needs.

### Resources
Creating a cluster revolves around two resources
- The machine configuration
  - The machine configuration defines how the individual nodes within a node pool will be provisioned. For instance which region and size they may be
  - These normally have an type of `rke-machine-config.cattle.io.<provider name>config`, which matches the id of it's schema object
- The provisioning cluster
  - The `provisioning.cattle.io.cluster` which, aside from machine configuration, contains all details of the cluster
  - In the UI this is an instance of the `rancher/dashboard` `shell/models/provisioning.cattle.io.cluster.js` class
     - This has lots of great helper functions, most importantly `save`
  - Cluster provisioners should always create an instance of this class

### Provisioner Class
To customise the process of creating or editing these resources the extension should register a provisioner class which implements the `IClusterProvisioner` interface.

```
  plugin.register('provisioner', 'my-provisioner', ExampleProvisioner);
```

> Note that `register` allows us to register an arbitrary extension and we introduce the type `provisioner`.

Below is outline for the functionality the class provides, for detail about the `IClusterProvisioner` interface see the inline documentation.

The class provides a way to...
1. show a card for the new cluster type for the user to choose when selecting a provider
1. handle custom machine configs that haven't necessarily been provided by the usual node driver way
1. hooks to extend/override the cluster save process. Either..
    - Override all of the cluster save process
    - Extend/Override parts of the cluster save process. This allows a lot of the boilerplate code to manage addons, member bindings, etc to run
      - run code before the cluster resource is saved
      - replace the code that saves the core cluster
      - run code after the cluster resource is saved
1. show a custom label for the provider of the custom cluster
    - This is done by setting the `ui.rancher/provider` annotation in the cluster
    - It's used in the UI whenever showing the cluster's provider
1. show custom tabs on the Detail page of the custom cluster

To make API calls from the UI to a different domain, Rancher includes a [proxy](https://github.com/rancher/rancher/blob/release/v2.6/pkg/httpproxy/proxy.go) that can be used to make requests to third-party domains (like a cloud provider's API) without requiring that the other end supports CORS or other browser shenanigans.  Send requests to `/meta/proxy/example.com/whatever/path/you/want` and the request will be made from the Rancher server and proxied back to you.

TLS and port 443 are assumed.  Add a port after the hostname to change the port (`example.com:1234`).  For plain HTTP, first stop and consider the chain of life decisions which have led you to this point. Then if you still think you need that, use `/meta/proxy/http:/example.com:1234` (note one slash after `http:`, not two).  The hostname must be included in the whitelist defined in global settings, or in the configuration for an active node driver.  If if isn't your request will be denied.  (This prevents a malicious (non-admin) user from abusing the Rancher server as an arbitrary HTTP proxy or reach internal IPs/names that the server can reach directly but the user can't from the outside.)

The rest of the path and query string are sent to the target host as you'd expect.

Normal headers are copied from your request and sent to the target.  There are some exceptions for sensitive fields like the user's rancher cookies or saved basic auth creds which will not be copied.  If you send an `X-Api-Cookie-Header`, its value will be sent as the normal `Cookie` to the target.  If you send `X-API-Auth-Header`, that will be sent out as the normal `Authorization`.

But normally you want to make a request using a Cloud Credential as the authorization, without knowing what the secret values in that credential are.  You ask for this by sending an `X-Api-CattleAuth-Header` header.  The value of the header specifies what credential Id to use, and a [signer](https://github.com/rancher/rancher/blob/release/v2.6/pkg/httpproxy/sign.go) which describes how that credential should be injected into the request.  Common options include `awsv4` (Amazon's complicated HMAC signatures), `bearer`, `basic`, and `digest`.  For example if you send `X-Api-CattleAuth-Header: Basic credId=someCredentialId usernameField=user passwordField=pass`, Rancher will retrieve the credential with id `someCredentialId`, read the values of the `user` and `pass` fields from it and add the header `Authorization: Basic <base64(user + ":" + pass)>` to the proxied request for you.

### Components
When creating or editing a cluster the user can see the cloud credential and machine pool components.

These can be provided as per the `Custom Components` section.

```
  plugin.register('cloud-credential', 'my-provisioner', false);
  plugin.register('machine-config', 'my-provisioner', () => import('./src/test.vue'));
```

> This example registers that no cloud credential is needed and registers a custom component to be used for Machine Configuration within a node/machine pool - this is the same as with Node Drivers - e.g. with the OpenStack node driver example.

### Custom tabs in the Cluster's Cluster Configuration 

When creating or editing the cluster the user can see a set of `Cluster Configuration` tabs that contain configuration applicable to the entire cluster.

Extensions can add additional tabs here.

```
  plugin.addTab(TabLocation.CLUSTER_CREATE_RKE2, {
    resource:     ['provisioning.cattle.io.cluster'],
    queryParam:    { type: ExampleProvisioner.ID }
  }, {
    name:      'custom-cluster-config',
    labelKey:     'exampleClusterConfigTab.tabLabel',
    component: () => import('./src/example-cluster-config-tab.vue')
  });
```
> Note we use the new `queryParam` property to allow us to target the tab only when the cluster is of our provider type.

### Custom tabs in the Cluster's detail page

When clicking on a created cluster in the UI the user is shown details for the cluster. This page has some tabs which may not be applicable to the custom provider. The provider class has a way to hide these. To add a new custom tab the following can be used

```
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    context:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });
```

Note we use the new `context` property to allow us to target the tab only when the cluster is of our provider type.

### Localisation

The custom cluster type's label is defined as per any other extension text in `l10n/en-us.yaml` as `cluster.provider.<provider name>`.