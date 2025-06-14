# Notification Center API

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

> For now, developers can use the Notification Centre via the VueX store. In the future, we will add an API for this, that will be fully supported as part of the UI Extensions API.

The Notification Center adds a 'bell' icon in the top-right of the Rancher Manager UI which supports a history of application notifications. When there are unread notifications, then bell icon shows a red dot, for example:

![Example Notification](./images/notification-headerbar.png)

> The existing `growl` store is deprecated - notifications added to the notification center of certain notification levels will automatically show growls.

## Adding a Notification

> Note: Types are defined in `shell/notifications.ts`

There is a new VueX store with actions under the `notifications` store.

```
  store.dispatch('notifications/add', notification);
```

Where `notification` is of type `Notification`. The properties on this type are:

|Field|Purpose|
|---|---|
|level|Notification level|
|title|Title to be displayed in the notification|
|message|Message to be shown in the notification (optional)|
|progress|Progress (0-100) for notifications of type `Task` (optional)|
|primaryAction|Primary action to be shown in the notification (optional)|
|secondaryAction|Secondary to be shown in the notification (optional)|
|id|Unique id (optional)|
|preference|User Preference tied to the notification (optional) (the preference will be updated when the notification is marked read)|

The `level` specifies the importance of the notification and determines the icon that is shown in the notification:

|Level|Purpose|
|---|---|
|Announcement|An announcement (like info but shows the announcement icon|
|Task|A task that is underway (will show progress bar if the `progress` field is et|
|Info|Information notificatoon|
|Success|Notification that something has completed successfully|
|Warning|Notification of a warning|
|Error|Notification of an error|

Example notification of type `Announcement`:

![Example Notification](./images/notification-example.png)

Note that the `id` field is optional - if not specified, the notification will be assigned a unique identifier. Using a known identifier is only really required if you wish to be able to look up a notification by a known identifier OR you wish to be able yo update a notification after being added.

### Actions

Notifications can contain one of both of a `Primary` of `Secondary` action. These are shown as buttons in the notification UI.

These actions can be specified by the `primaryAction` and `secondaryAction` fields. The type of both of these if `NotificationAction`.

`NotificationAction` contains two fields:

|Field|Purpose|
|---|---|
|label|Button label for the action|
|target|HREF link that will be opened in a new tab when the action is invoked|

Currently actions only support opening a specified link in a new browser tab when the corresponding button is clicked.

# Updating a Notification

A notification can be updated by dispatching the action:

```
  store.dispatch('notifications/update', notification);
```

Where `notification` is of type `Notification`.

Note that `notification` MUST include an `id` field that specifies the identifier of an existing notification.

A typical use-case for updating a notification is to update the `progress` status of a `Task` notification.

# Linking a Notification to a User Preference

In some cases (e.g. remembering if a user has read the release notes), we wish to link a notification to a user preference, so that
when the user marks a notification as read or unread, it updates the preference accordingly.

This can be done via the optional `preference` field on the `Notification` type which is of type `NotificationPreference`.

This has the following fields:

|Field|Purpose|
|---|---|
|key|ID of the user preference|
|value|Value to store in the user preference when the corresponding notification is marked as read|
|unsetValue|Value to store in the user preference when the corresponding notification is marked as unread (optional - when not specified, the preference will be set to an empty string)|
