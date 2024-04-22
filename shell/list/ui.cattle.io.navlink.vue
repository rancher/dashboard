<script>
import ResourceTable from '@shell/components/ResourceTable';
import { mapGetters } from 'vuex';

export default {
  name:       'ListNavLink',
  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },

    loading: {
      type:     Boolean,
      required: false,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: { ...mapGetters(['clusterId']) }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  >
    <template #cell:to="{row}">
      <template v-if="row.spec && row.spec.toService">
        <router-link :to="{name: 'c-cluster-product-resource-namespace-id', params: { cluster: clusterId, product: 'explorer', resource: 'service', namespace: row.spec.toService.namespace, id: row.spec.toService.name}}">
          {{ row.spec.toService.namespace }}/{{ row.spec.toService.name }}
        </router-link>:
        <a
          :href="row.link"
          :target="row.actualTarget"
          rel="noopener noreferrer nofollow"
        >
          {{ row.spec.toService.port || 'default' }}
          <i class="icon icon-external-link" />
        </a>
      </template>
      <template v-else-if="row.link">
        <a
          :href="row.link"
          :target="row.actualTarget"
          rel="noopener noreferrer nofollow"
        >
          {{ row.link.replace(/^https:\/\//,'') }}
          <i class="icon icon-external-link" />
        </a>
      </template>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </template>
  </ResourceTable>
</template>
