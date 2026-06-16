<script setup lang="ts">
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import SortableTable from '@shell/components/SortableTable/index.vue';
import { useInterval } from '@shell/composables/useInterval';

export interface Props {
  value: any;
}

export interface Detail {
  label: string;
  values: (string | { component: any; props: any })[];
}

const props = withDefaults(defineProps<Props>(), { value: true });

const store = useStore();
const i18n = useI18n(store);

const table = ref<any>(null);

const eventHeaders = [
  {
    name:  'type',
    label: i18n.t('tableHeaders.type'),
    value: '_type',
    sort:  '_type',
  },
  {
    name:  'reason',
    label: i18n.t('tableHeaders.reason'),
    value: 'reason',
    sort:  'reason',
  },
  {
    name:          'date',
    label:         i18n.t('tableHeaders.updated'),
    value:         'firstTimestamp',
    sort:          'date:desc',
    formatter:     'LiveDate',
    formatterOpts: { addSuffix: true },
    width:         125
  },
  {
    name:  'message',
    label: i18n.t('tableHeaders.message'),
    value: 'message',
    sort:  'message',
  },
];

const fetch = useFetch(async() => {
  return await props.value.loadAutoscalerEvents();
});

// From the FAQ there appears to be a 20 second target between detecting scaling needs to happen to scaling beginning
// so I don't see a reason to poll quicker than 20 seconds.
// https://github.com/kubernetes/autoscaler/blob/9befb31fd94d73ae0b888bd9536ae085cd9304e1/cluster-autoscaler/FAQ.md#what-are-the-service-level-objectives-for-cluster-autoscaler
useInterval(() => {
  fetch.value.refresh();
}, 20000);

const rows = computed(() => {
  return fetch.value.data || [];
});

onMounted(() => {
  table.value?.changeSort('date', true);
});

</script>

<template>
  <Tab
    name="autoscaler"
    :label="i18n.t('autoscaler.tab.title')"
  >
    <SortableTable
      ref="table"
      :headers="eventHeaders"
      :namespaced="false"
      :row-actions="false"
      default-sort-by="date"
      :rows="rows"
    />
  </Tab>
</template>

<style lang="scss" scoped>
</style>
