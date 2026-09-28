<script>

import { MESSAGE, NAME, OBJECT, REASON } from '@shell/config/table-headers';
import { EVENT } from '@shell/config/types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { STEVE_EVENT_FIRST_SEEN, STEVE_EVENT_LAST_SEEN, STEVE_EVENT_OBJECT, STEVE_NAME_COL } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import EventsTableLink from './EventsTableLink';
import { isImprovedTablesEnabled } from '@shell/utils/table-views/feature';

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

// Local storage key for the events table row count preference
const ROWS_COUNT_PREF = 'events-row-count-pref';
// Value to use when we want to use the user's preference from the table
const ROWS_PREF_USE_TABLE = -1;
// Default number of rows to show in the events table when not set in the preference
const ROWS_COUNT_DEFAULT = 10;

export default {
  components: { PaginatedResourceTable, EventsTableLink },

  data() {
    const tableRowOptions = this.$store.getters['prefs/options'](ROWS_PER_PAGE);

    let rowsPerPage = ROWS_COUNT_DEFAULT;

    // Read the current value from localStorage if it exists
    if (window.localStorage.getItem(ROWS_COUNT_PREF)) {
      try {
        rowsPerPage = parseInt(window.localStorage.getItem(ROWS_COUNT_PREF));
      } catch (e) {
        console.error('Error parsing rows count from localStorage:', e); // eslint-disable-line no-console
      }
    }

    return {
      rowsPerPage,
      schema:            null,
      events:            [],
      eventHeaders,
      paginationHeaders: null,
      options:           tableRowOptions || [],
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

  computed: {
    /** Whether the table below has a toolbar of its own, which decides where the link goes */
    improvedTables() {
      return isImprovedTablesEnabled(this.$store);
    },

    userPrefRowsPerPage() {
      return parseInt(this.$store.getters['prefs/get'](ROWS_PER_PAGE), 10) || undefined;
    },
    rowOptions() {
      const rowOptions = [];

      this.options.forEach((item) => rowOptions.push({
        label: this.t('glance.showXEvents', { count: item }),
        value: item
      }));

      if (this.userPrefRowsPerPage) {
        rowOptions.push({
          label: this.t('glance.useUserPreference', { count: this.userPrefRowsPerPage }),
          value: ROWS_PREF_USE_TABLE,
        });
      }

      return rowOptions;
    }
  },

  methods: {
    updateRowsCount(val) {
      this.rowsPerPage = val;
      window.localStorage.setItem(ROWS_COUNT_PREF, val);
    },
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
  <div>
    <!-- Where the link goes depends on whether the table has a toolbar of its own. With the
         improved tables feature on it sits above, the way the Certificates tab puts its own -
         the table's header row belongs to the toolbar and there is no room beside it. With the
         feature off the table has its ordinary header row, so the link goes back into it. -->
    <div
      v-if="!!schema && improvedTables"
      class="events-table-link-row"
    >
      <EventsTableLink
        :rows-per-page="rowsPerPage"
        :to="allEventsLink"
        :options="rowOptions"
        @update:rows-per-page="updateRowsCount"
      />
    </div>
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
      :rows-per-page="rowsPerPage"
    >
      <template
        v-if="!improvedTables"
        #header-right
      >
        <EventsTableLink
          :rows-per-page="rowsPerPage"
          :to="allEventsLink"
          :options="rowOptions"
          @update:rows-per-page="updateRowsCount"
        />
      </template>
    </PaginatedResourceTable>
  </div>
</template>

<style lang="scss" scoped>
// The same shape the Certificates tab gives its own link - pushed to the right, clear of the
// table below it
.events-table-link-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
}
</style>
