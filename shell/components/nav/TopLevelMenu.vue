<script>
import BrandImage from '@shell/components/BrandImage';
import ClusterIconMenu from '@shell/components/ClusterIconMenu';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher';
import IconOrSvg from '../IconOrSvg';
import { mapGetters } from 'vuex';
import { CAPI, COUNT, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import { PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { alternateLabel, isMac, KEY } from '@shell/utils/platform';
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

      // `update` refreshes only the watched context set (local/pinned/recent); the ALL list loads lazily
      // on the open/scroll triggers, not here.
      helper.update(args);
    }

    return {
      shown:             false,
      // The cluster-switcher flyout is open. Everything the estate offers — search, the ALL CLUSTERS
      // directory — lives in there; the nav itself only ever shows PINNED + RECENT.
      switcherOpen:      false,
      displayVersion,
      fullVersion,
      // The flyout's search term. It lives here because the `clustersOthers` pipeline (`search` →
      // resetOthers) does, but the flyout is its only writer and reader.
      clusterFilter:     '',
      hasProvCluster,
      loadingMoreOthers: false,
      // A search request is in flight (drives the flyout's initial search skeleton).
      searchLoading:     false,
      routeCombo:        false,

      canPagination,
      helper,
      debouncedHelperUpdateSlow:   debounce((...args) => this.helper.update(...args), 1000),
      debouncedHelperUpdateMedium: debounce((...args) => this.helper.update(...args), 750),
      debouncedHelperUpdateQuick:  debounce((...args) => this.helper.update(...args), 200),
      // The ALL list is unwatched + page-increment: reset to page 1 on the open/search triggers, debounced
      // so search typing doesn't spam requests.
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

    recentClusters() {
      return this.hasProvCluster ? this.helper.clustersRecent : [];
    },

    // `local` (the management cluster) is a FIXED slot at the top of the cluster area — never inside
    // PINNED / RECENT / ALL, not pinnable, never evicted — so pull it out and render its own tile.
    localCluster() {
      // The `hide-local-cluster` setting removes `local` from the nav entirely — its fixed slot must
      // honor it too (the slice below fetches strictly by id and does NOT apply that filter).
      if (this.hideLocalCluster) {
        return null;
      }

      // `local` comes from its own dedicated slice (helper.clustersLocal) — excluded from
      // pinned/recent/others/search, so it's never scavenged from those groups.
      return (this.hasProvCluster ? this.helper.clustersLocal?.[0] : null) || null;
    },

    railPinned() {
      return this.pinFiltered.filter((c) => !c.isLocal);
    },

    railRecent() {
      return this.recentClusters.filter((c) => !c.isLocal);
    },

    // ALL CLUSTERS is fetched server-side (sorted + paginated), so PRESERVE that order rather than
    // re-sorting the loaded window (else "active first" would hold only within a page). Pinned/recent
    // are appended from the always-loaded context fetch; local is excluded (its own slot).
    railAll() {
      if (this.searchActive) {
        return this.clustersFiltered.filter((c) => !c.isLocal);
      }

      const others = this.clustersFiltered.filter((c) => !c.isLocal);
      const seen = new Set(others.map((c) => c.id));
      const extras = [...this.pinFiltered, ...this.recentClusters].filter((c) => !c.isLocal && !seen.has(c.id));

      return [...others, ...extras];
    },

    // Expanded-nav shelf: PINNED + RECENT, always — the estate lives in the switcher flyout.
    pinnedRows() {
      return this.appBar.pinFiltered;
    },

    recentRows() {
      return this.appBar.recentFiltered;
    },

    // Signature of the shelf's row ORDER, the cue to play the FLIP on pin/unpin. Pinned and recent are
    // kept SEPARATE (the `|`): a row crossing the pinned↔recent boundary leaves the concatenated order
    // unchanged, so without the separator the FLIP wouldn't fire for those two positions.
    shelfOrder() {
      const ids = (rows) => rows.map((c) => c.id).join(',');

      return `${ ids(this.pinnedRows) }|${ ids(this.recentRows) }`;
    },

    // Infinite-scroll: more rows exist when the loaded window is smaller than the server-side total.
    // `others` backs the flyout's ALL CLUSTERS directory AND its search results — one shared pipeline.
    hasMoreOthers() {
      return this.clustersFiltered.length < (this.helper.counts?.others || 0);
    },

    // Total clusters matching the current search (page-1 response total), shown in the flyout's MATCHES
    // caption. Shared with the expanded nav — same `clustersOthers` pipeline.
    switcherSearchCount() {
      return this.helper.counts?.others || 0;
    },

    // Exact count of clusters browsable in the ALL list (not capped by the rail's paginated slices). The
    // saved count comes from a findPage that ALWAYS excludes `local` (and Harvester) — see the helper's
    // `updateCount` — so it IS the ALL CLUSTERS total directly, and can't move when hide-local toggles.
    browsableClusterCount() {
      const savedCount = this.$store.getters['management/getSavedCount'](SAVED_COUNTS.K8S_CLUSTERS);

      if (typeof savedCount === 'number') {
        return savedCount;
      }

      // Fallback before that query resolves: the live /v1/counts summary is the RAW total (includes
      // local), so drop local for a close-enough placeholder. `local` is only in that raw total when the
      // user can actually see it, so gate the −1 on clustersLocal.
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};
      const rawTotal = counts[MANAGEMENT.CLUSTER]?.summary?.count || 0;

      return Math.max(0, rawTotal - (this.helper.clustersLocal.length ? 1 : 0));
    },

    // The flyout's shortcut in the two forms it needs. `switcherShortcutLabel` is what a user reads in
    // the tooltip; `switcherKeyShortcut` is the spelled-out form `aria-keyshortcuts` expects, because
    // "⌘J" does not read out sensibly.
    switcherShortcutLabel() {
      return isMac ? '⌘J' : 'Ctrl+J';
    },

    switcherKeyShortcut() {
      return `${ isMac ? 'Meta' : alternateLabel }+J`;
    },

    // Id of the cluster currently being explored — marked `current` in the switcher. Gate on the route's
    // cluster param: on global pages the store keeps `clusterId` set behind the scenes, but nothing in the
    // switcher should look selected there.
    currentClusterId() {
      const routeCluster = this.$route?.params?.cluster;

      if (!routeCluster || routeCluster === BLANK_CLUSTER) {
        return '';
      }

      const id = this.$store.getters['clusterId'];

      return typeof id === 'string' ? id : '';
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

      // Pass 2 — light up the FIRST item matching the current route. Kept SEPARATE from the reset above:
      // the ALL list shares cluster object refs with pinFiltered/recentFiltered, so a combined reset+set
      // pass would let ALL's reset clobber a flag an earlier section set — un-highlighting the current row.
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

    // Before SSP world all of these changes were kicked off given Vue change detection to properties in a computed method.
    // Changes could come from two scenarios
    // 1. Changes made by the user (pin / search). Could be tens per second
    // 2. Changes made by rancher to clusters (state, label, etc change). Could be hundreds a second
    // They can be restricted to help the churn caused from above
    // 1. When SSP enabled reduce http spam
    // 2. When SSP is disabled (legacy) reduce fn churn (this was a known performance customer issue)

    // The shelf is DERIVED from these prefs, so it re-materializes on its own when a pref changes. These
    // watchers just (1) snapshot positions so the FLIP can animate the change and (2) refresh the context
    // fetch/watch so a newly-pinned cluster's data loads.
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
    // snapshotted positions to the new ones. Covers BOTH the expanded shelf and the collapsed rail.
    shelfOrder(neu, old) {
      if (neu !== old && this._flipBefore) {
        this.$nextTick(() => this.playFlip());
      }
    },

    search() {
      // Search term changed → refresh the watched context (so pin flags stay correct) AND reset the ALL
      // list to page 1 with the new term (debounced so typing doesn't spam requests).
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
    // Capture on `window` — one hop ahead of the `document` capture listeners the shortkey directive uses
    // — so the guard can swallow an app shortcut before any of them sees it.
    window.addEventListener('keydown', this.onSwitcherKeyGuard, true);
    window.addEventListener('keyup', this.onSwitcherKeyGuard, true);
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handler);
    document.removeEventListener('keydown', this.onSwitcherHotkey);
    window.removeEventListener('keydown', this.onSwitcherKeyGuard, true);
    window.removeEventListener('keyup', this.onSwitcherKeyGuard, true);
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
      // Navigating to a cluster clears the flyout's search, so the next open starts on the ALL CLUSTERS
      // directory rather than a stale filtered list.
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

    // Explore keeps the current view where possible (reuses the route-combo logic); `hide()` closes the
    // rail after a switch, matching the chip flow.
    switcherExplore(cluster) {
      this.clusterMenuClick({ preventDefault: () => {} }, cluster);
      this.hide();
    },

    // The flyout owns the only cluster search in the nav; its query drives the `clustersOthers` pipeline
    // via the `search` watcher.
    onSwitcherSearch(term) {
      // Show the loading skeleton immediately (cleared when the debounced request resolves).
      this.searchLoading = !!term;
      this.clusterFilter = term;
    },

    handler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.hide();
      }
    },

    // Cmd (Mac) / Ctrl (Windows/Linux) + J toggles the cluster-switcher flyout — mirroring the Cmd/Ctrl+K
    // resource search nav (see NavActionBar). `e.code` keys off the physical J so it matches regardless of
    // any modifier remapping the produced `e.key`.
    onSwitcherHotkey(e) {
      const isJ = e.code === 'KeyJ' || (e.key || '').toLowerCase() === 'j';

      if (!isJ || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) {
        return;
      }

      const switcher = this.$refs.switcher;

      if (switcher) {
        e.preventDefault();
        switcher.toggle();
      }
    },

    // While the flyout is open it OWNS the keyboard: every app shortcut behind it (Cmd/Ctrl+K, the
    // `v-shortkey` bindings, …) is swallowed here. Three things still get through:
    // - Cmd/Ctrl+J, the flyout's own toggle (`onSwitcherHotkey` closes it);
    // - Option/Alt, so the `v-shortkey.hold` bindings keep driving the "keep this view" reveal — that
    //   directive owns the state (issue 11329), including releasing it when focus leaves the page;
    // - anything typed inside the flyout, so its search box and ↑↓/Enter/Esc keep working.
    onSwitcherKeyGuard(e) {
      if (!this.switcherOpen) {
        return;
      }

      const key = (e.key || '').toLowerCase();
      const isToggle = (e.code === 'KeyJ' || key === 'j') && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
      const isAlt = e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight';

      if (isToggle || isAlt) {
        return;
      }

      const target = e.target;

      if (target && typeof target.closest === 'function' && target.closest('.cluster-switcher-flyout')) {
        return;
      }

      // `stopImmediatePropagation` (not just `stopPropagation`) — the shortkey directive listens on
      // `document`, and only the immediate form is guaranteed to beat every listener there.
      e.stopImmediatePropagation();
      e.stopPropagation();
    },

    hide() {
      this.shown = false;
    },

    // The flyout is anchored to the nav's width, so flipping `shown` while it is still on screen
    // re-anchors it instantly — it jumps to the other position at FULL opacity and only then fades out.
    // Send it away first and wait for it to have actually gone, then resize the nav. `closeAndWait`
    // resolves immediately when nothing is open, so a plain expand/collapse is unaffected.
    async toggle() {
      await this.$refs.switcher?.closeAndWait();

      this.shown = !this.shown;
    },

    // The [data-flip] shelf rows to animate — VISIBLE ones only. When collapsed, the CSS-hidden ALL list
    // renders the SAME ids with data-flip; including those would double-key the FLIP Map and animate the
    // wrong (hidden) element. `offsetParent === null` skips the display:none duplicates.
    flipRows() {
      const root = this.$el;

      if (!root || typeof root.querySelectorAll !== 'function') {
        return [];
      }

      return Array.from(root.querySelectorAll('[data-flip]')).filter((n) => n.offsetParent !== null);
    },

    // FLIP animation for the pin/unpin shelf reorder (see the `pinnedIds`/`recentIds`/`shelfOrder`
    // watchers); works on both the expanded shelf and the collapsed rail (same `[data-flip]` rows).
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
        // relocate it.
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

      // Flash the just-toggled row once it has landed (wash) — the VISIBLE one.
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

    // Fetch page 1 of the ALL directory with the CURRENT pinned/recent/search context — the shared handler
    // for every "show me the ALL list" trigger. `.catch` swallows the wrapper's benign de-dup rejection.
    resetOthersList() {
      this.helper.resetOthers({
        pinnedIds:  this.pinnedIds,
        recentIds:  this.recentIds,
        searchTerm: this.search,
      }).catch(() => {}).finally(() => {
        // Clear the flyout's initial-search skeleton once the shared results land.
        this.searchLoading = false;
      });
    },

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
        // re-fetches the next page.
      } finally {
        this.loadingMoreOthers = false;
      }
    },

    // The flyout scrolled near the bottom of its ALL CLUSTERS / MATCHES list — load the next window.
    onFlyoutLoadMore() {
      this.loadMoreOthers();
    },

    // Flyout opened → page-1 trigger for the (unwatched) ALL list; always re-fetch so the list is fresh.
    // Closing drops the search so the next open starts on the full directory again.
    onFlyoutOpen(open) {
      this.switcherOpen = open;

      // Alt released outside the guard's reach (the flyout closed mid-combo) would strand the arrow on.
      this.routeCombo = false;

      if (open) {
        this.resetOthersList();
      } else if (this.clusterFilter) {
        this.clusterFilter = '';
      }
    },

    async goToHarvesterCluster() {
      const localCluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, 'fleet-local/local');

      try {
        await localCluster.goToHarvesterCluster();
      } catch {
      }
    },

    /**
     * Cmd/Ctrl+J hint on the switcher trigger. Shown in BOTH nav states, but anchored to a different
     * element in each so it never covers what it describes: beside the chip on the collapsed rail, and
     * off the end of the row when expanded — the trigger button spans the full 300px, so anchoring the
     * expanded one to it puts the tooltip past the row rather than on top of the "Cluster Switch" label,
     * and hovering anywhere on the row still raises it. Same `showWhenClosed` convention as
     * getTooltipConfig. Suppressed while the flyout is open — nav tooltips layer above it, so it would
     * otherwise sit on the cluster list.
     */
    switcherTooltip(showWhenClosed = false) {
      const rightState = showWhenClosed ? !this.shown : this.shown;

      if (!rightState || this.switcherOpen) {
        return { content: null };
      }

      return {
        content:   this.t('nav.switcher.shortcutTooltip', { shortcut: this.switcherShortcutLabel }),
        placement: 'right',
      };
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
          // The collapsed rail keeps its tooltip via the showWhenClosed calls above.
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
          <!-- Home + local + the switcher trigger: the nav's fixed head. It holds its size while the
               cluster shelf below it absorbs (and scrolls) whatever room is left. -->
          <div
            class="nav-head"
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
            <!-- local (management cluster): fixed slot at the top of the cluster area -->
            <div
              v-if="localCluster"
              class="cluster-local"
              @click="hide()"
            >
              <button
                v-shortkey.hold="{windows: ['alt'], mac: ['option']}"
                class="cluster selector option"
                :class="{ 'active-menu-link': localCluster.isMenuActive }"
                :aria-current="localCluster.isMenuActive ? 'page' : undefined"
                :data-testid="`menu-cluster-local`"
                role="button"
                :aria-label="`${ t('nav.ariaLabel.cluster') } ${ localCluster.label }`"
                @click.prevent="clusterMenuClick($event, localCluster)"
                @shortkey="onRouteComboHold"
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
                </div>
              </button>
            </div>
            <!-- The cluster-switcher "door": ONE slot below local, IDENTICAL expanded and collapsed —
                 the count chip sits in the icon lane, and the expanded nav adds the "Cluster Switch"
                 label plus the trailing chevron (the collapsed rail clips both). Gated on the BROWSABLE
                 count (not the raw total, which includes local), so there's no empty "0" flyout when
                 local is the only cluster. -->
            <div
              v-if="browsableClusterCount > 0"
              class="cluster-door"
            >
              <div class="clustersAll">
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
                  :route-combo="routeComboActive"
                  :nav-expanded="shown"
                  @update:search="onSwitcherSearch"
                  @load-more="onFlyoutLoadMore"
                  @update:open="onFlyoutOpen"
                  @select="switcherExplore"
                >
                  <!-- Trigger reuses the app-bar's cluster-button structure so it sits in the shelf like
                       the cluster rows; its "icon" is a count chip (estate size over the word "clusters")
                       in the same left icon lane, so the collapsed rail shows just the chip. -->
                  <template #trigger="{ toggle: toggleSwitcher, open: switcherIsOpen, count: switcherCount }">
                    <button
                      v-clean-tooltip="switcherTooltip()"
                      type="button"
                      class="cluster selector option cluster-all"
                      data-testid="cluster-switcher-trigger"
                      :aria-label="t('nav.switcher.ariaLabel')"
                      :aria-keyshortcuts="switcherKeyShortcut"
                      :aria-expanded="switcherIsOpen"
                      aria-haspopup="listbox"
                      @click.prevent="toggleSwitcher"
                    >
                      <div
                        v-clean-tooltip="switcherTooltip(true)"
                        class="cluster-all-lane"
                      >
                        <div class="cluster-all-badge">
                          <span class="cluster-all-count">{{ switcherCount }}</span>
                          <span class="cluster-all-unit">{{ t('nav.switcher.clustersBadge') }}</span>
                        </div>
                      </div>
                      <div class="cluster-all-name">
                        {{ t('nav.switcher.clusterSwitch') }}
                      </div>
                      <svg
                        class="cluster-all-chevron"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      ><path d="M8.38085 5.38085C8.72256 5.03915 9.27743 5.03915 9.61914 5.38085L15.6191 11.3809C15.9608 11.7226 15.9608 12.2774 15.6191 12.6191L9.61914 18.6191C9.27743 18.9608 8.72256 18.9608 8.38085 18.6191C8.03915 18.2774 8.03915 17.7226 8.38085 17.3809L13.7617 12L8.38085 6.61914C8.03915 6.27743 8.03915 5.72256 8.38085 5.38085Z" /></svg>
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
            >
              <!-- Pinned Clusters — the nav shelf is always PINNED + RECENT; the estate (and the only
                   search) lives in the flyout. -->
              <div
                v-if="railPinned.length"
                class="clustersPinned"
              >
                <div class="category-title">
                  <RcSeparator />
                  <span>
                    {{ t('nav.switcher.pinned') }}
                  </span>
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
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </span>
                </div>
              </div>

              <!-- Recent Clusters -->
              <div
                v-if="railRecent.length"
                class="clustersRecent"
              >
                <div class="category-title">
                  <RcSeparator />
                  <span>
                    {{ t('nav.switcher.recent') }}
                  </span>
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
                    v-shortkey.hold="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`recent-menu-cluster-${ c.id }`"
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
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </span>
                </div>
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
  // Their poppers are teleported to <body>, so this global (unscoped) rule reaches them.
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

  // Type scale — the shelf + flyout only use these three sizes.
  $font-size-sm:    12px;  // meta / status / footer / counts
  $font-size-body:  14px;  // option row text

  // The cluster "chip": the app-bar icon badge (ClusterIconMenu) is 42×32 / radius 5px; the count chips
  // mirror it and the icon lane is sized to hold it.
  $chip-width:  42px;
  $chip-height: 32px;
  $chip-radius: 5px;

  // Spacing rhythm (4px base) + the shared nav transition, so the repeated paddings/margins/gaps and
  // the show/hide easing come from one place.
  $space-1: 4px;
  $space-2: 8px;
  $space-4: 16px;
  $space-5: 20px;
  $transition-nav: all 0.25s ease-in-out;

  // Row action icons (gear + pin): a header-style hover "square" — a 22×22 box holding a 16px icon that
  // fills with a subtle grey on hover. Centres the glyph via line-height (works for display:block or flex).
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

  // local (management cluster) fixed tile at the top of the cluster area.
  .cluster-local {
    margin-bottom: 0;
  }

  // A shelf row mid-FLIP sits above its neighbours so it glides over them, and turns off pointer events
  // so the transient transform doesn't swallow clicks.
  [data-flip].flipping {
    position: relative;
    z-index: 2;
    pointer-events: none;
  }

  // A row ENTERING the shelf (newly pinned/recent) fades + slides in from the left.
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

  // The just-toggled row flashes a brief primary tint that fades to transparent.
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

  // The switcher trigger reuses the app-bar cluster-button so it sits in the shelf like the home / cluster
  // rows. Its "icon" is a count chip with exactly the ClusterIconMenu badge's footprint — same lane, same
  // 42x32 — so the collapsed rail reads as one clean column of chips.
  .cluster-all .cluster-all-lane {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: $chip-width;
    height: $chip-height;
    margin-right: $space-4;
  }
  .cluster-all .cluster-all-badge {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    // The chip IS a cluster chip, so its text takes ClusterIconMenu's badge colour rather than the
    // link colour the row label uses — "20 clusters" reads like "CD2" beside it.
    color: var(--default-active-text);
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--border);
    border-radius: $chip-radius;

    // Two fixed sizes — the count sits over the word it counts, so it never has to shrink to fit.
    .cluster-all-count {
      font-size: 12px;
      font-weight: bold;
      line-height: 13px;
    }

    .cluster-all-unit {
      font-size: 11px;
      font-weight: normal;
      line-height: 12px;
      // "clusters" is a hair too wide for a 42px chip at 11px — tighten the tracking rather than drop
      // below the specified size.
      letter-spacing: -0.4px;
    }
  }
  // "Cluster Switch": the row label. Expanded-nav only — the collapsed rail clips it, exactly like the
  // cluster names on the rows below.
  .cluster-all .cluster-all-name {
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: $font-size-body;
    font-weight: normal;
    line-height: 16px;
    color: var(--on-tertiary, var(--link));
  }
  // The chevron trails the label at the END of the row (never inside the chip), so it too shows only on
  // the expanded nav. Its right margin comes from the shared `.option svg` rule.
  .cluster-all .cluster-all-chevron {
    flex: 0 0 auto;
  }

  // The row takes the app-bar's ordinary hover highlight (inherited from `.body .option:hover`), so it
  // behaves like every cluster row above it. The chip is the one exception: the generic hover rules
  // recolour every `div` inside the row white, which would erase the count on the chip's pale
  // background — so pin the chip's own colours through every state.
  .side-menu .body .option.cluster-all .cluster-all-badge {
    color: var(--default-active-text) !important;
    background: var(--nav-icon-badge-bg) !important;
  }

  // The flyout being open is not an "active/selected" state — this tile is not a cluster you can be
  // "in" — so it never takes the green `active-menu-link` fill, only hover.
  .side-menu .body .option.cluster-all:not(:hover) {
    background: transparent;
  }

  // The "door" slot below local: holds the cluster-switcher trigger, identical in both nav states.
  .cluster-door {
    display: flex;
    align-items: center;
    height: 43px;
  }

  // The trigger tile that opens the switcher flyout. It reuses the app-bar cluster-button, so it flows at
  // full EXPANDED width; the collapsed rail's overflow clips the label + chevron, leaving just the count
  // chip in the icon lane.
  .clustersAll {
    flex: 1 1 auto;
    min-width: 0;

    :deep(.v-popper) {
      display: block;
    }
  }

  // Scroll-edge shadow fade (see `.clusters::after`): visible while scrolling, gone at the bottom.
  // Driven by animation-timeline: scroll(), so 0% = top of scroll, 100% = bottom.
  @keyframes cluster-scroll-shadow {
    0%, 88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .clustersRecent .pin {
    display: block;
  }

  // The pin's base opacity:0 lives deep inside `.side-menu .body .option .pin`, so its hover-reveal must
  // match that depth to win (the top-level form above was being overridden).
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
      // A fixed-height column between the title bar and the footer. It must NOT scroll: a nav taller than
      // the viewport used to push the whole body into a scroll, carrying GLOBAL APPS / CONFIGURATION and
      // the version footer off-screen. `min-height: 0` lets it actually shrink to the space it is given
      // (a flex item's default `min-height: auto` is content height, which is what forced the overflow).
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      width: 300px;
      overflow: hidden;

      & .category {
        & a.router-link-active {
          &:hover {
            color: var(--on-active, var(--default));
          }
        }
      }

      // No divider lines in the nav — labels are the only separators (incl. above Global Apps).

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
          // Smaller glyph than the gear (16px), centred in the same 22×22 square.
          font-size: 12px;
          // The gear (before it) carries the margin-left:auto that pushes the pair right, so the pin
          // just trails it 10px behind — no auto margin of its own.
          margin-left: 0;
          display: none;
          transition: opacity 0.1s ease-in-out, background-color 0.1s ease-in-out;

          // PINNED: always shown, primary. NOT-PINNED: hidden until row hover (like the gear), grey.
          // !important beats the legacy recolour rules.
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
          // Grow to fill the row so the gear + pin sit at the end via flow, instead of being floated there
          // with margin-left:auto. min-width:0 lets the name ellipsis.
          flex: 1 1 auto;
          min-width: 0;
          line-height: normal;

          & > p {
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
            // Name: reads as a nav link like HOME and the GLOBAL APPS entries — 14px, regular weight,
            // the primary/link colour. `!important` so the app-bar's broad recolour rules can't blend it
            // away; the hover/active rules further down re-assert their own colours the same way.
            font-size: $font-size-body;
            font-weight: normal;
            line-height: 18px;
            color: var(--on-tertiary, var(--link)) !important;

            // The shelf carries no subtitle any more (local's "Management cluster" line and the
            // per-cluster provider · version meta both live in the flyout rows now), but the rule is
            // cheap insurance if one comes back.
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

          // Row hover reveals the pin but must NOT recolour it — keep grey (unpinned) / primary (pinned);
          // only the pin's own hover adds the grey square behind it.
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

          // Current row (selected): white name + pinned pin; light meta + light-grey not-pinned pin.
          // !important overrides the base black/muted name+pin invariants.
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
        // No right padding — the pin's own 22×22 square provides the right-edge breathing room.
        padding: $option-padding 0 $option-padding $option-padding-left;
      }

      .nav-head {
        flex: 0 0 auto;
      }

      .clusters {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;

        // The ONLY scrolling region in the nav. `flex-grow: 0` keeps a short shelf at its natural height
        // (so GLOBAL APPS still sits at the bottom via the `.category` below); `flex-shrink: 1` plus
        // `min-height: 0` let a long one give way and scroll internally instead of stretching the nav
        // past the viewport. No viewport-derived max-height — the flex box already knows what's left.
        flex: 0 1 auto;
        min-height: 0;

        // Bottom scroll-edge shadow that paints OVER the rows: a sticky pseudo-element renders after the
        // rows and layers on top (a `background` gradient would be occluded by the opaque chips). A
        // scroll-driven animation fades it out at the bottom; `pointer-events: none` keeps pins clickable.
        &::after {
          content: "";
          position: sticky;
          bottom: 0;
          display: block;
          height: 8px;
          margin-top: -8px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--body-text) 8%, transparent) 100%);
          // Hidden by default; only the scroll-driven animation reveals it. When the list ISN'T scrollable
          // the scroll timeline is inactive and this base value wins — so no stray shadow on a
          // short/collapsed list.
          opacity: 0;
          // Scroll position drives the fade: fully visible while scrolling, gone at the bottom. Where
          // scroll-driven animations aren't supported (e.g. Safari) the base opacity:0 wins — the shadow
          // never shows.
          animation: cluster-scroll-shadow linear both;
          animation-timeline: scroll(nearest block);
        }

         a, span {
          margin: 0;
         }
      }

      // PINNED CLUSTERS / RECENTLY USED are plain `.category-title`s — identical to GLOBAL APPS and
      // CONFIGURATION, with no overrides of their own.
      .clustersPinned, .home-link, .clustersRecent {
        .pin {
          display: block;
        }
      }

      .category {
        display: flex;
        flex-direction: column;
        place-content: flex-end;
        // Grows to push the app links to the bottom, but never shrinks — the cluster shelf above is the
        // one region allowed to give way when the nav runs out of room.
        flex: 1 0 auto;

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
