# Extension Telemetry in Dynamic Content Requests

SUSE UI extensions can add their own basic telemetry to the dynamic content request. They do this by registering a `telemetry` function in their init function. The function returns a set of query string params, and the Rancher UI adds these to the query string it already sends.

Because this uses the generic 'register' function, this won't break when loaded into older versions of Rancher.

## Background

The Rancher UI periodically fetches dynamic content (release notices, support notices, announcements). The request carries a query string of basic system information, such as a hashed system ID, the Rancher version, the cluster count, the known SUSE extensions installed, and browser and screen size. `SystemInfoProvider` collects this information and builds the query string. See [shell/utils/dynamic-content/info.ts](shell/utils/dynamic-content/info.ts).

Extension telemetry adds extra params to that query string.

## Registering a telemetry function

In the extension's init function, call `plugin.register` with the type `telemetry`:

```ts
import { IPlugin, TelemetryParams } from '@shell/core/types';

export default function(plugin: IPlugin) {
  // ...

  plugin.register('telemetry', 'my-extension', (getters: any): TelemetryParams => {
    return {
      'myext-feature': !!getters['features/get']('some-feature'),
      'myext-count':   getters['my-store/items']?.length || 0,
    };
  });
}
```

- **Type**: `'telemetry'` (also available as `EXT_IDS.TELEMETRY` in `@shell/core/plugin`).
- **Name**: identifies the function within the extension. An extension can register more than one telemetry function under different names.
- **Function**: a `TelemetryFunction` (`(getters: any) => TelemetryParams`) that receives the store getters and returns a map of param name to value.

How the extension works out its values is up to the extension.

## How it works

When the dynamic content request is being prepared, `SystemInfoProvider`:

1. **Collects the telemetry functions from SUSE extensions only.** An extension counts as a SUSE extension if either of these is true:
   - it is a built-in extension (compiled into the Rancher UI, for example `rancher-prime`);
   - its name is in the known SUSE extension list (`SUSE_EXTENSIONS` in `info.ts`), or in the `suseExtensions` setting delivered in the dynamic content payload.

   Telemetry functions registered by any other extension are ignored and never called.
2. **Calls each function** with the store getters and merges the results:
   - Only `string`, `number` and `boolean` values are kept. Other value types (objects, arrays, `null`, `undefined`, functions) are dropped.
   - If a function throws, or returns something that is not an object, it is skipped.
   - If more than one function returns the same param, the first value collected is used.
3. **Adds the params to the query string** after all of the standard params:
   - Param names and values are URL-encoded.
   - **A telemetry param never overwrites an existing param.** If its name matches a param that is already present (for example `v`, `uuid`, `p` or `cc`), it is dropped. Extensions can add information but can't change what Rancher already reports.

## Guidelines for extension authors

- **Prefix your param names** with a short extension-specific prefix (for example `rp-` for Rancher Prime). This avoids clashes with the standard params and with other extensions. Clashing params are silently dropped.
- **Keep it basic and anonymous.** Send small values such as flags, counts and versions. Do NOT send personal data, resource names or anything identifying.
- **Keep the function synchronous and cheap.** It runs while the request is being built, and async results are not supported. Read values that are already in the store rather than making API calls.
