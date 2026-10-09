import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';
import { NEVER_ADD } from '@shell/utils/create-yaml';
import { deleteProperty } from '@shell/utils/object';
import { EXT_IDS } from '@shell/core/plugin';
import { patchWithFallback } from '@shell/apis/resources/patch-content-type';
import { keyForResource } from '@shell/utils/resource-key';
import { SCHEMA } from '@shell/config/types';
import { findIfExists, relatedEntry } from '@shell/utils/related-resources';
import { schemaForReference, schemaReferencesIn, schemasByKind } from '@shell/utils/schema-references';

// Some fields that are removed for YAML (NEVER_ADD) are required via API
const STEVE_ADD = [
  'metadata.resourceVersion',
  'metadata.fields',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.generateName',
  'metadata.ownerReferences',
];
const STEVE_NEVER_SAVE = NEVER_ADD.filter((na) => !STEVE_ADD.includes(na));

export default class SteveModel extends HybridModel {
  get name() {
    return this.metadata?.name || this._name;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.spec?.description || this._description;
  }

  /**
   * Set description based on the type of model available with private fallback
   */
  set description(value) {
    if (this.metadata?.annotations) {
      this.metadata.annotations[DESCRIPTION] = value;
    }

    if (this.spec) {
      this.spec.description = value;
    }

    this._description = value;
  }

  /**
   * Get all model extensions for this model
   */
  get modelExtensions() {
    return this.$extension.getDynamic(EXT_IDS.MODEL_EXTENSION, this.type) || [];
  }

  /**
   * Resources related to this one that the user should be able to edit by YAML alongside it
   *
   * This is resolved when the consuming component initialises (and not in a computed property), so
   * models extending this class can override it with an async implementation, for example to fetch
   * the resources they want to add
   *
   * Each entry wraps the resource alongside configuration for it. These are all given the same
   * context: the related resource in question, all of the related resources, the primary
   * resource (this one) and the reactive state of the editor
   * - `beforeSaveHook` / `afterSaveHook`, run either side of saving the related resource
   * - `save`, called instead of the related resource's own `save` when it is defined
   * - `banner`, resolving a banner to show for the resource, re-evaluated whenever anything it
   *   read from the context changes
   *
   * Override `fetchModelRelatedResources`, not this. This merges the resources this one owns
   * with the ones the model contributes itself, so a model that overrides this instead silently
   * drops the owned resources.
   *
   * ```
   * async fetchModelRelatedResources({ dependencies, dependents }) {
   *   const others = dependencies ? await this.$dispatch('findAll', { type: SOME_TYPE }) : [];
   *
   *   return others.map((resource) => ({
   *     resource,
   *     // the save writes the yaml in the editor, not `resource`, so the hook changes the yaml
   *     beforeSaveHook: ({ editorState, nodeId, initialYaml }) => {
   *       const related = jsyaml.load(editorState.yaml[nodeId] ?? initialYaml[nodeId]);
   *
   *       related.spec.foo = this.spec.foo;
   *       editorState.yaml[nodeId] = jsyaml.dump(related);
   *     },
   *     // `editorState.selected` is a `nodeId`, so compare with `keyForResource`, not `id`
   *     banner:         ({ editorState }) => editorState.selected === keyForResource(resource) ? { labelKey: 'some.key' } : null,
   *   }));
   * }
   * ```
   *
   * A model defines only the resources directly related to its own, and marks as `dependent` those
   * that use it and those it selects by label. Dependencies further away are found as the tree is
   * expanded, from the models of the resources in between, so every type in the tree gets the same
   * related resources on its own page. Dependents are gathered only for the primary resource, and
   * are not expanded. `options` says which of the two kinds are wanted, see `RelatedResourcesFetchOptions`
   *
   * Where more than one source gives the same resource, the first entry is kept, in this order
   * - `fetchModelRelatedResources`, since it carries the model's own groupKey, hooks and banner
   * - `fetchSchemaRelatedResources`
   * - `fetchOwnedRelatedResources`
   *
   * @param {import('@shell/core/types').RelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchRelatedResources(options = { dependencies: true, dependents: true }) {
    const sources = await Promise.all([
      this.fetchModelRelatedResources(options),
      this.includeSchemaRelatedResources ? this.fetchSchemaRelatedResources(options) : [],
      options.dependents && this.includeOwnedRelatedResources ? this.fetchOwnedRelatedResources() : [],
    ]);

    const keys = new Set();

    return sources.flatMap((entries) => (entries || []).filter((entry) => {
      const key = keyForResource(entry?.resource);

      if (!key) {
        return true;
      }

      if (keys.has(key)) {
        return false;
      }

      keys.add(key);

      return true;
    }));
  }

  /**
   * //TODO nb these method names are bad
   * The related resources this model contributes, on top of the ones it owns
   *
   * This is the method for a model or an extension to override. See
   * `fetchRelatedResources` for the shape of an entry.
   *
   * @param {import('@shell/core/types').RelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchModelRelatedResources() {
    return [];
  }

  /**
   * Gather the resources this one owns as related resources?
   *
   * Override to false for a type whose owned resources are not worth editing alongside it. That is
   * the deliberate way to suppress them; overriding `fetchRelatedResources` also works but
   * drops the merge with `fetchModelRelatedResources` too.
   *
   * @returns {boolean}
   */
  get includeOwnedRelatedResources() {
    return true;
  }

