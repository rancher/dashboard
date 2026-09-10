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
import { isMac, KEY, shortcutLabel } from '@shell/utils/platform';
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
import { commitAndReconcile, reorderPinned, reportPinWriteFailure } from '@shell/utils/cluster-pref-writer';

const DRAG_THRESHOLD = 4;
const DRAG_SCROLL_EDGE = 32;
const DRAG_SCROLL_MAX = 14;
const PINNED_TOOLTIP_DISTANCE = 44;

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

      helper.update(args);
    }

    return {
      shown:             false,
      switcherOpen:      false,
      displayVersion,
      fullVersion,
      clusterFilter:     '',
      hasProvCluster,
      loadingMoreOthers: false,
      listFailed:        false,
      // Drag-reorder of the pinned shelf. `dragId` is the row being held; `dragOrder` is the ids in the
      // order the shelf is CURRENTLY showing them, which the pointer rewrites as it passes other rows.
      // Null when nothing is being dragged, so the shelf falls back to the pref's own order.
      dragId:            null,
      dragOrder:         null,
      // A search request is in flight (drives the flyout's initial search skeleton).
      listLoading:       false,
      // Token for the page-1 reset in flight. Two resets can carry the SAME term, so only this
      // identifies which of them is the live one (see `resetOthersList`).
      othersRequestId:   0,
      recentLoading:     false,
      routeCombo:        false,

      canPagination,
      helper,
      debouncedHelperUpdateSlow:  debounce((...args) => this.helper.update(...args), 1000),
      debouncedHelperUpdateQuick: debounce((...args) => this.helper.update(...args), 200),
      debouncedResetOthers:       debounce(() => this.resetOthersList(), 200),
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

      const byId = new Map([
        ...this.appBar.localCluster,
        ...this.appBar.pinFiltered,
        ...this.appBar.recentFiltered,
        ...this.appBar.clustersFiltered,
      ].map((c) => [c.id, c]));
      const ready = [...byId.values()].filter((c) => c.ready);
      const readyCount = ready.length;

      return readyCount > 1 || (readyCount === 1 && this.clusterId !== ready[0].id);
    },

    search() {
      return (this.clusterFilter || '').toLowerCase();
    },

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

    localCluster() {
      if (this.hideLocalCluster) {
        return null;
      }

      return (this.hasProvCluster ? this.helper.clustersLocal?.[0] : null) || null;
    },

    railPinned() {
      return this.pinFiltered.filter((c) => !c.isLocal);
    },

    railRecent() {
      return this.recentClusters;
    },

    railAll() {
      if (this.searchActive) {
        return this.clustersFiltered;
      }

      const rows = this.clustersFiltered.filter((c) => !c.isLocal);
      const seen = new Set(rows.map((c) => c.id));

      [...this.pinFiltered, ...this.recentClusters].forEach((c) => {
        if (c.isLocal || seen.has(c.id)) {
          return;
        }

        seen.add(c.id);
        rows.push(c);
      });

      return rows;
    },

    // Expanded-nav shelf: PINNED + RECENT, always — the estate lives in the switcher flyout.
    //
    // Mid-drag the shelf follows the pointer instead of the pref: `dragOrder` is the order the rows are
    // being shuffled into, and only the drop writes it back. Rendering the pref directly would snap the
    // row home on every pointer move, since the pref does not change until then.
    pinnedRows() {
      const rows = this.appBar.pinFiltered;

      if (!this.dragOrder) {
        return rows;
      }

      const byId = new Map(rows.map((c) => [c.id, c]));

      return [
        ...this.dragOrder.map((id) => byId.get(id)).filter((c) => !!c),
        ...rows.filter((c) => !this.dragOrder.includes(c.id)),
      ];
    },

    shelves() {
      return [
        {
          key: 'pinned', titleKey: 'nav.switcher.pinned', sectionClass: 'clustersPinned', rows: this.pinnedRows
        },
      ].filter((shelf) => !!shelf.rows.length);
    },

    hasMoreOthers() {
      return this.clustersFiltered.length < (this.helper.counts?.others || 0);
    },

    switcherSearchCount() {
      return this.helper.counts?.others || 0;
    },

    browsableClusterCount() {
      const savedCount = this.$store.getters['management/getSavedCount'](SAVED_COUNTS.K8S_CLUSTERS);
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};
      const total = typeof savedCount === 'number' ? savedCount : (counts[MANAGEMENT.CLUSTER]?.summary?.count || 0);

      return Math.max(0, total - (this.helper.clustersLocal.length ? 1 : 0));
    },

    // The flyout's shortcut in the two forms it needs. `switcherShortcutLabel` is what a user reads in
    // the tooltip; `switcherKeyShortcut` is the spelled-out form `aria-keyshortcuts` expects, because
    // "⌘J" does not read out sensibly.
    switcherShortcutLabel() {
      return shortcutLabel(isMac ? ['⌘', 'J'] : ['Ctrl', 'J']);
    },

    switcherShortcutKeys() {
      return { windows: ['ctrl', 'j'], mac: ['meta', 'j'] };
    },

    switcherKeyShortcut() {
      return `${ isMac ? 'Meta' : 'Control' }+J`;
    },

    currentClusterId() {
      const routeCluster = this.$route?.params?.cluster;

      if (!routeCluster || routeCluster === BLANK_CLUSTER) {
        return '';
      }

      return typeof routeCluster === 'string' ? routeCluster : '';
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
      this.hide();
    },

    // Before SSP world all of these changes were kicked off given Vue change detection to properties in a computed method.
    // Changes could come from two scenarios
    // 1. Changes made by the user (pin / search). Could be tens per second
    // 2. Changes made by rancher to clusters (state, label, etc change). Could be hundreds a second
    // They can be restricted to help the churn caused from above
    // 1. When SSP enabled reduce http spam
    // 2. When SSP is disabled (legacy) reduce fn churn (this was a known performance customer issue)

    // The shelf is DERIVED from these prefs, so it re-materializes on its own when a pref changes, and
    // the row transitions ride on that. These watchers only refresh the context fetch/watch so a
    // newly-pinned cluster's data loads.
    pinnedIds: {
      handler(neu, old) {
        if (sameContents(neu, old)) {
          return;
        }

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

        this.updateClusters(this.pinnedIds, 'quick');
      }
    },

    search() {
      if (!this.canPagination) {
        this.updateClusters(this.pinnedIds, 'quick');
      }
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
      async handler(neu) {
        await this.helper.updateCount(neu);
      },
      immediate: true,
    }

  },

  mounted() {
    document.addEventListener('keyup', this.handler);
    // Capture on `window` — one hop ahead of the `document` capture listeners the shortkey directive uses
    // — so the guard can swallow an app shortcut before any of them sees it.
    window.addEventListener('keydown', this.onSwitcherKeyGuard, true);
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handler);
    window.removeEventListener('keydown', this.onSwitcherKeyGuard, true);

    this.endRowDrag(false);

    this.debouncedHelperUpdateSlow.cancel();
    this.debouncedHelperUpdateQuick.cancel();
    this.debouncedResetOthers.cancel();
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

    switcherExplore(cluster) {
      this.clusterMenuClick({ preventDefault: () => {} }, cluster);
      this.hide();
    },

    onSwitcherSearch(term) {
      if ((term || '').toLowerCase() !== this.search) {
        this.listLoading = true;
      }

      this.clusterFilter = term;
    },

    handler(e) {
      if (e.keyCode === KEY.ESCAPE && !document.querySelector('.cluster-switcher-popper')) {
        this.hide();
      }
    },

    /**
     * Cmd (Mac) / Ctrl (Windows/Linux) + J toggles the cluster-switcher flyout — mirroring the Cmd/Ctrl+K
     * resource search nav (see NavActionBar).
     *
     * Bound with `.anywhere` because the flyout puts the caret in its own search box, and the directive's
     * avoid list would otherwise leave the shortcut able to open the flyout but not close it.
     */
    onSwitcherHotkey() {
      this.$refs.switcher?.toggle();
    },

    /**
     * Cmd/Ctrl+K belongs to the side nav's resource jump (NavActionBar). Wherever that exists, get out of
     * its way: `hide` puts the flyout away and collapses the nav, then the jump is opened by FOCUSING its
     * input — the same door its own shortcut uses, and the one that still works while the flyout is on
     * screen silencing every `v-shortkey` binding.
     *
     * On WINDOW capture because the shortkey directive stops propagation from `document` capture, so a
     * listener on `document` would never see the key. `navSearch`, which decides whether the jump renders,
     * is SideNav's own state and not reachable from here, so ask the page: the input's presence IS the
     * condition. Keydown only, or the keyup would run it a second time.
     *
     * Blocking the rest is no longer this listener's job — the flyout is registered as a
     * shortcut-silencing container, exactly like a modal, so the plugin stands every binding down for as
     * long as the panel is up.
     */
    onSwitcherKeyGuard(e) {
      const key = (e.key || '').toLowerCase();
      const modified = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;

      if ((e.code === 'KeyK' || key === 'k') && modified && e.type === 'keydown' &&
        (this.shown || this.switcherOpen) && document.querySelector('[data-testid="nav-jump-to-input"]')) {
        this.hide().then(() => document.querySelector('[data-testid="nav-jump-to-input"]')?.focus());
      }
    },

    async hide() {
      await this.$refs.switcher?.closeAndWait();

      this.shown = false;
    },

    onShelfRowClick(cluster) {
      if (cluster.ready) {
        this.hide();
      }
    },

    /**
     * Press on a shelf row: arm a possible drag-reorder. Nothing is taken here — a press is far more often
     * the start of a click that navigates — so the row is only picked up once the pointer has actually
     * travelled `DRAG_THRESHOLD` pixels with it held.
     *
     * The pin toggle is its own control inside the row, so a press that starts on it is left alone.
     */
    onRowDragStart(event, cluster) {
      if (event.button !== 0 || event.target.closest?.('.pin')) {
        return;
      }

      this.dragFrom = { id: cluster.id, y: event.clientY };
      this.dragMoved = false;

      window.addEventListener('mousemove', this.onRowDragMove, true);
      window.addEventListener('mouseup', this.onRowDragEnd, true);
      window.addEventListener('keydown', this.onRowDragKey, true);
    },

    /**
     * The pointer moved with a row held. Past the threshold this takes over the shelf's order and keeps
     * the held row under the cursor, swapping it with whichever row the pointer is now over.
     */
    onRowDragMove(event) {
      if (!this.dragFrom) {
        return;
      }

      this.dragPointerY = event.clientY;

      if (!this.dragMoved && Math.abs(event.clientY - this.dragFrom.y) < DRAG_THRESHOLD) {
        return;
      }

      this.beginRowDrag();
      this.placeDraggedRow();
      this.startDragScroll();
    },

    placeDraggedRow() {
      const order = [...this.dragOrder];
      const from = order.indexOf(this.dragId);
      const to = this.rowIndexAt(this.dragPointerY);

      if (from === -1 || to === -1 || to === from) {
        return;
      }

      order.splice(to, 0, ...order.splice(from, 1));
      this.dragOrder = order;
    },

    /**
     * Scroll the shelf while a row is held near either end of it, so a row can be dragged to a place that
     * is not on screen — otherwise the reach of a drag is however much of the list happens to be visible,
     * and a long shelf can only ever be rearranged within one screenful.
     *
     * A frame loop rather than a mousemove handler: the pointer sits still in the band while the list
     * moves past it, which produces no mouse events at all.
     */
    startDragScroll() {
      if (!this.dragScrollFrame) {
        this.dragScrollFrame = requestAnimationFrame(this.dragScrollStep);
      }
    },

    dragScrollStep() {
      this.dragScrollFrame = null;

      const scroller = this.$refs.clusterList;

      if (!this.dragMoved || !scroller) {
        return;
      }

      const box = scroller.getBoundingClientRect();
      const y = this.dragPointerY;
      let delta = 0;

      if (y < box.top + DRAG_SCROLL_EDGE) {
        delta = -Math.ceil(((box.top + DRAG_SCROLL_EDGE - y) / DRAG_SCROLL_EDGE) * DRAG_SCROLL_MAX);
      } else if (y > box.bottom - DRAG_SCROLL_EDGE) {
        delta = Math.ceil(((y - (box.bottom - DRAG_SCROLL_EDGE)) / DRAG_SCROLL_EDGE) * DRAG_SCROLL_MAX);
      }

      if (!delta) {
        return;
      }

      const before = scroller.scrollTop;

      scroller.scrollTop = before + delta;

      if (scroller.scrollTop === before) {
        return;
      }

      this.placeDraggedRow();
      this.dragScrollFrame = requestAnimationFrame(this.dragScrollStep);
    },

    /**
     * Take the row: lift it, and freeze the slots the shelf's rows sit in. Reached by moving far enough
     * with the row held, and harmless to call again once the row is already held.
     */
    beginRowDrag() {
      if (this.dragMoved || !this.dragFrom) {
        return;
      }

      this.dragMoved = true;
      this.dragId = this.dragFrom.id;
      this.dragOrder = this.pinnedRows.map((c) => c.id);
      this.dragStartOrder = [...this.dragOrder];
      this.captureDragSlots();
    },

    /**
     * The fixed positions the shelf's rows occupy, taken once as a drag begins.
     *
     * They have to be measured up front. A row's box reflects any transform it is under, and the rows
     * displaced by a drag are mid-FLIP for 200ms afterwards — so measuring live reads the positions rows
     * are travelling THROUGH. The pointer then lands on a row that is only passing by, which swaps, which
     * starts another animation: the row flails between slots instead of settling under the cursor.
     *
     * Held in the SCROLLER'S coordinates, not the viewport's: the shelf scrolls under the pointer during
     * a drag, and viewport positions measured once would drift by exactly the distance scrolled, putting
     * every slot boundary somewhere the rows no longer are.
     */
    captureDragSlots() {
      const scroller = this.$refs.clusterList;
      const rows = scroller?.querySelectorAll('.clustersPinned .shelf-rows > div') || [];
      const origin = scroller ? scroller.getBoundingClientRect().top - scroller.scrollTop : 0;

      this.dragSlots = [...rows].map((el) => {
        const box = el.getBoundingClientRect();

        return { top: box.top - origin, bottom: box.bottom - origin };
      });
    },

    /**
     * Which slot the pointer is in — the same measurement expanded or collapsed, since the shelf is a
     * plain vertical list in both. Past either end it clamps, so dragging beyond the last row parks the
     * row at the end rather than abandoning the move.
     */
    rowIndexAt(clientY) {
      const slots = this.dragSlots || [];
      const scroller = this.$refs.clusterList;

      if (!slots.length || !scroller) {
        return -1;
      }

      const y = clientY - scroller.getBoundingClientRect().top + scroller.scrollTop;

      if (y <= slots[0].top) {
        return 0;
      }

      if (y >= slots[slots.length - 1].bottom) {
        return slots.length - 1;
      }

      return slots.findIndex((slot) => y >= slot.top && y <= slot.bottom);
    },

    /** Escape abandons the drag: the shelf snaps back to the pref, and nothing is written. */
    onRowDragKey(event) {
      if (event.key === 'Escape') {
        this.endRowDrag(false);
      }
    },

    onRowDragEnd() {
      this.endRowDrag(this.dragMoved);
    },

    endRowDrag(commit) {
      if (this.dragScrollFrame) {
        cancelAnimationFrame(this.dragScrollFrame);
        this.dragScrollFrame = null;
      }

      window.removeEventListener('mousemove', this.onRowDragMove, true);
      window.removeEventListener('mouseup', this.onRowDragEnd, true);
      window.removeEventListener('keydown', this.onRowDragKey, true);

      const started = this.dragStartOrder || [];
      const moved = !!this.dragOrder && this.dragOrder.some((id, i) => id !== started[i]);
      const order = commit && moved ? [...this.dragOrder] : null;

      if (this.dragMoved) {
        const swallowClick = (e) => {
          e.stopPropagation();
          e.preventDefault();
        };

        window.addEventListener('click', swallowClick, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallowClick, true), 0);
      }

      this.dragFrom = null;
      this.dragMoved = false;
      this.dragSlots = null;
      this.dragStartOrder = null;
      this.dragId = null;
      this.dragOrder = null;

      if (order) {
        this.onShelfReorder(order);
      }
    },

    /**
     * A shelf row was dropped in a new position. The shelf renders the pinned pref IN ORDER, so writing
     * that order back is the whole reorder — the rows re-derive from the pref and stay where they were
     * dropped. Optimistic, like pin/unpin, so the shelf never waits on the round trip, and reported the
     * same way when the write fails so the user is not left with an order that silently reverts.
     */
    onShelfReorder(orderedIds) {
      const write = commitAndReconcile(
        (action, payload) => this.$store.dispatch(action, payload),
        [reorderPinned(orderedIds)]
      );

      return reportPinWriteFailure(this.$store, this.t, write);
    },

    async toggle() {
      await this.$refs.switcher?.closeAndWait();

      this.shown = !this.shown;
    },

    resetOthersList() {
      const requestedTerm = this.search;
      const requestId = ++this.othersRequestId;

      this.listLoading = true;
      this.listFailed = false;

      this.helper.resetOthers({
        pinnedIds:  this.pinnedIds,
        recentIds:  this.recentIds,
        searchTerm: requestedTerm,
      }).catch(() => {
        if (requestId === this.othersRequestId) {
          this.listFailed = true;
        }
      }).finally(() => {
        if (requestId === this.othersRequestId) {
          this.listLoading = false;
        }
      });
    },

    async loadMoreOthers() {
      if (this.loadingMoreOthers || !this.hasMoreOthers) {
        return;
      }

      this.loadingMoreOthers = true;

      try {
        await this.helper.loadMoreOthers();
      } catch {
      } finally {
        this.loadingMoreOthers = false;
      }
    },

    onFlyoutLoadMore() {
      this.loadMoreOthers();
    },

    onFlyoutOpen(open) {
      this.switcherOpen = open;

      if (!open) {
        this.routeCombo = false;
      }

      if (open) {
        this.recentLoading = true;
        this.helper.refreshRecent()
          .catch((e) => console.warn('Unable to load the recent clusters', e)) // eslint-disable-line no-console
          .finally(() => {
            this.recentLoading = false;
          });
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
        content:     this.t('nav.switcher.shortcutTooltip', { shortcut: this.switcherShortcutLabel }),
        placement:   'right',
        popperClass: 'nav-tooltip',
      };
    },

    /**
     * Hover copy for a PINNED shelf row, which is the one kind of row that can be dragged — so the tooltip
     * is where that is said. Shown in BOTH nav states, unlike `getTooltipConfig`: the expanded row already
     * shows the name, but not that the row can be reordered, which nothing else on screen says.
     *
     * A row that cannot be explored says why, so "nothing happens when I click it" has an answer in the
     * same place as the invitation to drag it.
     */
    getPinnedTooltip(cluster, showWhenClosed = false) {
      const rightState = showWhenClosed ? !this.shown : this.shown;

      if (!cluster || !rightState || this.dragId) {
        return { content: null };
      }

      if (this.routeComboActive && cluster.ready) {
        return {
          content: this.t('nav.keyComboTooltip'), placement: 'right', popperClass: 'nav-tooltip'
        };
      }

      const { label: name, ready, stateDisplay: reason } = cluster;
      const content = ready ? this.t('nav.pinnedCluster.explore', { name }) : this.t('nav.pinnedCluster.blocked', { name, reason });

      return {
        content,
        placement:   'right',
        distance:    showWhenClosed ? undefined : PINNED_TOOLTIP_DISTANCE,
        popperClass: 'nav-tooltip nav-pinned-tooltip',
      };
    },

    getTooltipConfig(item, showWhenClosed = false) {
      if (!item) {
        return;
      }

      let contentText = '';
      let content;
      let popperClass = 'nav-tooltip';

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
        popperClass = 'nav-tooltip menu-description-tooltip';

        if (item.description) {
          contentText += `<br><br>${ item.description }`;
        }

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          content = null;
        }
      }

      return {
        content,
        placement: 'right',
        popperClass
      };
    },

    updateClusters(pinnedIds, speed = 'slow') {
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
            <!-- The cluster-switcher "door": the top of the cluster area, IDENTICAL expanded and collapsed —
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
                  :recent="railRecent"
                  :recent-loading="recentLoading"
                  :search-results="clustersFiltered"
                  :cluster-count="browsableClusterCount"
                  :search-count="switcherSearchCount"
                  :list-loading="listLoading"
                  :list-failed="listFailed"
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
                      v-shortkey.anywhere="switcherShortcutKeys"
                      type="button"
                      class="cluster selector option cluster-all"
                      data-testid="cluster-switcher-trigger"
                      :aria-label="t('nav.switcher.ariaLabel')"
                      :aria-keyshortcuts="switcherKeyShortcut"
                      :aria-expanded="switcherIsOpen"
                      aria-haspopup="listbox"
                      @click.prevent="toggleSwitcher"
                      @shortkey="onSwitcherHotkey"
                    >
                      <div
                        v-clean-tooltip="switcherTooltip(true)"
                        class="cluster-all-lane"
                      >
                        <div class="cluster-all-badge">
                          <span class="cluster-all-count">{{ switcherCount }}</span>
                          <span class="cluster-all-unit">{{ t('nav.search.clusters', { count: switcherCount }) }}</span>
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

          <!-- local (management cluster): a fixed slot under the switcher, mirroring the flyout -->
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
              data-testid="menu-cluster-local"
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
              <!-- The nav shelf is PINNED only — the estate, RECENTLY USED and the only search live in
                   the flyout. Driven off `shelves` so a future shelf reuses this row rather than copying it. -->
              <div
                v-for="shelf in shelves"
                :key="shelf.key"
                :class="shelf.sectionClass"
              >
                <div class="category-title">
                  <RcSeparator />
                  <span>
                    {{ t(shelf.titleKey) }}
                  </span>
                </div>
                <!-- The shelf IS the pinned pref in order, so dragging a row is the reorder: the list
                     re-sorts live under the cursor and the drop writes that order back. The rows shuffle
                     on the TransitionGroup's own FLIP transition, and the markup is the same one the
                     collapsed rail renders, so the rail reorders too. -->
                <TransitionGroup
                  name="shelf-row"
                  tag="div"
                  class="shelf-rows"
                  :class="{ 'is-reordering': !!dragId }"
                >
                  <div
                    v-for="(c, index) in shelf.rows"
                    :key="c.id"
                    :data-testid="`${ shelf.key }-ready-cluster-${ index }`"
                    :class="{ 'shelf-row-held': dragId === c.id }"
                    @mousedown="onRowDragStart($event, c)"
                    @click="onShelfRowClick(c)"
                  >
                    <button
                      v-if="c.ready"
                      v-shortkey.hold="{windows: ['alt'], mac: ['option']}"
                      :data-testid="`${ shelf.key }-menu-cluster-${ c.id }`"
                      class="cluster selector option"
                      :class="{'active-menu-link': c.isMenuActive }"
                      :aria-current="c.isMenuActive ? 'page' : undefined"
                      :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                      @click.prevent="clusterMenuClick($event, c)"
                      @shortkey="onRouteComboHold"
                    >
                      <ClusterIconMenu
                        v-clean-tooltip="getPinnedTooltip(c, true)"
                        :cluster="c"
                        :route-combo="routeComboActive"
                        class="rancher-provider-icon"
                        :show-pin="false"
                      />
                      <div
                        v-clean-tooltip="getPinnedTooltip(c)"
                        class="cluster-name"
                      >
                        <p>{{ c.label }}</p>
                      </div>
                      <Pinned
                        v-if="!c.isLocal"
                        :cluster="c"
                        :tab-order="shown ? 0 : -1"
                      />
                    </button>
                    <span
                      v-else
                      class="option cluster selector disabled"
                      :data-testid="`${ shelf.key }-menu-cluster-disabled-${ c.id }`"
                    >
                      <ClusterIconMenu
                        v-clean-tooltip="getPinnedTooltip(c, true)"
                        :cluster="c"
                        class="rancher-provider-icon"
                        :show-pin="false"
                      />
                      <div
                        v-clean-tooltip="getPinnedTooltip(c)"
                        class="cluster-name"
                      >
                        <p>{{ c.label }}</p>
                      </div>
                      <Pinned
                        v-if="!c.isLocal"
                        :cluster="c"
                        :tab-order="shown ? 0 : -1"
                      />
                    </span>
                  </div>
                </TransitionGroup>
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
    <Teleport to="body">
      <div
        v-if="dragId"
        class="shelf-drag-cursor"
        aria-hidden="true"
      />
    </Teleport>
  </div>
</template>

<style lang="scss">
  .shelf-drag-cursor {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 104;
    cursor: grabbing;
  }

  // Nav tooltips must layer above the cluster-switcher flyout (z-index 102) and its page overlay (100).
  // Their poppers are teleported to <body>, so this rule has to be global (unscoped) to reach them — but
  // it is keyed on the `nav-tooltip` class the nav's own tooltip configs set, so the rest of the app's
  // poppers keep their default stacking.
  .v-popper__popper.v-popper--theme-tooltip.nav-tooltip {
    z-index: 103;
  }

  .menu-description-tooltip {
    max-width: 200px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .v-popper__popper.v-popper--theme-tooltip.nav-pinned-tooltip .v-popper__inner {
    max-width: 320px;
    white-space: normal;
    word-wrap: break-word;
  }

  // floating-vue's generated wrapper around the cluster-switcher trigger: it takes neither a prop nor a
  // slot, and its default `display: inline-block` would collapse the trigger's full-width tile.
  .clustersAll > .v-popper {
    display: block;
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

</style>

<style lang="scss" scoped>
  $icon-size: 25px;
  $option-padding: 9px;
  $option-padding-left: 14px;
  $option-height: $icon-size + $option-padding + $option-padding;

  $font-size-sm:    12px;  // meta / status / footer / counts
  $font-size-body:  14px;  // option row text

  $chip-width:  42px;
  $chip-height: 32px;
  $chip-radius: 5px;

  $nav-space-2: 8px;
  $nav-space-4: 16px;
  $nav-space-5: 20px;
  $transition-nav: all 0.25s ease-in-out;

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

  .cluster-local {
    margin-bottom: 0;
  }

  .shelf-rows {
    position: relative;
  }

  .shelf-row-enter-active,
  .shelf-row-leave-active {
    transition: opacity 0.16s ease-out, transform 0.16s ease-out;
  }

  .shelf-row-enter-active {
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

  .shelf-row-enter-from,
  .shelf-row-leave-to {
    opacity: 0;
    transform: translateX(-6px) scale(0.985);
  }

  .shelf-row-leave-active {
    animation: cluster-unwash 0.3s ease-out;
    transition-delay: 0.14s;
  }

  @keyframes cluster-unwash {
    0% {
      background: transparent;
    }

    100% {
      background: color-mix(in srgb, var(--primary) 15%, transparent);
    }
  }

  .shelf-row-move {
    transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
  }

  $drag-displace-curve: cubic-bezier(0.2, 0, 0, 1);
  $drag-drop-curve: cubic-bezier(0.2, 1, 0.1, 1);

  .shelf-rows .cluster.selector {
    transition: background-color 0.1s ease-in-out, transform 0.33s $drag-drop-curve, box-shadow 0.33s $drag-drop-curve;
  }

  // Scoped through `.shelf-rows` so it outranks the resting row's own background, which is set further
  // up the nav's cascade than the lift below can reach.
  .shelf-rows .shelf-row-held .cluster.selector {
    background: color-mix(in srgb, var(--primary) 14%, transparent);
  }

  .shelf-row-held {
    position: relative;
    z-index: 1;

    .cluster.selector {
      transform: scale(1.02);
      transition: transform 0.2s $drag-displace-curve, box-shadow 0.2s $drag-displace-curve, background-color 0.2s $drag-displace-curve;
    }
  }

  .side-menu .shelf-rows .shelf-row-held .cluster.selector {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  }

  // The rows shuffling around the held one. `.shelf-row-move` is the TransitionGroup's own FLIP
  // transition — the same one a pin or an unpin rides — so it is only re-timed while a drag is actually
  // in progress, and the held row travels with them rather than teleporting into its new slot.
  .shelf-rows.is-reordering .shelf-row-move {
    transition: transform 0.2s $drag-displace-curve;
  }

  .shelf-rows > div {
    -webkit-user-select: none;
    user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .shelf-rows .cluster.selector,
    .shelf-rows.is-reordering .shelf-row-move,
    .shelf-row-enter-active,
    .shelf-row-leave-active {
      transition: none;
    }

    .shelf-row-enter-active,
    .shelf-row-leave-active {
      animation: none;
    }

    .shelf-row-enter-from,
    .shelf-row-leave-to {
      transform: none;
    }

    .shelf-row-held .cluster.selector {
      transform: none;
    }
  }

  // (The shelf already conveys pinned-ness via the PINNED group + pin toggle, so ClusterIconMenu's
  // redundant pin overlay is hidden with :show-pin="false" on each chip — no scoped-style piercing.)

  .cluster-all .cluster-all-lane {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: $chip-width;
    height: $chip-height;
    margin-right: $nav-space-4;
  }
  .cluster-all .cluster-all-badge {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--default-active-text);
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--border);
    border-radius: $chip-radius;

    .cluster-all-count {
      font-size: 12px;
      font-weight: bold;
      line-height: 13px;
    }

    .cluster-all-unit {
      font-size: 11px;
      font-weight: normal;
      line-height: 12px;
      letter-spacing: -0.4px;
    }
  }
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
  .cluster-all .cluster-all-chevron {
    flex: 0 0 auto;
  }

  .side-menu .body .option.cluster-all .cluster-all-badge {
    color: var(--default-active-text) !important;
    background: var(--nav-icon-badge-bg) !important;
  }

  .side-menu .body .option.cluster-all:not(:hover):not([aria-expanded='true']) {
    background: transparent;
  }

  .cluster-door {
    display: flex;
    align-items: center;
    height: 43px;
  }

  .clustersAll {
    flex: 1 1 auto;
    min-width: 0;

    // floating-vue's generated `.v-popper` wrapper defaults to `display: inline-block`, which would
    // collapse the trigger's width. It takes neither a prop nor a slot, so the rule lives in the unscoped
    // block at the top of this file rather than piercing out of here.
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
      width: $app-bar-expanded-width;
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
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      width: $app-bar-expanded-width;
      overflow: hidden;

      & .category {
        & a.router-link-active {
          &:hover {
            color: var(--on-active, var(--default));
          }
        }
      }

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
          font-size: 12px;
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
        }

        .cluster-name {
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

          // Current row (selected): white name + pinned pin; light meta + light-grey not-pinned pin.
          // !important overrides the base black/muted name+pin invariants.
          .cluster-name > p {
            color: var(--on-active, var(--primary-hover-text)) !important;
          }
          .pin.is-pinned {
            color: var(--on-active, var(--primary-hover-text)) !important;
          }
          .pin:not(.is-pinned) {
            color: color-mix(in srgb, var(--on-active, var(--primary-hover-text)) 65%, transparent) !important;
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

        // The collapsed rail rings the row's ICON, since `.option:focus-visible` zeroes the row's own
        // outline. The switcher's icon is its count chip, which is why it was the one row with no focus
        // indicator on the rail (WCAG 2.4.7).
        &:focus-visible {
          .top-menu-icon, .rancher-provider-icon, .app-icon, .cluster-all-badge {
            @include focus-outline;
          }
        }

        &:hover,
        &[aria-expanded='true'] {
          color: var(--tertiary-hover-app-bar, var(--primary-hover-text));
          background: var(--nav-hover-top-level, var(--primary-hover-bg));
          > div {
            color: var(--primary-hover-text);
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
        padding: $option-padding 0 $option-padding $option-padding-left;
      }

      .nav-head {
        flex: 0 0 auto;
      }

      .clusters {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;

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

          // No scroll-driven animations (Firefox, older Safari) → no fade, and so no overflow cue at all
          // on the nav's only scrolling region. Fall back to a permanently-visible edge shadow: less
          // precise than the scroll-linked fade, but the shelf never clips a row silently.
          @supports not (animation-timeline: scroll()) {
            opacity: 1;
          }
        }

         a, span {
          margin: 0;
         }
      }

      .clustersPinned, .home-link {
        .pin {
          display: block;
        }
      }

      .category {
        display: flex;
        flex-direction: column;
        place-content: flex-end;
        flex: 1 0 auto;

        &-title {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          align-items: center;
          margin: 15px 0;
          margin-left: $nav-space-4;
          font-size: $font-size-body;
          text-transform: uppercase;

          span {
            transition: opacity 0.25s ease-in-out;
            display: flex;
            max-height: 16px;
          }

          hr {
            margin: 0;
            max-width: 50px;
            width: 0;
            transition: none;
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

          .top-menu-icon, .app-icon, .rancher-provider-icon, .cluster-all-badge {
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
            transition: width 0s linear 0.25s;
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
      margin: $nav-space-5;
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
    left: -$app-bar-expanded-width;
  }

  .fade-enter {
    left: -$app-bar-expanded-width;
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
      padding: $nav-space-2 $nav-space-5;

      &:hover {
        background-color: var(--active-hover, var(--primary-hover-bg));
        color: var(--primary-hover-text);
        text-decoration: none;
      }
    }
  }
</style>
