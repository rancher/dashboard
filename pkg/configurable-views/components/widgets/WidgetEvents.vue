<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { EVENT } from '@shell/config/types';
import { AGE, MESSAGE, OBJECT, REASON } from '@shell/config/table-headers';
import { STEVE_EVENT_FIRST_SEEN, STEVE_EVENT_LAST_SEEN } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { useClusterPage } from '../../composables/useClusterPage';
import { objectRoute } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// EVENTS — a cluster's events, newest first: the Events tab of its dashboard.
//
// The dashboard's own columns (its server-paged set: reason, object, message, name, first and last
// seen), read one page at a time from the cluster this widget names. The dashboard's EventsTable
// cannot be used as-is: it reads the `cluster` store, which holds only the cluster that is open.
//
// The order is fixed - newest first, which is what a list of events is for - so the columns do not
// offer to re-sort it. Object and Name link into THIS cluster: the shell's link formatters route to
// the open cluster, which here is none or another one.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

const perPage = computed(() => props.widget.limit || 10);

const {
  rows, count, loading, error, load
} = useClusterPage(() => ({
  resource: EVENT,
  cluster:  cluster.value,
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
  <WidgetCard
    :title="widget.title || t('clusterIndexPage.sections.events.label')"
    :loading="loading && !rows.length"
    :error="cluster ? error : NO_CLUSTER"
  >
    <ResourceTable
      v-if="cluster"
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
  </WidgetCard>
</template>
