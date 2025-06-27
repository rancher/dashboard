<script>

import { MESSAGE, NAME, OBJECT, REASON } from '@shell/config/table-headers';
import { EVENT } from '@shell/config/types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { STEVE_EVENT_OBJECT, STEVE_NAME_COL } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import { RcDropdown, RcDropdownTrigger, RcDropdownItem } from '@components/RcDropdown';

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

const ROWS_COUNT_PREF = 'events-row-count-pref';
const ROWS_COUNT_DEFAULT = 10;
const ROWS_COUNT_OPTIONS = [10, 25, 50];

export default {
  components: {
    PaginatedResourceTable,
    RcDropdown,
    RcDropdownItem,
    RcDropdownTrigger
  },

  data() {
    const tableRowsPref = this.$store.getters['prefs/get'](ROWS_PER_PAGE);
    let rowsPerPage = ROWS_COUNT_DEFAULT;

    if (window.localStorage.getItem(ROWS_COUNT_PREF)) {
      const storedRowsCount = parseInt(window.localStorage.getItem(ROWS_COUNT_PREF));

      if (ROWS_COUNT_OPTIONS.includes(storedRowsCount)) {
        rowsPerPage = storedRowsCount;
      } else {
        // if the count stored is not included on the options array
        // it means that the user probably used the table preferences count
        // so let's stick to that
        rowsPerPage = tableRowsPref;
      }
    } else {
      window.localStorage.setItem(ROWS_COUNT_PREF, ROWS_COUNT_DEFAULT);
    }

    return {
      rowsPerPage,
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
      headerFromSchemaColString('First Seen', schema, this.$store.getters, true),
      {
        ...headerFromSchemaColString('Last Seen', schema, this.$store.getters, true),
        defaultSort: true,
      },
      headerFromSchemaColString('Count', schema, this.$store.getters, true),
    ] : [];

    this.schema = schema;
    this.paginationHeaders = paginationHeaders;
  },

  mounted() {
    this.dismissRouteHandler = this.$router.beforeEach(this.onRouteChange);
  },

  computed: {
    userPrefRowsPerPage() {
      return parseInt(this.$store.getters['prefs/get'](ROWS_PER_PAGE), 10) || undefined;
    },
    rowOptions() {
      const rowOptions = [];

      ROWS_COUNT_OPTIONS.forEach((item) => rowOptions.push({
        label: this.t('glance.showXEvents', { count: item }),
        value: item
      }));

      if (this.userPrefRowsPerPage) {
        rowOptions.push({
          label: this.t('glance.useUserPreference', { count: this.userPrefRowsPerPage }),
          value: this.userPrefRowsPerPage
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
    <template v-slot:header-right>
      <router-link
        data-testid="events-link"
        :to="allEventsLink"
        class="events-link"
      >
        <span>{{ t('glance.eventsTable') }}</span>
      </router-link>
      <rc-dropdown>
        <rc-dropdown-trigger
          data-testid="events-list-row-count-menu-toggle"
          :aria-label="t('glance.changeEventsListRowCount')"
          ghost
          small
        >
          <i class="icon icon-gear" />
        </rc-dropdown-trigger>
        <template #dropdownCollection>
          <rc-dropdown-item
            v-for="(item, i) in rowOptions"
            :key="i"
            :value="item.value"
            @click.stop="updateRowsCount(item.value)"
          >
            {{ item.label }}
          </rc-dropdown-item>
        </template>
      </rc-dropdown>
    </template>
  </PaginatedResourceTable>
</template>

<style lang="scss" scoped>
.icon.icon-gear {
  color: var(--primary);
  padding: 0 8px;
}
.events-link {
  align-self: center;
  margin-right: 10px;
  white-space: nowrap;
}
</style>
