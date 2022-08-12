# Auth Sessions and Tokens

## First login

After instantiating Rancher for the first time, it will be required to pick a bootstrap password, which will be the `admin` password. Is it possible to include as environment variable `CATTLE_BOOTSTRAP_PASSWORD`.
The value of the password must be valid, e.g. not match the username value and be at least 12 characters. This last restriction can bd changed with `CATTLE_PASSWORD_MIN_LENGTH`.

Bear mind that the whole first access process will require both the steps to be completed.

This process cannot be reversed, still admin password can be changed in the profile page.

## Cookies

Rancher uses the following cookies:

| Name | Description |
|------|-------------|
| `R_SESS` | The logged in user's session token |
| `R_PCS`  | The user's preferred color scheme, used for server side rendering. If it's auto, it's the user's system preference. |
| `CSRF`   | Cross site request. The server sets this cookie as defined in the header of the request. For any request other than a GET request, we have to use Javascript to read this value and use it as a header in the request. That proves we are using our code on Rancher's domain and our header matches that cookie. |
| `R_REDIRECTED` | This cookie is used to redirect users from Ember to Vue when they upgrade from v2.5.x to v2.6.x. |
| `R_LOCALE` | Tracks the user's preferred language. |

When users log in to Rancher, the UI sends the username and password to the back end, then Rancher sends the logged-in user's session cookie in the response back to us. Rancher uses cookies to track the session for the following reasons:

- Cookies are automatically sent by the browser with any request that matches the domain. Note: In some edge cases the browser may not use the port.
- The cookie is http only, which means the browser uses it, but it cannot be accessed by Javascript in the browser. This is an important security feature because it means the cookie cannot be stolen by cross site scripting attacks.

In general, we use the browser's local storage for client-side-only settings including window height and language.

## Third-party Integration with Rancher Auth

Sometimes a third-party application needs to integrate with Rancher such that after you install it as a Helm chart in Rancher, you can also access the application from a link in the Rancher UI.

In the case of Harvester, we injected headers and groups to tell Harvester who the user is and what groups they belong to. This means that Harvester doesn't need to call the Rancher API.

Application integrating with Rancher auth should never maintain their own separate authentication state or session. Due to the difficulty of maintaining consistent authentication state across browser windows and tabs, it would be a security risk to use more than one session along with Rancher's session.

The following should be true of any auth system integrating with Rancher:

- Only Rancher tokens are used to authenticate users.
- The same session token is used for Rancher's session and the third party app session.
- Logging out of Rancher also must also log you out of the third-party application.
- Session storage is not used to store tokens.

We don't recommend using session storage for auth because two tabs will have different storage even if both tabs are opened on the same domain. In that case, opening a new tab on the same domain would show the user a log-in screen. It is a better user experience to be able to share the same session across multiple tabs.

## Custom NavLinks

To set up a link to a third-party navigation link in the left navigation bar, we recommend using the NavLink custom resource. For more information on how to configure custom NavLinks, see the [Rancher documentation.](https://rancher.com/docs/rancher/v2.6/en/admin-settings/branding/#custom-navigation-links) NavLinks open in another window or tab. You can define grouped entries in them as well.

A third-party app installed with a Helm chart can deploy the NavLink custom resource along with the app. When this resource is deployed, the link will be hidden for users without access to the proxy.