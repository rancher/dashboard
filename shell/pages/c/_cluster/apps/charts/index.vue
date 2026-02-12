<script>
import { markRaw } from 'vue';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, SORT_BY, _FLAGGED, CATEGORY, DEPRECATED, HIDDEN, TAG, STATUS
} from '@shell/config/query-params';
import { DOCS_BASE } from '@shell/config/private-label';
import { APP_STATUS, filterAndArrangeCharts, normalizeFilterQuery } from '@shell/store/catalog';
import { lcFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import debounce from 'lodash/debounce';
import { mapGetters } from 'vuex';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { CATALOG } from '@shell/config/labels-annotations';
import { isUIPlugin } from '@shell/config/uiplugins';
import { RcItemCard } from '@components/RcItemCard';
import { get } from '@shell/utils/object';
import { CATALOG as CATALOG_TYPES, CATALOG_SORT_OPTIONS } from '@shell/config/types';
import FilterPanel from '@shell/components/FilterPanel';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';
import AddRepoLink from '@shell/pages/c/_cluster/apps/charts/AddRepoLink';
import StatusLabel from '@shell/pages/c/_cluster/apps/charts/StatusLabel';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { getLatestCompatibleVersion } from '@shell/utils/chart';
import Select from '@shell/components/form/Select';

const createInitialFilters = () => ({
  repos:      [],
  categories: [],
  statuses:   [],
  tags:       []
});

export default {
  name:       'Charts',
  components: {
    AsyncButton,
    Banner,
    Loading,
    RcItemCard,
    FilterPanel,
    AppChartCardSubHeader,
    AppChartCardFooter,
    Select,
    RichTranslation
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const query = this.$route.query;

    this.searchQuery = query[SEARCH_QUERY] || '';
    this.debouncedSearchQuery = query[SEARCH_QUERY] || '';
    this.selectedSortOption = query[SORT_BY] || CATALOG_SORT_OPTIONS.RECOMMENDED;
    this.showHidden = query[HIDDEN] === _FLAGGED;
    this.filters.repos = normalizeFilterQuery(query[REPO]) || [];
    this.filters.categories = normalizeFilterQuery(query[CATEGORY]) || [];
    this.filters.statuses = normalizeFilterQuery(query[STATUS]) || [];
    this.filters.tags = normalizeFilterQuery(query[TAG]) || [];

    this.installedApps = await this.$store.dispatch('cluster/findAll', { type: CATALOG_TYPES.APP });
  },

  updated() {
    if (!this.observerInitialized && this.filteredCharts.length > 0) {
      this.initIntersectionObserver();
    }
    this.ensureOverflow();
  },

  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },

  data() {
    return {
      DOCS_BASE,
      searchQuery:          null,
      debouncedSearchQuery: null,
      showDeprecated:       null,
      showHidden:           null,
      filters:              createInitialFilters(),
      // to optimize UI responsiveness by immediately updating the filter state
      internalFilters:      createInitialFilters(),
      isFilterUpdating:     false,
      installedApps:        [],
      statusOptions:        [
        {
          value: APP_STATUS.INSTALLED,
          label: {
            component:      markRaw(StatusLabel),
            componentProps: {
              label:       this.t('generic.installed'),
              icon:        'icon-warning',
              iconColor:   'warning',
              iconTooltip: this.t('catalog.charts.statusFilterCautions.installation')
            }
          }
        },
        {
          value: APP_STATUS.DEPRECATED,
          label: this.t('generic.deprecated'),
        },
        {
          value: APP_STATUS.UPGRADEABLE,
          label: {
            component:      markRaw(StatusLabel),
            componentProps: {
              label:       this.t('generic.upgradeable'),
              icon:        'icon-warning',
              iconColor:   'warning',
              iconTooltip: this.t('catalog.charts.statusFilterCautions.upgradeable')
            }
          }
        }
      ],
      selectedSortOption: CATALOG_SORT_OPTIONS.RECOMMENDED,
      sortOptions:        [
        { kind: 'group', label: this.t('catalog.charts.sort.prefix') },
        { value: CATALOG_SORT_OPTIONS.RECOMMENDED, label: this.t('catalog.charts.sort.recommended') },
        { value: CATALOG_SORT_OPTIONS.LAST_UPDATED_DESC, label: this.t('catalog.charts.sort.lastUpdatedDesc') },
        { value: CATALOG_SORT_OPTIONS.ALPHABETICAL_ASC, label: this.t('catalog.charts.sort.alphaAscending') },
        { value: CATALOG_SORT_OPTIONS.ALPHABETICAL_DESC, label: this.t('catalog.charts.sort.alphaDescending') },
      ],
      initialVisibleChartsCount: 30,
      visibleChartsCount:        20,
      hasOverflow:               false
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    repoOptions() {
      let out = this.$store.getters['catalog/repos'].map((r) => {
        return {
          value:        r._key,
          label:        r.nameDisplay,
          labelTooltip: r.nameDisplay,
          weight:       ( r.isRancher ? 1 : ( r.isPartner ? 2 : 3 ) ),
        };
      });

      out = sortBy(out, ['weight', 'label']);

      // not a filter, just a link for adding a new repo
      out.push({
        value:          'add-repo-link',
        component:      markRaw(AddRepoLink),
        componentProps: { clusterId: this.clusterId }
      });

      return out;
    },

    tagOptions() {
      const outSet = new Set();

      this.allCharts.forEach((chart) => {
        if (Array.isArray(chart.tags)) {
          chart.tags.forEach((tag) => outSet.add(tag));
        }
      });

      return Array.from(outSet).map((tag) => ({ value: tag.toLowerCase(), label: tag }));
    },

    /**
     * Filter all charts by invalid entries (hidden and ui plugin).
     *
     * This does not include any user provided filters (like selected repos, categories and text query)
     */
    enabledCharts() {
      return (this.allCharts || []).filter((c) => {
        if ( c.hidden && !this.showHidden ) {
          return false;
        }

        if (isUIPlugin(c)) {
          return false;
        }

        return true;
      });
    },

    /**
     * Filter enabled charts allll filters. These are what the user will see in the list
     */
    filteredCharts() {
      const {
        categories, repos, tags, statuses
      } = this.filters;
      const res = this.filterCharts({
        category:    categories,
        searchQuery: this.debouncedSearchQuery,
        repo:        repos,
        tag:         tags,
        sort:        this.selectedSortOption
      });

      const OSs = this.currentCluster.workerOSs;
      const showPrerelease = this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);

      res.forEach((chart) => {
        chart._latestCompatibleVersion = getLatestCompatibleVersion(chart, OSs, showPrerelease);
      });

      // status filtering is separated from other filters because "isInstalled" and "upgradeable" statuses are already calculated in models/chart.js
      // by doing this we won't need to re-calculate it in filterAndArrangeCharts
      if (!statuses.length) {
        return res;
      }

      return res.filter((chart) => {
        const chartStatuses = [
          chart.deprecated && APP_STATUS.DEPRECATED,
          chart.isInstalled && APP_STATUS.INSTALLED,
          chart.upgradeable && APP_STATUS.UPGRADEABLE
        ].filter(Boolean);

        return chartStatuses.some((status) => statuses.includes(status));
      });
    },

    categoryOptions() {
      const map = {};

      for ( const chart of this.allCharts ) {
        for ( const c of chart.categories ) {
          if ( !map[c] ) {
            const labelKey = `catalog.charts.categories.${ lcFirst(c) }`;

            map[c] = {
              label: this.$store.getters['i18n/withFallback'](labelKey, null, c),
              value: c.toLowerCase()
            };
          }
        }
      }

      const out = Object.values(map);

      return sortBy(out, ['label']);
    },

    filterPanelFilters() {
      return [
        {
          key:     'repos',
          title:   this.t('gitPicker.github.repo.label'),
          options: this.repoOptions
        },
        {
          key:     'categories',
          title:   this.t('generic.category'),
          options: this.categoryOptions
        },
        {
          key:     'statuses',
          title:   this.t('tableHeaders.status'),
          options: this.statusOptions
        },
        {
          key:     'tags',
          title:   this.t('generic.tag'),
          options: this.tagOptions
        }
      ];
    },

    appChartCards() {
      const charts = this.filteredCharts.slice(0, this.visibleChartsCount);

      return charts.map((chart) => ({
        id:     chart.id,
        pill:   chart.featured ? { label: { key: 'generic.shortFeatured' }, tooltip: { key: 'generic.featured' } } : undefined,
        header: {
          title:    { text: chart.chartNameDisplay },
          statuses: chart.cardContent.statuses
        },
        subHeaderItems: chart.cardContent.subHeaderItems,
        image:          { src: chart.latestCompatibleVersion.icon, alt: { text: this.t('catalog.charts.iconAlt', { app: get(chart, 'chartNameDisplay') }) } },
        content:        { text: chart.chartDescription },
        footerItems:    chart.cardContent.footerItems,
        rawChart:       chart
      }));
    },

    clusterId() {
      return this.$store.getters['clusterId'];
    },

    noFiltersApplied() {
      return Object.values(this.internalFilters).every((arr) => arr.length === 0) && !this.searchQuery;
    },

    totalMessage() {
      const count = !this.isFilterUpdating ? this.filteredCharts.length : '. . .';

      if (this.noFiltersApplied) {
        return this.t('catalog.charts.totalChartsMessage', { count });
      } else {
        return this.t('catalog.charts.totalMatchedChartsMessage', { count });
      }
    }
  },

  watch: {
    debouncedSearchQuery() {
      this.resetLazyLoadState();
    },

    searchQuery: {
      handler: debounce(function(q) {
        this.debouncedSearchQuery = q;
        this.$router.applyQuery({ [SEARCH_QUERY]: q || undefined });
      }, 300),
      immediate: false
    },

    filters: {
      deep: true,
      handler(newFilters) {
        this.resetLazyLoadState();

        const query = {
          [REPO]:     normalizeFilterQuery(newFilters.repos),
          [CATEGORY]: normalizeFilterQuery(newFilters.categories),
          [STATUS]:   normalizeFilterQuery(newFilters.statuses),
          [TAG]:      normalizeFilterQuery(newFilters.tags)
        };

        this.$router.applyQuery(query);
        this.internalFilters = JSON.parse(JSON.stringify(newFilters));
      }
    },

    selectedSortOption: {
      handler(neu) {
        this.$router.applyQuery({ [SORT_BY]: neu || undefined });
      },
      immediate: false
    },
  },

  methods: {
    get,

    onFilterChange(newFilters) {
      this.isFilterUpdating = true;
      this.internalFilters = newFilters;

      this.applyFiltersDebounced(newFilters);
    },

    applyFiltersDebounced: debounce(function(newFilters) {
      this.filters = newFilters;
      this.isFilterUpdating = false;
    }, 100),

    selectChart(chart) {
      const version = chart.latestCompatibleVersion.version;

      const query = {
        [REPO_TYPE]: chart.repoType,
        [REPO]:      chart.repoName,
        [CHART]:     chart.chartName,
        [VERSION]:   version
      };

      if (chart.deprecated) {
        query[DEPRECATED] = 'true';
      }

      this.$router.push({
        name:   'c-cluster-apps-charts-chart',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query
      });
    },

    handleFooterItemClick(type, value) {
      if (type === REPO) {
        const repoKey = this.repoOptions.find((option) => option.label === value)?.value;

        if (!this.filters.repos.includes(repoKey)) {
          this.filters.repos.push(repoKey);
        }
      } else if (type === CATEGORY && !this.filters.categories.includes(value.toLowerCase())) {
        this.filters.categories.push(value.toLowerCase());
      } else if (type === TAG && !this.filters.tags.includes(value.toLowerCase())) {
        this.filters.tags.push(value.toLowerCase());
      }
    },

    focusSearch() {
      if ( this.$refs.searchQuery ) {
        this.$refs.searchQuery.focus();
        this.$refs.searchQuery.select();
      }
    },

    async refresh(btnCb) {
      try {
        await this.$store.dispatch('catalog/refresh');
        btnCb(true);
      } catch (e) {
        this.$store.dispatch('growl/fromError', e);
        btnCb(false);
      }
    },

    filterCharts({
      repo, category, tag, searchQuery, sort
    }) {
      const enabledCharts = (this.enabledCharts || []);
      const clusterProvider = this.currentCluster.status.provider || 'other';

      return filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        showRepos:      repo,
        category,
        tag,
        searchQuery,
        showDeprecated: true,
        showHidden:     this.showHidden,
        hideTypes:      [CATALOG._CLUSTER_TPL],
        showPrerelease: this.$store.getters['prefs/get'](SHOW_PRE_RELEASE),
        sort
      });
    },

    resetLazyLoadState() {
      this.visibleChartsCount = this.initialVisibleChartsCount;
      this.observerInitialized = false;
      this.hasOverflow = false;
    },

    // The lazy loading implementation has two parts
    // 1. Initial Load (ensureOverflow): Having a simple calculation of how many items to load
    //    can fail in edge cases like browser zoom, where element sizing and viewport
    //    height can lead to miscalculations. If not enough content is loaded, the page
    //    won't be scrollable, breaking the IntersectionObserver. This method, called
    //    iteratively by the `updated` lifecycle hook, adds batches of charts and
    //    re-measures until the content height factually overflows the container,
    //    guaranteeing a scrollbar. It then sets `hasOverflow = true` to stop itself.
    // 2. Scroll-based Load (IntersectionObserver): Once the page is scrollable, a standard
    //    IntersectionObserver (`initIntersectionObserver` and `loadMore`) takes care of
    //    loading new batches of charts as the user scrolls to the bottom.
    ensureOverflow() {
      this.$nextTick(() => {
        if (this.hasOverflow || !this.$refs.chartsContainer) {
          return;
        }

        const mainLayout = document.querySelector('.main-layout');

        if (!mainLayout) {
          return;
        }

        const contentHeight = this.$refs.chartsContainer.offsetHeight;
        const containerHeight = mainLayout.offsetHeight;

        if (contentHeight > containerHeight) {
          this.hasOverflow = true;
        } else if (this.visibleChartsCount < this.filteredCharts.length) {
          // Load another batch
          this.visibleChartsCount += this.initialVisibleChartsCount;
        } else {
          // All charts are visible
          this.hasOverflow = true;
        }
      });
    },

    resetAllFilters() {
      this.internalFilters = createInitialFilters();
      this.filters = createInitialFilters();
      this.searchQuery = '';
    },

    loadMore() {
      if (this.visibleChartsCount >= this.filteredCharts.length) {
        return;
      }
      this.visibleChartsCount += this.initialVisibleChartsCount;
    },

    initIntersectionObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }
      const mainLayout = document.querySelector('.main-layout');
      const sentinel = this.$refs.sentinel;

      if (sentinel && mainLayout) {
        this.observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.loadMore();
          }
        }, { mainLayout });
        this.observer.observe(sentinel);
        this.observerInitialized = true;
      }
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="header">
      <h1
        data-testid="charts-header-title"
        class="m-0"
      >
        {{ t('catalog.chart.header.charts') }}
      </h1>
      <AsyncButton
        class="refresh-repo-button"
        :action-label="t('catalog.charts.refreshButton.label')"
        :waitingLabel="t('catalog.charts.refreshButton.label')"
        :success-label="t('catalog.charts.refreshButton.label')"
        mode="refresh"
        role="button"
        :aria-label="t('catalog.charts.refresh')"
        actionColor="role-secondary"
        successColor="bg-success"
        @click="refresh"
      />
    </div>
    <div class="search-input">
      <input
        ref="searchQuery"
        v-model="searchQuery"
        type="search"
        class="input"
        :placeholder="t('catalog.charts.search')"
        data-testid="charts-filter-input"
        :aria-label="t('catalog.charts.search')"
        role="textbox"
      >
      <i
        v-if="!searchQuery"
        class="icon icon-search"
      />
    </div>
    <button
      v-shortkey.once="['/']"
      class="hide"
      @shortkey="focusSearch()"
    />

    <Banner
      v-for="(err, i) in loadingErrors"
      :key="i"
      color="error"
      :label="err"
    />

    <div class="wrapper">
      <FilterPanel
        :modelValue="internalFilters"
        :filters="filterPanelFilters"
        @update:modelValue="onFilterChange"
      />

      <div
        v-if="filteredCharts.length === 0"
        class="charts-empty-state"
        data-testid="charts-empty-state"
      >
        <h1
          class="empty-state-title"
          data-testid="charts-empty-state-title"
        >
          {{ t('catalog.charts.noCharts.title') }}
        </h1>
        <div class="empty-state-tips">
          <RichTranslation
            k="catalog.charts.noCharts.message"
            :raw="true"
          >
            <template #resetAllFilters="{ content }">
              <a
                tabindex="0"
                role="button"
                class="link"
                data-testid="charts-empty-state-reset-filters"
                @click="resetAllFilters"
                @keyup.enter="resetAllFilters"
                @keyup.space="resetAllFilters"
              >{{ content }}</a>
            </template>
            <template #repositoriesUrl="{ content }">
              <router-link :to="{ name: 'c-cluster-apps-catalog-repo'}">
                {{ content }}
              </router-link>
            </template>
          </RichTranslation>
          <RichTranslation
            k="catalog.charts.noCharts.docsMessage"
            tag="div"
            :raw="true"
          >
            <template #docsUrl="{ content }">
              <a
                :href="`${DOCS_BASE}/how-to-guides/new-user-guides/helm-charts-in-rancher`"
                class="secondary-text-link"
                tabindex="0"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
                {{ content }} <i class="icon icon-external-link" />
              </a>
            </template>
          </RichTranslation>
        </div>
      </div>
      <div
        v-else
        class="right-section"
      >
        <div class="total-and-sort">
          <div class="total">
            <p
              class="total-message"
              data-testid="charts-total-message"
            >
              {{ totalMessage }}
            </p>
            <a
              v-if="!noFiltersApplied"
              class="reset-filters"
              role="button"
              :aria-label="t('catalog.charts.resetFilters.title')"
              @click="resetAllFilters"
            >
              {{ t('catalog.charts.resetFilters.title') }}
            </a>
          </div>
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
          ref="chartsContainer"
          class="app-chart-cards"
          data-testid="app-chart-cards-container"
        >
          <rc-item-card
            v-for="card in appChartCards"
            :id="card.id"
            :key="card.id"
            :pill="card.pill"
            :header="card.header"
            :image="card.image"
            :content="card.content"
            :value="card.rawChart"
            variant="medium"
            role="link"
            :class="{ 'single-card': appChartCards.length === 1 }"
            :clickable="true"
            @card-click="selectChart"
          >
            <template
              v-once
              #item-card-sub-header
            >
              <AppChartCardSubHeader :items="card.subHeaderItems" />
            </template>
            <template
              v-once
              #item-card-footer
            >
              <AppChartCardFooter
                :items="card.footerItems"
                :clickable="true"
                @click:item="handleFooterItemClick"
              />
            </template>
          </rc-item-card>
        </div>
        <div
          ref="sentinel"
          class="sentinel-charts"
          data-testid="charts-lazy-load-sentinel"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .refresh-repo-button {

    :deep(.icon) {
      font-size: 14px;
    }
  }
}

.search-input {
  position: relative;
  margin-bottom: 24px;

  input {
    height: 48px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .icon-search {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 16px;
  }
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  flex: 1;

  .sentinel-charts {
    height: 1px;
  }
}

.total-and-sort {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--gap-md);
  padding: 8px 0;

  .total {
    display: flex;

    .total-message {
      font-size: 16px;
      font-weight: 600;
      color: var(--body-text);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .reset-filters {
      font-size: 16px;
      font-weight: 600;
      margin-left: 8px;
      cursor: pointer;
    }
  }

  .charts-sort-select {
    width: 300px;

    // make the color of the selected item consistent with the group title when the select dropdown is open
    :deep(.v-select.inline.vs--single.vs--open .vs__selected) {
      opacity: 1;
      color: var(--dropdown-disabled-text);
    }
  }
}

.wrapper {
  display: flex;
  gap: var(--gap-lg);
}

.charts-empty-state {
  width: 100%;
  padding: 72px 120px;
  text-align: center;

  .empty-state-title {
    margin-bottom: 24px;
  }

  .empty-state-tips {
    margin-bottom: 12px;
    font-size: 16px;
    line-height: 32px;
  }
}

.app-chart-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;

  .single-card {
    max-width: 500px;
  }
}

</style>
