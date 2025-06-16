<script lang="ts">
import { useStore } from 'vuex';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed } from 'vue';
import SortableTable from '@shell/components/SortableTable/index.vue';
import { STATE, SIMPLE_NAME, IMAGE_NAME } from '@shell/config/table-headers';
import { escapeHtml } from '@shell/utils/string';
import day from 'dayjs';
import { findBy } from '@shell/utils/array';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { sortableNumericSuffix } from '@shell/utils/sort';

export interface Props {
  pod: any;
  weight?: number;
}
</script>

<script lang="ts" setup>
const { weight, pod } = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const headers = [
  STATE,
  {
    name:          'ready',
    labelKey:      'tableHeaders.ready',
    formatter:     'IconText',
    formatterOpts: { iconKey: 'readyIcon' },
    align:         'left',
    width:         75,
    sort:          'readyIcon'
  },
  {
    ...SIMPLE_NAME,
    value: 'name'
  },
  IMAGE_NAME,
  {
    name:          'isInit',
    labelKey:      'workload.container.init',
    formatter:     'IconText',
    formatterOpts: { iconKey: 'initIcon' },
    align:         'left',
    width:         75,
    sort:          'initIcon'
  },
  {
    name:     'restarts',
    labelKey: 'tableHeaders.restarts',
    value:    'status.restartCount',
    align:    'right',
    width:    75
  },
  {
    name:          'age',
    labelKey:      'tableHeaders.started',
    value:         'status.state.running.startedAt',
    sort:          'status.state.running.startedAt:desc',
    search:        false,
    formatter:     'LiveDate',
    formatterOpts: { addSuffix: true },
    align:         'right'
  }
];

const dateTimeFormatString = computed(() => {
  const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
  const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

  return `${ dateFormat } ${ timeFormat }`;
});

const dateTimeFormat = (value: any) => {
  return value ? day(value).format(dateTimeFormatString.value) : '';
};

const allContainers = computed(() => {
  const { containers = [], initContainers = [] } = pod.spec;

  return [...containers, ...initContainers];
});

const allStatuses = computed(() => {
  const { containerStatuses = [], initContainerStatuses = [] } = pod.status;

  return [...containerStatuses, ...initContainerStatuses];
});

const rows = computed(() => {
  const containers = allContainers.value;
  const statuses = allStatuses.value;

  return (containers || []).map((container: any) => {
    const status = findBy(statuses, 'name', container.name);
    const state = status?.state || {};
    const descriptions = [];

    // There can be only one member of a `ContainerState`
    const s: any = Object.values(state)[0] || {};
    const reason = s.reason || '';
    const message = s.message || '';
    const showBracket = s.reason && s.message;
    const description = `${ reason }${ showBracket ? ' (' : '' }${ message }${ showBracket ? ')' : '' }`;

    if (description) {
      descriptions.push(description);
    }

    // add lastState to show termination reason
    if (status?.lastState?.terminated) {
      const ls = status?.lastState?.terminated;
      const lsReason = ls.reason || '';
      const lsMessage = ls.message || '';
      const lsExitCode = ls.exitCode || '';
      const lsStartedAt = dateTimeFormat(ls.startedAt);
      const lsFinishedAt = dateTimeFormat(ls.finishedAt);
      const lsShowBracket = ls.reason && ls.message;
      const lsDescription = `${ lsReason }${ lsShowBracket ? ' (' : '' }${ lsMessage }${ lsShowBracket ? ')' : '' }`;

      descriptions.push(t('workload.container.terminationState', {
        lsDescription, lsExitCode, lsStartedAt, lsFinishedAt
      }));
    }

    return {
      ...container,
      status:           status || {},
      stateDisplay:     status ? pod.containerStateDisplay(status) : undefined,
      stateBackground:  status ? pod.containerStateColor(status).replace('text', 'bg') : undefined,
      nameSort:         sortableNumericSuffix(container.name).toLowerCase(),
      readyIcon:        status?.ready ? 'icon-checkmark text-success ml-5' : 'icon-x text-error ml-5',
      availableActions: pod.containerActions,
      stateObj:         status, // Required if there's a description
      stateDescription: descriptions.join(' | '), // Required to display the description
      initIcon:         pod.containerIsInit(container) ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-minus icon-2x text-muted ml-5',

      // Call openShell here so that opening the shell
      // at the container level still has 'this' in scope.
      openShell: () => pod.openShell(container.name),
      // Call openLogs here so that opening the logs
      // at the container level still has 'this' in scope.
      openLogs:  () => pod.openLogs(container.name)
    };
  });
});

</script>

<template>
  <Tab
    :label="`${t('workload.container.titles.containers')} (${rows.length})`"
    name="containers"
    :weight="weight"
  >
    <SortableTable
      :rows="rows"
      :headers="headers"
      key-field="name"
      :search="false"
      :row-actions="true"
      :table-actions="false"
    />
  </Tab>
</template>
