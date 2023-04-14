---
title: 'Building ISO Images'
description: Allow the user to configure and build Elemental ISO images
authors: [alex, kwwii]
tags: [Manager, Elemental, Extensions]
---
## Configure and build ISOs via the UI

Currently, when users want to install an edge comuting machine and include it in an Elemental cluster they have to create an iso image which is properly configured with the endpoint information. 

To simplify this workflow we've added the ability to preconfigure an iso image build  for a given Elemental endpoint. After booting the image, the machine will be available to the Rancher for inclusion in a cluster.

![ISO Build](./image1.png)