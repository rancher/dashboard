# Introduction

A Rancher Extension is a packaged Vue 3 library that adds or modifies functionality in the Rancher UI.

Developers can author, release and maintain extensions independently of Rancher itself, using the same tooling and component library that Rancher is built on.

## How extensions work at runtime

When an extension is installed, Rancher's Dashboard loads the extension's JavaScript bundle and calls its **default export** — an init function — passing it an `IPlugin` instance:

```ts
export default function(plugin: IPlugin) {
  // all registrations happen here
}
```

This function is called once at load time. Everything the extension contributes to the UI must be registered inside it.

## Key concepts

**`@rancher/shell`** is Rancher's published npm package. It provides the component library, type definitions, routing infrastructure, and the `IPlugin` interface that every extension implements. The version of `@rancher/shell` your extension targets determines Rancher version compatibility — see the [Support Matrix](./support-matrix.md).

**`IPlugin`** is the entry point for all extension registrations. Through it you can add products and pages, inject UI into existing Rancher pages (tabs, panels, actions, cards), set marketplace metadata, and access the DSL helpers.

**The DSL** (`plugin.DSL(store, productName)`) returns a set of helper functions — `product`, `basicType`, `virtualType`, `configureType` — that define a product's navigation structure. "DSL" stands for Domain-Specific Language.

## What you can build

Rancher defines a number of extension points — the [**Extensions API**](./api/overview.md) — which developers can use to add functionality:

- Add new UI screens to the top-level side navigation — [**Top-level product**](./usecases/top-level-product.md)
- Add new UI screens to the cluster-level side navigation — [**Cluster-level product**](./usecases/cluster-level-product.md)
- Add new hosted provider UI — [**Hosted provider**](./usecases/hosted-provider.md)
- Add new UI screens within the Cluster Explorer
- Add custom views for Kubernetes CRDs
- Extend existing Rancher pages with panels, tabs, actions, and cards
- Customize the landing page

> Note: More extension points will be added over time.

Once authored, an extension is packaged as a Helm chart, published to a Helm repository or container registry, and installed into a running Rancher instance via the Extensions page in the UI.

## Next steps

Ready to build your first extension? → [**Getting Started**](./extensions-getting-started.md)
