# Terminology

This is part of the developer [getting started guide](https://github.com/rancher/dashboard/blob/master/README.md).

The official Kubernetes [glossary](https://kubernetes.io/docs/reference/glossary/?fundamental=true) also explains Kubernetes-specific terminology.

| Term                                  | Description                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dashboard / Cluster Explorer / Vue UI | The application in this repository. It will slowly replace the older Ember UI                                            |
| Manager / Cluster Manager / Ember UI  | The old [Ember based UI](https://github.com/rancher/ui)                                                                  |
| Norman                                | Old Rancher API which has mostly been superseded by Steve                                                                |
| Steve                                 | New Rancher API                                                                                                          |
| Rancher (Product)                     | A [Kubernetes Management Platform](https://rancher.com/products/rancher/). This product includes the Rancher API and UIs |
| RKE                                   | [Rancher Kubernetes Engine](https://rancher.com/products/rke/) - A certified Kubernetes distribution                     |
| SSR                                   | Server Side Rendering. Disabled by default when developing the Dashboard (enabled pre 2.6.6)                             |
| SPA                                   | Single Page Application. Enabled by default in production                                                                |
| Vue                                   | [A frontend client framework used by the Dashboard](https://vuejs.org/)                                                  |
| Vuex                                  | [Frontend state management](https://vuex.vuejs.org/)                                                                     |
| Nuxt                                  | [Vue framework helper](https://nuxtjs.org/)                                                                              |