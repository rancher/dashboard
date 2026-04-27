# Product Registration (Experimental)

> Available from Rancher 2.15 and onwards

> Note: This API is experimental and may change in future releases.

## Overview

The product registration API provides a simplified way to register products and pages in Rancher Dashboard Extensions. It replaces the need to manually configure routes and DSL functions (`product`, `virtualType`, `configureType`, `basicType`) — all of which are handled automatically under the hood.

### When to use this API

Use this API when you want to:

- Quickly scaffold a new Extension product without dealing with routing boilerplate
- Add custom pages or resource pages to a product with minimal configuration
- Extend an existing Rancher Dashboard product (Explorer, Cluster Management, etc.) with new pages

For full control over routing and DSL configuration, continue using the [existing approach](./products.md).

> Note: For a set of copy-paste-ready examples covering common use cases, see [Product Registration Examples](../../usecases/product-registration-examples.md).

## Terminology

Before diving in, here are the key terms used throughout this API. If you're not familiar with the concepts of top-level and cluster-level products, check their definitions [here](../../api/concepts.md).

| Term | Description |
| --- | --- |
| **Product** | A top-level view in Rancher Dashboard that adds a navigation entry into the top-level slide-in menu (e.g. Fleet, Cluster Management) |
| **Custom page** | A page inside a product that renders a Vue component you provide. Equivalent to defining a `virtualType` in the DSL approach |
| **Resource page** | A page inside a product that displays a Kubernetes resource type using Rancher's built-in list/detail/edit views. Equivalent to defining a `configureType` in the DSL approach |
| **Spoofed type** | A synthetic/fake resource type that behaves like a real Kubernetes resource in the UI but is defined entirely by your Extension via a `getInstances` function. Equivalent to defining a `spoofedType` in the DSL approach |
| **Group** | A collapsible folder/group in the product's side-menu that contains pages or other groups |
| **Single page product** | A product with no side-menu — just one full-page Vue component |

## API Reference

All methods are called on the `extension` object in your Extension's `index.ts`.

### `addProduct(productName)`

The simplest way to register a product. Pass a string name and the product will be registered with a default empty page.

```ts
extension.addProduct('my-first-product');
```

This is a convenience/bridge method useful for getting started. You can expand to the full API signatures below once you are ready to add custom pages.

### `addProduct(product, config)`

Register a product with pages and side-menu navigation.

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `product` | `ProductMetadata` | Product name, label, icon, and other metadata |
| `config` | `ProductChild[]` | Array of pages or groups that form the product's side-menu |

### `addProduct(product)`

Register a single page product (no side-menu).

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `product` | `ProductSinglePage` | Product metadata plus a `component` to render |

### `extendProduct(product, config)`

Add pages to an existing Rancher Dashboard product.

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `product` | `StandardProductName` | One of: `'explorer'`, `'manager'`, `'settings'`, `'auth'` |
| `config` | `ProductChild[]` | Array of pages or groups to add to the product |

## Usage

> Note: We recommend building up configuration objects as separate `const` variables before passing them to `addProduct` or `extendProduct`. This gives you better TypeScript intellisense and autocomplete, and avoids some of the confusion when creating the objects directly in `addProduct` or `extendProduct`.

### Quick start

The fastest way to get a product registered. This registers a product with a default empty page:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  extension.addProduct('my-first-product');
}
```

### Single page product

A product that renders a single Vue component with no side-menu:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductSinglePage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const product: ProductSinglePage = {
    name:      'my-dashboard',
    label:     'My Dashboard',
    icon:      'globe',
    component: () => import('./pages/DashboardPage.vue')
  };

  extension.addProduct(product);
}
```

### Product with custom pages

A product with multiple custom pages listed as side-menu entries:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductMetadata, ProductChildCustomPage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const overviewPage: ProductChildCustomPage = {
    name:      'overview',
    label:     'Overview',
    component: () => import('./pages/OverviewPage.vue'),
    weight:    2, // side-menu ordering (bigger number on top)
  };

  const settingsPage: ProductChildCustomPage = {
    name:      'settings',
    label:     'Settings',
    component: () => import('./pages/SettingsPage.vue'),
    weight:    1,
  };

  const product: ProductMetadata = {
    name:  'my-app',
    label: 'My App',
    icon:  'gear',
  };

  extension.addProduct(product, [overviewPage, settingsPage]);
}
```

### Product with a spoofed type

A product with a spoofed type — a synthetic resource that you populate with data from your own function. Rancher Dashboard renders it using the standard list/detail views:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductMetadata, ProductChildSpoofedTypePage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const backupsPage: ProductChildSpoofedTypePage = {
    name:         'backups',
    label:        'Backups',
    getInstances: () => Promise.resolve([
      { id: 'backup-1', type: 'backups', name: 'Daily Backup' },
      { id: 'backup-2', type: 'backups', name: 'Weekly Backup' },
    ]),
  };

  const product: ProductMetadata = {
    name:  'my-app',
    label: 'My App',
  };

  extension.addProduct(product, [backupsPage]);
}
```

