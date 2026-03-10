---
id: resources-api
---

# Resources API

> Available from Rancher `2.14` and onwards

## What is the Resources API?

The Resources API provides a comprehensive, type-safe interface for interacting with Kubernetes resources within Rancher extensions. This API allows extension developers to create, read, update, and delete resources programmatically with full TypeScript support and autocomplete.

The API is organized into two contexts to reflect Rancher's architecture:

- **Cluster Context** (`cluster`) - Cluster-scoped Kubernetes resources like Pods, Deployments, Services, etc.
- **Management Context** (`mgmt`) - Global Rancher resources like Users, Clusters, Global Settings, etc.

## Key Features

### ✅ Type-Safe with Generics
Get full TypeScript autocomplete and type checking on returned resources:
```ts
const pods = await resources.cluster.list<Pod>(K8S.POD);
pods[0].spec.containers; // ✅ Type-safe!
```

### ✅ Constants Instead of Strings
Use predefined constants to avoid typos and get autocomplete:
```ts
resources.cluster.list(K8S.POD);  // ✅ Autocomplete works!
// vs
resources.cluster.list('pod');    // ❌ No autocomplete, typo-prone
```

### ✅ Explicit Context
Clear distinction between cluster and management resources:
```ts
resources.cluster.list(K8S.POD);      // Cluster resources
resources.mgmt.list(K8S.USER);        // Management resources
```

## How to use the Resources API

### Using Composition API in Vue

To use the Resources API in the context of the **Composition API** of a Vue component, import the correct method:

```ts
import { useResources, K8S } from '@shell/apis';
import type { Pod, Deployment } from '@shell/types/resources';
```

Then use it in your component with the appropriate context:

```ts
const resources = useResources();

// Cluster context - for cluster-scoped resources
const pods = await resources.cluster.list<Pod>(K8S.POD);
pods.forEach(pod => {
  console.log(pod.metadata.name);
  console.log(pod.spec.containers);  // ✅ Fully typed!
});

// Get a specific deployment
const deployment = await resources.cluster.get<Deployment>(
  K8S.DEPLOYMENT, 
  'my-app'
);
console.log(deployment.spec.replicas);  // ✅ Type-safe!

// Management context - for global resources
const users = await resources.mgmt.list(K8S.USER);
const cluster = await resources.mgmt.get(K8S.CLUSTER, 'c-abc123');
```

### Using Options API in Vue

To use the Resources API in the context of the **Options API** of a Vue component, access the `$resources` property from `this`:

```ts
import { K8S } from '@shell/apis';

export default {
  async mounted() {
    // Cluster context
    const pods = await this.$resources.cluster.list(K8S.POD);
    
    // Management context
    const users = await this.$resources.mgmt.list(K8S.USER);
  }
}
```

## Using Resource Constants

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
K8S.JOB
K8S.CRON_JOB

// Networking
K8S.INGRESS
K8S.NETWORK_POLICY

// RBAC
K8S.ROLE
K8S.ROLE_BINDING
K8S.CLUSTER_ROLE
K8S.CLUSTER_ROLE_BINDING

// Rancher Management
K8S.USER
K8S.CLUSTER
K8S.PROJECT
K8S.ROLE_TEMPLATE
K8S.GLOBAL_ROLE

// And many more...
```

For custom resources or CRDs, you can still use strings:
```ts
// Using strings for custom CRDs
const customResources = await resources.cluster.list('mycompany.io.customresource');

// With type safety using interfaces
interface MyCustomResource {
  metadata: { name: string };
  spec: { myField: string };
}

const typed = await resources.cluster.list<MyCustomResource>('mycompany.io.customresource');
typed[0].spec.myField;  // ✅ Typed!
```

## API Contexts

### Cluster Context (`resources.cluster`)

Use `resources.cluster` for resources that are:
- Scoped to the currently selected cluster
- Kubernetes native resources
- Namespace-scoped or cluster-scoped within a cluster

**Examples:** Pods, Deployments, Services, ConfigMaps, Namespaces, Nodes

```ts
const pods = await resources.cluster.list(K8S.Pod);
const services = await resources.cluster.list(K8S.Service);
const namespaces = await resources.cluster.list(K8S.Namespace);
```

### Management Context (`resources.mgmt`)

Use `resources.mgmt` for resources that are:
- Global to the Rancher installation
- Not tied to a specific cluster
- Rancher-specific management resources

**Examples:** Users, Clusters, Auth Configs, Global Settings, Role Templates

```ts
const users = await resources.mgmt.list(K8S.User);
const clusters = await resources.mgmt.list(K8S.Cluster);
const settings = await resources.mgmt.list(K8S.Setting);
```

## Type Safety Examples

### Example 1: Listing Pods with Type Safety

```ts
import { useResources, K8S } from '@shell/apis';
import type { Pod } from '@shell/types/resources';

const resources = useResources();

const pods = await resources.cluster.list<Pod>(K8S.Pod, {
  limit: 100,
  // Additional filter options...
});

// Full autocomplete and type checking
pods.forEach(pod => {
  console.log(pod.metadata.name);           // ✅
  console.log(pod.spec.containers[0].image); // ✅
  console.log(pod.status.phase);            // ✅
});
```

### Example 2: Getting a Specific Deployment

```ts
import type { Deployment } from '@shell/types/resources';

const deployment = await resources.cluster.get<Deployment>(
  K8S.Deployment,
  'my-application'
);

if (deployment) {
  console.log(`Replicas: ${deployment.spec.replicas}`);
  console.log(`Image: ${deployment.spec.template.spec.containers[0].image}`);
}
```

### Example 3: Label Selector with Types

```ts
import type { Pod } from '@shell/types/resources';

// Find all pods with specific labels
const nginxPods = await resources.cluster.labelSelector<Pod>(
  'app=nginx,env=production'
);

nginxPods.forEach(pod => {
  console.log(`Pod: ${pod.metadata.name}, IP: ${pod.status.podIP}`);
});
```

## Available Methods

Explore the auto-generated API documentation below to see all available methods and interfaces for working with Kubernetes resources in your extensions.
