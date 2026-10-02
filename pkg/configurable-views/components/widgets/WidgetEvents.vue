<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTable from '@shell/components/ResourceTable.vue';
import EventsTable from '@shell/pages/c/_cluster/explorer/EventsTable.vue';
import { RcDropdown, RcDropdownTrigger, RcDropdownItem } from '@components/RcDropdown';
import { EVENT } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import { AGE, MESSAGE, OBJECT, REASON } from '@shell/config/table-headers';
import { STEVE_EVENT_FIRST_SEEN, STEVE_EVENT_LAST_SEEN } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import { useWidgetCluster, useOpenCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { useClusterPage } from '../../composables/useClusterPage';
import { objectRoute } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// EVENTS — a cluster's events: the Events tab of its dashboard, as the dashboard draws it.
//
// On the cluster Rancher has open this IS the dashboard's EventsTable - the same component, so the
// same columns, sorting, paging, "Full events list" link and row-count menu, with nothing around it.
// Put it in a Tabs widget and it reads exactly like the tab it came from.
//
// That component reads the `cluster` store, which holds only the open cluster. For any other cluster
// the widget reads the events itself, a page at a time, and draws them in the same bare table with
// the same link and menu. Its order is fixed - newest first - since the server can only be asked to
// sort by the fields it indexes. Object links into THAT cluster: the shell's link formatters route to
// the open one.

// Shared with the dashboard's own table, so the row count someone picks there holds here too.
const ROWS_COUNT_PREF = 'events-row-count-pref';
const ROWS_COUNT_DEFAULT = 10;

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);
const isOpen = useOpenCluster(cluster);

function storedRowCount(): number {
  try {
    return parseInt(window.localStorage.getItem(ROWS_COUNT_PREF) || '', 10) || ROWS_COUNT_DEFAULT;
  } catch (e) {
    return ROWS_COUNT_DEFAULT;
  }
}

const rowCount = ref(storedRowCount());
const perPage = computed(() => props.widget.limit || rowCount.value);

// The dashboard's own choices for the row-count menu.
const rowOptions = computed<number[]>(() => store.getters['prefs/options'](ROWS_PER_PAGE) || []);

function setRowCount(count: number): void {
  rowCount.value = count;
  try {
    window.localStorage.setItem(ROWS_COUNT_PREF, `${ count }`);
  } catch (e) {}
}

const allEventsLink = computed<RouteLocationRaw>(() => ({
  name:   'c-cluster-product-resource',
  params: {
    cluster: cluster.value, product: EXPLORER, resource: EVENT
  }
}));

const {
  rows, count, loading, error, load
} = useClusterPage(() => ({
  resource: EVENT,
  // The open cluster's events are the stock table's to read.
  cluster:  isOpen.value ? '' : cluster.value,
  perPage:  perPage.value,
  // The dashboard's own "last seen" field, descending.
  sort:     [{ field: 'metadata.fields.0', asc: false }],
}));

const unsorted = (h: object) => ({ ...h, sort: false });

const schema = computed(() => store.getters['management/schemaFor'](EVENT));

// The dashboard's Count column, built as it builds it: from the event schema's own "Count" column,
// which knows which of Steve's fields holds it. Every cluster's events share that schema. Left out,
// rather than guessed, if a Rancher ever stops listing it.
function countHeader() {
  try {
    // AGE is what it substitutes for an "age" column; Count is not one, so it only fills the slot.
    return [unsorted(headerFromSchemaColString('Count', schema.value, store.getters, true, AGE))];
  } catch (e) {
    return [];
  }
}

const headers = computed(() => [
  unsorted({
    ...REASON, canBeVariable: true, width: 130
  }),
  unsorted({ ...OBJECT, formatter: undefined }),
  unsorted(MESSAGE),
  unsorted({
    name: 'name', labelKey: 'tableHeaders.name', value: 'metadata.name'
  }),
  unsorted(STEVE_EVENT_FIRST_SEEN),
  unsorted(STEVE_EVENT_LAST_SEEN),
  ...countHeader(),
]);

// The object an event is about, as a link into this widget's cluster: zero or one of them. A list,
// because iterating it is how the template binds a link that may not exist without asserting it does.
function linkFor(row: { involvedObject?: Record<string, string> }): RouteLocationRaw[] {
  const to = objectRoute(cluster.value, row.involvedObject);

  return to ? [to] : [];
}
</script>

<template>
  <div class="wstock">
    <h3
      v-if="widget.title"
      class="wstock__title"
    >
      {{ widget.title }}
    </h3>

    <EventsTable v-if="isOpen" />

    <p
      v-else-if="!cluster || error"
      class="wstock__msg"
      :class="{ 'wstock__msg--error': !!cluster }"
    >
      {{ cluster ? error : t(NO_CLUSTER) }}
    </p>

    <ResourceTable
      v-else
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :loading="loading"
      :external-pagination-enabled="true"
      :external-pagination-result="{ count }"
      :table-actions="false"
      :row-actions="false"
      :namespaced="false"
      :groupable="false"
      :search="false"
      :rows-per-page="perPage"
      key-field="id"
      @pagination-changed="load"
    >
      <template #header-right>
        <router-link
          :to="allEventsLink"
          class="wstock__link"
        >
          <span>{{ t('glance.eventsTable') }}</span>
        </router-link>
        <RcDropdown>
          <RcDropdownTrigger
            :aria-label="t('glance.changeEventsListRowCount')"
            variant="ghost"
            size="small"
          >
            <i class="icon icon-gear wstock__gear" />
          </RcDropdownTrigger>
          <template #dropdownCollection>
            <RcDropdownItem
              v-for="option in rowOptions"
              :key="option"
              @click.stop="setRowCount(option)"
            >
              <span :class="{ 'wstock__option--selected': perPage === option }">
                {{ t('glance.showXEvents', { count: option }) }}
              </span>
            </RcDropdownItem>
          </template>
        </RcDropdown>
      </template>
      <template #col:object="{ row }">
        <td>
          <router-link
            v-for="(to, i) in linkFor(row)"
            :key="i"
            :to="to"
          >
            {{ row.involvedObject.kind }} {{ row.involvedObject.name }}
          </router-link>
          <span v-if="!linkFor(row).length">{{ row.involvedObject?.kind }} {{ row.involvedObject?.name }}</span>
        </td>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
// The dashboard's own table has nothing around it, and neither does this: no card, no heading unless
// the widget is given one. The link and the gear are EventsTable's, measure for measure.
.wstock {
  min-width: 0;

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0 0 12px;
  }

  &__msg {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;

    &--error {
      color: var(--error);
    }
  }

  &__link {
    align-self:   center;
    margin-right: 10px;
    white-space:  nowrap;
  }

  &__gear {
    color:   var(--primary);
    padding: 0 8px;
  }

  &__option--selected {
    font-weight: bold;
  }
}
</style>
