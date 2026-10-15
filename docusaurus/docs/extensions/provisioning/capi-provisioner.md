# CAPI-backed Provisioners

Some [Custom Cluster Provisioners](./overview.md#custom-cluster-provisioner) are backed by [Rancher Turtles](https://github.com/rancher/turtles) and upstream [Cluster API (CAPI)](https://cluster-api.sigs.k8s.io/) instead of the classic node-driver flow. This page covers the concepts and `IClusterProvisioner` members that are specific to that style of provisioner.

## Concepts

- A Rancher-managed cluster is always a `provisioning.cattle.io.cluster` resource, whether it's a classic node-driver cluster or a CAPI-backed one. For CAPI-backed providers, Rancher Turtles additionally reconciles it into an upstream CAPI `Cluster` resource.
- CAPI splits cluster's responsibilities across three provider roles: **infrastructure**, **control plane**, and **bootstrap**. A CAPI-backed provisioner extension typically only fills the infrastructure role — it owns the infrastructure-cluster and machine-template CRDs and knows how to talk to the target infrastructure (AWS, Azure, vSphere, etc.). The control plane and bootstrap roles are filled by Rancher's own CAPR (Cluster API Provider RKE2), which the extension doesn't need to touch directly. This is why cluster creation for these providers still goes through the standard RKE2 wizard (Kubernetes version, RKE2/K3s config, etc.), with the provisioner's sections layered in for the infrastructure-specific pieces.
- **Infrastructure cluster**: the provider's cluster-scoped CRD (e.g. `AWSCluster`), referenced from `provisioning.cattle.io.cluster.spec.rkeConfig.infrastructureRef`. This resource has no equivalent in the classic node-driver flow — the extension is responsible for creating and managing it directly. Reference to this cluster is required and must be set in the extension, typically using `registerSaveHooks`.
- **Machine pool config**: the provider's machine-template CRD (e.g. `AWSMachineTemplate`), one per machine pool, referenced by `machinePool.machineConfigRef`. Upstream CAPI machine templates are immutable, so editing a machine pool's instance config means creating a **new** template, repointing the pool at it, and only removing the old template once the cluster save succeeds — a failed save should not leave a pool pointing at a deleted template.
- Rancher's `rke2.vue` edit view (in `@rancher/shell`) owns the overall cluster creation/edit wizard; the provisioner supplies extra sections and hooks into specific extension points rather than replacing the wizard.

## Registration points

These `IClusterProvisioner` members (see [Custom Cluster Provisioner](./overview.md#custom-cluster-provisioner) for the base interface) are what identify a provisioner as CAPI-backed and let it plug into the infrastructure-cluster and machine-pool-config lifecycle:

- `isUpstreamCAPIProvider: true` — tells the shared wizard this provider is CAPI-backed, which changes some validation/UI behavior in `rke2.vue`.
- `clusterSchema` (a.k.a. `infrastructureClusterSchema`) — a getter returning the Norman schema for the infrastructure-cluster type, alongside `machineConfigSchema` for the machine-template type.
- `extensionInfrastructureSection` / `extensionInfrastructureSectionProps` — the Vue component (and its props) rendered for infrastructure-cluster-specific config.
- `extensionProvisioningSection` / `extensionProvisioningSectionProps` — a component for provisioning-cluster-level config/validation that is tied to the `provisioning.cattle.io.cluster`.
- `extensionCredentialSection` / `extensionCredentialSectionProps` — a component that replaces the Rancher cloud credential step, for providers whose credentials are not Rancher cloud credentials. See [Credentials that are not Rancher cloud credentials](#credentials-that-are-not-rancher-cloud-credentials).
- `createMachinePoolMachineConfig`, `saveMachinePoolConfigs`, `cleanupMachinePools` — override how machine-template resources are created/saved/cleaned up per pool. `saveMachinePoolConfigs` should set `provisioning.cattle.io.cluster.spec.rkeConfig.machinePools` to reference the newly created machine configs.
- `registerInitHooks` / `registerSaveHooks` — register functions that run when the cluster form initializes or before the cluster is saved, typically to load or persist the infrastructure-cluster resource alongside the `provisioning.cattle.io.cluster`.

See the inline documentation on `IClusterProvisioner` in [`shell/core/types-provisioning.ts`](https://github.com/rancher/dashboard/tree/master/shell/core/types-provisioning.ts) for the full signatures.

## Credentials that are not Rancher cloud credentials

By default the wizard starts with a credential step: the user picks or creates a Rancher cloud credential, and its id is written to `provisioning.cattle.io.cluster.spec.cloudCredentialSecretName`. Rancher cloud credentials are used by Rancher node drivers: they are not required to provision clusters using upstream CAPI infrastructure providers. A CAPI provider that authenticates some other way (for example an identity resource or a secret referenced from the infrastructure cluster) can replace the contents of that step with its own component through `extensionCredentialSection`.

When `extensionCredentialSection` is defined:

- the credential step will be shown even if `cloud-credential` is registered as `false` for the provider
- the step keeps the Cancel / Continue footer used in built-in cluster provisioning flows; the extension component renders above it
- the value the component emits is never written to `spec.cloudCredentialSecretName` and is not looked up as a cloud credential
- the value is passed on as `credentialId` to `extensionInfrastructureSection` and to the provider's `machine-config` component

### Props

| Prop | Description |
|---|---|
| `value` | Current value, or `null` |
| `mode`, `provider` | Form mode and provider id |
| `provisioningCluster` | The `provisioning.cattle.io.cluster` being created or edited |
| `infrastructureCluster` | The infrastructure cluster set up by `registerInitHooks`, so the component can write its credential reference (for example `spec.identityRef`) |
| `registerSave(fn)` | `fn` is called when the user clicks Continue. It resolves to a list of errors, empty on success |
| `registerBack(fn)` | `fn` is called when the user clicks Select Existing |

`extensionCredentialSectionProps` adds props, either as an object or as a function that receives the props above and returns an object.

### Events

| Event | Description |
|---|---|
| `update:value` | A non-null value completes the step: the footer is hidden and the cluster form is shown. Emit `null` to return to the step |
| `validationChanged(boolean)` | Enables Continue |
| `canGoBackChanged(boolean)` | Optional. Shows the Select Existing button in the footer |

The component should show its own loading state while it fetches.

### Editing an existing cluster

Set the initial value in a `registerInitHooks` hook, where `this` is the wizard:

```ts
registerInitHooks(registerInitHook: any): void {
  registerInitHook(async function(this: any) {
    this.infrastructureCluster = await loadInfrastructureCluster(this.value);
    this.credentialId = credentialIdFrom(this.infrastructureCluster);
  }, 'my-provider-init');
}
```

## Reference implementation

[`rancher/prov-capi-ui-extensions`](https://github.com/rancher/prov-capi-ui-extensions) is a CAPI-backed provisioner extension for AWS (via Cluster API Provider AWS). Its `pkg/capa/provisioner.ts` implements every member above, except the custom credential component.
