# Table Headers Configuration

*(Rancher version v2.14.0)*

This page describes how to configure table columns for resource lists when registering products using `addProduct` or `extendProduct`.

The headers configuration system provides a simple, type-safe way to define which columns appear in resource list tables.

## Quick Start

Add the `headers` property to any resource page definition:

```ts
{
  type: 'apps.deployment',
  headers: {
    preset: 'namespaced',  // Adds: state, name, namespace, age
    pagination: 'auto'      // Automatically maps to Steve columns
  }
}
```

## Configuration Patterns

### Pattern 1: Use a preset (recommended)

Presets provide common column combinations:

```ts
{
  type: 'core.service',
  headers: {
    preset: 'namespaced',  // state, name, namespace, age
    pagination: 'auto'
  }
}
```

Available presets:
- `'namespaced'` — STATE, NAME, NAMESPACE, AGE
- `'cluster'` — STATE, NAME, AGE  
- `'workload'` — STATE, NAME, NAMESPACE, TYPE, IMAGES, ENDPOINTS, AGE
- `'storage'` — STATE, NAME, CAPACITY, STORAGE_CLASS, AGE

### Pattern 2: Preset with additional columns

Extend a preset with resource-specific columns:

```ts
{
  type: 'core.service',
  headers: {
    preset: 'namespaced',
    add: ['specType', 'targetPort', 'selector'],
    pagination: 'auto'
  }
}
```

### Pattern 3: Define columns explicitly

Specify exactly which columns to display:

```ts
{
  type: 'core.pod',
  headers: {
    columns: [
      'state',
      'name',
      'namespace',
      'node',
      'podRestarts',
      'podImages',
      'age'
    ],
    pagination: 'auto'
  }
}
```

### Pattern 4: Customize column behavior

Import the `column()` builder to modify individual columns:

```ts
import { column } from '@shell/core/columns';

{
  type: 'core.secret',
  headers: {
    columns: [
      'state',
      'name',
      column('secretData').noSort().noSearch(),  // Disable sort & search
      'age'
    ],
    pagination: 'auto'
  }
}
```

### Pattern 5: Override column properties

Fine-tune specific columns without rebuilding them:

```ts
{
  type: 'networking.k8s.io.ingress',
  headers: {
    columns: ['state', 'name', 'namespace', 'ingressTarget', 'ingressClass', 'age'],
    override: {
      ingressTarget: {
        sort: 'spec.rules[0].host',  // Custom sort path
        search: false                 // Disable search
      },
      ingressClass: {
        sort: 'spec.ingressClassName'
      }
    },
    pagination: 'auto'
  }
}
```

## Standard Columns Reference

All these columns are available as simple strings with full TypeScript autocomplete:

### Core Columns
| Key | Description |
|-----|-------------|
| `'state'` | Resource state badge (Active, Error, Updating, etc.) |
| `'name'` | Resource name with link to detail page |
| `'namespace'` | Kubernetes namespace |
| `'age'` | Time since resource creation |

### Node & Resource Info
| Key | Description |
|-----|-------------|
| `'node'` | Node name with link |
| `'nodeName'` | Simple node name display |
| `'version'` | Version information |
| `'cpu'` | CPU allocation/usage |
| `'ram'` | Memory allocation/usage |
| `'internalExternalIp'` | IP addresses for nodes |

### Workload Columns
| Key | Description |
|-----|-------------|
| `'type'` | Resource type |
| `'subType'` | Resource sub-type |
| `'pods'` | Pod count/status |
| `'scale'` | Replica scale with ready count |
| `'simpleScale'` | Simple scale display |
| `'workloadImages'` | Container images |
| `'workloadEndpoints'` | Service endpoints |
| `'podImages'` | Pod container images |
| `'podRestarts'` | Pod restart count |
| `'workloadHealthScale'` | Health indicator with scale |

### Storage Columns
| Key | Description |
|-----|-------------|
| `'persistentVolumeSource'` | PV source/provisioner |
| `'persistentVolumeClaim'` | Associated PVC |
| `'reclaimPolicy'` | PV reclaim policy |
| `'storageClass'` | Storage class name |
| `'storageClassProvisioner'` | Storage provisioner |
| `'storageClassDefault'` | Default storage class indicator |

