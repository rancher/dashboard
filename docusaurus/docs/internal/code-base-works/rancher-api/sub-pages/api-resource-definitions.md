# Resource Definitions

## Schemas
Schemas are provided in bulk via Rancher and cached locally in the relevant store (`management`, `rancher`, etc).

A schema can be fetched synchronously via store getter

```ts
import { POD } from '@shell/config/types';

this.$store.getters['cluster/schemaFor'](POD)`
```

> Troubleshooting: Cannot find new schema
> 
> Ensure that your schema text in `/config/types.js` is singular, not plural

As mentioned before a schema dictates the functionality available to that type and what is shown for the type in the UI.

A resource is an instance of a schema e.g. the `admin` user is an instance of type `management.cattle.io.user`.

## Types

Each type has a Kubernetes API group and a name, but not necessarily a human-readable name. Types are used mainly for building side navigation and defining how the UI should build forms and list views for each resource. For more information about types and how to use them, there are helpful comments in `store/type-map.js`.