### Product with resource pages

A product that displays Kubernetes resources using Rancher's built-in list/detail/edit views:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductMetadata, ProductChildResourcePage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const clusterPage: ProductChildResourcePage = {
    type:   'provisioning.cattle.io.cluster',
    weight: 2,
    config: {
      displayName: 'Clusters',
      isCreatable: true,
      isEditable:  true,
      isRemovable: true,
      canYaml:     true,
    },
  };

  const nodePage: ProductChildResourcePage = {
    type:   'management.cattle.io.node',
    weight: 1,
  };

  const product: ProductMetadata = {
    name:  'my-resources',
    label: 'My Resources',
  };

  extension.addProduct(product, [clusterPage, nodePage]);
}
```

### Product with groups

Organize pages into collapsible folder/groups in the side-menu:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildCustomPage,
  ProductChildGroup
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  // Pages for the "Monitoring" group
  const alertsPage: ProductChildCustomPage = {
    name:      'alerts',
    label:     'Alerts',
    component: () => import('./pages/AlertsPage.vue'),
  };

  const metricsPage: ProductChildCustomPage = {
    name:      'metrics',
    label:     'Metrics',
    component: () => import('./pages/MetricsPage.vue'),
  };

  const monitoringGroup: ProductChildGroup = {
    name:     'monitoring',
    label:    'Monitoring',
    weight:   2,
    children: [alertsPage, metricsPage],
  };

  // A standalone page outside any group
  const overviewPage: ProductChildCustomPage = {
    name:      'overview',
    label:     'Overview',
    component: () => import('./pages/OverviewPage.vue'),
    weight:    3, // side-menu ordering (bigger number on top)
  };

  const product: ProductMetadata = {
    name:  'my-platform',
    label: 'My Platform',
  };

  extension.addProduct(product, [overviewPage, monitoringGroup]);
}
```

### Extending an existing product

