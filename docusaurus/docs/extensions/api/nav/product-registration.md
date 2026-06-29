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

Register a product with pages and side-menu navigation. Can only be called **once per product name** — calling it again with the same name will throw an error.

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
| `product` | `ProductMetadataSinglePage` | Product metadata plus a `component` to render |

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
import { ProductMetadataSinglePage } from '@shell/core/plugin-products-external';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const product: ProductMetadataSinglePage = {
    name:      'my-dashboard',
    label:     'My Dashboard',
    sideBar:   { icon: { name: 'globe' } },
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
import { ProductMetadata, ProductChildCustomPage } from '@shell/core/plugin-products-external';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const overviewPage: ProductChildCustomPage = {
    name:      'overview',
    label:     'Overview',
    component: () => import('./pages/OverviewPage.vue'),
    sideMenu:  { weight: 2 }, // side-menu ordering (bigger number on top)
  };

  const settingsPage: ProductChildCustomPage = {
    name:      'settings',
    label:     'Settings',
    component: () => import('./pages/SettingsPage.vue'),
    sideMenu:  { weight: 1 },
  };

  const product: ProductMetadata = {
    name:    'my-app',
    label:   'My App',
    sideBar: { icon: { name: 'gear' } },
  };

  extension.addProduct(product, [overviewPage, settingsPage]);
}
```

> We recommend that ordering of the pages in the side menu entry is done via the order in the array of pages rather than using `weight`

### Product with resource pages

A product that displays Kubernetes resources using Rancher's built-in list/detail/edit views:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductMetadata, ProductChildResourcePage } from '@shell/core/plugin-products-external';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const clusterPage: ProductChildResourcePage = {
    type:     'provisioning.cattle.io.cluster',
    label:    'Clusters',
    can: {
      create: true,
      edit:   true,
      remove: true,
      yaml:   true,
    },
    views: { list: { showListMasthead: false } }, // prevent double masthead on types with custom list views
  };

  const nodePage: ProductChildResourcePage = {
    type:     'management.cattle.io.node',
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
} from '@shell/core/plugin-products-external';

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
    name:    'monitoring',
    label:   'Monitoring',
    sideMenu: {
      children: [alertsPage, metricsPage],
    },
  };

  // A standalone page outside any group
  const overviewPage: ProductChildCustomPage = {
    name:      'overview',
    label:     'Overview',
    component: () => import('./pages/OverviewPage.vue'),
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
import { ProductChildCustomPage } from '@shell/core/plugin-products-external';

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

All types are importable from `@shell/core/plugin-products-external`:

```ts
import {
  ProductMetadata,
  ProductMetadataSinglePage,
  ProductChildCustomPage,
  ProductChildResourcePage,
  ProductChildPage,
  ProductChildGroup,
  ProductChild,
  StandardProductName,
} from '@shell/core/plugin-products-external';
```

### `ProductMetadata`

The metadata that defines a product — its identity, icon, and product-level settings. This is passed as the first argument to `addProduct`.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique product identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `extendable` | `boolean` | No | Whether UI Extensions can add pages to this product |
| `enable` | `Object` | No | Conditions that control when this product is visible. Check [enable](#enable-optional--conditions-that-control-when-this-product-is-visible) object defintion |
| `appHeader` | `Object` | No | Controls what appears in the main application header. Check [appHeader](#appheader-optional--controls-what-appears-in-the-main-application-header) object defintion |
| `sideBar` | `Object` | No | Controls how the product appears in the vertical side bar. Check [sideBar](#sidebar-optional--controls-how-the-product-appears-in-the-vertical-side-bar) object defintion |
| `resources` | `Object` | No | Controls how resources are fetched, filtered and stored. Check [resources](#resources-optional--controls-how-resources-are-fetched-filtered-and-stored) object defintion |

<br/>

#### **`enable`** *(optional)* — Conditions that control when this product is visible:

| Property | Type | Description |
| --- | --- | --- |
| `ifFeature` | `string \| RegExp` | Only show the product if a feature flag is present |
| `ifHave` | `string` | Only show if the specified resource type exists |
| `ifHaveGroup` | `string \| RegExp` | Only show if the specified API group is present |
| `ifHaveType` | `string \| RegExp` | Only show if the specified resource type is present |
| `ifNotHaveType` | `string \| RegExp` | Hide if the specified resource type is present (opposite of `ifHaveType`) |

<br/>

#### **`appHeader`** *(optional)* — Controls what appears in the main application header:

| Property | Type | Description |
| --- | --- | --- |
| `icon` | `string` | Icon to display in the app header |
| `showNamespaceFilter` | `boolean` | Show the namespace filter in the header |
| `showClusterInfo` | `boolean` | Show cluster info in the header |
| `hideCopyConfig` | `boolean` | Hide the Copy KubeConfig button |
| `hideKubeConfig` | `boolean` | Hide the Download KubeConfig button |
| `hideKubeShell` | `boolean` | Hide the Kubectl Shell button |

<br/>

#### **`sideBar`** *(optional)* — Controls how the product appears in the vertical side bar:

| Property | Type | Description |
| --- | --- | --- |
| `weight` | `number` | Side-bar ordering (bigger number = higher in the list) |
| `icon.name` | `string` | Icon name (based on [rancher icons](https://rancher.github.io/icons/)). Defaults to `'extension'` |
| `icon.svg` | `Function` | Alternative to `icon.name` — provides the icon as an SVG (uses `require`) |

<br/>

#### **`resources`** *(optional)* — Controls how resources are fetched, filtered and stored:

| Property | Type | Description |
| --- | --- | --- |
| `hideSystemResources` | `boolean` | Hide system resources in lists |
| `store` | `string` | Vuex store to use by default (e.g. `'management'`) |

<br/>

### `ProductMetadataSinglePage`

A product that renders a single full-page Vue component with no side-menu. Extends `ProductMetadata` with:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `component` | `VueRouteComponent` | Yes | Vue component to render for the entire product |

<br/>

### `ProductChildCustomPage`

A page inside a product that renders a Vue component you provide. Equivalent to a `virtualType` in the legacy DSL approach.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique page identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `component` | `VueRouteComponent` | Yes | Vue component to render |
| `enable` | `Object` | No | Conditions that control when this page is visible. Check [enable](#enable-optional--conditions-that-control-when-this-page-is-visible) object definition |
| `sideMenu` | `Object` | No | Controls how this page appears in the side menu. Check [sideMenu](#sidemenu-optional--controls-how-this-page-appears-in-the-side-menu) object definition |
| `resource` | `Object` | No | Controls how resources are handled for this page. Check [resource](#resource-optional--controls-how-resources-are-handled-for-this-page) object definition |

<br/>

#### **`enable`** *(optional)* — Conditions that control when this page is visible:

| Property | Type | Description |
| --- | --- | --- |
| `ifHave` | `boolean` | Display only if a condition is met (relates to `IF_HAVE` in the store) |
| `ifFeature` | `string` | Display only if the specified feature flag is present |
| `ifHaveType` | `string` | Display only if the specified resource type exists |
| `ifHaveVerb` | `string` | Used with `ifHaveType` — display only if the resource type allows this verb (`GET`, `POST`, `PUT`, `DELETE`) |

<br/>

#### **`sideMenu`** *(optional)* — Controls how this page appears in the side menu:

| Property | Type | Description |
| --- | --- | --- |
| `weight` | `number` | Side-menu ordering (bigger number on top) |

<br/>

#### **`resource`** *(optional)* — Controls how resources are handled for this page:

| Property | Type | Description |
| --- | --- | --- |
| `namespaced` | `boolean` | Whether this custom page is namespaced |

<br/>

### `ProductChildResourcePage`

A page that displays a Kubernetes resource type using Rancher Dashboard's built-in list/detail/edit views. Equivalent to a `configureType` in the DSL approach.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | Yes | Kubernetes resource type (e.g. `'provisioning.cattle.io.cluster'`) |
| `label` | `string` | No | Override the display name for this resource type |
| `sideMenu` | `Object` | No | Controls the side-menu entry for this resource page. Check [sideMenu](#sidemenu-optional--controls-the-side-menu-entry-for-this-resource-page) object definition |
| `display` | `Object` | No | Controls what information is shown. Check [display](#display-optional--controls-what-information-is-shown) object definition |
| `can` | `Object` | No | Controls what actions are available for this resource type. Check [can](#can-optional--controls-what-actions-are-available-for-this-resource-type) object definition |
| `views` | `Object` | No | Controls how this resource behaves in list, detail, and create/edit pages. Check [views](#views-optional--controls-how-this-resource-behaves-in-list-detail-and-createedit-pages) object definition |
| `listConfig` | `Object` | No | Controls how all lists that show this resource behave. Check [listConfig](#listconfig-optional--controls-how-all-lists-that-show-this-resource-behave) object definition |

<br/>

#### **`sideMenu`** *(optional)* — Controls the side-menu entry for this resource page:

| Property | Type | Description |
| --- | --- | --- |
| `weight` | `number` | Side-menu ordering (bigger number on top) |
| `localOnly` | `boolean` | Hide this type from the nav on downstream clusters (only shows in the `local` cluster) |

<br/>

#### **`display`** *(optional)* — Controls what information is shown:

| Property | Type | Description |
| --- | --- | --- |
| `showState` | `boolean` | If `false`, hide state in columns and masthead |
| `showAge` | `boolean` | If `false`, hide age in columns and masthead |

<br/>

#### **`can`** *(optional)* — Controls what actions are available for this resource type:

| Property | Type | Description |
| --- | --- | --- |
| `create` | `boolean` | If `false`, disable creation even if the schema allows it |
| `edit` | `boolean` | If `false`, disable editing |
| `remove` | `boolean` | If `false`, disable deletion |
| `yaml` | `boolean` | If `false`, disable YAML editing and viewing |

<br/>

#### **`views`** *(optional)* — Controls how this resource behaves in list, detail, and create/edit pages:

| Property | Type | Description |
| --- | --- | --- |
| `list.createLabelKey` | `string` | Translation key to override the "Create" button label in the list view |
| `list.showListMasthead` | `boolean` | If `false`, hide the masthead in the list view. Defaults to `false` |
| `detail.showConfigView` | `boolean` | If `false`, hide the config button in the masthead when in view mode |
| `createEdit.showMasthead` | `boolean` | Show the masthead in the edit/create resource component |

<br/>

#### **`listConfig`** *(optional)* — Controls how all lists that show this resource behave:

| Property | Type | Description |
| --- | --- | --- |
| `headers` | `HeaderOptions[]` | Custom table column headers for the list view. See [Table headers](#table-headers-listconfigheaders) |
| `hideBulkActions` | `boolean` | Hide bulk action buttons (e.g. delete) for this resource in the list view. See [Hiding bulk actions](#hiding-bulk-actions-listconfighidebulkactions) |

<br/>

### `ProductChildGroup`

A collapsible folder/group in the product's side-menu that contains pages or other nested groups. Optionally, a group can have its own Vue component that renders when the group header is clicked (only for new products, not when extending).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Unique group identifier |
| `label` | `string` | Yes* | Display label (* either `label` or `labelKey` is required) |
| `labelKey` | `string` | Yes* | Translation key for the label |
| `component` | `VueRouteComponent` | No | Optional component to render when the group header is clicked |
| `sideMenu` | `Object` | Yes | Defines the group's children and ordering. Check [sideMenu](#sidemenu-required--defines-the-groups-children-and-ordering) object definition |

<br/>

#### **`sideMenu`** *(required)* — Defines the group's children and ordering:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ProductChild[]` | Yes | Array of pages or nested groups inside this group |
| `weight` | `number` | No | Side-menu ordering (bigger number on top) |
| `default` | `string` | No | Name of the default child to navigate to when the group is clicked (if no `component` is set) |

