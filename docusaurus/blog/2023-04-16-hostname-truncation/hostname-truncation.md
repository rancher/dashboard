---
title: 'Cluster creation with NetBios compatibile hostnames'
description: Adding NetBios compatibility when creating a cluster
authors: [richa]
tags: [Manager, Windows]
---

## Truncating Hostnames

Kubernetes allows for 63 character hostnames but for systems running Windows there is a hard limit of 15 characters. We've added a checkbox to the cluster creation UI which will tell the Rancher server to truncate the machine pool hostnames to 15 character when creating a cluster.

![Hostname-truncation](./image.png)

Users will be notified when editing clusters or singular machine pools with settings beyond those supported by the UI. Changing the truncation setting after creation is currently not supported.

![Hostname-truncation-cluster-warning](./image1.png)

![Hostname-truncation-machine-pool-warning](./image2.png)