Add new pages to one of Rancher Dashboard's built-in products:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductChildCustomPage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const customPage: ProductChildCustomPage = {
    name:      'my-custom-view',
    label:     'My Custom View',
    component: () => import('./pages/MyCustomView.vue'),
  };

  // Add a page to the Cluster Explorer product
  extension.extendProduct('explorer', [customPage]);
}
```

The products available for extension are:

| Name | Description |
| --- | --- |
| `'explorer'` | Cluster Explorer |
| `'manager'` | Cluster Management |
| `'settings'` | Global Settings |
| `'auth'` | Authentication & API Keys |

## Type Reference

All types are importable from `@shell/core/plugin-types`:

```ts
import {
  ProductMetadata,
  ProductSinglePage,
  ProductChildCustomPage,
  ProductChildResourcePage,
  ProductChildSpoofedTypePage,
  ProductChildPage,
  ProductChildGroup,
  ProductChild,
  StandardProductName,
} from '@shell/core/plugin-types';
```

### `ProductMetadata`

The metadata that defines a product — its identity, icon, and product-level settings. This is passed as the first argument to `addProduct`.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique product identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `icon` | `string` | No | Icon name (based on [rancher icons](https://rancher.github.io/icons/)). Defaults to `'extension'` |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `showClusterSwitcher` | `boolean` | No | Show the cluster switcher in navigation |
| `showNamespaceFilter` | `boolean` | No | Show the namespace filter in the header |
| `mapToGroup` | `{ condition: RegExp \| string; group: string }[]` | No | Map resources to specific side-menu groups based on a regex or resource ID. See [mapToGroup](#mapping-resources-to-groups-maptogroup) |
| `ignoreGroups` | `{ regexOrString: string \| RegExp; fn?: (getters: any) => boolean }[]` | No | Hide specific side-menu groups, unconditionally or based on a callback. See [ignoreGroups](#hiding-groups-ignoregroups) |

### `ProductSinglePage`

A product that renders a single full-page Vue component with no side-menu. Extends `ProductMetadata` with:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `component` | `RouteComponent` | Yes | Vue component to render for the entire product |

### `ProductChildCustomPage`

A page inside a product that renders a Vue component you provide. Equivalent to a `virtualType` in the DSL approach.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique page identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `component` | `RouteComponent` | Yes | Vue component to render |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |

### `ProductChildResourcePage`

A page that displays a Kubernetes resource type using Rancher Dashboard's built-in list/detail/edit views. Equivalent to a `configureType` in the DSL approach.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | Yes | Kubernetes resource type (e.g. `'provisioning.cattle.io.cluster'`) |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `config` | `ConfigureTypeConfiguration` | No | Resource page options (creatable, editable, removable, etc.) |
| `headers` | `any[]` | No | Custom table column headers for the list view. See [Table headers](#table-headers-headers) |
| `overrideListResourceName` | `string` | No | Override the display name for this resource type in the list view. See [Renaming types](#renaming-types-overridelistresourcename) |
| `hideFromNav` | `boolean` | No | Hide this resource type from the side-menu entirely. See [Hiding types](#hiding-types-from-navigation-hidefromnav) |
| `hideBulkActions` | `boolean` | No | Hide bulk action buttons (e.g. delete) for this resource type in the list view. See [Hiding bulk actions](#hiding-bulk-actions-hidebulkactions) |


### `ProductChildSpoofedTypePage`

A spoofed type is a synthetic/fake resource type that behaves like a real Kubernetes resource in the UI but is entirely defined by your Extension. You provide the instances via a function, and Rancher Dashboard renders them using the standard list/detail views. This is useful for displaying data from external APIs or computed data that doesn't correspond to an actual Kubernetes resource. 

See [more detailed information](#spoofed-types) on spoofed types.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique identifier for the spoofed type (also used as the `type` internally) |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `getInstances` | `() => Promise<any[]>` | Yes | Function that returns the spoofed resource instances. Each instance should have at least `id`, `type`, and `name` |
| `type` | `string` | No | Override the type identifier (defaults to `name`) |
| `namespaced` | `boolean` | No | Whether the spoofed type is namespaced (default: `false`) |
| `schemas` | `any[]` | No | Custom schema definitions. If not provided, a default schema is auto-generated |
| `collectionMethods` | `string[]` | No | HTTP methods allowed for the collection (default: `['GET']`) |
| `resourceFields` | `any` | No | Field definitions for the spoofed resource schema |
| `attributes` | `any` | No | Additional attributes for the spoofed resource schema |
| `headers` | `any[]` | No | Custom table column headers for the list view. See [Table headers](#table-headers-headers) |
| `overrideListResourceName` | `string` | No | Override the display name in the list view |
| `hideBulkActions` | `boolean` | No | Hide bulk action buttons for this spoofed type |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `ifHaveType` | `string` | No | Only show if the specified Kubernetes resource type exists |
| `exact` | `boolean` | No | Whether the route should match exactly |
| `group` | `string` | No | Group name to place this spoofed type under |

### `ProductChildGroup`

A collapsible folder/group in the product's side-menu that contains pages or other nested groups. Optionally, a group can have its own Vue component that renders when the group header is clicked (only for new products, not when extending).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique group identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `children` | `ProductChild[]` | Yes | Array of pages or nested groups |
| `component` | `RouteComponent` | No | Optional component for the group's own page |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |

### `ProductChildPage`

A union type representing any page item in a product configuration. It can be one of:

- `ProductChildCustomPage` — a custom page with a Vue component
- `ProductChildResourcePage` — a resource page for a Kubernetes type
- `ProductChildSpoofedTypePage` — a spoofed/synthetic resource type

```ts
type ProductChildPage = ProductChildCustomPage | ProductChildResourcePage | ProductChildSpoofedTypePage;
```

### `ProductChild`

A union type representing any item that can appear in a product configuration — either a page or a group. This is the type used for arrays passed to `addProduct` and `extendProduct`, and for the `children` property of `ProductChildGroup`.

```ts
type ProductChild = ProductChildGroup | ProductChildPage;
```

## Advanced Configuration

### Table headers (`headers`)

Both resource pages and spoofed type pages support custom table column headers via the `headers` property. Headers control which columns appear in the resource list view, what data they display, and how they behave (sorting, searching, formatting).

When you set `headers` on a page, these columns **replace** the default columns that Rancher Dashboard would normally generate for that resource type. If you don't set `headers`, Rancher Dashboard uses its default column set.

#### Using built-in headers

Rancher Dashboard provides a set of commonly used header definitions in `@shell/config/table-headers`. These are pre-configured with the correct `value` paths, formatters, and sorting for standard resource fields. Some of the most commonly used built-in headers:

| Header | Description |
| --- | --- |
| `NAME` | Resource name with a clickable link to the detail view (uses `LinkDetail` formatter) |
| `STATE` | Resource state with a colored badge (uses `BadgeStateFormatter`) |
| `AGE` | Resource age since creation (uses `LiveDate` formatter) |
| `NAMESPACE` | Resource namespace |

```ts
import { NAME, STATE, AGE, NAMESPACE } from '@shell/config/table-headers';

