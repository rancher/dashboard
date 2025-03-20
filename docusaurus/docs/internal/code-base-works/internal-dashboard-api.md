# Creating Your Own Internal API

This guide will walk you through creating and injecting custom Vue APIs for the Dashboard and `@rancher/shell` package by simply dropping a `.api.ts` file in a specific folder. Once set up, you can call your new APIs from any Vue component (e.g. `this.$myNewApi.someMethod()`).

---

## Overview

1. **Naming Convention**: Your primary API classes should end in `.api.ts` (e.g., `my-api.api.ts`).
2. **Location**: Place these files in the `shell/plugins/internal-api/` directory (subdirectories are supported).
3. **Static `apiName`**: Inside your class, define a static property named `apiName` (e.g., `static apiName = '$myNewApi'`), which determines the key by which your class is injected into Vue.
4. **Instantiation**: A Vue plugin (`internalApiPlugin`) automatically scans `shell/plugins/internal-api/`, imports each `.api.ts` file, creates a new instance of its default export, and injects it onto the Vue prototype as `$myNewApi`.

---

## Steps to Create & Use a New API

1. **Create a File**  
   Within `shell/plugins/internal-api/` (or its subdirectories), create a `.api.ts` file. For example:

   `shell/plugins/internal-api/my-api.api.ts`

2. **Export a Default Class**  
   Your class should extend the provided `BaseApi` class. This ensures that your API has access to common functionality (like the Vuex store) without reimplementing it for every API. The class must have:

   - A constructor that calls the `BaseApi` constructor with the Vuex.Store instance.
   - A static `apiName` property defining how it will be injected.
   - Custom methods or logic you need to expose to components.

   Example:

   ```ts
   // shell/plugins/internal-api/my-api.api.ts
   import BaseApi from "@shell/plugins/internal-api/shared/base-api";

   export default class MyApi extends BaseApi {
     // Name under which this API is injected => this.$myApi
     // The `$` prefix will be automatically added when the API is injected
     static apiName = "myApi";

     public doSomething() {
       console.log("Hello from MyApi");
     }
   }
   ```

3. **Usage in Vue Components**  
   Once the file is saved, the `internalApiPlugin` (as shown in your `install-plugins.js`) will automatically discover your API file (e.g. `my-api.api.ts`), instantiate it with the Vuex store, and inject an instance of `MyApi` onto the Vue prototype. This means that:

   - In an Options API component, you can access your API via this.$myApi.
   - In a Composition API component, you can access it using getCurrentInstance() (or via other injection methods) to retrieve the global properties.

### Options API Example

```vue
<template>
  <div>Options API Component: Check the console for API output.</div>
</template>

<script>
export default {
  name: "OptionsComponent",
  mounted() {
    // Using the injected API from the Vue prototype
    this.$myApi.doSomething();
  },
};
</script>
```

### Composition API Example

```vue
<template>
  <div>Composition API Component: Check the console for API output.</div>
</template>

<script setup>
import { getCurrentInstance, onMounted } from "vue";

// getCurrentInstance() gives you access to the component instance,
// which contains the proxy with all global properties including injected APIs.
const { proxy } = getCurrentInstance();

onMounted(() => {
  // Access the API via the proxy
  proxy.$myApi.doSomething();
});
</script>
```

---

## TypeScript Augmentation (Optional)

To get TypeScript IntelliSense for `this.$myApi`, you can manually augment the `vue` module. In `shell/types/vue-shim.d.ts`, you can import your API class and add a property to `ComponentCustomProperties`:

```ts
import type MyApi from "@shell/plugins/internal-api/my-api.api";

declare module "vue" {
  interface ComponentCustomProperties {
    $myApi: MyApi;
  }
}
```

Now, TypeScript will recognize `this.$myApi` in your Vue components.

---

## File Structure Example

Below is an example file structure showing multiple APIs in subdirectories:

```
shell/plugins/internal-api/
  ├── my-api.api.ts
  ├── cluster/
  │    ├── cluster-tools.api.ts
  │    └── some-helper.ts  <-- not injected
  └── rancher/
        └── rancher.api.ts
```

Each `.api.ts` file is automatically discovered and instantiated. Helpers or partial modules that do not follow the `.api.ts` naming scheme (like `some-helper.ts`) won’t be injected.

---

## How It Works

- **`install-plugins.js`** includes `internalApiPlugin` in `installInjectedPlugins()`.
- **`internalApiPlugin`** uses `require.context` to scan subdirectories under `shell/plugins/internal-api/`.
- For each file matching `*.api.ts`, it:
  1. Imports the file.
  2. Reads the default export (your class).
  3. Checks for a static `apiName` property; if not found, it falls back to the file name.
  4. Instantiates the class, passing in the Vuex store.
  5. Calls `inject(key, instance)`, which attaches your API to `Vue.prototype.$key`.

---

## Conclusion

With this setup:

1. **Create** a `.api.ts` class in `shell/plugins/internal-api/`.
2. **Define** `static apiName = '$something'`.
3. **Use** it in Vue components via `this.$something`.

Everything else—from discovery to injection—happens automatically. This approach keeps your code organized, fosters easy extension, and saves you from having to manually edit the main injection logic each time you add a new API.
