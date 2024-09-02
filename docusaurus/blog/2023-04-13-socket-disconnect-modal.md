---
title: 'Inactivity notification and timeout settings in the UI'
description: Inactivity notification and timeout settings in the UI
authors: [eden]
tags: [Manager, Modal, Timeout, Inactivity]
---
## Socket Timeout UX

As part of Rancher Manager's wider performance improvement work, we looked at simple ways to improve the browser's performance.

Users often have many tabs open in their browser, each connecting to the Rancher backend via sockets. To reduce this load when browser tabs go unnoticed, we will implement a user-configurable time-out to disconnect any sockets the UI has open to the backend. 

Once implemented, after a given time, the user will receive an intitial modal dialogue warning them of the pending socket time-out and allow them to reset the timer, signalling that the sockets should stay connected and a time-out modal when the time-out has expired.

## Workflow


Initially, the user will receive a modal dialogue with a countdown showing the time remaining until the sockets disconnect and a button allowing them to resume the session.

**Session expiration modal**

![Resume session](https://user-images.githubusercontent.com/120640736/224100284-79b6e0b4-3dd7-43dd-a4e3-b549f2f4c159.png)

After the timeout has expired, a modal will be shown informing the user that the sockets have been disconnected, and the user will need to refresh the page to restart the sockets.


**Session expired modal**

![Reload page](https://user-images.githubusercontent.com/120640736/224100461-60b68a5b-8161-4fd4-8073-93bcf01e890b.png)
