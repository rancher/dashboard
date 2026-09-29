<script>
import jsyaml from 'js-yaml';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import { foldAllComments, foldMatchingLines, foldYamlPath } from '@components/RcCodeMirror';
import Footer from '@shell/components/form/Footer';
import { ANNOTATIONS_TO_FOLD } from '@shell/config/labels-annotations';
import { ensureRegex } from '@shell/utils/string';
import { typeOf } from '@shell/utils/sort';

import {
  _CREATE,
  _VIEW,
  PREVIEW,
  _FLAGGED,
  _UNFLAG,
  _EDIT,
} from '@shell/config/query-params';
import { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { ExtensionPoint, EditableRelatedResourcesLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import Loading from '@shell/components/Loading.vue';
import SingleResourceYaml from './SingleResourceYaml.vue';
import MultiResourceYaml from './MultiResourceYaml.vue';
import { keyForResource } from '@shell/utils/resource-key';

export default {
  emits: ['error'],

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
    }
  },

  data() {
    return { editableRelatedResources: [] };
  },

  async fetch() {
    await this.loadEditableRelatedResources();
  },

  computed: {
    needsMultiEdit() {
      return this.editableRelatedResources.length > 0;
    },
  },

  // TODO nb does this watcher do anything
  watch: {
    value() {
      this.loadEditableRelatedResources();
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
     * Entries are `EditableRelatedResource` objects (a `resource` plus configuration for it, such
     * as save hooks, banner and groupKey). Anything that isn't of that shape is dropped, so a
     * badly behaved model or extension can't break the editor.
     *
     * This is resolved on initialization (vs computed property) to accomodate async operations, either in resource models or extensions
     */
    async loadEditableRelatedResources() {
      // Ensure a slow load for a previous resource doesn't overwrite the result for the current one
      const forResource = this.value;

      let resources = await this.fetchRelatedResourcesFor(this.value, this.$route);

      resources = await this.expandRelatedResourceTree(resources);

      if (this.value === forResource) {
        this.editableRelatedResources = resources.filter((entry) => this.isEditableRelatedResource(entry));
      }
    },

    /**
     * The related resources for one resource: the list from its model, then the extensions whose
     * location matches `route`, each seeing the previous result
     *
     * @param {Object} resource
     * @param {Object} route The route the extension location configs are matched against
     * @returns {Promise<Array>} `EditableRelatedResource` entries, not yet validated
     */
    async fetchRelatedResourcesFor(resource, route) {
      let resources = [];

      if (typeof resource?.fetchEditableRelatedResources === 'function') {
        try {
          resources = await resource.fetchEditableRelatedResources() || [];
        } catch (e) {
          console.warn('Failed to fetch related resources for', resource?.id, e); // eslint-disable-line no-console
        }
      }

      // gate it so that we prevent errors on older versions of dashboard
      if (!this.$store.$extension?.getUIConfig) {
        return resources;
      }

      const extensions = getApplicableExtensionEnhancements(
        this,
        ExtensionPoint.EDITABLE_RELATED_RESOURCES,
        EditableRelatedResourcesLocation.RESOURCE_YAML,
        route
      );

      // TODO nb track when multiple extensions are in play
      for (const { fetchExtensionEditableRelatedResources } of extensions) {
        if (typeof fetchExtensionEditableRelatedResources !== 'function') {
          continue;
        }

        try {
          const neu = await fetchExtensionEditableRelatedResources(resource, resources);

          if (Array.isArray(neu)) {
            resources = neu;
          }
        } catch (e) {
          console.warn('Extension failed to fetch related resources for', resource?.id, e); // eslint-disable-line no-console
        }
      }

      return resources;
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
     * before adding a resource that is already present in the tree
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
     * @param {Array} entries Initial list of `EditableRelatedResource` entries
     * @returns {Promise<Array>} The expanded list, original entries first
     */
    async expandRelatedResourceTree(entries) {
      const idsSeen = new Set(entries.map((e) => keyForResource(e.resource)).filter(Boolean));
      const refsSeen = new WeakSet(entries.map((e) => e.resource).filter(Boolean));

      // Every entry needs an identity of its own, so that a child can still point at its parent
      // when that parent's resource has no id
      let generatedIds = 0;
      const nodeIdFor = (resource) => keyForResource(resource) || `related-${ generatedIds++ }`;

      // Everything gathered for the primary resource sits at the top of the tree, with no parent
      const result = entries.map((entry) => {
        const top = {
          ...entry, depth: 1, nodeId: nodeIdFor(entry.resource)
        };

        delete top.parentId;

        return top;
      });
      const queue = [...result];

      while (queue.length) {
        const entry = queue.shift();
        const children = await this.fetchRelatedResourcesFor(entry.resource, this.routeForRelatedResource(entry.resource));

        for (const child of children) {
          if (!child?.resource) {
            continue;
          }

          const key = keyForResource(child.resource);
          const alreadySeen = key ? idsSeen.has(key) : refsSeen.has(child.resource);

          if (alreadySeen) {
            continue;
          }

          if (key) {
            idsSeen.add(key);
          } else {
            refsSeen.add(child.resource);
          }

          // Anything the model or extension set for the position of the entry is discarded
          const expanded = {
            ...child, depth: entry.depth + 1, nodeId: nodeIdFor(child.resource), parentId: entry.nodeId
          };

          result.push(expanded);
          queue.push(expanded);
        }
      }

      return result;
    },

    /**
     * Is this a valid `EditableRelatedResource` entry?
     *
     * @param {any} entry
     * @returns {boolean}
     */
    isEditableRelatedResource(entry) {
      const valid = !!entry?.resource &&
        ['beforeSaveHook', 'afterSaveHook', 'save', 'clone', 'banner'].every((fn) => !entry[fn] || typeof entry[fn] === 'function');

      if (!valid) {
        console.warn('Ignoring invalid editable related resource', entry); // eslint-disable-line no-console
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
    :related-resources="editableRelatedResources"
    @error="$emit('error', $event)"
  />
  <SingleResourceYaml
    v-else
    v-bind="$props"
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
