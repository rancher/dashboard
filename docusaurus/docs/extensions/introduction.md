# Introduction

Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime.

Extensions can be created independently of Rancher and their code can live in separate GitHub repositories. They are compiled as [Vue](https://vuejs.org/) libraries and packaged
up with a simple Helm chart to allow easy installation into Rancher.

You can find some example extensions here: https://github.com/rancher/ui-plugin-examples

> Note: Rancher Extensions is in early development - support for Extensions was recently added to Rancher 2.7.0 and the internal Rancher team is building out
extensions using the extensions framework. Over time, the extensions API will improve and the supporting documentation will be built out, to enable
the wider developer community to build their own extensions.

## Overview

A Rancher Extension is a packaged Vue library that provides a set of functionality to extend and enhance the Rancher UI.

Developers can author, release and maintain extensions independently of Rancher itself.

Rancher defines a number of extension points which developers can take advantage of, to provide extra functionality, for example:

- Ability to add new locales and localization packs
- Ability to add support for custom CRDs
- Ability to add new UI screens to the top-level side navigation
- Ability to customize the landing page

> Note: More extension points will be added over time

Once an extension has been authored, it can be packaged up into a Helm chart, added to a Helm repository and then easily installed into a running Rancher system.
