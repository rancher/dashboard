# Product registration

*(Rancher version v2.14.0)*

This page describes the updated way to create or extend products using the extension API. The legacy flow is preserved in a “Legacy navigation & pages” section below.

## "addProduct" method
Creates a new product in Rancher (top-level navigation entry, routes, side menu, and pages defined by your config array).

```
plugin.addProduct(productMetadata, productConfig);
```

Where:

| Argument | Type | Description |
| --- | --- | --- |
| `productMetadata` | object | Product name and other relevant metadata like `name`, `label`, `icon`, `weight`, etc |
| `productConfig` | Array | Array of objects that specify the pages to be rendered, like custom pages (`virtualType`), resource pages (`configureType`), and groups. |

Example:
```ts
import { IPlugin, ProductMetadata, ProductChild } from '@shell/core/types';

export default function init(plugin: IPlugin) {
  const productMetadata: ProductMetadata = {
    name:  'my-product',
    label: 'My Product',
    icon:  'gear',
  };

  const productConfig: ProductChild[] = [
    {
      name:      'overview',   // virtualType (custom page)
      label:     'Overview',
      component: () => import('./pages/overview.vue'),
      weight:    50,
    },
    {
      type:   'provisioning.cattle.io.cluster', // configureType (resource page)
      label:  'Clusters',
      weight: 40,
    },
    {
      name:     'settings', // group with children
      label:    'Settings',
      children: [
        {
          name:      'general',
          label:     'General',
          component: () => import('./pages/settings/general.vue'),
        },
      ],
    },
  ];

  plugin.addProduct(productMetadata, productConfig);
}
```

### Product Metadata parameters

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Product identifier (used in route names/paths and translation key `product.<name>`) |
| `labelKey` | string | i18n key; overrides `label` |
| `label` | string | Display label (fallback if translation not found) |
| `icon` | string | Icon name (Rancher icon set) |
| `svg` | module | Optional SVG module instead of icon name |
| `weight` | number | Ordering in top-level menu (higher value = higher in order) |
| `showClusterSwitcher` | boolean | Whether to show cluster switcher the Header (default `false`) |
| `category` | string | Category label (default `global`) |

### Product Config parameters (children inside array)

| Field | Type | Applies to | Description |
| --- | --- | --- | --- |
| `name` | string | custom page, group | Unique page/group id (used in route names) |
| `labelKey` | string | custom page, group | i18n key; overrides `label` |
| `label` | string | custom page, group | Display label (if no `labelKey`) |
| `component` | component loader | custom page | Vue component for custom page. **Not allowed on group parent when extending**. |
| `children` | ProductChildPage[] | group | Child pages inside a group (can have their own `component`, `label`, `labelKey`, `weight`) |
| `type` | string | resource page | Kubernetes resource type (CRD or built-in) to render via resource views |
| `weight` | number | all | Side-menu ordering (higher value = higher in order within scope) |


## "extendProduct" method
Extend an existing product (`StandardProductName`) with extra pages, groups, and resources.

```
plugin.extendProduct(productName, productConfig);
```

Where:

| Argument | Type | Description |
| --- | --- | --- |
| `productName` | string | Product identifier to be extended. Admissible values are refered by `StandardProductName` |
| `productConfig` | Array | Array of objects that specify the pages to be rendered, like custom pages (`virtualType`), resource pages (`configureType`), and groups. |


Example:
```ts
import { IPlugin, ProductChild, StandardProductName } from '@shell/core/types';

export default function init(plugin: IPlugin) {
  const config: ProductChild[] = [
    {
      name:      'custom-settings',
      label:     'Custom Settings',
      component: () => import('./pages/custom-settings.vue'),
      weight:    90,
    },
    {
      type:   'upgrade.cattle.io.plan',
      weight: 80,
    },
  ];

  plugin.extendProduct(StandardProductName.EXPLORER, productConfig);
}
```

