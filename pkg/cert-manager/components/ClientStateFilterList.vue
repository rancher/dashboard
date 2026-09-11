<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable';

/**
 * A resource list that filters client-side by the model `state` getter.
 *
 * The overview's per-state buckets deep-link here with `?stateFilter=expiring` (or `expiring,error`).
 * Those states are computed on the client (expiring, in-progress, ...) and the backend does not
 * store them under `metadata.state.name`, so it cannot filter on them. cert-manager renders its
 * lists client-side (no server-side pagination - see index.ts), so `ResourceList` loads the full set
 * into `rows` and we filter here by the same `state` getter the overview buckets are built from - so
 * bucket and filter always agree.
 *
 * `ResourceList` still renders the masthead, and its built-in `?stateFilter` badge bar ("Filtered to:
 * [Expiring] · clear") shows the active filter and clears it. This component supplies the missing
 * piece: actually narrowing the rows. Registered per type by thin wrappers in list/ (one per type
 * id); with no query param the list behaves normally.
 */
export default {
  name: 'ClientStateFilterList',

  components: { ResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    // Supplied by ResourceList as `:rows="rows"`. Client-side, these are full model instances, so
    // `row.state` (the cert-manager model getter) is available.
    rows: {
      type:    Array,
      default: () => [],
    },
    loading: {
      type:    Boolean,
      default: false,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false,
    },
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema, false);
    },

    /** The states to keep, from `?stateFilter=a,b`. Empty means "show everything". */
    stateFilter(): string[] {
      const q = this.$route.query.stateFilter;

      return q ? String(q).split(',').filter(Boolean) : [];
    },

    filteredRows(): any[] {
      const states = this.stateFilter;

      if (!states.length) {
        return this.rows;
      }

      return this.rows.filter((r: any) => states.includes(r.state));
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="filteredRows"
    :headers="headers"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
