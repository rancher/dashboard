---
title: 'Truncating Hostnames'
description: Adding NetBios compatibility when creating a cluster
authors: [richa]
tags: [Manager, Windows]
---

## Creating a cluster with NetBios compatibile hostnames

Kubernetes allows for 63 character hostnames but for systems running Windows there is a hard limit of 15 characters. We've added a checkbox to the cluster creation UI which will tell the Rancher server to truncate the machine pool hostnames to 15 character when creating a cluster.

Users will be notified when editing clusters which have one or more truncated machine pool but changing the truncation setting is currently not possible.