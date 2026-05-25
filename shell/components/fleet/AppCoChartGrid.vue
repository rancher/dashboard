<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { ZERO_TIME, CATALOG_SORT_OPTIONS } from '@shell/config/types';
import { RcItemCard } from '@components/RcItemCard';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppCoEmptyState from '@shell/components/fleet/AppCoEmptyState.vue';
import Loading from '@shell/components/Loading';
import Select from '@shell/components/form/Select';

interface ChartEntry {
  name: string;
  description: string;
  icon: string;
  version: string;
  appVersion: string;
  created: string;
  versions: any[];
}

const props = defineProps({
  charts: {
    type:    Object,
    default: () => ({}),
  },
  loading: {
    type:    Boolean,
    default: false,
  },
  searchPlaceholder: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['select-chart']);

const store = useStore();
const { t } = useI18n(store);

const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const selectedSortOption = ref(CATALOG_SORT_OPTIONS.ALPHABETICAL_ASC);

const sortOptions = [
  { kind: 'group', label: t('catalog.charts.sort.prefix') },
  { value: CATALOG_SORT_OPTIONS.LAST_UPDATED_DESC, label: t('catalog.charts.sort.lastUpdatedDesc') },
  { value: CATALOG_SORT_OPTIONS.ALPHABETICAL_ASC, label: t('catalog.charts.sort.alphaAscending') },
  { value: CATALOG_SORT_OPTIONS.ALPHABETICAL_DESC, label: t('catalog.charts.sort.alphaDescending') },
];

const placeholderText = computed(() => props.searchPlaceholder || t('catalog.charts.search'));

const allCharts = computed<ChartEntry[]>(() => {
  const entries = props.charts as Record<string, any[]>;

  if (!entries || !Object.keys(entries).length) {
    return [];
  }

  return Object.keys(entries).sort().map((name) => {
    const versions = entries[name] || [];
    const latest = versions[0] || {};

    return {
      name,
      description: latest.description || '',
      icon:        latest.icon || '',
      version:     latest.version || '',
      appVersion:  latest.appVersion || '',
      created:     latest.created || '',
      versions,
    };
  });
});

const filteredCharts = computed(() => {
  if (!searchQuery.value) {
    return allCharts.value;
  }

  const raw = searchQuery.value;
  const exactMatch = /^"(.+)"$/.exec(raw);
  const q = exactMatch ? exactMatch[1].toLowerCase() : raw.toLowerCase();

  return allCharts.value.filter((chart) => {
    const name = chart.name.toLowerCase();
    const desc = chart.description.toLowerCase();

    if (exactMatch) {
      return name === q || desc === q;
    }

    return name.includes(q) || desc.includes(q);
  });
});

const sortedCharts = computed(() => {
  const charts = [...filteredCharts.value];

  switch (selectedSortOption.value) {
  case CATALOG_SORT_OPTIONS.ALPHABETICAL_ASC:
    return charts.sort((a, b) => a.name.localeCompare(b.name));
  case CATALOG_SORT_OPTIONS.ALPHABETICAL_DESC:
    return charts.sort((a, b) => b.name.localeCompare(a.name));
  case CATALOG_SORT_OPTIONS.LAST_UPDATED_DESC:
    return charts.sort((a, b) => {
      const dateA = a.created ? new Date(a.created).getTime() : 0;
      const dateB = b.created ? new Date(b.created).getTime() : 0;

      return dateB - dateA;
    });
  default:
    return charts;
  }
});

const formatDate = (dateString: string): string => {
  if (!dateString || dateString === ZERO_TIME) {
    return '';
  }

  try {
    const d = new Date(dateString);

    return d.toLocaleDateString(undefined, {
      year:  'numeric',
      month: 'short',
      day:   'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const chartCards = computed(() => {
  return sortedCharts.value.map((chart) => {
    const dateStr = chart.created ? formatDate(chart.created) : '';
    const subHeaderItems: any[] = [];

    if (chart.version) {
      subHeaderItems.push({
        icon:        'icon-version-alt',
        iconTooltip: { key: 'tableHeaders.version' },
        label:       chart.version,
      });
    }

    if (dateStr) {
      subHeaderItems.push({
        icon:        'icon-refresh-alt',
        iconTooltip: { key: 'tableHeaders.lastUpdated' },
        label:       dateStr,
      });
    }

    return {
      id:       chart.name,
      header:   { title: { text: chart.name } },
      image:    chart.icon ? { src: chart.icon, alt: { text: chart.name } } : undefined,
      content:  { text: chart.description },
      subHeaderItems,
      rawChart: chart,
    };
  });
});

const totalMessage = computed(() => {
  const count = sortedCharts.value.length;

  if (searchQuery.value) {
    return t('catalog.charts.totalMatchedChartsMessage', { count });
  }

  return t('catalog.charts.totalChartsMessage', { count });
});

const hasCharts = computed(() => allCharts.value.length > 0);

const clearSearch = () => {
  searchQuery.value = '';
  searchInput.value?.focus();
};

const onKeydown = (e: KeyboardEvent) => {
  const input = searchInput.value;

  if (!input || e.target === input) {
    return;
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>

<template>
  <div
    class="chart-card-grid"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <Loading
      v-if="props.loading"
      mode="relative"
    />

    <slot
      v-else-if="!hasCharts"
      name="empty-state"
    />

    <template v-else>
      <div class="search-input">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="search"
          class="input"
          :placeholder="placeholderText"
          :aria-label="placeholderText"
          data-testid="chart-card-grid-search"
        >
        <i
          v-if="!searchQuery"
          class="icon icon-search"
        />
      </div>

      <div class="total-and-sort">
        <p
          class="total-message"
          data-testid="chart-card-grid-total"
        >
          {{ totalMessage }}
        </p>
        <Select
          v-model:value="selectedSortOption"
          :clearable="false"
          :searchable="false"
          :options="sortOptions"
          placement="bottom"
          class="charts-sort-select"
        >
          <template #selected-option="{ label }">
            <span class="mmr-1">{{ t('catalog.charts.sort.prefix') }}:</span>{{ label }}
          </template>

          <template #option="{ label, kind }">
            <span
              v-if="kind === 'group'"
              class="mml-2 mmr-2"
            >
              {{ label }}:
            </span>
            <span
              v-else
              class="mml-6"
            >
              {{ label }}
            </span>
          </template>
        </Select>
      </div>

      <div
        v-if="chartCards.length"
        class="chart-cards"
        data-testid="chart-card-grid-cards"
      >
        <rc-item-card
          v-for="card in chartCards"
          :id="card.id"
          :key="card.id"
          :header="card.header"
          :image="card.image"
          :content="card.content"
          :value="card.rawChart"
          variant="medium"
          :clickable="true"
          :class="{ 'single-card': chartCards.length === 1 }"
          data-testid="chart-card-grid-card"
          @card-click="emit('select-chart', $event)"
        >
          <template #item-card-sub-header>
            <AppChartCardSubHeader :items="card.subHeaderItems" />
          </template>
          <template
            v-if="$slots['card-footer']"
            #item-card-footer
          >
            <slot
              name="card-footer"
              :card="card"
            />
          </template>
        </rc-item-card>
      </div>

      <AppCoEmptyState
        v-else
        :title="t('fleet.helmOp.add.steps.selection.emptyState.noMatch.title')"
        data-testid="chart-card-grid-no-match"
      >
        {{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.descriptionPre') }}
        <a
          href="#"
          @click.prevent="clearSearch"
        >{{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.clearSearch') }}</a>
        {{ t('fleet.helmOp.add.steps.selection.emptyState.noMatch.descriptionPost') }}
      </AppCoEmptyState>

      <slot name="after-cards" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.chart-card-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  outline: none;
}

.search-input {
  position: relative;

  input {
    width: 100%;
    height: 48px;
    padding-left: 16px;
    padding-right: 40px;
  }

  .icon-search {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 16px;
  }
}

.total-and-sort {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--gap-md);
  padding: 8px 0;

  .total-message {
    font-size: 16px;
    font-weight: 600;
    color: var(--body-text);
  }

  .charts-sort-select {
    width: 300px;

    :deep(.v-select.inline.vs--single.vs--open .vs__selected) {
      opacity: 1;
      color: var(--dropdown-disabled-text);
    }
  }
}

.chart-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;

  .single-card {
    max-width: 500px;
  }
}

.no-match {
  text-align: center;
  padding: 24px;
}
</style>
