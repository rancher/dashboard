# Auto-Import Folders

Rancher simplifies the registration of components through auto-import folders.

This must feature must be enabled in an extension, by calling the `importTypes` function in the extension's initialization function, for example:

```ts
import { importTypes } from '@rancher/auto-import';

// Initialize the extension
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // ...
}
```

With this enabled, the extension build tooling will auto-generate component registration for you, based on folder names, without you having
to do this manually.

The folder names match the `type` property of the `register` function. For example, to automatically register a `list` component, create a folder named `list`
in your extension and ensure the code above is added.

The `ID` of the component is taken from the filename, so to automatically get the equivalent of:

```ts
import NamespaceList from './NamespaceList.vue`;

// Initialize the extension
export default function(plugin: IPlugin) {

  plugin.register('list', 'namespace', NamespaceList);

  // ...
}
```

you would instead create the component `namespace.vue` in the `list` folder. Here the filename `namespace.vue` matches the id `namespace` (the `.vue` extension is ignored).
