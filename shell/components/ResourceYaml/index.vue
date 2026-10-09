<script>
import { ExtensionPoint, RelatedResourcesLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import Loading from '@shell/components/Loading.vue';
import SingleResourceYaml from './SingleResourceYaml.vue';
import MultiResourceYaml from './MultiResourceYaml.vue';
import { keyForResource } from '@shell/utils/resource-key';
import { ALL_RELATED_RESOURCES } from '@shell/utils/related-resources';
import { controllerReferenceOf } from '@shell/utils/related-resources/management';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const DEPENDENCIES_ONLY = { dependencies: true, dependents: false };

export default {
  emits: ['error', 'edit-as-form'],

  components: {
    Loading,
    SingleResourceYaml,
    MultiResourceYaml,
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    initialYamlForDiff: {
      type:    String,
      default: null,
    },

    yaml: {
      type:     String,
      required: true,
    },

    doneRoute: {
      type:    [String, Object],
      default: null,
    },

    offerPreview: {
      type:    Boolean,
      default: true,
    },

    parentParams: {
      type:    Object,
      default: null,
    },

    doneOverride: {
      type:    [Function, Object],
      default: null
    },

    showFooter: {
      type:    Boolean,
      default: true
    },

    showErrors: {
      type:    Boolean,
      default: true
    },

    applyHooks: {
      type:    Function,
      default: null,
    },

    /**
     * The yaml is shown in place of a form, so the multi-resource editor offers to go back to it
     *
     * `edit-as-form` is emitted once the user confirms
     */
    showEditAsForm: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return { relatedResources: [] };
  },

  async fetch() {
    await this.loadRelatedResources();
  },

  computed: {
    /**
     * Related resources are edited alongside the resource, so they are gathered in edit mode only
     *
     * View and create use SingleResourceYaml. A `mode` query of view shows the resource as view
     * whatever `mode` is, as in the `editorMode` of SingleResourceYaml
     */
    isEdit() {
      return this.mode === _EDIT && this.$route?.query?.mode !== _VIEW;
    },

    needsMultiEdit() {
      return this.isEdit && this.relatedResources.length > 0;
    },

    // SingleResourceYaml does not declare `showEditAsForm`, so it would fall through to its root element
    singleResourceYamlProps() {
      const { showEditAsForm, ...props } = this.$props;

      return props;
    },
  },

  // TODO nb does this watcher do anything
  watch: {
    value() {
      this.loadRelatedResources();
    },

    isEdit() {
      this.loadRelatedResources();
    },
  },

  methods: {
    /**
     * Resolve the related resources that can be edited by YAML alongside this one
     *
     * The primary resource's list is resolved against the current route. The whole list is then
     * transitively expanded: each related resource's list is resolved as though that resource were
     * the one in the route, and any results not already in the tree are appended. So an extension
     * registered for a type contributes wherever a resource of that type appears in the tree, with
     * no model needed for it.
     *
     * Entries are `RelatedResource` objects (a `resource` plus configuration for it, such
     * as save hooks, banner and groupKey). Anything that isn't of that shape is dropped, so a
     * badly behaved model or extension can't break the editor.
     *
     * This is resolved on initialization (vs computed property) to accomodate async operations, either in resource models or extensions
     */
    async loadRelatedResources() {
      // Ensure a slow load for a previous resource, or one started before leaving edit mode, doesn't overwrite the current result
      const forResource = this.value;

      if (!this.isEdit) {
        this.relatedResources = [];

        return;
      }

      let resources = await this.fetchRelatedResourcesFor(this.value, this.$route, ALL_RELATED_RESOURCES);

      resources = await this.expandRelatedResourceTree(resources);

      if (this.value === forResource && this.isEdit) {
        this.relatedResources = resources.filter((entry) => this.isRelatedResource(entry));
      }
    },

    /**
     * The related resources for one resource: the list from its model, then the extensions whose
     * location matches `route`, each seeing the previous result
     *
     * Entries of a kind `options` does not ask for are dropped, for models and extensions that
     * return them anyway
     *
     * Entries whose resource has `canYaml` false are dropped too, from every source, as their yaml
     * is not shown on their own page either
     *
     * @param {Object} resource
     * @param {Object} route The route the extension location configs are matched against
     * @param {import('@shell/core/types').RelatedResourcesFetchOptions} options
     * @returns {Promise<Array>} `RelatedResource` entries, not yet validated
     */
    async fetchRelatedResourcesFor(resource, route, options) {
      const wanted = (entries) => entries.filter((entry) => entry?.resource?.canYaml !== false &&
        (entry?.dependent ? options.dependents : options.dependencies)
      );
      let resources = [];

      if (typeof resource?.fetchRelatedResources === 'function') {
        try {
          resources = await resource.fetchRelatedResources(options) || [];
        } catch (e) {
          console.warn('Failed to fetch related resources for', resource?.id, e); // eslint-disable-line no-console
        }
      }

      // gate it so that we prevent errors on older versions of dashboard
      if (!this.$store.$extension?.getUIConfig) {
        return wanted(resources);
      }

      const extensions = getApplicableExtensionEnhancements(
        this,
        ExtensionPoint.RELATED_RESOURCES,
        RelatedResourcesLocation.RESOURCE_YAML,
        route
      );

      // TODO nb track when multiple extensions are in play
      for (const { fetchExtensionRelatedResources } of extensions) {
        if (typeof fetchExtensionRelatedResources !== 'function') {
          continue;
        }

        try {
          const neu = await fetchExtensionRelatedResources(resource, resources, options);

          if (Array.isArray(neu)) {
            resources = neu;
          }
        } catch (e) {
          console.warn('Extension failed to fetch related resources for', resource?.id, e); // eslint-disable-line no-console
        }
      }

      return wanted(resources);
    },

    /**
     * The current route with the resource params pointing at `resource`
     *
     * Everything else (product, cluster, mode, query, hash) is kept, so an extension location
     * config matches a related resource as it would match that resource shown on this page
     *
     * @param {Object} resource
     * @returns {Object}
     */
    routeForRelatedResource(resource) {
      const params = {
        ...this.$route.params,
        resource: resource?.type,
        id:       resource?.metadata?.name,
      };

      if (resource?.metadata?.namespace) {
        params.namespace = resource.metadata.namespace;
      } else {
        delete params.namespace;
      }

      return { ...this.$route, params };
    },

    /**
     * Walk each entry's resource and collect their related resources, breadth-first, stopping
     * before adding a resource that is already present in the tree, the primary resource included
     *
     * A resource found as a dependency is asked only for its own dependencies. A `dependent` is not
     * expanded, so only the primary resource's own dependents are shown, see
     * `RelatedResourcesFetchOptions`
     *
     * An entry is read-only where its source marked it `readOnly`, where the user can not edit the
     * resource's yaml (`canEditYaml` false: no update permission, a blocked PUT, or a type that is not
     * editable), or where another resource controls it (an ownerReference with `controller: true`),
     * as the controller would overwrite the edit. A read-only entry is not expanded
     *
     * The entries of one depth are expanded together, their results added in the order of the
     * entries, so the tree is the same whichever request finishes first
     *
     * Deduplication uses the resource's type and `id` together where available, falling back to
     * object identity so that resources fetched more than once are not added twice. The type is
     * part of the key because an `id` alone is only `namespace/name`, which two resources of
     * different types can share
     *
     * The result is a flat list, so each entry records where it sat in the tree it was discovered
     * in: `nodeId` (identifies the entry), `depth` (1 for the resources contributed for the
     * primary resource, one more for each level below that) and `parentId` (the `nodeId` of the
     * entry that contributed it, absent at depth 1). Entries are copied rather than mutated so
     * that a model or extension handing out the same object twice doesn't end up with the two
     * positions fighting over it.
     *
     * A resource reachable from more than one parent is added once, under the first parent that
     * reaches it, as that's the one that de-duplication keeps.
     *
     * @param {Array} entries Initial list of `RelatedResource` entries
     * @returns {Promise<Array>} The expanded list, original entries first
     */
    async expandRelatedResourceTree(entries) {
      const keysSeen = new Set();
      const refsSeen = new WeakSet();

      // true the first time a resource is passed, by key, or by identity for a resource with no key
      const isNew = (resource) => {
        const key = keyForResource(resource);
        const seen = key ? keysSeen.has(key) : refsSeen.has(resource);

        if (key) {
          keysSeen.add(key);
        } else {
          refsSeen.add(resource);
        }

        return !seen;
      };

      [this.value, ...entries.map((e) => e.resource)].filter(Boolean).forEach(isNew);

      // Every entry needs an identity of its own, so that a child can still point at its parent
      // when that parent's resource has no id
      let generatedIds = 0;
      const nodeIdFor = (resource) => keyForResource(resource) || `related-${ generatedIds++ }`;

      // an edit would fail on save, or be overwritten by the controller
      const isReadOnly = (entry) => !!(entry.readOnly || entry.resource?.canEditYaml === false || controllerReferenceOf(entry.resource));

      // Everything gathered for the primary resource sits at the top of the tree, with no parent
      const result = entries.map((entry) => {
        const top = {
          ...entry, depth: 1, nodeId: nodeIdFor(entry.resource), ...(isReadOnly(entry) ? { readOnly: true } : {})
        };

        delete top.parentId;

        return top;
      });

      let level = result;

      while (level.length) {
        const expandable = level.filter((entry) => !entry.dependent && !entry.readOnly);
        const childrenOf = await Promise.all(expandable.map((entry) => this.fetchRelatedResourcesFor(entry.resource, this.routeForRelatedResource(entry.resource), DEPENDENCIES_ONLY)));
        const next = [];

        expandable.forEach((entry, i) => {
          for (const child of childrenOf[i]) {
            if (!child?.resource || !isNew(child.resource)) {
              continue;
            }

            // Anything the model or extension set for the position of the entry is discarded
            const expanded = {
              ...child,
              depth:    entry.depth + 1,
              nodeId:   nodeIdFor(child.resource),
              parentId: entry.nodeId,
              ...(isReadOnly(child) ? { readOnly: true } : {}),
            };

            result.push(expanded);
            next.push(expanded);
          }
        });

        level = next;
      }

      return result;
    },

    /**
     * Is this a valid `RelatedResource` entry?
     *
     * @param {any} entry
     * @returns {boolean}
     */
    isRelatedResource(entry) {
      const valid = !!entry?.resource &&
        ['beforeSaveHook', 'afterSaveHook', 'save', 'banner'].every((fn) => !entry[fn] || typeof entry[fn] === 'function');

      if (!valid) {
        console.warn('Ignoring invalid related resource', entry); // eslint-disable-line no-console
      }

      return valid;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <MultiResourceYaml
    v-else-if="needsMultiEdit"
    :value="value"
    :yaml="yaml"
    :initial-yaml-for-diff="initialYamlForDiff"
    :apply-hooks="applyHooks"
    :show-edit-as-form="showEditAsForm"
    :related-resources="relatedResources"
    :done-route="doneRoute"
    :done-override="doneOverride"
    @error="$emit('error', $event)"
    @edit-as-form="$emit('edit-as-form')"
  />
  <SingleResourceYaml
    v-else
    v-bind="singleResourceYamlProps"
    @error="$emit('error', $event)"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps || {}"
      />
    </template>
  </SingleResourceYaml>
</template>