const clusterPage: ProductChildResourcePage = {
  type:    'provisioning.cattle.io.cluster',
  headers: [STATE, NAME, NAMESPACE, AGE],
};
```

> Note: The order of headers in the array determines the column order in the table (left to right).

#### Defining custom headers

You can define your own headers by providing objects that follow the `HeaderOptions` format. Custom headers can be mixed with built-in ones:

```ts
import { NAME, AGE } from '@shell/config/table-headers';

const clusterPage: ProductChildResourcePage = {
  type:    'provisioning.cattle.io.cluster',
  headers: [
    NAME,
    {
      name:  'provider',
      label: 'Provider',
      value: 'status.provider',
      sort:  'status.provider',
    },
    {
      name:     'nodeCount',
      label:    'Nodes',
      value:    'status.nodeCount',
      sort:     'status.nodeCount',
      search:   false,   // exclude from search filtering
      width:    80,       // fixed column width
    },
    AGE,
  ],
};
```

#### Using `getValue` for computed columns

When the data you want to display doesn't exist at a simple path on the row object, use the `getValue` function to compute the display value:

```ts
{
  name:     'fullName',
  label:    'Full Name',
  getValue: (row) => `${ row.metadata?.labels?.['first-name'] } ${ row.metadata?.labels?.['last-name'] }`,
  sort:     'metadata.labels.first-name',
}
```

#### Using formatters

Formatters transform raw values into formatted display output. Rancher Dashboard includes several built-in formatters in `@shell/components/formatter/`. Some commonly used ones:

| Formatter | Description |
| --- | --- |
| `LinkDetail` | Renders the value as a clickable link to the resource detail page |
| `BadgeStateFormatter` | Renders a colored state badge |
| `LiveDate` | Renders a relative timestamp that updates in real-time (e.g. "5 minutes ago") |
| `Link` | Renders a generic clickable link |

```ts
{
  name:          'status',
  label:         'Status',
  value:         'stateDisplay',
  formatter:     'BadgeStateFormatter',
  formatterOpts: { row: true }, // pass row data to the formatter
  width:         120,
}
```

#### Full header property reference

| Header Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique column identifier. Must be unique within the headers array |
| `label` | `string` | Column header text displayed at the top of the column |
| `labelKey` | `string` | Translation key for the column header (alternative to `label`) |
| `value` | `string` | Dot-notation path to the value on the row object (e.g. `'metadata.name'`, `'status.provider'`) |
| `sort` | `string \| string[] \| boolean` | Path(s) used for sorting. Use an array for multi-field sort (e.g. `['stateSort', 'nameSort']`). Set to `false` to disable sorting |
| `search` | `string \| boolean` | Path used for search/filtering. Set to `false` to exclude this column from search |
| `formatter` | `string` | Name of a built-in formatter component from `@shell/components/formatter/` or a custom formatter defined in your extension |
| `formatterOpts` | `any` | Configuration options passed to the formatter component |
| `width` | `number` | Fixed column width in pixels. If not set, the column auto-sizes |
| `getValue` | `(row: any) => string \| number \| null` | Custom function to extract or compute the display value from a row. Takes precedence over `value` for display, but `value` is still used for sorting/searching |

### Renaming types (`overrideListResourceName`)

Use `overrideListResourceName` to override the display name for a resource type or spoofed type in the list view. This maps the resource's internal type to a custom label via the DSL `mapType` method.

```ts
const clusterPage: ProductChildResourcePage = {
  type:                     'provisioning.cattle.io.cluster',
  overrideListResourceName: 'Provisioned Clusters',
};
```

### Hiding types from navigation (`hideFromNav`)

Set `hideFromNav: true` on a resource page to hide it from the side-menu entirely. The resource page is still accessible via its route — it just won't appear in the navigation. This is useful for resources that should be reachable from other pages but don't need a dedicated side-menu entry.

```ts
const clusterPage: ProductChildResourcePage = {
  type:        'provisioning.cattle.io.cluster',
  hideFromNav: true,
};
```

### Hiding bulk actions (`hideBulkActions`)

Set `hideBulkActions: true` on a resource page or spoofed type to hide the bulk action buttons (e.g. "Delete") from the list view toolbar. Users can still perform actions on individual resources.

```ts
const clusterPage: ProductChildResourcePage = {
  type:            'provisioning.cattle.io.cluster',
  hideBulkActions: true,
};
```

### Mapping resources to groups (`mapToGroup`)

Use `mapToGroup` on the product metadata to automatically assign resources to specific side-menu groups based on a regex pattern or exact resource ID. This is useful when you want to organize many resource types into logical groups without manually placing each one.

The `condition` can be a string (exact match on the resource ID) or a `RegExp` (pattern match).

```ts
const product: ProductMetadata = {
  name:  'my-app',
  label: 'My App',
  mapToGroup: [
    // All cert-manager resources go into the "certificates" group
    { condition: /^cert-manager\.io\./, group: 'certificates' },
    // A specific resource goes into the "networking" group
    { condition: 'networking.k8s.io.ingress', group: 'networking' },
  ],
};
```

### Hiding groups (`ignoreGroups`)

Use `ignoreGroups` on the product metadata to hide specific side-menu groups. Each entry specifies a `regexOrString` to match group names — either an exact string or a regex pattern.

The `fn` callback is optional. When provided, it receives the store getters and returns `true` to hide the group (conditional hide). When omitted, the group is always hidden (unconditional hide).

```ts
const product: ProductMetadata = {
  name:  'my-app',
  label: 'My App',
  ignoreGroups: [
    // Always hide the "internal" group (unconditional — no fn)
    { regexOrString: 'internal' },
    // Hide all groups matching a regex pattern (unconditional)
    { regexOrString: /^deprecated-.*/ },
    // Conditionally hide based on a feature flag
    {
      regexOrString: 'experimental',
      fn:            (getters) => !getters['features/isEnabled']('experimental-feature'),
    },
  ],
};
```

### Spoofed types

A spoofed type is a synthetic resource type that doesn't correspond to an actual Kubernetes resource. You define the data source via a `getInstances` function, and Rancher Dashboard renders it using the standard resource list/detail views — including the list table, detail page, and any configured actions.

This is useful for:

- Displaying data from external APIs (e.g. a backup service, monitoring data)
- Showing computed or aggregated data as if it were a resource
- Creating virtual resource views with custom data that doesn't live in Kubernetes

#### How spoofed types work

Under the hood, a spoofed type registers:

1. A **schema** — so Rancher Dashboard recognizes the type and can render the list/detail views. If you don't provide one, a default schema is auto-generated from the `name`, `collectionMethods`, `resourceFields`, and `attributes` you provide.
2. A **`getInstances` function** — called by Rancher Dashboard to fetch the data to display. This replaces the normal Kubernetes API call that would happen for a real resource.
3. A **route** — so the spoofed type has a URL path and appears in the side-menu.

The `type` identifier for the spoofed type defaults to the `name` you provide. This is what Rancher Dashboard uses internally to reference the spoofed type.

#### Basic usage

Each instance returned by `getInstances` must have at least `id`, `type`, and `name` properties. The `type` should match the spoofed type's name:

```ts
import { ProductChildSpoofedTypePage } from '@shell/core/plugin-types';

