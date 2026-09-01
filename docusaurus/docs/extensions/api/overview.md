# Extensions API

The Extensions API is the set of methods and configuration objects that your extension uses to register itself with Rancher and modify the UI. It is split into three areas:

| Area | What it covers |
|---|---|
| **Navigation** | Adding products, pages, and side-menu entries |
| **UI Extension Points** | Injecting content into existing Rancher pages (tabs, panels, cards, actions, table columns) |
| **Components & Resources** | Reusing Rancher shell components and registering custom resource views |

---

## Navigation

Use these APIs when you want to add new pages or products to the Rancher UI.

| API | When to use |
|---|---|
| [Products](./nav/products.md) | Register a top-level product (adds a nav entry in the main sidebar) |
| [Side Menu](./nav/side-menu.md) (`basicType`) | Add pages as entries in the product's side menu |
| [Routing](./nav/routing.md) (`addRoutes`) | Define the Vue Router routes that back your pages |
| [Resource Page](./nav/resource-page.md) (`configureType`) | Expose a Kubernetes resource as a navigable list/detail page inside your product |
| [Custom Page](./nav/custom-page.md) (`virtualType`) | Add a fully custom page (not backed by a K8s resource) to your product |
| [Page Templates](./nav/templates.md) | Choose a layout template (blank, default) for your custom or resource pages |
| [Product Registration](./nav/product-registration.md) | Experimental API for declarative product registration (Rancher 2.15+) |

---

## UI Extension Points

Use these APIs to inject content into **existing** Rancher pages without replacing them.

| API | Where content appears | Method |
|---|---|---|
| [Actions](./actions.md) | Header toolbar or resource list table row menus | `addAction` |
| [Tabs](./tabs.md) | Resource detail, create, edit pages, or the "Show configuration" slide-in | `addTab` |
| [Panels](./panels.md) | Resource detail masthead, top-of-detail area, resource list, or About page | `addPanel` |
| [Cards](./cards.md) | Cluster Dashboard page | `addCard` |
| [Table Columns](./table-columns.md) | Resource list view tables | `addTableColumn` |
| [Table Hooks](./table.md) | Low-level access to table rendering behaviour | `addTableHook` |

All extension point methods share a common [`LocationConfig`](./common.md) object that controls **where** and **when** the enhancement is shown (by product, resource, cluster, namespace, mode, etc.).

---

## Components & Resources

| API | When to use |
|---|---|
| [Shell Components](./components/components.md) | Reuse Rancher's built-in UI components (forms, inputs, banners, etc.) inside your extension pages |
| [Resource Views](./components/resources.md) | Override or extend the list/detail/edit views Rancher generates for Kubernetes resources |
| [Auto-Import](./components/auto-import.md) | Automatically register models, detail views, and edit views from folder conventions |

---

## Common Types

| Reference | Description |
|---|---|
| [LocationConfig](./common.md) | Shared config object that scopes all UI extension points to specific products, resources, clusters, etc. |
| [Concepts](./concepts.md) | Glossary of terms (top-level product, blank cluster, DSL, etc.) |
| [Metadata](./metadata.md) | Required extension metadata (`plugin.metadata`) displayed in the Extensions marketplace |

---

## Support Matrix

For a breakdown of which API hooks are available in each Rancher version, see the [Extension API Support Matrix](../support-matrix#extension-api-support-matrix).

## Examples

Working code examples that use these APIs can be found in the [Rancher UI Plugin Examples](https://github.com/rancher/ui-plugin-examples) repository and throughout the [Usecases](../usecases/overview.md) section.
