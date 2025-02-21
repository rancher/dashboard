# Introduction

For information about the supported Rancher APIs see [here](https://ranchermanager.docs.rancher.com/v2.8/api/quickstart)

The Rancher UI contains functionality to manage Kubernetes resources.

Developers can create, edit, fetch and remove individual resources or fetch collections of them. Resources that are fetched, by default, will be automatically updated via WebSocket

In addition the Rancher UI exposes permissions functionality around resources which can determine if the signed in user can perform the various actions around them.

# Resource Definitions

To understand about core concepts of schemas and resource types please continue reading at [Resource Definitions](./sub-pages/api-resource-definitions.md)

# Vuex Stores and Resources

To understand more about how resources are fetched, cached and updated please continue reading at [Vuex Stores and Resources](./sub-pages/api-vuex-and-resources.md)
