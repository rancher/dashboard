import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';
import { NEVER_ADD } from '@shell/utils/create-yaml';
import { deleteProperty } from '@shell/utils/object';
import { EXT_IDS } from '@shell/core/plugin';
import { keyForResource } from '@shell/utils/resource-key';

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
   * context: the related resource in question, all of the editable related resources, the primary
   * resource (this one) and the reactive state of the editor
   * - `beforeSaveHook` / `afterSaveHook`, run either side of saving the related resource
   * - `save`, called instead of the related resource's own `save` when it is defined
   * - `banner`, resolving a banner to show for the resource, re-evaluated whenever anything it
   *   read from the context changes
   *
   * Override `fetchOwnEditableRelatedResources`, not this. This merges the resources this one owns
   * with the ones the model contributes itself, so a model that overrides this instead silently
   * drops the owned resources.
   *
   * ```
   * async fetchOwnEditableRelatedResources() {
   *   const others = await this.$dispatch('findAll', { type: SOME_TYPE });
   *
   *   return others.map((resource) => ({
   *     resource,
   *     beforeSaveHook: (ctx) => ctx.resource.spec.foo = ctx.primaryResource.spec.foo,
   *     // `editorState.selected` is a `nodeId`, so compare with `keyForResource`, not `id`
   *     banner:         ({ editorState }) => editorState.selected === keyForResource(resource) ? { labelKey: 'some.key' } : null,
   *   }));
   * }
   * ```
   *
   * An entry from `fetchOwnEditableRelatedResources` wins over an owned entry for the same
   * resource, since it carries the model's own groupKey, hooks and banner.
   *
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchEditableRelatedResources() {
    const [own, owned] = await Promise.all([
      this.fetchOwnEditableRelatedResources(),
      this.includeOwnedEditableRelatedResources ? this.fetchOwnedEditableRelatedResources() : [],
    ]);

    const ownKeys = new Set((own || []).map((entry) => keyForResource(entry?.resource)).filter(Boolean));

    return [
      ...own || [],
      ...(owned || []).filter((entry) => !ownKeys.has(keyForResource(entry?.resource))),
    ];
  }

  /**
   * The editable related resources this model contributes, on top of the ones it owns
   *
   * This is the method for a model or an extension to override. See
   * `fetchEditableRelatedResources` for the shape of an entry.
   *
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources() {
    return [];
  }

  /**
   * Gather the resources this one owns as editable related resources?
   *
   * Override to false for a type whose owned resources are not worth editing alongside it. That is
   * the deliberate way to suppress them; overriding `fetchEditableRelatedResources` also works but
   * drops the merge with `fetchOwnEditableRelatedResources` too.
   *
   * @returns {boolean}
   */
  get includeOwnedEditableRelatedResources() {
    return true;
  }

  /**
   * The resources this one owns, as editable related resources
   *
   * Steve records one entry in `metadata.relationships` per owned resource, with `rel: 'owner'`
   * and the `toType` / `toId` of the resource owned.
   *
   * Only resources in the core kubernetes api group are gathered. Anything in a named group is
   * dropped on its type, before fetching, so it costs no requests.
   *
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnedEditableRelatedResources() {
    const { ids } = this._relationshipsFor('owner', 'to');
    const wanted = ids.filter(({ type }) => this.isCoreApiGroupType(type));

    const resources = await Promise.all(wanted.map(({ type, id }) => {
      const cached = this.$getters['byId'](type, id);

      if (cached) {
        return cached;
      }

      return this.$dispatch('find', { type, id }).catch((e) => {
        console.warn(`Failed to fetch owned resource ${ type }/${ id }`, e); // eslint-disable-line no-console

        return null;
      });
    }));

    return resources
      .filter((resource) => !!resource)
      .map((resource) => ({
        resource,
        // grouped by type, so owned resources of the same type share a heading
        group: resource.typeDisplay,
      }));
  }

  /**
   * Is this type in the core kubernetes api group?
   *
   * The core group is the empty group, so a core schema carries no `attributes.group`: the field
   * is `''` where it is sent at all. Everything else, `apps`, `rbac.authorization.k8s.io`,
   * `management.cattle.io`, names its group.
   *
   * A type with no schema is not core, and could not be fetched anyway.
   *
   * @param {string} type
   * @returns {boolean}
   */
  isCoreApiGroupType(type) {
    const schema = type ? this.$getters['schemaFor'](type) : null;

    return !!schema && !schema.attributes?.group;
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
   * Override the default save response processing to conditionally show a growl when a resource is created with an autogenerated name.
   * The growl will display the resource type and the generated name, providing immediate feedback to the user about the creation of the resource.
   *
   * @param {*} res
   */
  processSaveResponse(res, opt = {}) {
    super.processSaveResponse(res, opt);

    // Conditionally show the growl for autogenerated names
    if (res && res._status === 201 && res.metadata?.generateName && res.id && !opt.suppressSuccessToast) {
    // Split to remove the namespace if present (default/generated-xxx)
      const nameOnly = res.id.split('/').pop();

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
   */
  async update(data) {
    if (!this.canEdit) {
      throw new Error(`ResourceInstance API error - ${ this.type }/${ this.id } - Cannot patch: permission denied`);
    }

    console.error('Updating instance with data:', data); // eslint-disable-line no-console

    await this.save({
      data,
      method:  'patch',
      headers: { 'content-type': 'application/strategic-merge-patch+json' }
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