  /**
   * The resources this one owns, as related resources
   *
   * Steve records one entry in `metadata.relationships` per owned resource, with `rel: 'owner'`
   * and the `toType` / `toId` of the resource owned.
   *
   * A resource of a type the user can not get is dropped before fetching, as in
   * `fetchSchemaRelatedResources`. So is one of a type with no schema in this resource's store.
   * One the fetch finds missing or forbidden is dropped without a warning, see `findIfExists`
   *
   * An owned resource names this one in its `ownerReferences`, so it is a `dependent`
   *
   * Steve's relationships do not say whether the owner is the controller, so the entry is not marked
   * `readOnly` here. The editor reads `controller` from the resource's own `ownerReferences`, for
   * every entry whichever source returned it. A resource that `fetchModelRelatedResources` or
   * `fetchSchemaRelatedResources` also returns keeps the entry from that source, see `fetchRelatedResources`.
   *
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchOwnedRelatedResources() {
    const { ids } = this._relationshipsFor('owner', 'to');
    const wanted = ids.filter(({ type }) => !!type && this.$getters['schemaFor'](type)?.resourceMethods?.includes('GET'));

    const resources = await Promise.all(wanted.map(({ type, id }) => findIfExists(this, type, id)));

    return resources
      .filter((resource) => !!resource)
      .map((resource) => ({
        resource,
        // grouped by type, so owned resources of the same type share a heading
        group:     resource.typeDisplay,
        dependent: true,
      }));
  }

  /**
   * Gather the resources this one refers to as related resources?
   *
   * Override to false for a type whose references are not worth editing alongside it, for example
   * one listing every resource of a helm release.
   *
   * @returns {boolean}
   */
  get includeSchemaRelatedResources() {
    return true;
  }

  /**
   * The resources this one refers to, as related resources
   *
   * References are found from the schema definitions of this type, see `schemaReferencesIn`. The
   * type referred to is found from the schemas in this resource's store, so a reference to a type
   * the user can not see is dropped before fetching.
   *
   * So is a reference to a type the user can not get. That is told from the schema's
   * `resourceMethods`, as `attributes.verbs` lists what the api supports rather than what the user
   * may do.
   *
   * A reference without a namespace is to a resource in this one's namespace.
   *
   * A reference is a dependency, except for those `schemaReferencesIn` marks `dependent`.
   *
   * @param {import('@shell/core/types').RelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchSchemaRelatedResources(options = { dependencies: true, dependents: true }) {
    if (!this.metadata?.uid) {
      return [];
    }

    const schema = this.$getters['schemaFor'](this.type);

    await schema?.fetchResourceFields?.();

    const references = schemaReferencesIn(schema, this, (type) => this.$getters['schemaFor'](type))
      .filter((reference) => (reference.dependent ? options.dependents : options.dependencies));

    if (!references.length) {
      return [];
    }

    const byKind = schemasByKind(this.$getters['all'](SCHEMA));
    const wanted = new Map();

    references.forEach((reference) => {
      const target = schemaForReference(byKind, reference);
      const namespace = reference.namespace || this.metadata.namespace;

      if (!target?.resourceMethods?.includes('GET') || (target.attributes?.namespaced && !namespace)) {
        return;
      }

      const id = target.attributes?.namespaced ? `${ namespace }/${ reference.name }` : reference.name;
      const key = keyForResource({ type: target.id, id });

      if (key !== keyForResource(this) && !wanted.has(key)) {
        wanted.set(key, {
          type: target.id, id, dependent: !!reference.dependent
        });
      }
    });

    const found = await Promise.all([...wanted.values()].map(async({ type, id, dependent }) => {
      const resource = await findIfExists(this, type, id);

      return resource ? relatedEntry(resource, { dependent }) : null;
    }));

    return found.filter(Boolean);
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data);

    for (const field of STEVE_NEVER_SAVE) {
      deleteProperty(val, field);
    }

    return val;
  }

  paginationEnabled() {
    return this.$getters['paginationEnabled'](this.type);
  }

  /**
   * Show a growl when this resource was created with an autogenerated name.
   * The growl will display the resource type and the generated name, providing immediate feedback to the user about the creation of the resource.
   *
   * Call it once the resource has been created.
   */
  notifyGeneratedName() {
    if (this.metadata?.generateName && this.id) {
      // Split to remove the namespace if present (default/generated-xxx)
      const nameOnly = this.id.split('/').pop();

      // Avoid showing the growl without the ID.
      if (nameOnly.length > 0) {
        const resource = this.typeDisplay;

        // Show the growl with the resource type and generated name
        this.$dispatch('growl/success', {
          title:   this.t('generic.autogeneratedCreated.title', { resource }),
          message: this.t('generic.autogeneratedCreated.message', { id: nameOnly, resource }),
          timeout: 3000
        }, { root: true });
      }
    }
  }

  /**
   * RESOURCES API - ResourceInstance update method to send a PATCH request
   *
   * Strategic merge patch is attempted first, and resources that reject it are retried with merge
   * patch. See `patchWithFallback`.
   */
  async update(data) {
    if (!this.canEdit) {
      throw new Error(`ResourceInstance API error - ${ this.type }/${ this.id } - Cannot patch: permission denied`);
    }

    await patchWithFallback({
      storeName:    this.$getters['storeName'],
      resourceType: this.type,
      // A new options object per attempt - `save` mutates the one it's given
      send:         (contentType) => this.save({
        data,
        method:  'patch',
        headers: { 'content-type': contentType }
      }),
    });

    return this;
  }

  /**
   * RESOURCES API - ResourceInstance update method to send a PUT request
   */
  async replace() {
    if (!this.canEdit) {
      throw new Error(`ResourceInstance API error - ${ this.type }/${ this.id } - Cannot update: permission denied`);
    }

    await this.save();

    return this;
  }

  /**
   * RESOURCES API - ResourceInstance delete method to send a DELETE request
   */
  async delete() {
    if (!this.canDelete) {
      throw new Error(`ResourceInstance API error - ${ this.type }/${ this.id } - Cannot delete: permission denied`);
    }

    await this.remove();
  }
}
