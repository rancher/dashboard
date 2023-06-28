# Safe Mode

If you have developed and installed an Extension that has an issue that blocks the load of Rancher Dashboard, you might get "blocked" of accessing and navigating around Rancher Dashboard. In that case, there's a route path called `safeMode` that prevent's the load of installed Extensions, therefore regaining access to Rancher Dashboard.

To enable this safe mode, you just need to enter your Rancher Dashboard in the following way: `https://<- YOUR RANCHER BASE URL ->/safeMode`.