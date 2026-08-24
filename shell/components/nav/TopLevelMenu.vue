<script>
import BrandImage from '@shell/components/BrandImage';
import ClusterIconMenu from '@shell/components/ClusterIconMenu';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher';
import IconOrSvg from '../IconOrSvg';
import { mapGetters } from 'vuex';
import { CAPI, COUNT, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import { PINNED_CLUSTERS, RECENT_CLUSTERS, SEARCH_ECHO_MAX } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { KEY } from '@shell/utils/platform';
import { getVersionInfo } from '@shell/utils/version';
import { SETTING } from '@shell/config/settings';
import { getProductFromRoute } from '@shell/utils/router';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { isRancherPrime } from '@shell/config/version';
import Pinned from '@shell/components/nav/Pinned';
import sideNavService from '@shell/components/nav/TopLevelMenu.helper';
import { debounce } from 'lodash';
import { sameContents } from '@shell/utils/array';
import { RcSeparator } from '@components/RcSeparator';

export default {
  components: {
    BrandImage,
    ClusterIconMenu,
    ClusterSwitcher,
    IconOrSvg,
    Pinned,
    RcSeparator,
  },

  data() {
    const sideNavServiceInitialized = sideNavService.initialized;

    sideNavService.init(this.$store);

    const { displayVersion, fullVersion } = getVersionInfo(this.$store);
    const hasProvCluster = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);

    const canPagination = this.$store.getters[`management/paginationEnabled`]({
      id:      MANAGEMENT.CLUSTER,
      context: 'side-bar',
    }) && this.$store.getters[`management/paginationEnabled`]({
      id:      CAPI.RANCHER_CLUSTER,
      context: 'side-bar',
    });
    const helper = sideNavService.helper;
    const provClusters = !canPagination && hasProvCluster ? this.$store.getters[`management/all`](CAPI.RANCHER_CLUSTER) : [];
    const mgmtClusters = !canPagination ? this.$store.getters[`management/all`](MANAGEMENT.CLUSTER) : [];

    if (!canPagination || !sideNavServiceInitialized) {
      // Reduce the impact of the initial load, or properly initialised
      // Doing this here means we don't need an 'immediate' on the watches below
      const args = {
        pinnedIds:  this.$store.getters['prefs/get'](PINNED_CLUSTERS),
        recentIds:  this.$store.getters['prefs/get'](RECENT_CLUSTERS),
        searchTerm: '',
      };

      // `update` refreshes only the watched context set (local/pinned/recent). The ALL list loads lazily
      // on the open/scroll triggers, not here. SURE-8192.
      helper.update(args);
    }

    return {
      shown:               false,
      // PINNED + RECENT are always shown (no collapse). The estate lives behind the search "door":
      // focusing the filter swaps the shelf for the ALL CLUSTERS directory. SURE-8192 (v2).
      allClustersExpanded: false,
      displayVersion,
      fullVersion,
      // The single search term shared by BOTH the expanded-nav search box AND the collapsed-rail flyout,
      // so a query typed in one is still there (with the same filtered list) when the other is opened. It
      // drives the ONE `clustersOthers` pipeline (`search` → resetOthers). SURE-8192 (v2).
      clusterFilter:       '',
      hasProvCluster,
      loadingMoreOthers:   false,
      // A search request is in flight (drives the flyout's initial search skeleton). SURE-8192.
      searchLoading:       false,
      routeCombo:          false,

      canPagination,
      helper,
      debouncedHelperUpdateSlow:   debounce((...args) => this.helper.update(...args), 1000),
      debouncedHelperUpdateMedium: debounce((...args) => this.helper.update(...args), 750),
      debouncedHelperUpdateQuick:  debounce((...args) => this.helper.update(...args), 200),
      // The ALL list is unwatched + page-increment: reset to page 1 on the open/search triggers, debounced
      // so search typing doesn't spam requests. SURE-8192.
      debouncedResetOthers:        debounce(() => this.resetOthersList(), 200),
      provClusters,
      mgmtClusters,
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters(['clusterReady', 'isRancher', 'currentCluster', 'currentProduct', 'isRancherInHarvester']),
    ...mapGetters({ features: 'features/get' }),

    pinnedIds() {
      return this.$store.getters['prefs/get'](PINNED_CLUSTERS);
    },

    recentIds() {
      return this.$store.getters['prefs/get'](RECENT_CLUSTERS);
    },

    allClustersCount() {
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};
      const count = counts[MANAGEMENT.CLUSTER] || {};

      return count?.summary.count || 0;
    },

    routeComboActive() {
      if (!this.routeCombo || !this.isCurrRouteClusterExplorer) {
        return false;
      }

      const ready = [...this.appBar.pinFiltered, ...this.appBar.clustersFiltered].filter((c) => c.ready);
      const readyCount = ready.length;

      return readyCount > 1 || (readyCount === 1 && this.clusterId !== ready[0].id);
    },

    // New
    search() {
      return (this.clusterFilter || '').toLowerCase();
    },


    // New
    searchActive() {
      return !!this.search;
    },

    // The estate "door" is OPEN whenever the filter has been focused (allClustersExpanded) OR while it
    // holds any search text (searchActive). It STAYS open when the text is deleted — emptying the query
    // must NOT snap back to the PINNED/RECENT shelf. The only way back to the shelf is the explicit clear
    // (the X → exitSearch); losing focus or clearing the text never closes it. SURE-8192 (v2).
    searchMode() {
      return this.allClustersExpanded || this.searchActive;
    },

    // The "no clusters match" line echoes the query back; cap a very long query with an ellipsis so it
    // can't overflow. Mirrors the flyout's truncatedSearch (same 30-char limit). SURE-8192 (v2).
    truncatedSearch() {
      const s = this.clusterFilter || '';

      return s.length > SEARCH_ECHO_MAX ? `${ s.slice(0, SEARCH_ECHO_MAX) }…` : s;
    },

    /**
     * Only Clusters that are pinned
     *
     * (see description of helper.clustersPinned for more details)
     */
    pinFiltered() {
      return this.hasProvCluster ? this.helper.clustersPinned : [];
    },

    /**
     * Used to shown unpinned clusters OR results of text search
     *
     * (see description of helper.clustersOthers for more details)
     */
    clustersFiltered() {
      return this.hasProvCluster ? this.helper.clustersOthers : [];
    },

    // Recently-visited clusters for the switcher shelf (SURE-8192).
    recentClusters() {
      return this.hasProvCluster ? this.helper.clustersRecent : [];
    },

    // `local` (the management cluster) is a FIXED slot at the top of the cluster area on every surface
    // — never inside PINNED / RECENT / ALL, not pinnable, never evicted (SURE-8192, rev 2). Pull it out
    // of the groups and render it as its own tile.
    localCluster() {
      // The `hide-local-cluster` setting removes `local` from the nav entirely — its fixed slot must
      // honor it too (the slice below fetches strictly by id and does NOT apply that filter). SURE-8192.
      if (this.hideLocalCluster) {
        return null;
      }

      // `local` now comes from its own dedicated slice (helper.clustersLocal) — it's excluded from
      // pinned/recent/others/search, so it's never scavenged from those groups. SURE-8192.
      return (this.hasProvCluster ? this.helper.clustersLocal?.[0] : null) || null;
    },

    railPinned() {
      return this.pinFiltered.filter((c) => !c.isLocal);
    },

    railRecent() {
      return this.recentClusters.filter((c) => !c.isLocal);
    },

    // ALL CLUSTERS lists the COMPLETE estate. It is fetched SERVER-SIDE (DEFAULT_SORT: internal, then
    // connected/active, then name) and PAGINATED, so we PRESERVE that order rather than re-sorting the
    // loaded window client-side — otherwise "active first" would only hold within the current page, not
    // across the whole (paginated) estate. Pinned and recent come from the always-loaded context fetch;
    // append any not yet present in the loaded `others` page so they still show, without disturbing the
    // server ordering of what's loaded. Local excluded (its own fixed slot). While searching this is the
    // flat match list (also server-sorted, connected-first). SURE-8192 rev 2.
    railAll() {
      if (this.searchActive) {
        return this.clustersFiltered.filter((c) => !c.isLocal);
      }

      const others = this.clustersFiltered.filter((c) => !c.isLocal);
      const seen = new Set(others.map((c) => c.id));
      const extras = [...this.pinFiltered, ...this.recentClusters].filter((c) => !c.isLocal && !seen.has(c.id));

      return [...others, ...extras];
    },

    // ── Expanded-nav shelf (SURE-8192 v2) ────────────────────────────────────────────────────────────
    // PINNED + RECENT are ALWAYS shown (no collapse). The whole estate lives behind the search "door":
    // focusing the filter swaps this shelf for the ALL CLUSTERS directory (see `allClustersExpanded`).
    pinnedRows() {
      return this.appBar.pinFiltered;
    },

    recentRows() {
      return this.appBar.recentFiltered;
    },

    // A stable signature of the shelf's row ORDER, used as the cue to play the FLIP animation on pin/unpin.
    // The pinned and recent groups are kept SEPARATE (the `|`): a row crossing the pinned↔recent boundary
    // (last-pinned ↔ first-recent) leaves the CONCATENATED order unchanged, so without the separator the
    // signature wouldn't change and the FLIP wouldn't fire for exactly those two positions. SURE-8192 (v2).
    shelfOrder() {
      const ids = (rows) => rows.map((c) => c.id).join(',');

      return `${ ids(this.pinnedRows) }|${ ids(this.recentRows) }`;
    },

    // Expanded: shown when its accordion section is open OR a search is active (results live here).
    // Collapsed: the ALL list is CSS-hidden (the rail uses the flyout), so return the full list to
    // match legacy behavior — it never renders visibly either way.
    allRows() {
      if (!this.shown) {
        return this.appBar.clustersFiltered;
      }

      return this.searchMode ? this.appBar.clustersFiltered : [];
    },

    // Infinite-scroll: more rows exist when the loaded window is smaller than the server-side total.
    // `others` backs the ALL list + the expanded-nav search; `search` backs the flyout search. SURE-8192.
    hasMoreOthers() {
      return this.clustersFiltered.length < (this.helper.counts?.others || 0);
    },

    // Total clusters matching the current search (page-1 response total), shown in the flyout's MATCHES
    // caption. Shared with the expanded nav — same `clustersOthers` pipeline. SURE-8192 (v2).
    switcherSearchCount() {
      return this.helper.counts?.others || 0;
    },

    // Exact count of clusters browsable in the ALL list — accurate at any estate size (not capped by
    // the rail's paginated slices). Uses the server-filtered total the app ALREADY fetches: updateCount
    // issues a findPage (pageSize 1 → returns the count, not the rows) with `paginationFilterClusters`
    // — the same Harvester + hide-local filters the rail applies — and saves it as
    // SAVED_COUNTS.K8S_CLUSTERS. So no extra query is needed here, just a read.
    //
    // Two adjustments vs that saved count:
    //  • local — the ALL list ALWAYS excludes `local` (its own fixed slot). The saved count still
    //    includes local UNLESS the hide-local-cluster setting removed it, so drop 1 only when not hidden.
    //  • fallback — updateCount short-circuits when NO filters apply (harvester shown + local not
    //    hidden), leaving the saved count unset; fall back to the raw management-cluster COUNT summary.
    // SURE-8192.
    browsableClusterCount() {
      const savedCount = this.$store.getters['management/getSavedCount'](SAVED_COUNTS.K8S_CLUSTERS);
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};
      const rawTotal = counts[MANAGEMENT.CLUSTER]?.summary?.count || 0;
      const base = typeof savedCount === 'number' ? savedCount : rawTotal;

      const hideLocalSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
      const hideLocal = (hideLocalSetting.value || hideLocalSetting.default || 'false') === 'true';
      const localAdjust = hideLocal ? 0 : 1; // ALL never shows local; filtered count still has it unless hidden

      return Math.max(0, base - localAdjust);
    },

    // Id of the cluster currently being explored — marked `current` in the switcher. Only a route that is
    // actually scoped to a real cluster counts: on global pages (Home, Cluster Management, prefs…) the
    // store keeps `clusterId` set behind the scenes so the header/nav context persists, but nothing in the
    // switcher should still look selected there. So gate on the route's cluster param. SURE-8192 (v2).
    currentClusterId() {
      const routeCluster = this.$route?.params?.cluster;

      if (!routeCluster || routeCluster === BLANK_CLUSTER) {
        return '';
      }

      const id = this.$store.getters['clusterId'];

      return typeof id === 'string' ? id : '';
    },

    pinnedClustersHeight() {
      const pinCount = this.pinFiltered.length;
      const height = pinCount > 2 ? (pinCount * 43) : 90;

      return `min-height: ${ height }px`;
    },

    multiClusterApps() {
      const options = this.options;

      return options.filter((opt) => {
        const filterApps = (opt.inStore === 'management' || opt.isMultiClusterApp) && opt.category !== 'configuration' && opt.category !== 'legacy';

        if (this.isRancherInHarvester) {
          return filterApps && opt.category !== 'hci';
        } else {
          // We expect the location of Virtualization Management to remain the same when rancher-manage-support is not enabled
          return filterApps;
        }
      });
    },

    configurationApps() {
      const options = this.options;

      return options.filter((opt) => opt.category === 'configuration');
    },

    hciApps() {
      const options = this.options;

      return options.filter((opt) => this.isRancherInHarvester && opt.category === 'hci');
    },

    options() {
      const cluster = this.clusterId || this.$store.getters['defaultClusterId'];

      // TODO plugin routes
      const entries = this.$store.getters['type-map/activeProducts']?.map((p) => {
        // Try product-specific index first
        const to = p.to || {
          name:   `c-cluster-${ p.name }`,
          params: { cluster }
        };

        const matched = this.$router.getRoutes().filter((route) => route.name === to.name);

        if ( !matched.length ) {
          to.name = 'c-cluster-product';
          to.params.product = p.name;
        }

        let label;

        // Allow product to specify its label (old DSL product() did not have "label" or "labelKey")
        // new extensions product registration supports both "label" and "labelKey" (with "labelKey" taking precedence if both are provided)
        if (p.labelKey) {
          label = this.$store.getters['i18n/t'](p.labelKey);
        } else if (p.label) {
          label = p.label;
        }

        if (!label) {
          label = this.$store.getters['i18n/withFallback'](`product.${ p.name }`, null, ucFirst(p.name));
        }

        return {
          label,
          icon:              `icon-${ p.icon || 'copy' }`,
          svg:               p.svg,
          value:             p.name,
          removable:         p.removable !== false,
          inStore:           p.inStore || 'cluster',
          weight:            p.weight || 1,
          category:          p.category || 'none',
          to,
          isMultiClusterApp: p.isMultiClusterApp,
        };
      });

      return sortBy(entries, ['weight']);
    },

    canEditSettings() {
      return (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');
    },

    hasSupport() {
      return isRancherPrime() || this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },

    isCurrRouteClusterExplorer() {
      return this.$route?.name?.startsWith('c-cluster') && this.productFromRoute === EXPLORER;
    },

    productFromRoute() {
      return getProductFromRoute(this.$route);
    },

    aboutText() {
      // If a version number (starts with 'v') then use that
      if (this.displayVersion.startsWith('v')) {
        // Don't show the '.0' for a minor release (e.g. 2.8.0, 2.9.0 etc)
        return !this.displayVersion.endsWith('.0') ? this.displayVersion : this.displayVersion.substr(0, this.displayVersion.length - 2);
      }

      // Default fallback to 'About'
      return this.t('about.title');
    },

    largeAboutText() {
      return this.aboutText.length > 6;
    },

    appBar() {
      let activeFound = false;

      // order is important for the object keys here
      // since we want to check last pinFiltered and clustersFiltered
      const appBar = {
        hciApps:           this.hciApps,
        multiClusterApps:  this.multiClusterApps,
        configurationApps: this.configurationApps,
        localCluster:      this.localCluster ? [this.localCluster] : [],
        pinFiltered:       this.railPinned,
        recentFiltered:    this.railRecent,
        clustersFiltered:  this.railAll,
      };

      const clusterSections = ['localCluster', 'pinFiltered', 'recentFiltered', 'clustersFiltered'];

      // Pass 1 — clear every item's active flag.
      Object.keys(appBar).forEach((menuSection) => {
        appBar[menuSection].forEach((item) => {
          item.isMenuActive = false;
        });
      });

      // Pass 2 — light up the FIRST item matching the current route. Kept SEPARATE from the reset
      // above: rev-2's ALL list (clustersFiltered = railAll) shares cluster object refs with
      // pinFiltered/recentFiltered, so a combined reset+set pass let the later ALL section's
      // unconditional reset clobber the flag an earlier section had set — leaving the current cluster
      // (almost always also in RECENT/PINNED) un-highlighted. SURE-8192.
      Object.keys(appBar).forEach((menuSection) => {
        if (activeFound) {
          return;
        }

        const isClusterCheck = clusterSections.includes(menuSection);

        appBar[menuSection].forEach((item) => {
          if (!activeFound && this.checkActiveRoute(item, isClusterCheck)) {
            item.isMenuActive = true;
            activeFound = true;
          }
        });
      });

      return appBar;
    },

    hideLocalCluster() {
      const hideLocalSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
      const value = hideLocalSetting.value || hideLocalSetting.default || 'false';

      return value === 'true';
    },

    clusterCountsFromCounts() {
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};

      return counts[CAPI.RANCHER_CLUSTER]?.summary.count;
    }
  },

  // See https://github.com/rancher/dashboard/issues/12831 for outstanding performance related work
  watch: {
    $route() {
      this.shown = false;
    },

    // Expanding shows the PINNED/RECENT shelf (v2) — the ALL directory loads only when the user focuses
    // the door, so we neither auto-focus nor preload the estate on expand. SURE-8192 (v2).
    shown(neu) {
      if (!neu) {
        // Leaving directory mode when the nav collapses.
        this.allClustersExpanded = false;
      }
    },

    // Before SSP world all of these changes were kicked off given Vue change detection to properties in a computed method.
    // Changes could come from two scenarios
    // 1. Changes made by the user (pin / search). Could be tens per second
    // 2. Changes made by rancher to clusters (state, label, etc change). Could be hundreds a second
    // They can be restricted to help the churn caused from above
    // 1. When SSP enabled reduce http spam
    // 2. When SSP is disabled (legacy) reduce fn churn (this was a known performance customer issue)

    // The shelf is DERIVED from these prefs (helper.clustersPinned/Recent read them), so it re-materializes
    // on its own whenever a pref changes — the optimistic commit AND the reconcile commit each flow
    // straight through. These watchers just (1) snapshot positions so the FLIP can animate the change, and
    // (2) refresh the context fetch/watch so a newly-pinned cluster's data loads. SURE-8192.
    pinnedIds: {
      handler(neu, old) {
        if (sameContents(neu, old)) {
          return;
        }

        // The cluster just pinned/unpinned gets the "wash" highlight once the shelf reorders.
        const added = (neu || []).filter((x) => !(old || []).includes(x));
        const removed = (old || []).filter((x) => !(neu || []).includes(x));

        this._washId = added[0] || removed[0] || null;

        // Snapshot shelf-row positions BEFORE the derived shelf re-renders; the shelfOrder watcher plays the
        // FLIP after the DOM updates.
        this.captureFlip();

        // Refresh the context fetch/watch so a newly-pinned cluster's data lands (if not already cached).
        this.updateClusters(neu, 'quick');

        // Flip the `pinned` flag on EVERY cached cluster now, so the pin ICON on every surface (shelf,
        // flyout, ALL) updates in the same tick as the membership + FLIP — not on the later refetch.
        this.helper.syncPinnedFlags(neu);
      }
    },

    recentIds: {
      handler(neu, old) {
        if (sameContents(neu, old)) {
          return;
        }

        // Snapshot positions before the derived RECENT list re-renders. On a pin/unpin both watchers fire in
        // ONE flush before any render, so this reads the same pre-move layout.
        this.captureFlip();
        this.updateClusters(this.pinnedIds, 'quick');
      }
    },

    // Once the shelf actually reorders (after updateClusters lands), FLIP-animate the rows from their
    // snapshotted positions to the new ones. Covers BOTH the expanded shelf and the collapsed rail (same
    // DOM). SURE-8192 (v2).
    shelfOrder(neu, old) {
      if (neu !== old && this._flipBefore) {
        this.$nextTick(() => this.playFlip());
      }
    },

    search() {
      // Search term changed → refresh the watched context (so pin flags stay correct) AND reset the ALL
      // list to page 1 with the new term (debounced so typing doesn't spam requests). SURE-8192.
      this.updateClusters(this.pinnedIds, this.canPagination ? 'medium' : 'quick');
      this.debouncedResetOthers();
    },

    provClusters: {
      handler(neu, old) {
        if (this.canPagination) {
          // Shouldn't be doing this at all if pagination is on (updates handled by  TopLevelMenu pagination wrapper)
          return;
        }

        // Potentially incredibly high throughput. Changes should be at least limited (slow if state change, quick if added/removed). Shouldn't get here if SSP
        this.updateClusters(this.pinnedIds, neu?.length === old?.length ? 'slow' : 'quick');
      },
      deep: true,
    },

    mgmtClusters: {
      handler(neu, old) {
        if (this.canPagination) {
          // Shouldn't be doing this at all if pagination is on (updates handled by  TopLevelMenu pagination wrapper)
          return;
        }

        // Potentially incredibly high throughput. Changes should be at least limited (slow if state change, quick if added/removed). Shouldn't get here if SSP
        this.updateClusters(this.pinnedIds, neu?.length === old?.length ? 'slow' : 'quick');
      },
      deep: true,
    },

    hideLocalCluster() {
      this.updateClusters(this.pinnedIds, 'slow');
    },

    clusterCountsFromCounts: {
      async handler(neu, old) {
        await this.helper.updateCount(neu);
      },
      immediate: true,
    }

  },

  mounted() {
    document.addEventListener('keyup', this.handler);
    document.addEventListener('keydown', this.onSwitcherHotkey);
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handler);
    document.removeEventListener('keydown', this.onSwitcherHotkey);
  },

  methods: {
    checkActiveRoute(obj, isClusterRoute) {
      // for Cluster links in main nav: check if route is a cluster explorer one + check if route cluster matches cluster obj id + check if curr product matches route product
      if (isClusterRoute) {
        return this.isCurrRouteClusterExplorer && this.$route?.params?.cluster === obj?.id && this.productFromRoute === this.currentProduct?.name;
      }

      // for remaining main nav items, check if curr product matches route product is enough
      return this.productFromRoute === obj?.value;
    },

    // Alt/Option "keep context" reveal (issue 11329). `v-shortkey.hold` reports the raw modifier as
    // ABSOLUTE state (`detail.held` true on keydown, false on keyup) and force-releases on window blur /
    // tab hide, so this just mirrors it onto `routeCombo`. The old `.push` modifier toggled instead, which
    // desynced (stuck on, then inverted) whenever a key edge was missed while focus was elsewhere, e.g.
    // clicking the URL bar or alt-tabbing away.
    onRouteComboHold(e) {
      this.routeCombo = e.detail.held;
    },

    clusterMenuClick(ev, cluster) {
      // Navigating to a cluster clears the shared search, so the shelf (PINNED/RECENT) — not a stale
      // filtered list — is what greets the next open of either the nav or the flyout. SURE-8192 (v2).
      this.clusterFilter = '';

      if (this.routeComboActive) {
        ev.preventDefault();

        if (this.isCurrRouteClusterExplorer && this.productFromRoute === this.currentProduct?.name) {
          const clusterRoute = {
            name:   this.$route.name,
            params: { ...this.$route.params },
            query:  { ...this.$route.query }
          };

          clusterRoute.params.cluster = cluster.id;

          return this.$router.push(clusterRoute);
        }
      }

      return this.$router.push(cluster.clusterRoute);
    },

    // ── Cluster-switcher flyout wiring (SURE-8192) ──────────────────────────────
    // Explore keeps the current view where possible (reuses the route-combo logic); manage + the footer
    // link go to Cluster Management. `hide()` closes the rail after a switch, matching the chip flow.
    switcherExplore(cluster) {
      this.clusterMenuClick({ preventDefault: () => {} }, cluster);
      this.hide();
    },

    // The flyout writes into the SHARED `clusterFilter`, so its query is the same one the expanded nav
    // uses (and vice versa). The `search` watcher then drives the one `clustersOthers` pipeline via
    // `debouncedResetOthers`; the skeleton flag is cleared when that resolves (resetOthersList). SURE-8192.
    onSwitcherSearch(term) {
      // Show the loading skeleton immediately (cleared when the debounced request resolves). SURE-8192.
      this.searchLoading = !!term;
      this.clusterFilter = term;
    },

    handler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.hide();
      }
    },

    // Cmd (Mac) / Alt (Windows/Linux) + J toggles the cluster-switcher flyout — press again to close.
    // The flyout lives on the collapsed rail (ClusterSwitcher renders only when !shown), so the shortcut
    // acts when that ref is present. `e.code` keys off the physical J so Mac's Option-J (which yields a
    // different `e.key`) still matches. SURE-8192 (v2).
    onSwitcherHotkey(e) {
      const isJ = e.code === 'KeyJ' || (e.key || '').toLowerCase() === 'j';

      if (!isJ || !(e.metaKey || e.altKey) || e.ctrlKey || e.shiftKey) {
        return;
      }

      const switcher = this.$refs.switcher;

      if (switcher) {
        e.preventDefault();
        switcher.toggle();
      }
    },

    hide() {
      this.shown = false;
      if (this.clustersFiltered === 0) {
        this.clusterFilter = '';
      }
    },

    toggle() {
      this.shown = !this.shown;
    },

    // The "door": focusing the filter swaps the shelf for the ALL CLUSTERS directory (page-1 trigger).
    // Leaving ALL mode is EXPLICIT — the clear (X) button or Esc — NOT blur, so clicking away from an
    // (even empty) search no longer snaps back to the PINNED/RECENT shelf. SURE-8192 (v2).
    onFilterFocus() {
      this.allClustersExpanded = true;
      this.resetOthersList();
    },

    // Clear the search AND return to the PINNED/RECENT shelf (the only way out of ALL mode).
    exitSearch() {
      this.clusterFilter = '';
      this.allClustersExpanded = false;
    },

    // Same meta line as the flyout rows: distro/provider · k8s version (e.g. "EKS · v1.31.2"). SURE-8192.
    clusterMeta(c) {
      return [c.providerDisplay, c.kubernetesVersion].filter((p) => !!p).join(' · ');
    },


    // The [data-flip] shelf rows to animate — VISIBLE ones only. When collapsed, the (CSS-hidden) ALL
    // CLUSTERS list renders the SAME cluster ids with data-flip; including those would double-key the FLIP
    // Map and make it measure/animate the wrong (hidden, top≈0) element, breaking the collapsed-rail
    // animation. `offsetParent === null` for a display:none element skips the hidden duplicates. SURE-8192.
    flipRows() {
      const root = this.$el;

      if (!root || typeof root.querySelectorAll !== 'function') {
        return [];
      }

      return Array.from(root.querySelectorAll('[data-flip]')).filter((n) => n.offsetParent !== null);
    },

    // FLIP animation for the pin/unpin shelf reorder (see the `pinnedIds`/`recentIds`/`shelfOrder`
    // watchers). Adapted from the kwwii/ux prototype; works on both the expanded shelf and the collapsed
    // rail (same `[data-flip]` rows). SURE-8192 (v2).
    captureFlip() {
      this._flipBefore = new Map();
      this.flipRows().forEach((n) => {
        this._flipBefore.set(n.dataset.flip, n.getBoundingClientRect().top);
      });
    },

    playFlip() {
      const before = this._flipBefore;

      this._flipBefore = null;

      if (!before) {
        return;
      }
      const washId = this._washId;

      this._washId = null;

      const rows = this.flipRows();

      rows.forEach((n) => {
        const b = before.get(n.dataset.flip);

        // A row that wasn't on the shelf before is ENTERING — fade + slide it in (flyin) rather than
        // relocate it. SURE-8192 (v2).
        if (b === undefined) {
          this.retrigger(n, 'flyin');

          return;
        }
        const dy = b - n.getBoundingClientRect().top;

        if (Math.abs(dy) >= 2) {
          // Invert: jump the row back to where it was, with no transition…
          n.classList.add('flipping');
          n.style.transition = 'none';
          n.style.transform = `translateY(${ dy }px)`;
          // …then play: next frame, transition it to its natural (new) position.
          requestAnimationFrame(() => {
            n.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.7, 0.3, 1)';
            n.style.transform = '';

            const cleanup = () => {
              n.classList.remove('flipping');
              n.style.transition = '';
              n.style.transform = '';
              n.removeEventListener('transitionend', cleanup);
            };

            n.addEventListener('transitionend', cleanup);
          });
        }
      });

      // Flash the just-toggled row once it has landed (wash) — the VISIBLE one. SURE-8192 (v2).
      if (washId) {
        const washRow = rows.find((n) => n.dataset.flip === washId);

        if (washRow) {
          this.retrigger(washRow, 'wash');
        }
      }
    },

    // Re-trigger a one-shot CSS animation class (remove → reflow → add), clearing it on animationend.
    retrigger(el, cls) {
      el.classList.remove(cls);
      el.getBoundingClientRect(); // force reflow so the animation restarts
      el.classList.add(cls);

      const done = () => {
        el.classList.remove(cls);
        el.removeEventListener('animationend', done);
      };

      el.addEventListener('animationend', done);
    },

    onFilterEscape(e) {
      this.exitSearch();
      e?.target?.blur();
    },

    // Fetch page 1 of the ALL directory with the CURRENT pinned/recent/search context — the shared handler
    // for every "show me the ALL list" trigger (door focus, flyout open/chevron). `.catch` swallows the
    // pagination wrapper's benign concurrent-request de-dup rejection. SURE-8192.
    resetOthersList() {
      this.helper.resetOthers({
        pinnedIds:  this.pinnedIds,
        recentIds:  this.recentIds,
        searchTerm: this.search,
      }).catch(() => {}).finally(() => {
        // Clear the flyout's initial-search skeleton once the shared results land. SURE-8192 (v2).
        this.searchLoading = false;
      });
    },

    // ── Infinite scroll (SURE-8192) ─────────────────────────────────────────────────────────────────
    // Append the NEXT page of the ALL list (select-style page-increment: fixed page size, concat). The
    // helper owns the page counter; the component only guards re-entry.
    async loadMoreOthers() {
      if (this.loadingMoreOthers || !this.hasMoreOthers) {
        return;
      }

      this.loadingMoreOthers = true;

      try {
        await this.helper.loadMoreOthers();
      } catch (e) {
        // Best-effort load-more — swallow a benign concurrent-request de-dup rejection; the next scroll
        // re-fetches the next page. SURE-8192.
      } finally {
        this.loadingMoreOthers = false;
      }
    },

    // Expanded-nav ALL / MATCHES list scroll → load the next window as it nears the bottom. `.clusters`
    // is the SAME element on the collapsed rail (pinned/recent chips), but there the ALL list is hidden
    // and browsing happens in the flyout (its own load-more) — so only paginate when the expanded ALL or
    // search list is actually the scrollable content, never on the collapsed rail. SURE-8192.
    onClustersScroll(e) {
      if (!this.shown || !this.searchMode) {
        return;
      }

      const el = e.target;

      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        this.loadMoreOthers();
      }
    },

    // The flyout and the expanded nav browse the SAME `clustersOthers` list, so both paginate through it.
    onFlyoutLoadMore() {
      this.loadMoreOthers();
    },

    // Flyout opened (the collapsed-rail "ALL" button) → page-1 trigger for the (unwatched) ALL list.
    // Non-conditional: always re-fetch page 1 so the flyout's list is fresh on open. SURE-8192.
    onFlyoutOpen(open) {
      if (open) {
        this.resetOthersList();
      }
    },

    async goToHarvesterCluster() {
      const localCluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, 'fleet-local/local');

      try {
        await localCluster.goToHarvesterCluster();
      } catch {
      }
    },

    getTooltipConfig(item, showWhenClosed = false) {
      if (!item) {
        return;
      }

      let contentText = '';
      let content;
      let popperClass = '';

      // this is the normal tooltip scenario where we are just passing a string
      if (typeof item === 'string') {
        contentText = item;
        content = this.shown ? null : contentText;

      // if key combo is pressed, then we update the tooltip as well
      } else if (this.routeComboActive &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        item !== null &&
        item.ready) {
        contentText = this.t('nav.keyComboTooltip');

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          content = this.shown ? contentText : null;
        }

      // this is scenario where we show a tooltip when we are on the expanded menu to show full description
      } else {
        contentText = item.label;
        // this adds a class to the tooltip container so that we can control the max width
        popperClass = 'menu-description-tooltip';

        if (item.description) {
          contentText += `<br><br>${ item.description }`;
        }

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          // No hover tooltip in the EXPANDED nav — the full label + description already shows in the row.
          // The collapsed rail keeps its tooltip via the showWhenClosed calls above. SURE-8192 (v2).
          content = null;
        }
      }

      return {
        content,
        placement: 'right',
        popperClass
      };
    },

    updateClusters(pinnedIds, speed = 'slow' | 'medium' | 'quick') {
      const args = {
        pinnedIds,
        recentIds:  this.recentIds,
        searchTerm: this.search,
      };

      try {
        switch (speed) {
        case 'slow':
          this.debouncedHelperUpdateSlow(args);
          break;
        case 'medium':
          this.debouncedHelperUpdateMedium(args);
          break;
        case 'quick':
          this.debouncedHelperUpdateQuick(args);
          break;
        }
      } catch (err) {
        if (this.canPagination) {
          // Double bubble up errors here, errors are tracked further down
          // Note that this won't pick up async errors, further tweaks are required for that
        } else {
          throw err;
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="shown"
      class="side-menu-glass"
      @click="hide()"
    />
    <transition name="fade">
      <!-- Side menu -->
      <div
        data-testid="side-menu"
        class="side-menu"
        :class="{'menu-open': shown, 'menu-close':!shown}"
        tabindex="-1"
        role="navigation"
        :aria-label="t('nav.ariaLabel.topLevelMenu')"
      >
        <!-- Logo and name -->
        <div class="title">
          <div
            data-testid="top-level-menu"
            :aria-label="shown ? t('nav.collapseAppBar') : t('nav.expandAppBar')"
            :aria-expanded="shown"
            aria-controls="top-level-menu-body"
            role="button"
            tabindex="0"
            class="menu"
            @keyup.enter="toggle()"
            @keyup.space="toggle()"
            @click="toggle()"
          >
            <svg
              class="menu-icon"
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              :alt="t('nav.alt.mainMenuIcon')"
            ><path
              d="M0 0h24v24H0z"
              fill="none"
            /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          </div>
          <div class="side-menu-logo">
            <BrandImage
              data-testid="side-menu__brand-img"
              :alt="t('nav.alt.mainMenuRancherLogo')"
              file-name="rancher-logo.svg"
            />
          </div>
        </div>

        <!-- Menu body -->
        <div
          id="top-level-menu-body"
          class="body"
        >
          <div
            :class="{ 'bottom-border': shown }"
          >
            <!-- Home button -->
            <div
              class="home-link"
              @click="hide()"
            >
              <router-link
                class="option cluster selector home"
                :to="{ name: 'home' }"
                role="link"
                :aria-label="t('nav.ariaLabel.homePage')"
              >
                <svg
                  v-clean-tooltip="getTooltipConfig(t('nav.home'))"
                  class="top-menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                ><path
                  d="M0 0h24v24H0z"
                  fill="none"
                /><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                <div class="home-text">
                  {{ t('nav.home') }}
                </div>
              </router-link>
            </div>
            <!-- CLUSTERS section label — replaces the home/local divider line; same label style as
                 PINNED / RECENT (v2 — no divider lines, labels are the separators). SURE-8192. -->
            <div class="cluster-group-label">
              {{ t('nav.switcher.clusters') }}
            </div>
            <!-- local (management cluster): fixed slot at the top of the cluster area (SURE-8192 rev 2) -->
            <div
              v-if="localCluster"
              class="cluster-local"
              @click="hide()"
            >
              <button
                v-shortkey.push="{windows: ['alt'], mac: ['option']}"
                class="cluster selector option"
                :class="{ 'active-menu-link': localCluster.isMenuActive }"
                :aria-current="localCluster.isMenuActive ? 'page' : undefined"
                :data-testid="`menu-cluster-local`"
                role="button"
                :aria-label="`${ t('nav.ariaLabel.cluster') } ${ localCluster.label }`"
                @click.prevent="clusterMenuClick($event, localCluster)"
                @shortkey="handleKeyComboClick"
              >
                <ClusterIconMenu
                  v-clean-tooltip="getTooltipConfig(localCluster, true)"
                  :cluster="localCluster"
                  :route-combo="routeComboActive"
                  class="rancher-provider-icon"
                  :show-pin="false"
                />
                <div
                  v-clean-tooltip="getTooltipConfig(localCluster)"
                  class="cluster-name"
                >
                  <p>{{ localCluster.label }}</p>
                  <p class="description">
                    {{ t('nav.switcher.managementCluster') }}
                  </p>
                </div>
              </button>
            </div>
            <!-- The "door" (SURE-8192 v2): ONE slot below local. Expanded = the estate filter (focusing it
                 swaps the PINNED/RECENT shelf for the ALL CLUSTERS directory; blur returns to the shelf);
                 collapsed = the count-badge that opens the switcher flyout. Same container so the two morph
                 in place rather than reflowing. -->
            <div
              v-if="!!allClustersCount"
              class="cluster-door"
            >
              <div
                v-if="shown"
                class="clusters-search"
              >
                <div
                  class="search"
                >
                  <input
                    ref="clusterFilter"
                    v-model="clusterFilter"
                    :placeholder="t('nav.switcher.searchPlaceholder', { count: browsableClusterCount })"
                    :tabindex="!shown ? -1 : 0"
                    :aria-label="t('nav.search.ariaLabel')"
                    @focus="onFilterFocus"
                    @keyup.esc="onFilterEscape"
                  >
                  <i
                    class="magnifier icon icon-search"
                    :class="{ active: clusterFilter }"
                    aria-hidden="true"
                  />
                  <!-- Clear (X): a real button (keyboard-operable), shown whenever we're in ALL mode (even
                       with an empty search) since it's the explicit way back to the PINNED/RECENT shelf.
                       mousedown.prevent keeps the input from blurring first so the click lands. v2. -->
                  <button
                    v-if="searchMode"
                    type="button"
                    class="icon icon-close"
                    :aria-label="t('nav.search.clear')"
                    @mousedown.prevent
                    @click="exitSearch"
                  />
                </div>
              </div>
              <div
                v-else
                class="clustersAll"
              >
                <ClusterSwitcher
                  ref="switcher"
                  :all="railAll"
                  :local="localCluster"
                  :search-results="clustersFiltered"
                  :cluster-count="browsableClusterCount"
                  :search-count="switcherSearchCount"
                  :search-loading="searchLoading"
                  :current-cluster-id="currentClusterId"
                  :search="clusterFilter"
                  :has-more="hasMoreOthers"
                  :loading-more="loadingMoreOthers"
                  @update:search="onSwitcherSearch"
                  @load-more="onFlyoutLoadMore"
                  @update:open="onFlyoutOpen"
                  @select="switcherExplore"
                >
                  <!-- Trigger reuses the app-bar's own cluster-button structure so the ALL tile matches
                       the pinned/recent rows exactly; the count sits in the icon lane so the collapsed
                       rail shows the estate size. SURE-8192 (v2). -->
                  <template #trigger="{ toggle: toggleSwitcher, open: switcherOpen, count: switcherCount }">
                    <button
                      type="button"
                      class="cluster selector option cluster-all"
                      :aria-label="t('nav.switcher.ariaLabel')"
                      :aria-expanded="switcherOpen"
                      aria-haspopup="listbox"
                      @click.prevent="toggleSwitcher"
                    >
                      <div class="cluster-all-lane">
                        <div class="cluster-all-badge">
                          {{ switcherCount }}
                          <svg
                            class="cluster-all-chevron"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          ><path d="M8.38085 5.38085C8.72256 5.03915 9.27743 5.03915 9.61914 5.38085L15.6191 11.3809C15.9608 11.7226 15.9608 12.2774 15.6191 12.6191L9.61914 18.6191C9.27743 18.9608 8.72256 18.9608 8.38085 18.6191C8.03915 18.2774 8.03915 17.7226 8.38085 17.3809L13.7617 12L8.38085 6.61914C8.03915 6.27743 8.03915 5.72256 8.38085 5.38085Z" /></svg>
                        </div>
                      </div>
                    </button>
                  </template>
                </ClusterSwitcher>
              </div>
            </div>
          </div>

          <!-- Harvester extras -->
          <template v-if="hciApps.length">
            <div class="category" />
            <div>
              <a
                v-if="isRancherInHarvester"
                class="option"
                tabindex="0"
                @click="goToHarvesterCluster()"
              >
                <i
                  class="icon icon-dashboard app-icon"
                />
                <div>
                  {{ t('nav.harvesterDashboard') }}
                </div>
              </a>
            </div>
            <div
              v-for="(a, i) in appBar.hciApps"
              :key="i"
              @click="hide()"
            >
              <router-link
                class="option"
                :to="a.to"
                :class="{'active-menu-link': a.isMenuActive }"
                role="link"
                :aria-label="`${t('nav.ariaLabel.harvesterCluster')} ${ a.label }`"
              >
                <IconOrSvg
                  class="app-icon"
                  :icon="a.icon"
                  :src="a.svg"
                />
                <div>{{ a.label }}</div>
              </router-link>
            </div>
          </template>

          <!-- Cluster menu -->
          <template v-if="!!allClustersCount">
            <div
              ref="clusterList"
              class="clusters"
              :style="pinnedClustersHeight"
              @scroll="onClustersScroll"
            >
              <!-- Pinned Clusters — collapsed rail ignores the search (it has no search input of its
                   own), so only the EXPANDED nav hides the group while filtering. -->
              <div
                v-if="railPinned.length && (!shown || !searchMode)"
                class="clustersPinned"
              >
                <div class="cluster-group-label">
                  {{ t('nav.switcher.pinned') }}
                </div>
                <div
                  v-for="(c, index) in pinnedRows"
                  :key="c.id"
                  :data-flip="c.id"
                  :data-testid="`pinned-ready-cluster-${index}`"
                  @click="hide()"
                >
                  <button
                    v-if="c.ready"
                    v-shortkey.hold="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`pinned-menu-cluster-${ c.id }`"
                    class="cluster selector option"
                    :class="{'active-menu-link': c.isMenuActive }"
                    :aria-current="c.isMenuActive ? 'page' : undefined"
                    :to="c.clusterRoute"
                    role="button"
                    :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                    @click.prevent="clusterMenuClick($event, c)"
                    @shortkey="onRouteComboHold"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeComboActive"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`pinned-menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </span>
                </div>
              </div>

              <!-- Recent Clusters (SURE-8192) -->
              <div
                v-if="railRecent.length && (!shown || !searchMode)"
                class="clustersRecent"
              >
                <div class="cluster-group-label">
                  {{ t('nav.switcher.recent') }}
                </div>
                <div
                  v-for="(c, index) in recentRows"
                  :key="c.id"
                  :data-flip="c.id"
                  :data-testid="`recent-ready-cluster-${index}`"
                  @click="hide()"
                >
                  <button
                    v-if="c.ready"
                    v-shortkey.push="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`recent-menu-cluster-${ c.id }`"
                    class="cluster selector option"
                    :class="{'active-menu-link': c.isMenuActive }"
                    :aria-current="c.isMenuActive ? 'page' : undefined"
                    :to="c.clusterRoute"
                    role="button"
                    :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                    @click.prevent="clusterMenuClick($event, c)"
                    @shortkey="handleKeyComboClick"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeComboActive"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`recent-menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </span>
                </div>
              </div>

              <!-- ALL CLUSTERS directory — the estate, revealed only when the filter "door" is focused
                   (allClustersExpanded); hidden on the collapsed rail (uses the flyout). SURE-8192 (v2). -->
              <div
                v-if="!shown || searchMode"
                class="clustersList"
              >
                <div
                  v-if="!searchActive && browsableClusterCount"
                  class="cluster-group-label"
                >
                  {{ t('nav.switcher.allClusters') }}
                  <span class="cluster-group-count">{{ browsableClusterCount }}</span>
                </div>
                <!-- MATCHES header — replaces the ALL CLUSTERS accordion header while searching -->
                <div
                  v-if="searchActive && clustersFiltered.length"
                  class="cluster-group-label"
                >
                  {{ t('nav.switcher.matches') }}
                  <span class="cluster-group-count">{{ clustersFiltered.length }}</span>
                </div>
                <div
                  v-for="(c, index) in allRows"
                  :key="c.id"
                  :data-flip="c.id"
                  :data-testid="`top-level-menu-cluster-${index}`"
                  @click="hide()"
                >
                  <button
                    v-if="c.ready"
                    v-shortkey.hold="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`menu-cluster-${ c.id }`"
                    class="cluster selector option"
                    :class="{'active-menu-link': c.isMenuActive }"
                    :aria-current="c.isMenuActive ? 'page' : undefined"
                    :to="c.clusterRoute"
                    role="button"
                    :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                    @click="clusterMenuClick($event, c)"
                    @shortkey="onRouteComboHold"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeComboActive"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :class="{'showPin': c.pinned}"
                      :tab-order="shown ? 0 : -1"
                      :cluster="c"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                      :show-pin="false"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="clusterMeta(c)"
                        class="description"
                      >
                        {{ clusterMeta(c) }}
                      </p>
                    </div>
                    <Pinned
                      :class="{'showPin': c.pinned}"
                      :tab-order="shown ? 0 : -1"
                      :cluster="c"
                    />
                  </span>
                </div>
                <!-- Infinite-scroll loading skeleton -->
                <div
                  v-if="loadingMoreOthers"
                  class="cluster-skeleton"
                  aria-hidden="true"
                >
                  <div
                    v-for="n in 2"
                    :key="n"
                    class="skeleton-row"
                  >
                    <div class="skeleton-badge shimmer" />
                    <div class="skeleton-line shimmer" />
                  </div>
                </div>
              </div>

              <!-- No clusters message — same text + styling as the flyout's empty state. Announced via a
                   polite live region so screen-reader users hear it as they type. SURE-8192 (v2). -->
              <div
                v-if="clustersFiltered.length === 0 && searchActive"
                data-testid="top-level-menu-no-results"
                class="none-matching"
                role="status"
                aria-live="polite"
              >
                {{ t('nav.switcher.noMatch', { query: truncatedSearch }) }}
              </div>
            </div>
          </template>

          <!-- MULTI CLUSTER APPS -->
          <div class="category">
            <div :class="{ 'border-top': shown }">
              <template v-if="multiClusterApps.length">
                <div
                  class="category-title"
                >
                  <RcSeparator />
                  <span>
                    {{ t('nav.categories.multiCluster') }}
                  </span>
                </div>
                <div
                  v-for="(a, i) in appBar.multiClusterApps"
                  :key="i"
                  @click="hide()"
                >
                  <router-link
                    class="option"
                    :class="{'active-menu-link': a.isMenuActive }"
                    :to="a.to"
                    role="link"
                    :aria-label="`${t('nav.ariaLabel.multiClusterApps')} ${ a.label }`"
                  >
                    <IconOrSvg
                      v-clean-tooltip="getTooltipConfig(a.label)"
                      class="app-icon"
                      :icon="a.icon"
                      :src="a.svg"
                    />
                    <span class="option-link">{{ a.label }}</span>
                  </router-link>
                </div>
              </template>

              <!-- Configuration apps menu -->
              <template v-if="configurationApps.length">
                <div
                  class="category-title"
                >
                  <RcSeparator />
                  <span>
                    {{ t('nav.categories.configuration') }}
                  </span>
                </div>
                <div
                  v-for="(a, i) in appBar.configurationApps"
                  :key="i"
                  @click="hide()"
                >
                  <router-link
                    class="option"
                    :class="{'active-menu-link': a.isMenuActive }"
                    :to="a.to"
                    role="link"
                    :aria-label="`${t('nav.ariaLabel.configurationApps')} ${ a.label }`"
                  >
                    <IconOrSvg
                      v-clean-tooltip="getTooltipConfig(a.label)"
                      class="app-icon"
                      :icon="a.icon"
                      :src="a.svg"
                    />
                    <div>{{ a.label }}</div>
                  </router-link>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="footer"
        >
          <div
            class="version"
            :class="{'version-small': largeAboutText}"
            @click="hide()"
          >
            <router-link
              :to="{ name: 'about' }"
              role="link"
              :aria-label="t('nav.ariaLabel.about')"
            >
              {{ aboutText }}
            </router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
  // Nav tooltips must layer above the cluster-switcher flyout (z-index 102) and its page overlay (100).
  // Their poppers are teleported to <body>, so this global (unscoped) rule reaches them. SURE-8192 (v2).
  .v-popper__popper.v-popper--theme-tooltip {
    z-index: 103;
  }

  .menu-description-tooltip {
    max-width: 200px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .description-tooltip-pos-adjustment {
    // needs !important so that we can
    // offset the tooltip a bit so it doesn't
    // overlap the pin icon and cause bad UX
    left: 48px !important;
  }

  .localeSelector, .footer-tooltip {
    z-index: 1000;
  }

  .localeSelector {
    .v-popper__inner {
      padding: 10px 0;
    }

    .v-popper__arrow-container {
      display: none;
    }

    .v-popper:focus {
      outline: 0;
    }
  }

  .theme-dark .cluster-name .description {
    color: var(--input-label) !important;
  }
  .theme-dark .body .option  {
    &:hover .cluster-name .description,
    &.router-link-active .cluster-name .description,
    &.active-menu-link .cluster-name .description {
      color: var(--side-menu-desc) !important;
  }
  }
</style>

<style lang="scss" scoped>
  $clear-search-size: 20px;
  $icon-size: 25px;
  $option-padding: 9px;
  $option-padding-left: 14px;
  $option-height: $icon-size + $option-padding + $option-padding;

  // Type scale — the shelf + flyout only use these three sizes. SURE-8192 (v2).
  $font-size-label: 10px;  // shelf group labels (CLUSTERS / PINNED / RECENT), small captions
  $font-size-sm:    12px;  // meta / status / footer / counts
  $font-size-body:  14px;  // option row text

  // The cluster "chip": the app-bar icon badge (ClusterIconMenu) sets 42×32 / radius 5px; the count
  // chips mirror it and the icon lane is sized to hold it. SURE-8192 (v2).
  $chip-width:  42px;
  $chip-height: 32px;
  $chip-radius: 5px;

  // Spacing rhythm (4px base) + the shared nav transition, so the repeated paddings/margins/gaps and
  // the show/hide easing come from one place. SURE-8192 (v2).
  $space-1: 4px;
  $space-2: 8px;
  $space-4: 16px;
  $space-5: 20px;
  $transition-nav: all 0.25s ease-in-out;

  // Row action icons (gear + pin): a header-style hover "square" — a 22×22 box holding a 16px icon that
  // fills with a subtle grey on hover. Centres the glyph via line-height so it works whether the element
  // is display:block (pin toggle) or flex. SURE-8192 (v2).
  @mixin icon-hover-square {
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    width: 22px;
    min-width: 22px;
    height: 22px;
    min-height: 22px;
    padding: 0;
    line-height: 1;
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;

    &:hover {
      background: color-mix(in srgb, var(--body-text) 10%, transparent);
    }
  }

  // local (management cluster) fixed tile at the top of the cluster area (SURE-8192 rev 2).
  .cluster-local {
    margin-bottom: 0;
  }

  // A shelf row mid-FLIP (pin/unpin reorder) sits above its neighbours so it glides over them, and turns
  // off pointer events so the transient transform doesn't swallow clicks. SURE-8192 (v2).
  [data-flip].flipping {
    position: relative;
    z-index: 2;
    pointer-events: none;
  }

  // A row ENTERING the shelf (newly pinned/recent) fades + slides in from the left. SURE-8192 (v2).
  [data-flip].flyin {
    animation: cluster-flyin 0.16s ease-out;
  }

  @keyframes cluster-flyin {
    from {
      opacity: 0;
      transform: translateX(-6px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  // The just-toggled row flashes a brief primary tint that fades to transparent. SURE-8192 (v2).
  [data-flip].wash {
    animation: cluster-wash 0.6s ease-out;
  }

  @keyframes cluster-wash {
    0% {
      background: color-mix(in srgb, var(--primary) 15%, transparent);
    }

    100% {
      background: transparent;
    }
  }



  // (The shelf already conveys pinned-ness via the PINNED group + pin toggle, so ClusterIconMenu's
  // redundant pin overlay is hidden with :show-pin="false" on each chip — no scoped-style piercing.)

  // ALL: reuses the app-bar cluster-button (.option.cluster.selector) so it sits in the shelf like the
  // home / cluster rows, but its "icon" is a count chip (mirrors the ClusterIconMenu badge: 42×32,
  // filled, bordered) showing the estate size + a chevron. The chip lives in the same left icon lane so
  // the collapsed rail shows just the chip. SURE-8192 (v2).
  .cluster-all .cluster-all-lane {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: $chip-width;
    height: $chip-height;
  }
  .cluster-all .cluster-all-badge {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    width: $chip-width;
    height: $chip-height;
    // Same colour as the HOME icon/text (the app-bar link colour). SURE-8192 (v2).
    color: var(--on-tertiary, var(--link));
    font-weight: bold;
    font-size: $font-size-sm;
    text-transform: uppercase;
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--border);
    border-radius: $chip-radius;
  }
  // Override the app-bar's broad `.body .option svg { margin-right: 16px }` (which would shove the
  // chevron and knock "N ›" off-centre in the chip). SURE-8192 (v2).
  .cluster-all .cluster-all-badge .cluster-all-chevron {
    flex: 0 0 auto;
    margin-right: 0 !important;
  }

  // This tile is NOT a cluster you can be "in", so it must never take the hover/active treatment the
  // real cluster rows use — the green fill + white font is the "current cluster" cue. Freeze it: the
  // row stays transparent and the chip keeps its badge background + link-coloured "N ›" in every state,
  // including while the flyout is open. (High-specificity prefix beats `.body .option:hover`.) SURE-8192.
  .side-menu .body .option.cluster-all,
  .side-menu .body .option.cluster-all:hover,
  .side-menu .body .option.cluster-all:focus {
    background: transparent;

    .cluster-all-badge {
      color: var(--on-tertiary, var(--link));
      background: var(--nav-icon-badge-bg);
    }

    .cluster-all-chevron {
      fill: var(--on-tertiary, var(--link));
    }
  }

  // Hover (only) tints the chip border with the text/link colour — a plain clickable affordance, not an
  // active/selected state (the flyout being open doesn't light it up). SURE-8192 (v2).
  .side-menu .body .option.cluster-all:hover .cluster-all-badge {
    border-color: var(--on-tertiary, var(--link));
  }

  // The "door" slot below local: holds the search input (expanded) OR the count-badge (collapsed) in the
  // SAME box, so the two states occupy one consistent slot and morph in place. SURE-8192 (v2).
  .cluster-door {
    display: flex;
    align-items: center;
    height: 43px;
  }

  // ALL: the trigger tile that opens the switcher flyout (bottom of the shelf). It reuses the app-bar
  // cluster-button, so — exactly like the local/pinned rows — it flows at the full EXPANDED width and
  // left-aligns; the collapsed rail's overflow clips the name, leaving just the count chip in the icon
  // lane. (The flyout no longer anchors to this element — it is CSS fixed-positioned — so the trigger
  // no longer needs to be shrunk to the visible rail.) SURE-8192 (v2).
  .clustersAll {
    flex: 1 1 auto;
    min-width: 0;

    :deep(.v-popper) {
      display: block;
    }
  }

  // Shelf group labels (CLUSTERS / PINNED / RECENT). IDENTICAL in collapsed and expanded — a 70px-lane
  // centred 9px label — so it never reflows between states (mirror principle). The wider ALL CLUSTERS
  // directory caption is special-cased below. SURE-8192 (v2).
  .cluster-group-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;   // 8px between the caption and its count badge
    width: $app-bar-collapsed-width;
    padding: $space-2 0 $space-1;
    line-height: 18px;
    font-size: $font-size-label;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: uppercase;
    // Black, matching the GLOBAL APPS / CONFIGURATION section titles (.category-title). SURE-8192 (v2).
    color: var(--body-text);

    // Count badge: a neutral pill (Figma rev 2), shared by ALL CLUSTERS + MATCHES.
    .cluster-group-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      min-width: 22px;
      height: 16px;
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--body-text) 10%, transparent);
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0;
      text-transform: none;
      color: var(--body-text);
    }
  }
  // Infinite-scroll loading skeleton for the expanded ALL list — shimmer placeholder rows.
  .cluster-skeleton {
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: $space-4;
      padding: 8px $option-padding-left;
    }

    .skeleton-badge {
      flex: 0 0 auto;
      width: $chip-width;
      height: $chip-height;
      border-radius: var(--border-radius);
    }

    .skeleton-line {
      flex: 1 1 auto;
      max-width: 160px;
      height: 12px;
      border-radius: 4px;
    }
  }

  .shimmer {
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--body-text) 7%, transparent) 25%,
      color-mix(in srgb, var(--body-text) 15%, transparent) 37%,
      color-mix(in srgb, var(--body-text) 7%, transparent) 63%
    );
    background-size: 400% 100%;
    animation: cluster-shimmer 1.4s ease infinite;
  }

  @keyframes cluster-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: 0 0;
    }
  }

  // Scroll-edge shadow fade (see `.clusters::after`): visible while scrolling, gone at the bottom.
  // Driven by animation-timeline: scroll(), so 0% = top of scroll, 100% = bottom. SURE-8192.
  @keyframes cluster-scroll-shadow {
    0%, 88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  // The ALL CLUSTERS directory caption is wider than the 70px lane (it carries a count badge), and is
  // EXPANDED-only (the collapsed rail uses the flyout), so it never reflows — give it the full-width,
  // left-aligned treatment. SURE-8192 (v2).
  .clustersList .cluster-group-label {
    // Pinned to the top of the scrolling `.clusters` viewport so the ALL CLUSTERS caption stays put while
    // the directory scrolls under it (opaque bg so rows don't show through). SURE-8192 (v2).
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--topmenu-bg);
    // Full width so the sticky background spans the row and nothing scrolls past its side. SURE-8192.
    width: 100%;
    // Match the PINNED / RECENT group labels (line-height 18px + 8/4 padding = 30px): the count pill would
    // otherwise make the ALL CLUSTERS / MATCHES caption a couple of px shorter. Pin it to 30px. SURE-8192 (v2).
    box-sizing: border-box;
    height: 30px;
    padding: 8px 16px 4px;
    justify-content: flex-start;
  }
  // Collapsed rail shows only PINNED + RECENT chips (Figma P1); the full ALL CLUSTERS list is expanded
  // -nav only — reachable via the flyout when collapsed. SURE-8192.
  .side-menu.menu-close .clustersList {
    display: none;
  }
  .clustersRecent .pin {
    display: block;
  }

  // The pin's base opacity:0 lives deep inside `.side-menu .body .option .pin`, so its hover-reveal must
  // match that depth to win (the top-level form above was being overridden). SURE-8192 (v2).
  .side-menu .body .cluster.selector:hover .pin:not(.is-pinned),
  .side-menu .body .option:hover .pin:not(.is-pinned) {
    opacity: 1;
  }

  .side-menu {
    font-family: var(--title-font-family, unset); // Use the var if set, otherwise unset and use the font defined by the parent

    .menu {
      position: absolute;
      width: $app-bar-collapsed-width;
      height: 54px;
      top: 0;
      grid-area: menu;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:focus-visible {
        outline: none;

        .menu-icon {
          @include focus-outline;
          outline-offset: 4px;  // Ensure there is space around the menu icon for the focus indication
        }
      }

      .menu-icon {
        width: 25px;
        height: 25px;
        fill: var(--header-btn-text);
      }
    }

    position: absolute;
    top: 0;
    left: 0px;
    bottom: 0;
    width: $app-bar-collapsed-width;
    background-color: var(--topmenu-bg);
    z-index: 100;
    border-right: 1px solid var(--topmost-border);
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    transition: width 250ms;

    &:focus, &:focus-visible {
      outline: 0;
    }

    .option:focus-visible {
      outline: 0;
    }

    &.menu-open {
      width: 300px;
      box-shadow: 3px 1px 3px var(--shadow);

      // because of accessibility, we force pin action to be visible on menu open
      .pin {
        display: inline-flex !important;

        &:focus-visible {
          @include focus-outline;
          outline-offset: 4px;
        }
      }
    }

    .title {
      display: flex;
      height: 55px;
      flex: 0 0 55px;
      width: 100%;
      justify-content: flex-start;
      align-items: center;

      .menu {
        display: flex;
        justify-content: center;
      }
      .menu-icon {
        width: 25px;
        height: 25px;
      }
    }
    .home {
      svg {
        width: 25px;
        height: 25px;
        margin-left: 9px;
      }
    }
    .home-text {
      margin-left: $option-padding-left - 7;
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 300px;
      overflow: auto;

      & .category {
        & a.router-link-active {
          &:hover {
            color: var(--on-active, var(--default));
          }
        }
      }

      // (v2) No divider lines in the nav — labels are the only separators (incl. above Global Apps).

      .option {
        align-items: center;
        cursor: pointer;
        display: flex;
        color: var(--on-tertiary, var(--link));
        font-size: $font-size-body;
        height: $option-height;
        white-space: nowrap;
        background-color: transparent;
        width: 100%;
        border-radius: 0;
        border: none;

        .cluster-badge-logo-text {
          color: var(--default-active-text);
          font-weight: 500;
        }

        .pin {
          @include icon-hover-square;
          // Smaller glyph than the gear (16px), centred in the same 22×22 square. SURE-8192 (v2).
          font-size: 12px;
          // The gear (before it) carries the margin-left:auto that pushes the pair right, so the pin
          // just trails it 10px behind — no auto margin of its own. SURE-8192 (v2).
          margin-left: 0;
          display: none;
          transition: opacity 0.1s ease-in-out, background-color 0.1s ease-in-out;

          // PINNED: always shown, primary. NOT-PINNED: hidden until row hover (like the gear), grey — no
          // empty outline pin (the glyph is always the filled icon-pin; only colour/visibility differ).
          // !important beats the legacy recolour rules. SURE-8192 (v2).
          &.is-pinned {
            opacity: 1;
            color: var(--primary) !important;
          }
          &:not(.is-pinned) {
            opacity: 0;
            color: var(--muted) !important;
          }
          &.showPin {
            display: inline-flex;
          }
        }

        .cluster-name {
          // Grow to fill the row so the gear + pin sit at the end via flow (like the flyout), instead of
          // being floated there with margin-left:auto. min-width:0 lets the name ellipsis. SURE-8192 (v2).
          flex: 1 1 auto;
          min-width: 0;
          line-height: normal;

          & > p {
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
            // Name: matches the flyout row-name (13px / 600, 16px line). Black like the GLOBAL APPS
            // titles, and !important so the app-bar hover/active recolour rules can't turn it primary or
            // blend it away. SURE-8192 (v2).
            font-size: 13px;
            font-weight: 600;
            line-height: 16px;
            color: var(--body-text) !important;

            // Meta (distro · k8s): matches the flyout row-meta (10px / muted, 12px line); stays muted on
            // hover (was disappearing when the hover recoloured it). SURE-8192 (v2).
            &.description {
              font-size: 10px;
              font-weight: normal;
              line-height: 12px;
              padding-right: 0;
              color: var(--muted) !important;
            }
          }
        }

        &:not(.active-menu-link) {
          &:hover {
            .pin {
              display: block;
              color: var(--body-text-hover);
            }
          }
        }

        &:hover {
          text-decoration: none;

          // Row hover reveals the pin but must NOT recolour it — keep grey (unpinned) / primary
          // (pinned); only the pin's own hover adds the grey square behind it. SURE-8192 (v2).
          .pin {
            color: var(--muted);

            &.icon-pin {
              color: var(--primary);
            }
          }
        }
        &.disabled {
          background: transparent;
          cursor: not-allowed;

          .rancher-provider-icon,
          .cluster-name p {
            filter: grayscale(1);
            color: var(--muted) !important;
          }

          .pin {
            cursor: pointer;
          }
        }

        &:focus {
          outline: 0;
          box-shadow: none;
        }

        > i, > img {
          display: block;
          font-size: $icon-size;
          margin-right: 14px;
          &:not(.pin){
            width: $chip-width; // icon lane = the cluster chip footprint
          }
        }

        .rancher-provider-icon,
        svg {
          margin-right: 16px;
          fill: var(--on-tertiary, var(--link));
        }

        .top-menu-icon {
          outline-offset: 4px;
        }

        &.router-link-active, &.active-menu-link {
          &:focus-visible {
            .top-menu-icon, .app-icon {
              @include focus-outline;
            }
          }

          &:focus-visible .rancher-provider-icon {
            @include focus-outline;
            outline-offset: -4px;
          }

          background: var(--active-nav, var(--primary-hover-bg));
          color: var(--on-active, var(--primary-hover-text));

          svg {
            fill: var(--on-active, var(--primary-hover-text));
          }

          i {
            color: var(--on-active, var(--primary-hover-text));
          }

          div .description {
            color: var(--on-active, var(--default));
          }

          // Current row (selected): white name + pinned pin; light meta + light-grey not-pinned
          // pin. !important overrides the base black/muted name+pin invariants. SURE-8192 (v2).
          .cluster-name > p {
            color: var(--on-active, var(--primary-hover-text)) !important;

            &.description {
              color: var(--on-active, var(--default)) !important;
            }
          }
          .pin.is-pinned {
            color: var(--on-active, var(--primary-hover-text)) !important;
          }
          .pin:not(.is-pinned) {
            color: color-mix(in srgb, var(--on-active, #fff) 65%, transparent) !important;
          }

          &:hover {
            background: var(--active-hover, var(--primary-hover-bg));

            div {
              color: var(--on-active, var(--default));
            }

            svg {
              fill: var(--on-active, var(--primary-hover-text));
            }
          }
        }

        &:focus-visible {
          .top-menu-icon, .rancher-provider-icon, .app-icon {
            @include focus-outline;
          }
        }

        &:hover {
          color: var(--tertiary-hover-app-bar, var(--primary-hover-text));
          background: var(--nav-hover-top-level, var(--primary-hover-bg));
          > div {
            color: var(--primary-hover-text);

            .description {
              color: var(--default);
            }
          }
          svg {
            fill: var(--tertiary-hover-app-bar, var(--primary-hover-text));
          }
          div {
            color: var(--tertiary-hover-app-bar, var(--primary-hover-text));
          }
          &.disabled {
            background: transparent;
            color: var(--muted);

            > .pin {
              color:var(--default-text);
              display: block;
            }
          }
        }
      }

      .option, .option-disabled {
        // No right padding — the pin's own 22×22 square provides the right-edge breathing room. SURE-8192.
        padding: $option-padding 0 $option-padding $option-padding-left;
      }

      .search {
        position: relative;
        > input {
          background-color: transparent;
          padding-right: 35px;
          padding-left: 25px;
          height: 32px;
        }
        > .magnifier {
          position: absolute;
          top: 12px;
          left: 8px;
          width: 12px;
          height: 12px;
          font-size: $font-size-sm;
          opacity: 0.4;

          &.active {
            opacity: 1;

            &:hover {
              color: var(--body-text);
            }
          }
        }
        // Clear (X): now a real <button> (keyboard-operable) — reset the native chrome so the icon-font
        // glyph sits exactly where the old <i> did, and give it a visible focus ring. SURE-8192 (v2).
        > .icon-close {
          position: absolute;
          font-size: $font-size-sm;
          top: 12px;
          right: 8px;
          opacity: 0.7;
          cursor: pointer;
          appearance: none;
          border: none;
          background: transparent;
          padding: 0;
          line-height: 1;
          color: inherit;
          &:hover {
            color: var(--disabled-bg);
          }
          &:focus-visible {
            outline: 2px solid var(--primary);
            outline-offset: 2px;
            border-radius: 2px;
          }
        }
      }

      .clusters {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;

        // Bound the height so the cluster list scrolls INTERNALLY (which fires @scroll →
        // infinite scroll) instead of overflowing into the outer nav body (`.body` is
        // overflow:auto, so an unbounded `.clusters` just scrolls the whole nav and the
        // handler never triggers). SURE-8192.
        max-height: calc(100vh - 320px);

        // Bottom scroll-edge shadow that paints OVER the rows. A `background` gradient sits behind the
        // element's content, so the opaque badge chips occlude it; instead a sticky pseudo-element pinned
        // to the bottom of the scroll viewport renders after the rows and layers on top. A CSS scroll-
        // driven animation (animation-timeline: scroll) fades it out as the list reaches the bottom — no
        // JS. `margin-top` pulls it back over content so it adds no scroll height; `pointer-events: none`
        // keeps the pins clickable. Identical overlay to the flyout's `.switcher-scroll`. SURE-8192.
        &::after {
          content: "";
          position: sticky;
          bottom: 0;
          display: block;
          height: 8px;
          margin-top: -8px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--body-text) 8%, transparent) 100%);
          // Hidden by default; only the scroll-driven animation (below) reveals it. When the list ISN'T
          // scrollable the scroll timeline is inactive, the animation doesn't apply, and this base value
          // wins — so no stray shadow on a short/collapsed list. SURE-8192.
          opacity: 0;
          // Scroll position drives the fade: fully visible while scrolling, gone at the bottom. Where
          // scroll-driven animations aren't supported (e.g. Safari) the timeline is ignored and the base
          // opacity:0 wins — the shadow simply never shows (no breakage). SURE-8192.
          animation: cluster-scroll-shadow linear both;
          animation-timeline: scroll(nearest block);
        }

         a, span {
          margin: 0;
         }

        &-search {
          display: flex;
          align-items: center;
          width: 100%;
          // Align the search with the cluster chips/local tile (which sit at $option-padding-left) now
          // that the old count badge (which provided that left offset) is gone. SURE-8192.
          padding: 0 $option-padding-left;

          .search {
            display: inline-flex;
            align-items: center;
            transition: $transition-nav;
            transition-delay: 2s;
            width: 100%;
            height: 32px;

            input {
              flex: 1;
              height: 100%;
            }

            // Vertically centre the overlaid icons via the flex align (their abspos static position),
            // instead of a fixed top offset. SURE-8192 (v2).
            .magnifier {
              top: auto;
            }

            .icon-close {
              top: auto;
              // Black while shown, primary/green on hover. SURE-8192 (v2).
              color: var(--body-text);

              &:hover {
                color: var(--primary);
              }
            }
          }
        }
      }

      // Mirrors the flyout's `.switcher-empty`: left-aligned muted caption that wraps a long query
      // instead of overflowing. SURE-8192 (v2).
      .none-matching {
        width: 100%;
        padding: 18px 14px 10px;
        text-align: left;
        font-size: 12px;
        color: var(--muted);
        overflow-wrap: anywhere;
      }

      .clustersPinned, .home-link, .clustersRecent {
        .category {
          &-title {
            margin: $space-2 0;
            margin-left: $space-4;
            hr {
              margin: 0;
              width: 94%;
              transition: $transition-nav;
              max-width: 100%;
            }
          }
        }
        .pin {
          display: block;
        }
      }

      .category {
        display: flex;
        flex-direction: column;
        place-content: flex-end;
        flex: 1;

        &-title {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          align-items: center;
          margin: 15px 0;
          margin-left: $space-4;
          font-size: $font-size-body;
          text-transform: uppercase;

          span {
            transition: $transition-nav;
            display: flex;
            max-height: 16px;
          }

          hr {
            margin: 0;
            max-width: 50px;
            width: 0;
            transition: $transition-nav;
          }
        }

         i {
            padding-left: $option-padding-left - 5;
          }
      }
    }

    &.menu-open {
      .option {
        &.router-link-active, &.active-menu-link {
          &:focus-visible {
            @include focus-outline;
            border-radius: 0;
            outline-offset: -4px;

            .top-menu-icon, .app-icon, .rancher-provider-icon {
              outline: none;
              border-radius: 0;
            }
          }
        }

        &:focus-visible {
          @include focus-outline;
          outline-offset: -4px;

          .top-menu-icon, .app-icon, .rancher-provider-icon {
            outline: none;
            border-radius: 0;
          }
        }
      }
    }

    &.menu-close {
      .side-menu-logo  {
        opacity: 0;
      }
      .category {
        &-title {
          span {
            opacity: 0;
          }

          hr {
            width: 40px;
          }
        }
      }

      .clustersPinned, .home-link, .clustersRecent {
        .category {
          &-title {
            hr {
              width: 40px;
            }
          }
        }
      }

      .footer {
        margin: 20px 10px;
        width: 50px;

        .version{
          text-align: center;

          &.version-small {
            font-size: $font-size-sm;
          }
        }
      }
    }

    .footer {
      margin: $space-5;
      width: 240px;
      display: flex;
      flex: 0;
      flex-direction: row;
      > * {
        flex: 1;
        color: var(--link);
        text-align: left;
      }

      .version {
        cursor: pointer;

        a:focus-visible {
          @include focus-outline;
          outline-offset: 4px;
        }
      }
    }
  }

  .side-menu-glass {
    position: absolute;
    top: 0;
    left: 0px;
    bottom: 0;
    width: 100vw;
    z-index: 99;
    opacity: 1;
  }

  .side-menu-logo {
    align-items: center;
    display: flex;
    transform: translateX($app-bar-collapsed-width);
    opacity: 1;
    max-width: 200px;
    width: 100%;
    justify-content: center;
    transition: all 0.5s;
    overflow: hidden;
    & IMG {
      object-fit: contain;
      max-width: 200px;
      height: 36px;
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: all 0.25s;
    transition-timing-function: ease;
  }

  .fade-leave-active {
    transition: all 0.25s;
  }

  .fade-leave-to {
    left: -300px;
  }

  .fade-enter {
    left: -300px;
  }

  .locale-chooser {
    cursor: pointer;
  }

  .localeSelector {
    :deep() .v-popper__inner {
      padding: 50px 0;
    }

    :deep() .v-popper__arrow-container {
      display: none;
    }

    :deep() .v-popper:focus {
      outline: 0;
    }

    li {
      padding: $space-2 $space-5;

      &:hover {
        background-color: var(--active-hover, var(--primary-hover-bg));
        color: var(--primary-hover-text);
        text-decoration: none;
      }
    }
  }
</style>
