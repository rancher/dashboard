# Images #
This folder contains all the images that have the Rancher-specific content in them.
You can replace them by running the `rancher/rancher` container with:

```-v /path/to/your/logos:/usr/share/rancher/ui-dashboard/dashboard/_nuxt/assets/images/pl```

This replaces the entire folder, so you must supply all the files or they will be missing.

| File                        | Usage                                                     |
|:--------------------------- |:----------------------------------------------------------|
| half-logo.svg               | In the page header                                        |
| login-landscape.svg         | On the login screen                                       |
| setup-step-one.svg          | Initial setup screens                                     |
