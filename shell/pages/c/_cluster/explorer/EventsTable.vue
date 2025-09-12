<script>

import { MESSAGE, NAME, OBJECT, REASON } from '@shell/config/table-headers';
import { EVENT } from '@shell/config/types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { STEVE_EVENT_FIRST_SEEN, STEVE_EVENT_LAST_SEEN, STEVE_EVENT_OBJECT, STEVE_NAME_COL } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

const reason = {
  ...REASON,
  ...{ canBeVariable: true },
  width: 130,
};

const eventHeaders = [
  reason,
  OBJECT,
  MESSAGE,
  NAME, {
    name:        'date',
    label:       'Date',
    labelKey:    'clusterIndexPage.sections.events.date.label',
    value:       'timestamp',
    sort:        'timestamp:desc',
    formatter:   'Date',
    width:       220,
    defaultSort: true,
  },
];

export default {
  components: { PaginatedResourceTable },

  data() {
    return {
      schema:            null,
      events:            [],
      eventHeaders,
      paginationHeaders: null,
      allEventsLink:     {
        name:   'c-cluster-product-resource',
        params: {
          product:  EXPLORER,
          resource: EVENT,
        }
      }
    };
  },

  beforeMount() {
    const schema = this.$store.getters['cluster/schemaFor'](EVENT);

    const paginationHeaders = schema ? [
      reason,
      STEVE_EVENT_OBJECT,
      MESSAGE,
      {
        ...STEVE_NAME_COL,
        defaultSort: false,
      },
      STEVE_EVENT_FIRST_SEEN,
      STEVE_EVENT_LAST_SEEN,
      headerFromSchemaColString('Count', schema, this.$store.getters, true),
    ] : [];

    this.schema = schema;
    this.paginationHeaders = paginationHeaders;
  },

  mounted() {
    this.dismissRouteHandler = this.$router.beforeEach(this.onRouteChange);
  },

  methods: {
    async onRouteChange(to, from, next) {
      if (this.$route.name !== to.name) {
        await this.$store.dispatch('cluster/forgetType', EVENT);
      }

      next();
    }
  },

  beforeUnmount() {
    this.dismissRouteHandler();
  }
};
</script>

<template>
  <PaginatedResourceTable
    v-if="!!schema"
    :schema="schema"
    :headers="eventHeaders"
    :pagination-headers="paginationHeaders"

    key-field="id"
    :search="false"
    :table-actions="false"
    :row-actions="false"
    :groupable="false"
    :rows-per-page="10"
  >
    <template v-slot:header-right>
      <router-link
        data-testid="events-link"
        :to="allEventsLink"
        class="events-link"
      >
        <span>{{ t('glance.eventsTable') }}</span>
      </router-link>
    </template>
  </PaginatedResourceTable>
</template>

<style lang="scss" scoped>
.events-link {
  align-self: center;
  padding-right: 20px;
  white-space: nowrap;
}
</style>
