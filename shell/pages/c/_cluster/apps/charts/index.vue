<script>
import { markRaw } from 'vue';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import TypeDescription from '@shell/components/TypeDescription';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY, DEPRECATED, HIDDEN, TAG, STATUS
} from '@shell/config/query-params';
import { APP_STATUS, compatibleVersionsFor, filterAndArrangeCharts, normalizeFilterQuery } from '@shell/store/catalog';
import { lcFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import debounce from 'lodash/debounce';
import { mapGetters } from 'vuex';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { CATALOG } from '@shell/config/labels-annotations';
import { isUIPlugin } from '@shell/config/uiplugins';
import { RcItemCard } from '@components/RcItemCard';
import { get } from '@shell/utils/object';
import { CATALOG as CATALOG_TYPES } from '@shell/config/types';
import RcFilterPanel from '@shell/components/RcFilterPanel';
import AppCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppCardSubHeader';
import AppCardFooter from '@shell/pages/c/_cluster/apps/charts/AppCardFooter';
import AddRepoLink from '@shell/pages/c/_cluster/apps/charts/AddRepoLink';
import StatusLabel from '@shell/pages/c/_cluster/apps/charts/StatusLabel';

export default {
  name:       'Charts',
  components: {
    AsyncButton,
    Banner,
    Loading,
    TypeDescription,
    RcItemCard,
    RcFilterPanel,
    AppCardSubHeader,
    AppCardFooter
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const query = this.$route.query;

    this.searchQuery = query[SEARCH_QUERY] || '';
    this.debouncedSearchQuery = query[SEARCH_QUERY] || '';
    this.showHidden = query[HIDDEN] === _FLAGGED;
    this.filters.repos = normalizeFilterQuery(query[REPO]) || [];
    this.filters.categories = normalizeFilterQuery(query[CATEGORY]) || [];
    this.filters.statuses = normalizeFilterQuery(query[STATUS]) || [];
    this.filters.tags = normalizeFilterQuery(query[TAG]) || [];

    this.installedApps = await this.$store.dispatch('cluster/findAll', { type: CATALOG_TYPES.APP });
  },

  data() {
    return {
      searchQuery:          null,
      debouncedSearchQuery: null,
      showDeprecated:       null,
      showHidden:           null,
      filters:              {
        repos:      [],
        categories: [],
        statuses:   [],
        tags:       []
      },
      installedApps: [],
      statusOptions: [
        {
          value: APP_STATUS.INSTALLED,
          label: {
            component:      markRaw(StatusLabel),
            componentProps: {
              label:     this.t('generic.installed'),
              icon:      'icon-warning',
              iconColor: 'warning',
              tooltip:   this.t('catalog.charts.experimentalStatus.tooltip')
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
              label:     this.t('generic.upgradeable'),
              icon:      'icon-warning',
              iconColor: 'warning',
              tooltip:   this.t('catalog.charts.experimentalStatus.tooltip')
            }
          }
        }
      ],
      cardVariant: undefined,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    repoOptions() {
      let out = this.$store.getters['catalog/repos'].map((r) => {
        return {
          value:  r._key,
          label:  r.nameDisplay,
          weight: ( r.isRancher ? 1 : ( r.isPartner ? 2 : 3 ) ),
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
        tag:         tags
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

    appCards() {
      return this.filteredCharts.map((chart) => ({
        id:     chart.id,
        pill:   chart.featured ? { label: { key: 'generic.shortFeatured' }, tooltip: { key: 'generic.featured' } } : undefined,
        header: {
          title:    { text: chart.chartNameDisplay },
          statuses: chart.cardContent.statuses
        },
        subHeaderItems: chart.cardContent.subHeaderItems,
        image:          { src: chart.versions[0].icon, alt: { text: this.t('catalog.charts.iconAlt', { app: get(chart, 'chartNameDisplay') }) } },
        content:        { text: chart.chartDescription },
        footerItems:    chart.cardContent.footerItems,
        rawChart:       chart
      }));
    },

    clusterId() {
      return this.$store.getters['clusterId'];
    }
  },

  watch: {
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
        const query = {
          [REPO]:     normalizeFilterQuery(newFilters.repos),
          [CATEGORY]: normalizeFilterQuery(newFilters.categories),
          [STATUS]:   normalizeFilterQuery(newFilters.statuses),
          [TAG]:      normalizeFilterQuery(newFilters.tags)
        };

        this.$router.applyQuery(query);
      }
    }
  },

  methods: {
    get,

    selectChart(chart) {
      let version;
      const OSs = this.currentCluster.workerOSs;
      const showPrerelease = this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);
      const compatibleVersions = compatibleVersionsFor(chart, OSs, showPrerelease);
      const versions = chart.versions;

      if (compatibleVersions.length > 0) {
        version = compatibleVersions[0].version;
      } else {
        version = versions[0].version;
      }

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
      repo, category, tag, searchQuery
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
      });
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="header">
      <h1 class="m-0">
        {{ t('catalog.chart.header.charts') }}
      </h1>
      <AsyncButton
        role="button"
        :aria-label="t('catalog.charts.refresh')"
        :label="t('catalog.charts.refresh')"
        class="refresh-btn"
        mode="refresh"
        @click="refresh"
      />
    </div>
    <TypeDescription resource="chart" />
    <input
      ref="searchQuery"
      v-model="searchQuery"
      type="search"
      class="input search-input"
      :placeholder="t('catalog.charts.search')"
      data-testid="charts-filter-input"
      :aria-label="t('catalog.charts.search')"
      role="textbox"
    >
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

    <template v-if="allCharts.length">
      <div class="wrapper">
        <rc-filter-panel
          v-model="filters"
          :filters="[
            {
              key: 'repos',
              title: 'Repository',
              options: repoOptions
            },
            {
              key: 'categories',
              title: 'Category',
              options: categoryOptions
            },
            {
              key: 'statuses',
              title: 'Status',
              options: statusOptions
            },
            {
              key: 'tags',
              title: 'Tag',
              options: tagOptions
            }
          ]"
        />

        <div
          v-if="filteredCharts.length === 0"
          class="app-cards-empty-state"
        >
          <h1>{{ t('catalog.charts.noCharts') }}</h1>
        </div>
        <div
          v-else
          class="app-cards"
          data-testid="app-cards-container"
        >
          <rc-item-card
            v-for="(card, i) in appCards"
            :id="card.id"
            :key="card.id"
            :pill="card.pill"
            :header="card.header"
            :image="card.image"
            :content="card.content"
            :value="card.rawChart"
            :variant="i === 0 ? undefined : (cardVariant || 'medium')"
            :clickable="true"
            @card-click="selectChart"
            @variant="cardVariant = $event"
          >
            <template
              v-once
              #item-card-sub-header
            >
              <AppCardSubHeader :items="card.subHeaderItems" />
            </template>
            <template
              v-once
              #item-card-footer
            >
              <AppCardFooter
                :items="card.footerItems"
                @footer-item-click="handleFooterItemClick"
              />
            </template>
          </rc-item-card>
        </div>
      </div>
    </template>
    <div
      v-else
      class="m-50 text-center"
    >
      <h1>{{ t('catalog.charts.noCharts') }}</h1>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-input {
  margin-bottom: 24px;
}

.checkbox-select {
  .vs__search {
    position: absolute;
    right: 0
  }

  .vs__selected-options  {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: inline-block;
    line-height: 2.4rem;
  }
}

.wrapper {
  display: flex;
  gap: 16px;
}

.app-cards-empty-state {
  width: 100%;
  margin-top: 32px;
  padding: 32px;
  text-align: center;
}

.app-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;
}

</style>
