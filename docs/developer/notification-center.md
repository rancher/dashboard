# Notification Center API

<style>
  .svg-blue {
    width: 20px;
    filter: invert(56%) sepia(90%) saturate(1506%) hue-rotate(176deg) brightness(89%) contrast(84%);
  }
  .svg-green {
    width: 20px;
    filter: invert(52%) sepia(32%) saturate(562%) hue-rotate(70deg) brightness(97%) contrast(85%);    
  }
  .svg-orange {
    width: 20px;
    filter: invert(58%) sepia(92%) saturate(1804%) hue-rotate(2deg) brightness(104%) contrast(107%);
  }
  .svg-red {
    width: 20px;
    filter: invert(49%) sepia(94%) saturate(4070%) hue-rotate(336deg) brightness(102%) contrast(95%);
  }
</style>

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

> For now, developers can use the Notification Center via the VueX store. In the future, we will add an API for this, that will be fully supported as part of the UI Extensions API.

The Notification Center adds a 'bell' icon in the top-right of the Rancher Manager UI which supports a history of application notifications. When there are unread notifications, then bell icon shows a red dot, for example:

![Example Notification](./images/notification-headerbar.png)

> The existing `growl` store is deprecated - notifications added to the notification center of certain notification levels will automatically show growls.

## Adding a Notification

> Note: Types are defined in `@shell/types/notifications`

There is a new VueX store with actions under the `notifications` store.

```
  store.dispatch('notifications/add', notification);
```

Where `notification` is of type `Notification`. The properties on this type are:

|Field|Purpose|
|---|---|
|level|Notification level|
|title|Title to be displayed in the notification. Keep it concise, relevant and direct|
|message|Message to be shown in the notification (optional). This should expand on the notification title by providing further details about the notification|
|progress|Progress (0-100) for notifications of type `Task` (optional)|
|primaryAction|Primary action to be shown in the notification (optional)|
|secondaryAction|Secondary to be shown in the notification (optional)|
|id|Unique id (optional)|
|preference|User Preference tied to the notification (optional) (the preference will be updated when the notification is marked read)|

The `level` specifies the importance of the notification and determines the icon that is shown in the notification. You should use the `NotificationLevel` type from `@shell/types/notifications`.

|Level|Purpose|Icon|
|---|---|---|
|Announcement|An announcement. To be used when we want to inform on high-interest topics - news, updates, changes, scheduled maintenance, etc. E.g. “New version available!”|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-announcement.svg"/>|
|Task|A task that is underway. To be used when we want to inform on a process taking place - on-going actions that might take a while. E.g. “Cluster provisioning in progress”. The progress bar will also be shown if the `progress` field is set|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-busy.svg"/>|
|Info|Information notification. To be used when we want to inform on low-interest topics. E.g. “Welcome to Rancher v2.8"|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-info.svg"/>|
|Success|Notification that something has completed successfully. To be used when we want to confirm a successful action was completed. E.g. “Cluster provisioning completed”|<img class="svg-green" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-tick.svg"/>|
|Warning|Notification of a warning. To be used when we want to warn about a potential risk. E.g. “Nodes limitation warning”|<img class="svg-orange" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-warning.svg"/>|
|Error|Notification of an error. To be used when we want to alert on a confirmed risk. E.g. “Extension failed to load”|<img class="svg-red" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-error.svg"/>|

Example notification of type `Announcement`:

![Example Notification](./images/notification-example.png)

Note that the `id` field is optional - if not specified, the notification will be assigned a unique identifier. Using a known identifier is only really required if you wish to be able to look up a notification by a known identifier OR you wish to be able to update a notification after being added.

> Note: Be careful not to include sensitive information in notifications, since these are persisted to the browser's local storage

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

# Adding Notifications in a UI Extension

Add and manage notifications at load time using the `onLogin` navigation hook. `onLogin` is invoked when the user logs in and notifications have been loaded and initialized.

The `onLogin` hook can be set in the `init` function of your UI Extension with the `addNavHooks` function and using the `onLogin` hook, for example:

```
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {

  // ... Other initialization code ...

  // Register a navigation hook for when the user logs in
  plugin.addNavHooks({
    onLogin: async (store: any) => {
      await store.dispatch('notifications/add', { <notification> });
    }
  });
}
```

> Note: If you need to access the translation service for your notification messages, you can access the `t` function by obtaining it from the store with `  const t = store.getters['i18n/t'];`
