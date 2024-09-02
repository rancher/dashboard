# Routes

## Location

The core dashboard routes are defined in `shell/config/router.js`.

## Pattern 
Add an entry to the list of routes
```js
{
...
    routes: [
        {
            path: "/about",
            component: () => interopDefault(import('../pages/account/index.vue' /* webpackChunkName: "pages/account/index" */)),
            name: "about"
        }
    ]
...
}
```