**Extending constraint:** when extending an existing product, a group parent cannot specify `component` (to avoid route-matching conflicts). Put components on the children inside the group.

### Standard Rancher products you can extend

Current enum values for `StandardProductName`:

- `EXPLORER` — Cluster explorer
- `MANAGER` — Cluster management
- `SETTINGS` — Global settings
- `FLEET` — Fleet
- `HARVESTER_MANAGER` — Harvester manager
- `AUTH` — Users & Authentication


### Product child items (config array)

| Field | Type | Applies to | Description |
| --- | --- | --- | --- |
| `name` | string | custom page, group | Unique page/group id (used in route names) |
| `labelKey` | string | custom page, group | i18n key; overrides `label` |
| `label` | string | custom page, group | Display label (if no `labelKey`) |
| `component` | component loader | custom page | Vue component for custom page. **Not allowed on group parent when extending**. |
| `children` | ProductChildPage[] | group | Child pages inside a group (can have their own `component`, `label`, `labelKey`, `weight`) |
| `type` | string | resource page | Kubernetes resource type (CRD or built-in) to render via resource views |
| `weight` | number | all | Side-menu ordering (higher value = higher in order within scope) |

## What Rancher wires in automatically

- **Routes** — `addProduct` creates the Vue Router entries for every custom page (previously `virtualType`) and resource page (previously `configureType`). Top-level products get paths like `<product>/c/:cluster/<page>`, and resource routes (list/create/edit/show) reuse Rancher’s built-ins. `extendProduct` adds matching `c-cluster-<product>-*` routes so your additions sit inside the existing product.
- **Side menu** — all first-level children are registered as nav items; groups register their children as a second level. Labels/weights are picked from your config; i18n keys are honored.
- **Default landing** — the first child after ordering becomes the product’s default route. If that child is a group, the default is the group page (when it has a component) or the group’s first child.

## Rules and constraints (what’s allowed)

- `type` defines a resource page; `component` defines a custom page. Do not set both on the same item.
- `children` turns an item into a **group**. A group may also provide a `component` to render an overview page. When **extending** an existing product, the group parent **cannot** have a `component` (route-matching conflict).
- `name` is required for custom pages and groups; `type` is required for resource pages.
- Only one set of resource CRUD routes is added per product; each `type` reuses them with the correct meta/params.


## Important concepts

### Custom page

- Represents a custom page rendered by your defined **component**.

### Resource page

- Represents a Kubernetes resource list/detail/create UI using dashboard resource components. Under the hood

### Groups and overview pages

- A **group** is any item with `children`. Its `name` becomes the nav id; its children are second-level entries.
- A group **can** have a `component` when you create a new product. That component renders an overview page for the group (exact-match route) and is the target when the group is the first item in your config.
- When extending an existing product, group parents must **not** provide `component`; add components to the children instead.

### Ordering rules (side navigation entries order)
- If no `weight` is specified, the order of the `productConfig` items in the array is the order of the menu items appearing on the side menu 
- Top-level product ordering uses `product.weight` (higher floats to the top of the main nav).
- Side-menu ordering uses each item’s `weight` (higher first). Groups respect their own `weight`, and children inside a group respect theirs.
- If you omit weights, Rancher seeds them for you: the smallest explicit weight (or `999` if none) becomes the starting point, and missing weights step downward in the order you declared items. That yields a stable order without having to hand-tune every value.
- The first item after ordering defines the default landing route. If that item is a group without an overview component, its first child becomes the default.

### Products without a side navigation

- Set `product.component` when calling `addProduct` to create a single-page product. Rancher registers a `plain` layout route and skips side-menu registration, so you get a full-bleed page with no sidebar.
- If you pass an empty config without a `component`, Rancher injects a default “Main” page and side-menu entry for you.

### Legacy navigation & pages

The prior DSL-first docs (manual `product`, `virtualType`, `configureType`, `basicType`, `weightType`, etc.) are kept for reference in the legacy section. Use them if you need full manual control but these will be **deprecated**.
