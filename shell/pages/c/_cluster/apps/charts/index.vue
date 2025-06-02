<script>
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import TypeDescription from '@shell/components/TypeDescription';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY, DEPRECATED as DEPRECATED_QUERY, HIDDEN, TAG
} from '@shell/config/query-params';
import { lcFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import debounce from 'lodash/debounce';
import { mapGetters } from 'vuex';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { compatibleVersionsFor, filterAndArrangeCharts, normalizeFilterQuery } from '@shell/store/catalog';
import { CATALOG } from '@shell/config/labels-annotations';
import { isUIPlugin } from '@shell/config/uiplugins';
import { get } from '@shell/utils/object';
import { CATALOG as CATALOG_TYPES } from '@shell/config/types';
import RcItemCard from '@shell/components/cards/RcItemCard';
import RcFilterPanel from '@shell/components/RcFilterPanel';
import AppCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppCardSubHeader';
import AppCardFooter from '@shell/pages/c/_cluster/apps/charts/AppCardFooter';

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
    this.showDeprecated = query[DEPRECATED_QUERY] === 'true' || query[DEPRECATED_QUERY] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;
    this.filters.repos = query[REPO] || [];
    this.filters.categories = normalizeFilterQuery(query[CATEGORY]) || [];
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
        tags:       []
      },
      installedApps: []
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

      // custom option to render as a link for adding a new repo
      out.push({
        type:  'custom',
        value: 'add-repo-link',
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
     * Filter allll charts by invalid entries (deprecated, hidden and ui plugin).
     *
     * This does not include any user provided filters (like selected repos, categories and text query)
     */
    enabledCharts() {
      return (this.allCharts || []).filter((c) => {
        if ( c.deprecated && !this.showDeprecated ) {
          return false;
        }

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
      return this.filterCharts({
        category:    this.filters.categories,
        searchQuery: this.debouncedSearchQuery,
        showRepos:   this.filters.repos,
        tag:         this.filters.tags
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
              value: c.toLowerCase(),
              count: 0
            };
          }

          map[c].count++;
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

      if (chart.deprecated && this.showDeprecated) {
        query[DEPRECATED_QUERY] = 'true';
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
      showRepos, category, tag, searchQuery
    }) {
      const enabledCharts = (this.enabledCharts || []);
      const clusterProvider = this.currentCluster.status.provider || 'other';

      return filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        showRepos,
        category,
        tag,
        searchQuery,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        hideTypes:      [CATALOG._CLUSTER_TPL],
        showPrerelease: this.$store.getters['prefs/get'](SHOW_PRE_RELEASE),
      });
    }
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
              key: 'tags',
              title: 'Tag',
              options: tagOptions
            }
          ]"
        >
          <template #custom-option="{ filter, option }">
            <router-link
              v-if="filter.key === 'repos' && option.value === 'add-repo-link'"
              :href="`/c/${clusterId}/apps/catalog.cattle.io.clusterrepo/create`"
              target="_blank"
              class="add-repo-link"
            >
              + <span class="secondary-text-link">{{ t('catalog.charts.addNew') }}</span>
            </router-link>
          </template>
        </rc-filter-panel>

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
            v-for="card in appCards"
            :id="card.id"
            :key="card.id"
            :pill="card.pill"
            :header="card.header"
            :image="card.image"
            :content="card.content"
            :value="card.rawChart"
            :clickable="true"
            @card-click="selectChart"
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

.add-repo-link {
  all: unset;
  cursor: pointer;
  color: var(--link-text-secondary);
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
