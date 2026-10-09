# Related Resources in the YAML Editor

When a resource is edited as YAML and it has related resources, Rancher shows the multi-resource YAML editor in place of the single-resource one. The editor lists the resource and its related resources in a resource graph, and shows the YAML of the resource selected in the graph. Each resource can be saved on its own, or every edited resource can be saved together with "Save All Resources".

Rancher gathers the related resources of a resource from three sources:

- the resource's model, see [Shipping a model for your own type](#shipping-a-model-for-your-own-type)
- references found in the schema of the resource's type, see [References found without an extension](#references-found-without-an-extension)
- the resources it owns, from Steve's `metadata.relationships`

An extension can add, remove or reorder related resources with the `addRelatedResources` method.

A resource whose model returns `false` from `canYaml` is not shown in the editor, whichever source returns it.

Whichever source returns it, a resource is read-only when its model returns `false` from `canEditYaml`, or when it has an ownerReference with `controller: true`, as the controller would overwrite an edit. See `readOnly` in [RelatedResource](#relatedresource).

## References found without an extension

Before writing an extension, check whether Rancher already finds the reference. For a custom resource, Rancher reads the schema definition of each object in the resource. An object whose definition declares both a `kind` field and a `name` field is treated as a reference to another resource:

| Field in the definition | Used as |
|---|---|
| `kind` | The kind of the referenced resource. Required |
| `name` | The name of the referenced resource. Required |
| `apiGroup` or `group` | The API group of the referenced resource. An empty or unset value is the core group |
| `apiVersion` | Used for the API group when there is no `apiGroup` or `group` field. `group/version` gives `group`; `version` alone gives the core group |
| `namespace` | The namespace of the referenced resource. When unset, the namespace of the resource holding the reference |

When the definition declares no group field, or `apiVersion` is unset, the kind alone must identify one type. A reference whose kind matches more than one type is ignored.

A referenced resource is shown only when the user can get its type and the resource exists.

These are not found, and need an extension or a model:

- a string field holding only a name, for example `spec.configMapName`
- an object with no `kind` field, where the kind is implied by the field name
- a resource that refers to the one being edited, rather than being referred to by it

## addRelatedResources

This method adds a function that is given the related resources gathered so far for a resource, and returns the related resources to show.

Method:

```ts
plugin.addRelatedResources(where: String, when: LocationConfig, options: Object);
```

_Arguments_

`where` string parameter admissable values for this method:

| Key | Type | Description |
|---|---|---|
|`RelatedResourcesLocation.RESOURCE_YAML`| String | The resources shown with a resource in the multi-resource YAML editor |

<br/>

`when` Object admissable values:

`LocationConfig` as described above for the [LocationConfig object](./common#locationconfig).

The location config is matched against the route of the resource whose related resources are being gathered. For a related resource deeper in the graph, the route's `resource`, `namespace` and `id` params are replaced with those of that related resource, and the rest of the route is kept. So an extension registered for `{ resource: ['configmap'] }` runs when a ConfigMap is the resource being edited, and again for each ConfigMap found as a dependency of another resource in the graph.

Do not set `mode` in the location config. The YAML editor route has the query `mode=edit&as=yaml`, and the `edit` mode only matches a route with no `as` query.

<br/>

`options` config object. Admissable parameters for the `options` with `RelatedResourcesLocation.RESOURCE_YAML` are:

| Key | Type | Description |
|---|---|---|
|`fetchExtensionRelatedResources`| Function | `(resource, relatedResources, options) => RelatedResource[] \| Promise<RelatedResource[]>`. Returns the related resources of `resource`. See below |

`fetchExtensionRelatedResources` arguments:

| Argument | Type | Description |
|---|---|---|
|`resource`| Object | The resource whose related resources are being gathered. A model in the store, so `resource.$dispatch` and `resource.$getters` can be used to fetch other resources |
|`relatedResources`| `RelatedResource[]` | The related resources gathered so far, from the resource's model and from any extension that ran before this one |
|`options`| `RelatedResourcesFetchOptions` | `{ dependencies: boolean, dependents: boolean }`. Which kinds of related resources are wanted, see [Dependencies and dependents](#dependencies-and-dependents) |

The function returns the new list. To keep what was gathered, include `relatedResources` in the returned list. A returned value that is not an array is ignored, and the previous list is kept. A thrown error is logged to the console, and the previous list is kept.

The function runs when the editor loads, not during render, so it can be async.

Usage example for `RelatedResourcesLocation.RESOURCE_YAML`, adding the ConfigMap named in an annotation of a custom resource:

```ts
import { RelatedResourcesLocation } from '@shell/core/types';
import { findIfExists, relatedEntry } from '@shell/utils/related-resources';

plugin.addRelatedResources(
  RelatedResourcesLocation.RESOURCE_YAML,
  { resource: ['example.io.widget'] },
  {
    async fetchExtensionRelatedResources(resource, relatedResources, options) {
      const name = resource.metadata?.annotations?.['example.io/settings'];

      // the widget uses the configmap, so it is a dependency
      if (!options?.dependencies || !name) {
        return relatedResources;
      }

      // null when the configmap does not exist or the user can not get configmaps
      const settings = await findIfExists(resource, 'configmap', `${ resource.metadata.namespace }/${ name }`);

      return settings ? [...relatedResources, relatedEntry(settings)] : relatedResources;
    }
  }
);
```

## Dependencies and dependents

Each related resource is either a dependency or a dependent of the resource it was gathered for. A dependent's entry has `dependent: true`, which means:

- it is gathered only when the resource it was gathered for is the resource being edited
- it is not asked for its own related resources
- it is saved after the resource being edited

Set `dependent: true` on:

- a resource that uses the one it was gathered for, for example the Deployments mounting a ConfigMap
- a resource the one it was gathered for selects by label, for example the workloads a Service selects

Every other related resource is a dependency, for example the ConfigMap a Deployment mounts.

The graph is built from the resource being edited:

1. The resource being edited is asked for both kinds: `{ dependencies: true, dependents: true }`
2. Each dependency is then asked for its own dependencies only: `{ dependencies: true, dependents: false }`. This repeats for every dependency found, at every depth
3. A dependent is not asked for anything, nor is a read-only resource

Without this limit, the graph would take in every other resource using each dependency, then everything those resources use. A workload found by a selector would bring in everything it uses.

Check `options` before fetching. Entries of a kind that was not asked for are dropped after every extension has run, so returning them does not change the graph, but the requests made to find them are wasted.

A resource is shown once. When more than one resource in the graph finds the same resource, it is shown below the first one to find it.

Usage example, adding the widgets that use a ConfigMap as dependents of it:

```ts
import { RelatedResourcesLocation } from '@shell/core/types';
import { relatedEntry } from '@shell/utils/related-resources';

plugin.addRelatedResources(
  RelatedResourcesLocation.RESOURCE_YAML,
  { resource: ['configmap'] },
  {
    async fetchExtensionRelatedResources(resource, relatedResources, options) {
      if (!options?.dependents) {
        return relatedResources;
      }

      const widgets = await resource.$dispatch('findAll', { type: 'example.io.widget', opt: { namespaced: resource.metadata.namespace } });
      const users = widgets.filter((widget) => widget.metadata?.annotations?.['example.io/settings'] === resource.metadata.name);

      return [...relatedResources, ...users.map((widget) => relatedEntry(widget, { dependent: true }))];
    }
  }
);
```

## RelatedResource

Each entry of the list wraps one related resource with the configuration for it. Only `resource` is required.

| Key | Type | Description |
|---|---|---|
|`resource`| Object | The related resource, a model in the store |
|`dependent`| Boolean | `resource` uses the resource it was gathered for, or is selected by it. See [Dependencies and dependents](#dependencies-and-dependents) |
|`readOnly`| Boolean | `resource` is shown in view mode, with no save button, in the collapsed "Read-only" section of the graph, wherever it was found. It is not asked for its own related resources. The editor also makes an entry read-only where the model's `canEditYaml` is `false` or the resource has an ownerReference with `controller: true` |
|`group`| String | The heading the resource is shown under in the graph, already translated |
|`groupKey`| String | A translation key for the heading. `group` takes precedence |
|`banner`| Function | `(ctx) => { color?, label?, labelKey?, icon? } \| null`. A banner shown above the YAML while the resource is selected. Must be synchronous. Shown above the banner the editor adds, see [Banners the editor adds](#banners-the-editor-adds) |
|`beforeSaveHook`| Function | `(ctx) => void \| boolean \| Promise<void \| boolean>`. Runs before the resource is saved. Resolving to `false` cancels the save |
|`save`| Function | `(ctx) => resource \| Promise<resource>`. Saves the resource in place of the model's own `save`, for example through another API. The save hooks still run. Resolves to the saved resource; when that is a different resource, for example a replacement for an immutable one, the editor shows it in place of `resource` |
|`afterSaveHook`| Function | `(ctx) => void \| Promise<void>`. Runs after the resource is saved |

The editor sets `nodeId`, `depth` and `parentId` on each entry as it builds the graph. A value set by an extension for any of these is replaced.

An entry without a `resource`, or with a hook, `save` or `banner` that is not a function, is dropped with a warning in the console.

`relatedEntry(resource, { dependent, banner })` from `@shell/utils/related-resources` builds an entry grouped under the resource's type name, the same heading Rancher gives the related resources it finds itself.

### Context

`banner`, `beforeSaveHook`, `save` and `afterSaveHook` are each given one context object:

| Key | Type | Description |
|---|---|---|
|`resource`| Object | The related resource. In `afterSaveHook`, the saved resource |
|`primaryResource`| Object | The resource being edited |
|`relatedResources`| `RelatedResource[]` | Every related resource in the editor, `resource` included |
|`editorState`| Object | `{ yaml, selected }`. `yaml` holds the YAML in the editor for each resource opened in it, keyed by node id. `selected` is the node id of the resource shown. Reactive |
|`nodeId`| String | The node id of `resource`, its key in `editorState.yaml` |
|`primaryNodeId`| String | The node id of `primaryResource` |
|`initialYaml`| Object | The YAML of each resource as loaded, keyed by node id. Use this for a resource that has no entry in `editorState.yaml` because it was never opened |
|`saveResource`| Function | `(nodeId) => Promise<resource \| null>`. Saves another resource in the editor, its hooks included. Resolves to `null` when its `beforeSaveHook` cancelled the save |

A node id is the resource's type and id joined by `:`, for example `configmap:default/settings`. The id alone is not used, as two resources of different types can share a `namespace/name` id.

The editor wraps each `banner` function in its own computed property. The banner is re-evaluated when anything it read from the context changes, so read values from the context, not from variables captured when the entry was created.

Unless the entry defines `save`, a resource is saved from its YAML in `editorState.yaml`, not from `resource`. A change made to `resource` in a `beforeSaveHook` is not saved. To change what is saved, write the YAML in `editorState.yaml`.

The YAML is the resource as Kubernetes has it, as in the single resource YAML editor. It has none of the fields the Rancher API adds, such as `id`, `type` and `links`, and no server-managed metadata except `metadata.resourceVersion`. A `type` field of the resource itself, such as the type of a Secret, is shown as `type`. A `save` that makes a model from the YAML gets those fields back with `fromEditorYaml(ctx.resource, yaml)` from `@shell/utils/related-resources/yaml`:

```ts
import { fromEditorYaml } from '@shell/utils/related-resources/yaml';

const save = async({ resource, editorState, nodeId, initialYaml }) => {
  const model = await resource.$dispatch('create', fromEditorYaml(resource, editorState.yaml[nodeId] ?? initialYaml[nodeId]));

  return model.save();
};
```

Usage example, a banner shown while the resource is selected, and a hook copying a value from the YAML of the resource being edited into the YAML of the related resource before it is saved:

```ts
import jsyaml from 'js-yaml';

const entry = {
  ...relatedEntry(settings),

  banner: ({ editorState, nodeId }) => (editorState.selected === nodeId ? { color: 'info', labelKey: 'example.banners.sharedSettings' } : null),

  beforeSaveHook: ({ editorState, nodeId, primaryNodeId, initialYaml }) => {
    const primary: any = jsyaml.load(editorState.yaml[primaryNodeId] ?? initialYaml[primaryNodeId]);
    const related: any = jsyaml.load(editorState.yaml[nodeId] ?? initialYaml[nodeId]);

    related.metadata.labels = { ...related.metadata.labels, 'example.io/owner': primary.metadata.name };
    editorState.yaml[nodeId] = jsyaml.dump(related);
  },
};
```

### Banners the editor adds

The editor shows a banner of its own, below the entry's `banner`, when something else writes the selected resource. The first match decides:

1. an ownerReference with `controller: true`: the controller, linked
2. the annotation `objectset.rio.cattle.io/owner-gvk`: Rancher applies the resource for that owner, linked
3. the annotations `meta.helm.sh/release-name` and `objectset.rio.cattle.io/id`: Fleet deployed the resource in that helm release
4. the annotation `meta.helm.sh/release-name`: the helm release, linked to its Rancher App where there is one
5. a Secret named `sh.helm.release.v1.*` labelled `owner: helm`: the Secret helm keeps the release in

On a read-only resource only the first is shown, as the reason it is read-only. The resource being edited gets these banners too. A link is left out where it would lead to the resource being edited.

### Saving

Each resource in the graph has its own save button while it has unsaved changes. "Save All Resources" saves every edited resource in this order:

1. dependencies, the deepest first
2. the resource being edited
3. dependents

A save that fails or is cancelled by a `beforeSaveHook` stops the resources after it from being saved, and the editor stays open. The editor closes once every edited resource is saved.

Read-only resources are never saved.

## Removing related resources

The returned list replaces the one given, so an extension can remove entries that Rancher found:

```ts
plugin.addRelatedResources(
  RelatedResourcesLocation.RESOURCE_YAML,
  { resource: ['example.io.widget'] },
  { fetchExtensionRelatedResources: (resource, relatedResources) => relatedResources.filter((entry) => entry.resource.type !== 'secret') }
);
```

When every entry is removed, the single-resource YAML editor is shown.

## Shipping a model for your own type

An extension that ships a model for its own type, for example from the `models` folder with [auto-import](./components/auto-import), can define the related resources in the model instead. Extend `SteveModel` and override `fetchModelRelatedResources`. It takes the same `options` and returns the same entries:

```ts
import SteveModel from '@shell/plugins/steve/steve-class';
import { findIfExists, relatedEntry } from '@shell/utils/related-resources';

export default class Widget extends SteveModel {
  async fetchModelRelatedResources({ dependencies = true } = {}) {
    const name = this.metadata?.annotations?.['example.io/settings'];

    // a widget not yet created has no related resources
    if (!this.metadata?.uid || !dependencies || !name) {
      return [];
    }

    const settings = await findIfExists(this, 'configmap', `${ this.metadata.namespace }/${ name }`);

    return settings ? [relatedEntry(settings)] : [];
  }
}
```

Do not override `fetchRelatedResources`. It merges the model's own entries with the references found from the schema and the resources the resource owns. Where more than one of these gives the same resource, the model's own entry is kept, so a model can attach a banner or hooks to a resource that is also found from the schema.

Two getters turn the other sources off:

| Getter | Default | Set to `false` to |
|---|---|---|
|`includeSchemaRelatedResources`| `true` | not show the references found from the schema |
|`includeOwnedRelatedResources`| `true` | not show the resources this resource owns |

A model applies wherever a resource of its type is shown, and an extension's `fetchExtensionRelatedResources` runs after the model, so both can be used together.
