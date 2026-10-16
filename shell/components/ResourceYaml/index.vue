<script>
import { ExtensionPoint, RelatedResourcesLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import Loading from '@shell/components/Loading.vue';
import SingleResourceYaml from './SingleResourceYaml.vue';
import MultiResourceYaml from './MultiResourceYaml.vue';
import { keyForResource } from '@shell/utils/related-resources/resource-key';
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

    // track if the user navigated here via form view and show a button to switch back to the form view
    showEditAsForm: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return {
      relatedResources:        /** @type {import('@shell/core/types').RelatedResource[]} */ ([]),
      loadingRelatedResources: false,
    };
  },

  // resolve once primary resources are fetched
  // resources related to those resources may still be loading
  // this allows us to display the multi yaml editor and primary resource as soon as we know multi editor should be used
  // the rest of the related resources are loaded asynchronously
  async fetch() {
    await new Promise((resolve, reject) => {
      this.loadRelatedResources(resolve).then(resolve, reject);
    });
  },

  computed: {
    isEdit() {
      return this.mode === _EDIT && this.$route?.query?.mode !== _VIEW;
    },

    // multi edit wont actually render until fetching related resources from the primary resource
    needsMultiEdit() {
      return this.isEdit && (this.loadingRelatedResources || this.relatedResources.length > 0);
    },

    // props are passed on on to SingleResourceYaml with v-bind
    // `showEditAsForm` is not used in singleresourceyaml and the prop would ultimately be rendered on a dom element
    // show-edit-as-form="…"
    singleResourceYamlProps() {
      const { showEditAsForm, ...props } = this.$props;

      return props;
    },
  },

  watch: {
    value() {
      this.loadRelatedResources();
    },

    isEdit() {
      this.loadRelatedResources();
    },
  },

  methods: {
    // the resource detail drawer calls this when its yaml tab becomes visible, so the editor can resize
    refresh() {
      this.$refs.single?.refresh();
    },

    /**
     * Resolve the related resources that can be edited by YAML alongside this one
     *
     * Load resources to be edited by yaml alongside this.resource (the primary resource). This function describes loading behavior.
     *
     * - fetchRelatedResourcesFor describes actual resource retrieval
     * - expandRelatedResourceTree describes fetching resources related to related resources, building a tree
     *
     * This is resolved on initialization (vs computed property) to accomodate async operations, either in resource models or extensions
     *
     *
     * @param {Function} [onFound] called once the primary resource is known to have related resources
     */
    async loadRelatedResources(onFound = () => {}) {
      // a load can be started again before this one finishes: the `value` and `isEdit` watchers call this method too
      // each load awaits requests, so an earlier load can finish after a later one
      // `forResource` records the resource this load is for, and `isCurrent` is checked after each await
      // a load whose resource has since been replaced, or that finishes after edit mode was left, writes no state
      // so `relatedResources` and `loadingRelatedResources` always describe the resource shown now
      const forResource = this.value;
      const isCurrent = () => this.value === forResource && this.isEdit;

      if (!this.isEdit) {
        this.relatedResources = [];
        this.loadingRelatedResources = false;

        return;
      }

      const found = (await this.fetchRelatedResourcesFor(this.value, this.$route, ALL_RELATED_RESOURCES)).filter((entry) => this.isRelatedResource(entry));

      if (!isCurrent()) {
        return;
      }

      if (!found.length) {
        this.relatedResources = [];
        this.loadingRelatedResources = false;

        return;
      }

      this.loadingRelatedResources = true;
      onFound();

      try {
        const resources = await this.expandRelatedResourceTree(found);

        if (isCurrent()) {
          this.relatedResources = resources.filter((entry) => this.isRelatedResource(entry));
        }
      } finally {
        if (isCurrent()) {
          this.loadingRelatedResources = false;
        }
      }
    },

    /**
     * Resources related to the current resource - short list of other kubernetes resources a user might want to edit alongside the primary resource
     *
     *  - load resources from steve-class methods that read schemas and metadata.relationships
     *  - load resources from resource models
     *  - load resources from extensions
     *
     * Entries are dropped when canYaml = false (no yanml representation to be shown in the UI)
     * Entries are shown under a read-only group if the user doesn't have edit permission
     *
     * @param {Object} resource
     * @param {Object} route The route the extension location configs are matched against
     * @param {import('@shell/core/types').RelatedResourcesFetchOptions} options
     * @returns {Promise<Array>} `RelatedResource` entries
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

      // avoid throwing errors w/ older extensions
      if (!this.$store.$extension?.getUIConfig) {
        return wanted(resources);
      }

      const extensions = getApplicableExtensionEnhancements(
        this,
        ExtensionPoint.RELATED_RESOURCES,
        RelatedResourcesLocation.RESOURCE_YAML,
        route
      );

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
     * Extensions match by route - ensure the route used when checking extensions has the 'resource' prop here used
     * in the 'resource' route param
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
     * For each related resource, collect its related resources, ignoring duplicates. Dupes are determined with a type+id combo,
     * which will fall back to object identity if type+id is not available.
     *
     * A read-only entry will not have related resources fetched.
     *
     * A resource found as a dependency is asked only for its own dependencies. A `dependent` is not
     * expanded, so only the primary resource's own dependents are shown, see
     * `RelatedResourcesFetchOptions`
     *
     * @param {Array} entries Initial list of `RelatedResource` entries
     * @returns {Promise<Array>} The expanded list, original entries first, as a flat list where each entry contains information about its position in the tree.
     */
    async expandRelatedResourceTree(entries) {
      const keysSeen = new Set();
      const refsSeen = new WeakSet();

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

      let generatedIds = 0;
      const nodeIdFor = (resource) => keyForResource(resource) || `related-${ generatedIds++ }`;

      // assyme an edit would fail on save if canEditYaml is false,
      // or be shortly overwritten by the controller, if one is defined
      // models/extensions may also set readOnly per resource
      const isReadOnly = (entry) => {
        if (entry.resource?.canEditYaml === false) {
          return true;
        }

        return entry.readOnly === undefined ? !!controllerReferenceOf(entry.resource) : !!entry.readOnly;
      };

      // if readOnly is explicitly set to false (vs being undefined/null)
      // ignore restrictions imposed by controllers - a model or extension is overriding that
      const readOnlyFields = (entry) => ({
        ...(isReadOnly(entry) ? { readOnly: true } : {}),
        ...(entry.readOnly === false ? { ignoreController: true } : {}),
      });

      // 'no parent' is treated like primary is the parent
      const result = entries.map((entry) => {
        const top = {
          ...entry, depth: 1, nodeId: nodeIdFor(entry.resource), ...readOnlyFields(entry)
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


            const expanded = {
              ...child,
              depth:    entry.depth + 1,
              nodeId:   nodeIdFor(child.resource),
              parentId: entry.nodeId,
              ...readOnlyFields(child),
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
     * Ensure each RelatedResource entry is valid - fields that should be functions are functions
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
    :loading="loadingRelatedResources"
    :done-route="doneRoute"
    :done-override="doneOverride"
    @error="$emit('error', $event)"
    @edit-as-form="$emit('edit-as-form')"
  />
  <SingleResourceYaml
    v-else
    ref="single"
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
