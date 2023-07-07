# Rancher Extensions

Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime.

Extensions can be created independently of Rancher and their code can live in separate GitHub repositories. They are compiled as Vue libraries and packaged up with a simple Helm chart to allow easy installation into Rancher.

You can find some example extensions here: https://github.com/rancher/ui-plugin-examples

> Note: Rancher Extensions is in early development - support for Extensions was recently added to Rancher 2.7.0 and the internal Rancher team is building out extensions using the extensions framework. Over time, the extensions API will improve and the supporting documentation will be built out, to enable the wider developer community to build their own extensions.


// TODO: RC Add new section to cover IClusterProvisioner. Section should include cloud-crednetial and machine-config bits. Reference section from `code-base-works/machine-drivers` page
// TODO: RC Add new info to addTab part about customParams
