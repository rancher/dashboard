---
id: resources-api
---

# Resources API (Experimental)

> Note: This API is experimental and may change in future releases. Available from Rancher `2.15` and onwards

## What is the Resources API?

The Resources API helps extension developers interact with Kubernetes and Rancher resources programmatically. This API provides a type-safe interface for common resource operations such as listing, retrieving, and filtering resources with full TypeScript support and autocomplete.

The API is organized into two contexts:

- **Cluster Context** (`cluster`) - For cluster-scoped Kubernetes resources (Pods, Deployments, Services, etc.)
- **Management Context** (`mgmt`) - For global Rancher resources (Users, Clusters, Settings, etc.)

Both contexts implement the same base `ResourcesApi` interface, so they share the same methods (`find`, `findFiltered`, `findAll`).

## How to use the Resources API

### Using Options API in Vue

To use the Resources API in the context of the **Options API** of a Vue component, we globally expose the `$resources` property, which is available under the `this` object:

```ts
import { K8S } from '@shell/apis';

export default {
  async mounted() {
    // Cluster context
    const pods = await this.$resources.cluster.findFiltered(K8S.POD);
    
    // Management context
    const users = await this.$resources.mgmt.findFiltered(K8S.USER);
  }
}
```

### Using Composition API in Vue

To use the Resources API in the context of the **Composition API** of a Vue component, we'll need to import the correct method to make the API available in the component:

```ts
import { useResources } from '@shell/apis';
```

then just assign to a constant in the context for your component and use it:

```ts
import { useResources, K8S } from '@shell/apis';

const resources = useResources();

// Cluster context - for cluster-scoped resources
const pods = await resources.cluster.findFiltered(K8S.POD);
const deployment = await resources.cluster.find(K8S.DEPLOYMENT, 'default/my-app');

// Management context - for global resources
const users = await resources.mgmt.findFiltered(K8S.USER);
const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
```

## Resource Constants

The `K8S` object contains constants for common Kubernetes and Rancher resources:

```ts
import { K8S } from '@shell/apis';

// Core Kubernetes resources
K8S.POD
K8S.SERVICE
K8S.CONFIG_MAP
K8S.SECRET
K8S.NAMESPACE
K8S.NODE

// Workload resources
K8S.DEPLOYMENT
K8S.STATEFUL_SET
K8S.DAEMON_SET

// Rancher Management
K8S.USER
K8S.PROJECT
K8S.GLOBAL_ROLE

// And many more...
```

For custom resources or CRDs, you can use strings directly:

```ts
const customResources = await resources.cluster.findFiltered('mycompany.io.customresource');
```

## Available API's

| API | Description |
| :--- | :--- |
| [Cluster API](./resources-api/interfaces/ClusterApi) | Interact with cluster-scoped Kubernetes resources (Pods, Deployments, Services, etc.) |
| [Management API](./resources-api/interfaces/MgmtApi) | Interact with global Rancher resources (Users, Clusters, Settings, etc.) |
