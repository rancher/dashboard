# Rancher Extensions

Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime.

Extensions can be created independently of Rancher and their code can live in separate GitHub repositories. They are compiled as Vue libraries and packaged up with a simple Helm chart to allow easy installation into Rancher.

You can find some example extensions here: https://github.com/rancher/ui-plugin-examples

**With the shift from Vue 2 to Vue 3 in Rancher v2.10, we released a new version of the Rancher Extensions documentation (v3). To help you update your extension for this change, a migration guide is available. Learn more about it [here](./rancher-2.10-support.md).**