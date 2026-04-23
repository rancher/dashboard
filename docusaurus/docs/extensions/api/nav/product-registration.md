# Product Registration (Experimental)

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
| `config` | `ProductChildPage[]` or `ProductChildGroup[]` | Array of pages or groups that form the product's side-menu |

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
| `config` | `ProductChildPage[]` or `ProductChildGroup[]` | Array of pages or groups to add to the product |

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
  ProductChildPage,
  ProductChildGroup,
  StandardProductName,
} from '@shell/core/plugin-types';
```

### `ProductMetadata`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique product identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `icon` | `string` | No | Icon name (based on [rancher icons](https://rancher.github.io/icons/)). Defaults to `'extension'` |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `showClusterSwitcher` | `boolean` | No | Show the cluster switcher in navigation |
| `showNamespaceFilter` | `boolean` | No | Show the namespace filter in the header |

### `ProductSinglePage`

Extends `ProductMetadata` with:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `component` | `RouteComponent` | Yes | Vue component to render for the entire product |

### `ProductChildCustomPage`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique page identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `component` | `RouteComponent` | Yes | Vue component to render |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |

### `ProductChildResourcePage`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | Yes | Kubernetes resource type (e.g. `'provisioning.cattle.io.cluster'`) |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `config` | `ConfigureTypeConfiguration` | No | Resource page options (creatable, editable, removable, etc.) |

### `ProductChildGroup`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique group identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `children` | `ProductChild[]` | Yes | Array of pages or nested groups |
| `component` | `RouteComponent` | No | Optional component for the group's own page |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |


## Rules & Constraints

When defining pages and groups in your product configuration, there are some important rules to keep in mind:

### Page types are mutually exclusive

A page item is either a **custom page** (has `component`) or a **resource page** (has `type`). Do not set both `type` and `component` on the same item. The API uses these properties to determine what kind of page to register:

- `component` defined &rarr; registers a custom page (`virtualType`)
- `type` defined &rarr; registers a resource page (`configureType`)

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