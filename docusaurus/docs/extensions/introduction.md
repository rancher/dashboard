# Introduction

A Rancher Extension is a packaged Vue library that provides a set of functionality to extend and enhance the Rancher UI.

Developers can author, release and maintain extensions independently of Rancher itself.

Rancher defines a number of extension points - the [**Extensions API**](./api/overview.md) - which developers can take advantage of, to provide extra functionality, for example:

- [**Create a new product**](./usecases/add-new-product.md) in Rancher
- [**Extend an existing product**](./usecases/extend-existing-product.md) in Rancher
- Add UI support for a new [**Node Driver managed Cluster**](./usecases/node-driver.md) UI
- Add UI support a new [**Hosted provider Cluster**](./usecases/hosted-provider.md) UI
- Add new UI for Kubernetes CRDs 
- Extend existing views in Rancher Manager by adding panels, tabs and actions 
- Customize the landing page 

> Note: More extension points will be added over time

Once an extension has been authored, it can be packaged up into a Helm chart, added to a Helm repository and then easily installed into a running Rancher system.