<br/>

### `ProductChildPage`

A union type representing any page item in a product configuration. It can be one of:

- `ProductChildCustomPage` — a custom page with a Vue component
- `ProductChildResourcePage` — a resource page for a Kubernetes type

```ts
type ProductChildPage = ProductChildCustomPage | ProductChildResourcePage;
```

<br/>

### `ProductChild`

A union type representing any item that can appear in a product configuration — either a page or a group. This is the type used for arrays passed to `addProduct` and `extendProduct`, and for the `children` property of `ProductChildGroup`.

```ts
type ProductChild = ProductChildGroup | ProductChildPage;
```

## Advanced Configuration

### Table headers (`listConfig.headers`)

Resource lists use Headers to control which columns appear in the resource list view, what data they display, and how they behave (sorting, searching, formatting).

By default these mostly come from the resource's definition and its `additionalPrinterColumns` field.

When you set `listConfig.headers` on a resource page, these columns **replace** the default columns.

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
  type:       'provisioning.cattle.io.cluster',
  listConfig: { headers: [STATE, NAME, NAMESPACE, AGE] },
};
```

> Note: The order of headers in the array determines the column order in the table (left to right).

#### Defining custom headers

You can define your own headers by providing objects that follow the `HeaderOptions` format. Custom headers can be mixed with built-in ones:

```ts
import { NAME, AGE } from '@shell/config/table-headers';