### Secret & ConfigMap Columns
| Key | Description |
|-----|-------------|
| `'keys'` | ConfigMap/Secret keys |
| `'secretData'` | Secret data keys count |
| `'secretProjectScoped'` | Project-scoped indicator |

### Network Columns
| Key | Description |
|-----|-------------|
| `'ingressTarget'` | Ingress target hosts |
| `'ingressDefaultBackend'` | Default backend service |
| `'ingressClass'` | Ingress class |
| `'specType'` | Service type (ClusterIP, NodePort, etc.) |
| `'targetPort'` | Service target port |
| `'selector'` | Service selector |

### Event Columns
| Key | Description |
|-----|-------------|
| `'eventType'` | Event type |
| `'eventLastSeenTime'` | Last occurrence time |
| `'reason'` | Event reason |
| `'message'` | Event message |
| `'object'` | Related object reference |
| `'duration'` | Event duration |

### HPA Columns
| Key | Description |
|-----|-------------|
| `'hpaReference'` | HPA target reference |
| `'minReplica'` | Minimum replicas |
| `'maxReplica'` | Maximum replicas |
| `'currentReplica'` | Current replica count |

### Helm/App Columns
| Key | Description |
|-----|-------------|
| `'chart'` | Helm chart name |
| `'chartUpgrade'` | Chart upgrade availability |
| `'appSummary'` | Application summary |
| `'resources'` | Resource summary |
| `'url'` | Application URL |

### RBAC & User Columns
| Key | Description |
|-----|-------------|
| `'username'` | Username |
| `'userDisplayName'` | User display name |
| `'userProvider'` | Auth provider |
| `'userLastLogin'` | Last login time |
| `'userId'` | User ID |
| `'principal'` | Principal name |
| `'roles'` | User roles |
| `'rbacDefault'` | RBAC default indicator |
| `'builtIn'` | Built-in resource indicator |

### Fleet Columns
| Key | Description |
|-----|-------------|
| `'fleetSummary'` | Fleet deployment summary |
| `'fleetApplicationType'` | Fleet application type |
| `'workspace'` | Fleet workspace |

### Misc Columns
| Key | Description |
|-----|-------------|
| `'description'` | Resource description |
| `'lastUpdated'` | Last update time |
| `'creationDate'` | Creation date |
| `'status'` | Status field |

## Column Builder API

For advanced column customization, import the `column` function:

```ts
import { column } from '@shell/core/columns';
```

### Available methods

```ts
column('state')
  .noSort()              // Disable sorting
  .noSearch()            // Disable searching
  .sort(['path.to.field'])  // Custom sort path(s)
  .search(['path1', 'path2'])  // Custom search path(s)
  .width(150)            // Set column width in pixels
  .label('Custom Label') // Override display label
  .labelKey('i18n.key')  // Set translation key
  .value('path.to.value')  // Custom value path
  .formatter('Badge', { options })  // Set formatter component
  .dashIfEmpty()         // Show dash when empty
  .align('center')       // Set alignment: 'left' | 'center' | 'right'
  .set('key', value)     // Override any property
  .merge({ prop: value })  // Merge multiple properties
```

### Examples

**Disable sort and search:**
```ts
column('secretData').noSort().noSearch()
```

**Custom sort path:**
```ts
column('ingressTarget').sort('spec.rules[0].host')
```

**Custom width and label:**
```ts
column('targetPort').width(120).label('Port')
```

**Complex customization:**
```ts
column('state')
  .width(100)
  .sort(['stateSort', 'nameSort'])
  .search(false)
  .align('center')
```

## Pagination Configuration

The `pagination` property controls how columns are handled during server-side pagination:

### Auto-mapping (recommended)

```ts
headers: {
  columns: ['state', 'name', 'namespace', 'age'],
  pagination: 'auto'  // Automatically maps to STEVE_* equivalents
}
```

When `pagination: 'auto'` is set, Rancher automatically maps your columns to their Steve/SSP pagination equivalents:
- `'name'` → `STEVE_NAME_COL`
- `'namespace'` → `STEVE_NAMESPACE_COL`
- `'age'` → `STEVE_AGE_COL`
- etc.

### Same columns for pagination

```ts
headers: {
  columns: ['state', 'name', 'namespace', 'age'],
  pagination: 'same'  // Use the same columns
}
```

### Custom pagination columns

For complete control over pagination columns:

```ts
headers: {
  columns: ['state', 'name', 'namespace', 'chart', 'age'],
  pagination: {
    state: 'state',
    name: 'name',
    namespace: 'namespace',
    chart: {
      name: 'chart',
      sort: ['spec.chart.metadata.name'],
      search: ['spec.chart.metadata.name']
    },
    age: 'age'
  }
}
```

## Shared Configurations

Create reusable header configurations:

```ts
const standardListHeaders = {
  columns: ['state', 'name', 'namespace', 'age'],
  pagination: 'auto' as const
};

const productConfig: ProductChild[] = [
  {
    type: 'policy.pod-disruption-budget',
    headers: standardListHeaders
  },
  {
    type: 'policy.network-policy',
    headers: standardListHeaders
  },
  {
    type: 'policy.limit-range',
    headers: standardListHeaders
  }
];
```

## Custom Columns

Define completely custom columns for your CRDs:

```ts
headers: {
  columns: [
    'state',
    'name',
    {
      name: 'customField',
      label: 'Custom Field',
      value: 'spec.customData.field',
      sort: 'spec.customData.field',
      search: 'spec.customData.field',
      width: 150
    },
    'age'
  ],
  pagination: 'auto'
}
```

## Integration with Product Registration

Headers are configured as part of resource page definitions:

```ts
import { IPlugin, ProductChild } from '@shell/core/types';

export default function init(plugin: IPlugin) {
  const productConfig: ProductChild[] = [
    {
      type: 'apps.deployment',
      label: 'Deployments',
      headers: {
        preset: 'workload',
        pagination: 'auto'
      }
    },
    {
      type: 'core.service',
      label: 'Services',
      headers: {
        preset: 'namespaced',
        add: ['specType', 'targetPort'],
        pagination: 'auto'
      }
    },
    {
      type: 'core.pod',
      label: 'Pods',
      headers: {
        columns: ['state', 'name', 'namespace', 'node', 'podRestarts', 'podImages', 'age'],
        pagination: 'auto'
      }
    }
  ];

  plugin.addProduct(
    { name: 'my-product', label: 'My Product', icon: 'icon-app' },
    productConfig
  );
}
```

## Migration from Legacy DSL

If you're migrating from the legacy `headers()` DSL method, the new system is backward-compatible. Under the hood, your configuration is transformed into DSL calls:

**Legacy DSL:**
```ts
headers(schema) {
  return [
    STATE,
    NAME,
    NAMESPACE,
    AGE
  ];
}
```

**New approach:**
```ts
headers: {
  columns: ['state', 'name', 'namespace', 'age'],
  pagination: 'auto'
}
```

The new approach provides:
- Better discoverability (no need to know export names)
- Type safety and autocomplete
- Simplified pagination configuration
- Less boilerplate (90% code reduction)

## Troubleshooting

### TypeScript errors

If you see type errors, ensure you're using TypeScript 4.5+ and that your columns are properly typed:

```ts
// Correct - using 'as const' for string literals
const headers = {
  columns: ['state', 'name', 'age'],
  pagination: 'auto' as const
};

// Or let TypeScript infer the types
headers: {
  columns: ['state', 'name', 'age'],
  pagination: 'auto'
}
```

### Columns not appearing

1. Verify the column key is correct (check [Standard Columns Reference](#standard-columns-reference))
2. Check browser console for warnings about unknown columns
3. Ensure pagination is configured (`pagination: 'auto'` is recommended)

### Pagination issues

If server-side pagination isn't working correctly:

1. Use `pagination: 'auto'` to leverage automatic Steve column mapping
2. For custom columns, define explicit pagination column configurations
3. Check that your column keys match available pagination equivalents

## Best Practices

1. **Start with presets** — Use `preset: 'namespaced'` or similar for most resources
2. **Use `pagination: 'auto'`** — Let Rancher handle pagination mapping automatically
3. **Leverage TypeScript** — Autocomplete will guide you to valid column names
4. **Share configurations** — Create reusable header configs for similar resources
5. **Customize selectively** — Only use `column()` builder when you need specific customization
6. **Test with pagination** — Ensure your columns work correctly with server-side pagination enabled

## See Also

- [Product Registration](./products.md) — Main product registration documentation
- [Table Columns](./table-columns.md) — Adding custom columns via `addTableColumn` method
- [Legacy Products](./legacy/products-legacy.md) — Legacy DSL-based product registration