const backupsPage: ProductChildSpoofedTypePage = {
  name:         'backups',
  label:        'Backups',
  getInstances: () => Promise.resolve([
    { id: 'backup-1', type: 'backups', name: 'Daily Backup' },
    { id: 'backup-2', type: 'backups', name: 'Weekly Backup' },
  ]),
};
```

In a real Extension, `getInstances` would typically call an external API:

```ts
const backupsPage: ProductChildSpoofedTypePage = {
  name:         'backups',
  label:        'Backups',
  getInstances: async() => {
    const response = await fetch('https://my-api.example.com/backups');

    return response.json();
  },
};
```

#### Schema auto-generation

A schema is automatically generated for the spoofed type if you don't provide one via the `schemas` property. The auto-generated schema uses:

- `id` — set to the spoofed type's `name`
- `type` — set to `'schema'`
- `collectionMethods` — defaults to `['GET']` (read-only). Set to `['GET', 'POST']` if you want the UI to show a "Create" button, or `['GET', 'PUT', 'DELETE']` for edit/delete support
- `resourceFields` — defines the fields of the spoofed resource. Defaults to `{}`
- `attributes` — additional metadata. By default includes `{ namespaced: false }`

```ts
const backupsPage: ProductChildSpoofedTypePage = {
  name:              'backups',
  label:             'Backups',
  collectionMethods: ['GET', 'POST'],
  namespaced:        true,
  resourceFields:    {
    name:     { type: 'string' },
    schedule: { type: 'string' },
    status:   { type: 'string' },
  },
  getInstances: () => fetchBackups(),
};
```

If you need full control over the schema, you can provide it directly via the `schemas` array. Each schema object should have at minimum `id`, `type`, `collectionMethods`, `resourceFields`, and `attributes`:

```ts
const backupsPage: ProductChildSpoofedTypePage = {
  name:         'backups',
  label:        'Backups',
  schemas:      [{
    id:                'backups',
    type:              'schema',
    collectionMethods: ['GET'],
    resourceFields:    { name: { type: 'string' } },
    attributes:        { namespaced: false },
  }],
  getInstances: () => fetchBackups(),
};
```

#### Conditional display

Use `ifHaveType` to only show the spoofed type when a specific Kubernetes resource type exists in the cluster. This is useful for spoofed types that complement real resources:

```ts
const certStatusPage: ProductChildSpoofedTypePage = {
  name:         'cert-status',
  label:        'Certificate Status',
  ifHaveType:   'cert-manager.io.certificate',
  getInstances: () => fetchCertificateStatus(),
};
```

#### Table headers and list view options

Spoofed types support the same `headers`, `overrideListResourceName`, and `hideBulkActions` options as resource pages:

```ts
import { NAME, AGE } from '@shell/config/table-headers';