const clusterPage: ProductChildResourcePage = {
  type:       'provisioning.cattle.io.cluster',
  listConfig: {
    headers: [
      NAME,
      {
        name:  'provider',
        label: 'Provider',
        value: 'status.provider',
        sort:  'status.provider',
      },
      {
        name:   'nodeCount',
        label:  'Nodes',
        value:  'status.nodeCount',
        sort:   'status.nodeCount',
        search: false,  // exclude from search filtering
        width:  80,      // fixed column width
      },
      AGE,
    ],
  },
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

### Renaming types (`label`)

Use the `label` property directly on a resource page to override the display name for a resource type in the list view. This maps the resource's internal type to a custom label via the DSL `mapType` method.

```ts
const clusterPage: ProductChildResourcePage = {
  type:  'provisioning.cattle.io.cluster',
  label: 'Provisioned Clusters',
};
```

### Hiding bulk actions (`listConfig.hideBulkActions`)

Set `listConfig.hideBulkActions: true` on a resource page to hide the bulk action buttons (e.g. "Delete") from the list view toolbar. Users can still perform actions on individual resources.

```ts
const clusterPage: ProductChildResourcePage = {
  type:       'provisioning.cattle.io.cluster',
  listConfig: { hideBulkActions: true },
};
```

> **Known limitation:** Some built-in resource types in Rancher Dashboard have custom list views that explicitly control bulk action visibility. For those types, `listConfig.hideBulkActions` may have no effect. This may apply to a small number of resource types. If you notice that bulk actions are still showing after setting `listConfig.hideBulkActions: true`, the resource type likely has a custom list view that overrides this setting. See [#17426](https://github.com/rancher/dashboard/issues/17426) for more details.


## Rules & Constraints

When defining pages and groups in your product configuration, there are some important rules to keep in mind:

### `addProduct` can only be called once per product

Each product can only be registered once via `addProduct`. Calling `addProduct` a second time with the same product name will throw an error. If you need to add pages to an existing product, use `extendProduct` instead.

```ts
// ✅ Correct
extension.addProduct(product, [pageA, pageB]);

// ❌ Error — same product registered twice
extension.addProduct(product, [pageA]);
extension.addProduct(product, [pageB]); // throws
```

### Page types are mutually exclusive

A page item is either a **custom page** (has `component`) or a **resource page** (has `type`). Do not set both `type` and `component` on the same item. The API uses these properties to determine what kind of page to register:

- `component` defined &rarr; registers a custom page (`virtualType`)
- `type` defined &rarr; registers a resource page (`configureType`)

### Resource pages cannot have children

Only custom pages and groups can have `sideMenu.children`. A resource page (an item with `type`) cannot be turned into a group — it uses Rancher Dashboard's built-in list/detail/edit views and does not support child navigation.

### Groups cannot have a `type` property

A group (an item with `sideMenu.children`) cannot also have a `type` property. Groups are for organizing navigation — they do not display Kubernetes resources directly. Place resource pages as children of the group instead.

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
