# Translations for Rancher Prime

The example below demonstrates how to customize translation strings for Rancher Prime:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { mergeWithReplace } from '@shell/utils/object';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // here we merge the two translation files IF we are in a Rancher Prime env
  if (plugin.environment.isPrime) {
    const base = require('./l10n/en-us.yaml');
    const prime = require('./l10n/en-us-prime.yaml');
    const merged = mergeWithReplace(base, prime, { mutateOriginal: true });
    
    // here we register the newly merged translation file with the overrides
    plugin.register('l10n', 'en-us', merged);
  }
}

```

Besides the normal `/l10n/en-us.yaml` translation file, you can create a new translation file (in this example `/l10n/en-us-prime.yaml`) which overrides any duplicate keys on `/l10n/en-us.yaml` with the translations that are specific for Rancher Prime.

The `Shell` package offers you the `mergeWithReplace` method to use but you can use you custom merge function for objects or even lodash's `merge` method.