const backupsPage: ProductChildSpoofedTypePage = {
  name:                     'backups',
  label:                    'Backups',
  headers:                  [
    NAME,
    {
      name:  'schedule',
      label: 'Schedule',
      value: 'schedule',
      sort:  'schedule',
    },
    AGE,
  ],
  overrideListResourceName: 'Backup Jobs',
  hideBulkActions:          true,
  getInstances:             () => fetchBackups(),
};
```

> Note: Spoofed types are registered via the DSL `spoofedType` method and do NOT go through `configureType`. Only one set of resource CRUD routes is added per product, and spoofed types reuse these routes.

## Rules & Constraints

When defining pages and groups in your product configuration, there are some important rules to keep in mind:

### Page types are mutually exclusive

A page item is either a **custom page** (has `component`), a **resource page** (has `type`), or a **spoofed type** (has `getInstances`). Do not mix these defining properties on the same item. The API uses these properties to determine what kind of page to register:

- `component` defined &rarr; registers a custom page (`virtualType`)
- `type` defined &rarr; registers a resource page (`configureType`)
- `getInstances` defined &rarr; registers a spoofed type (`spoofedType`)

### Resource pages cannot have children

Only custom pages and groups can have `children`. A resource page (an item with `type`) cannot be turned into a group — it uses Rancher Dashboard's built-in list/detail/edit views and does not support child navigation.

### Groups cannot have a `type` property

A group (an item with `children`) cannot also have a `type` property. Groups are for organizing navigation — they do not display Kubernetes resources directly. Place resource pages as children of the group instead.

### Naming requirements

- Custom pages and groups require a `name` property (unique identifier used in routes)
- Resource pages require a `type` property (the Kubernetes resource type)
- Custom pages and groups require either `label` or `labelKey` (for display in the side-menu)
- Resource pages do not need `label` or `labelKey` — Rancher Dashboard resolves the display name from the resource schema

### Page names must be unique within a product

Each custom page and group must have a unique `name` within the same product configuration. Registering two pages with the same `name` at the same level will throw an error at registration time.

> Note: Pages with the same `name` in different groups are allowed, because the group prefix makes their resolved names different (e.g. `myapp-overview` and `myapp-admin-overview` are distinct).

### Resource types must be unique within a product

Each resource page `type` must appear only once in a product configuration. Registering the same Kubernetes resource type twice will throw an error at registration time.

### Ordering and default routes

- The first item in the config array (after ordering by `weight`) becomes the product's default landing route
- For groups without a `component`, the default route falls through to the group's first child
- Higher `weight` values place items higher in the side-menu (bigger number on top)
- When no weights are specified, the array order determines the side-menu order