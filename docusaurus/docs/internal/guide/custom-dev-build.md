# Custom Dashboard Dev Build

> This does not apply to the usual development cycle and is only used in specific custom cases

To use a custom dashboard build that is publicly available

1. Go to the burger menu (top left) --> `Global Settings` --> `Settings`
1. Scroll down to `ui-dashboard-index`. Use the three dot menu on the right to change this value to the location of the custom build
1. Scroll down to `ui-offline-preferred`. Use the three dot menu on the right to change this value to `Remote`

It's important to get this right. If there's a typo or any other issue the Rancher UI will become unavailable. If this happens either..

- whilst your UI session is still alive, go to `<rancher url>/v3/settings/ui-offline-preferred` and change to `true`.
- with your kube context point to the local / upstream cluster, run `kubectl edit settings.management.cattle.io ui-offline-preferred` and set `value` to `true`

Refresh the Rancher UI and it should be back, allowing the settings to be correctly updated.

This change will apply to all users of the dashboard after they refresh their page.