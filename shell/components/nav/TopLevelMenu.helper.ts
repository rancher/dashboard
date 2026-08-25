import { CAPI, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import { MENU_MAX_CLUSTERS, MENU_MAX_RECENT_CLUSTERS, PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { visibleRecentClusters } from '@shell/utils/recent-clusters';
import { STORE } from '@shell/store/store-types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationParam, PaginationParamFilter, PaginationSort } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import PaginationWrapper from '@shell/utils/pagination-wrapper';
import { sortBy } from '@shell/utils/sort';
import { reactive } from 'vue';
import { LocationAsRelativeRaw } from 'vue-router';

export interface TopLevelMenuCluster {
  id: string,
  label: string,
  ready: boolean
  providerNavLogo: string,
  badge: string,
  iconColor: string,
  isLocal: boolean,
  pinned: boolean,
  description: string,
  // Meta shown on a cluster-switcher row: distro/provider (e.g. "RKE2", "EKS") and k8s version. SURE-8192.
  providerDisplay: string,
  kubernetesVersion: string,
  pin: () => void,
  unpin: () => void,
  clusterRoute: LocationAsRelativeRaw,
}

interface UpdateArgs {
  searchTerm: string,
  pinnedIds: string[],
  recentIds?: string[],
  unPinnedMax?: number,
  forceWatch?: boolean,
  mgmtClusterRevision?: string,
  provClusterRevision?: string,
}

/**
 * Order `clusters` by their position in `ids` (most-recent-first for the RECENT group), dropping any
 * cluster not present in `ids`, and cap the result. Used to render the recent-clusters shelf in the
 * exact visit order the pref records, independent of the API's default sort. SURE-8192.
 */
function orderByIdsAndCap(clusters: TopLevelMenuCluster[], ids: string[] = [], max: number): TopLevelMenuCluster[] {
  const byId = new Map(clusters.map((c) => [c.id, c]));

  return ids
    .map((id) => byId.get(id))
    .filter((c): c is TopLevelMenuCluster => !!c)
    .slice(0, max);
}

type MgmtCluster = {
  [key: string]: any,
  id: string,
  nameDisplay: string,
  canExplore: boolean,
  providerMenuLogo: string,
  badge: string,
  iconColor: string,
  isLocal: boolean,
  pinned: boolean,
  description: string,
  machineProviderDisplay?: string,
  provider?: string,
  kubernetesVersion?: string,
  pin: () => void
  unpin: () => void
}

type ProvCluster = {
  [key: string]: any
}

/**
 * Order of v1 mgmt clusters
 * 1. local cluster - https://github.com/rancher/dashboard/issues/10975
 * 2. working clusters
 * 3. name
 */
const DEFAULT_SORT: Array<PaginationSort> = [
  {
    asc:   false,
    field: 'spec.internal',
  },
  {
    asc:   false,
    field: 'status.connected'
  },
  {
    asc:   true,
    field: 'spec.displayName',
  },
];

export interface TopLevelMenuHelper {
  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3. Is pinned
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  clustersPinned: Array<TopLevelMenuCluster>;

  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3.
  * a) if search term, filter on it
  * b) if no search term, filter on pinned
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  clustersOthers: Array<TopLevelMenuCluster>;

  /**
  * The recently-visited clusters (SURE-8192), most-recent-first and capped at MENU_MAX_RECENT_CLUSTERS.
  * Excludes pinned clusters (a pinned cluster shows under PINNED, never duplicated into RECENT) and is
  * empty while searching (search shows a single flat match list, not the resting groups).
  */
  clustersRecent: Array<TopLevelMenuCluster>;

  /**
   * The `local` (management) cluster — fetched by its OWN request so the fixed top tile is always
   * present and live, independent of pinned/recent/others (which all filter local out). SURE-8192.
   */
  clustersLocal: Array<TopLevelMenuCluster>;

  /**
   * Total matching count for the ALL list — the UI compares the loaded length against it to know whether
   * infinite-scroll has more rows to load. SURE-8192.
   */
  counts: { others: number };

  /** Flip every cached cluster's `pinned` flag from the pinned pref (keeps the pin icon in sync). SURE-8192. */
  syncPinnedFlags: (pinnedIds: string[]) => void;

  /**
   * Fetch all cluster resources
   */
  update: (args: UpdateArgs) => Promise<void>;

  /** Fetch page 1 of the ALL list, replacing what's loaded (open / search / chevron triggers). */
  resetOthers: () => Promise<void>;
  /** Append the next page of the ALL list (infinite scroll). */
  loadMoreOthers: () => Promise<void>;
  /** Whether more ALL-list pages remain. */
  hasMoreOthers: () => boolean;

  /**
   * Cleanup on destroy of TopLevelMenu
   */
  destroy: () => Promise<void>;

  updateCount: (count: number) => Promise<void>;
}

export abstract class BaseTopLevelMenuHelper {
  protected $store: VuexStore;

  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3. Is pinned
  *
  * Why aren't we filtering these by search term? Because we don't show pinned when filtering on search term
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  // Every fetched cluster, id-keyed. The pinned/recent/local shelf slices below are DERIVED from this cache
  // × the pinned/recent PREFS — so membership + order ALWAYS follow the pref (no seed, no lock, cross-tab
  // safe) and the fetch only supplies live row data. The shelf is a view of the pref, not
  // a hand-maintained copy. SURE-8192 (v2).
  protected clusterCache: Record<string, TopLevelMenuCluster> = reactive({});

  private get pinnedPref(): string[] {
    return this.$store.getters['prefs/get'](PINNED_CLUSTERS) || [];
  }

  private get recentPref(): string[] {
    return this.$store.getters['prefs/get'](RECENT_CLUSTERS) || [];
  }

  // Cached clusters minus `local` (the fixed top tile, never part of the pinned/recent groups). A stale
  // `local` id left in the pinned pref is therefore harmlessly ignored by the getters below.
  private get cachedNonLocal(): TopLevelMenuCluster[] {
    return Object.values(this.clusterCache).filter((c) => !c.isLocal);
  }

  // PINNED = the pinned pref (membership + order), matched to whatever data the cache holds. Uncapped.
  public get clustersPinned(): Array<TopLevelMenuCluster> {
    return orderByIdsAndCap(this.cachedNonLocal, this.pinnedPref, this.pinnedPref.length);
  }

  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3.
  * a) if search term, filter on it
  * b) if no search term, filter on pinned
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  public clustersOthers: Array<TopLevelMenuCluster> = reactive([]);

  /**
  * Recently-visited clusters (SURE-8192). Ordered most-recent-first per the `recent-clusters` pref,
  * excludes pinned, capped at MENU_MAX_RECENT_CLUSTERS, and empty while a search term is active.
  */
  // RECENT = the recent pref (most-recent-first), minus pinned, capped — matched to cached data.
  public get clustersRecent(): Array<TopLevelMenuCluster> {
    const recentIds = visibleRecentClusters(this.recentPref, this.pinnedPref, MENU_MAX_RECENT_CLUSTERS);

    return orderByIdsAndCap(this.cachedNonLocal, recentIds, MENU_MAX_RECENT_CLUSTERS);
  }

  // LOCAL = the `local` cluster from the cache (rendered as the fixed top tile).
  public get clustersLocal(): Array<TopLevelMenuCluster> {
    const c = this.clusterCache['local'];

    return c ? [c] : [];
  }

  // Flip every cached cluster's `pinned` flag from the pinned pref, so the pin ICON on ANY surface (shelf,
  // flyout, ALL) updates the instant the pref changes — in lockstep with the shelf membership + FLIP —
  // instead of lagging until the next fetch. The membership follows the pref already; this keeps the icon
  // in sync. SURE-8192.
  public syncPinnedFlags(pinnedIds: string[]): void {
    const pinned = new Set(pinnedIds || []);

    Object.values(this.clusterCache).forEach((c) => {
      c.pinned = pinned.has(c.id);
    });
  }

  /**
   * Total matching count (server-side) for the ALL list (`others`) — the UI compares the loaded length
   * against it to know whether infinite-scroll has more rows to load. SURE-8192.
   */
  public counts = reactive({ others: 0 });

  constructor({ $store }: {
    $store: VuexStore,
}) {
    this.$store = $store;
  }

  // Convert a mgmt cluster to a shelf row AND upsert it into the shared cache (id-keyed). On a repeat it
  // copies fresh fields INTO the existing cached object so its identity is stable (kept across fetches — the
  // FLIP and any per-row flags survive), and every list — shelf, ALL, search — references the same object.
  // Returns the cached object. SURE-8192 (v2).
  protected convertToCluster(mgmtCluster: MgmtCluster, provCluster?: ProvCluster): TopLevelMenuCluster {
    const next: TopLevelMenuCluster = {
      id:                mgmtCluster.id,
      label:             mgmtCluster.nameDisplay,
      // Align side nav cluster, home page name link and cluster management cluster explore buttons on canExplore
      ready:             mgmtCluster.canExplore,
      providerNavLogo:   mgmtCluster.providerMenuLogo,
      badge:             mgmtCluster.badge,
      iconColor:         mgmtCluster.iconColor,
      isLocal:           mgmtCluster.isLocal,
      // Pinned-ness is the pref, not the server row — so a fetch can never revert the optimistic flip.
      pinned:            this.pinnedPref.includes(mgmtCluster.id),
      description:       provCluster?.description || mgmtCluster.description,
      providerDisplay:   provCluster?.provisionerDisplay || mgmtCluster.machineProviderDisplay || mgmtCluster.provider || '',
      kubernetesVersion: mgmtCluster.kubernetesVersion || '',
      pin:               () => mgmtCluster.pin(),
      unpin:             () => mgmtCluster.unpin(),
      clusterRoute:      { name: 'c-cluster-explorer', params: { cluster: mgmtCluster.id } },
    };

    const existing = this.clusterCache[next.id];

    if (existing) {
      Object.assign(existing, next);

      return existing;
    }

    this.clusterCache[next.id] = next;

    return next;
  }
}

/**
 * Helper designed to supply paginated results for the top level menu cluster resources
 */
export class TopLevelMenuHelperPagination extends BaseTopLevelMenuHelper implements TopLevelMenuHelper {
  private args?: UpdateArgs;

  // local + pinned + recent share ONE query + watch — the "context" set (the clusters you care about),
  // small enough for a single id-IN fetch; split client-side. SURE-8192.
  private clustersContextWrapper: PaginationWrapper<any>;
  // The ALL list is UNWATCHED, select-style page-increment (fetched on open + scroll): a page counter grows
  // by one page per load and the new page is appended (`concat`), same as `useLabeledSelectPagination`.
  // `othersPages` is the server-side total page count → `hasMore = page < pages`. SURE-8192.
  private clustersOthersWrapper: PaginationWrapper<any>;
  private othersPage = 1;
  private othersPages = 0;

  private clusterCount = 0;

  constructor({ $store }: {
      $store: VuexStore,
  }) {
    super({ $store });

    // local + pinned + recent are all id lookups on the same resource — the "context" set (the clusters
    // you care about). Fetch them in ONE `id IN (...)` query with ONE watch, then split client-side.
    // Because `local` is always in the union the query always runs, so the watch is always established —
    // a newly-pinned/visited cluster goes live immediately (no empty-watch gap). SURE-8192.
    this.clustersContextWrapper = new PaginationWrapper({
      $store,
      id:       'top-level-menu-context-clusters',
      onChange: async() => {
        if (!this.args) {
          return;
        }
        try {
          await this.updateContext(this.args);
        } catch {
          // Logged lower down; catch to avoid dev-mode UI warnings.
        }
      },
      enabledFor: {
        store:    STORE.MANAGEMENT,
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'side-bar',
        }
      },
      formatResponse: { classify: true }
    });
    // ALL list — the whole estate (unpinned window). UNWATCHED, select-style page-increment: fetched on
    // open + grown on scroll (see `updateOthers`/`loadMoreOthers`). SURE-8192.
    this.clustersOthersWrapper = new PaginationWrapper({
      $store,
      id:         'top-level-menu-unpinned-clusters',
      enabledFor: {
        store:    STORE.MANAGEMENT,
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'side-bar',
        }
      },
      formatResponse: { classify: true }
    });
  }

  /**
   * Populate `clustersLocal` with the `local` (management) cluster via its own request. Local is the
   * fixed top tile and is always shown when the user has access, so this fetches strictly by id and
   * doesn't apply the Harvester/hide-local filters the other slices use. SURE-8192.
   */
  /**
   * Fetch the "context" set — local + pinned + recent — in ONE `id IN (...)` query. This is the ONLY watched
   * cluster request: its onChange re-runs this to keep those rows live. `local` is always in the union, so
   * the query (and its watch) always runs. Converting the rows upserts them into the shared cache; the shelf
   * slices (clustersPinned/Recent/Local) are DERIVED from that cache × the prefs, so there's nothing to seed
   * or split here — a cluster whose data lands on any fetch simply appears. SURE-8192.
   */
  private async updateContext(args: UpdateArgs): Promise<void> {
    const pinnedIds = args.pinnedIds || [];
    const recentIds = visibleRecentClusters(args.recentIds, pinnedIds, MENU_MAX_RECENT_CLUSTERS);
    // Union of the ids we care about (deduped); `local` is always present.
    const contextIds = Array.from(new Set(['local', ...pinnedIds, ...recentIds]));

    const r = await this.clustersContextWrapper.request({
      forceWatch: args.forceWatch,
      pagination: {
        filters: this.constructParams({
          pinnedIds:     contextIds,
          includePinned: true, // id IN (contextIds) — includes `local`
        }),
        page:                 1,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      },
      revision: args.mgmtClusterRevision
    });

    // Converting caches each row (id-keyed); the derived getters pick up membership + order from the pref.
    // This request has no explicit pageSize, so it uses the store default (100000) — far larger than the
    // id-IN union, so the whole requested set comes back in one page and "a requested id is absent" reliably
    // means "that cluster no longer exists" (the basis for the prune below). SURE-8192.
    const returnedIds = new Set<string>(r.data.map((c: MgmtCluster) => c.id));

    r.data.forEach((mgmtCluster: MgmtCluster) => this.convertToCluster(mgmtCluster));

    // Prune deleted clusters: any id we ASKED for but the server did NOT return no longer exists (deleted)
    // or is no longer visible, so drop it from the cache — it leaves the pinned/recent shelf at once, the
    // way removing a cluster used to remove it from the switcher before SURE-8192's cache. We only prune
    // ids we actually requested (never rows the ALL-list fetch cached) and we don't backfill: the shelf
    // simply shows fewer rows until a fresh visit/pin. SURE-8192.
    contextIds.forEach((id) => {
      if (!returnedIds.has(id)) {
        delete this.clusterCache[id];
      }
    });
  }

  // ---------- requests ----------
  // The watched "context" set (local/pinned/recent) and the unwatched ALL list are independent: this
  // refreshes both, but pin/visit only need the context (the ALL list is fetched on open/scroll and
  // `railAll` dedupes, so a stale `others` still renders correctly). SURE-8192.
  //
  // `update` refreshes ONLY the watched context set (local/pinned/recent) — called on init and on every
  // pin/unpin/visit. The ALL list is fetched separately by `resetOthers`/`loadMoreOthers` on the explicit
  // open/scroll triggers (not here), so a pin doesn't re-page the list. SURE-8192.
  async update(args: UpdateArgs) {
    this.args = args;

    await this.updateContext(args).catch(() => {});
  }

  async destroy() {
    this.clustersContextWrapper.onDestroy();
    this.clustersOthersWrapper.onDestroy();
  }

  /**
   * Helper function
   *
   * This extracts all the functionality previously in TopLevelMenu
   *
   * Construct SSP filter params
   */
  private constructParams({
    pinnedIds,
    searchTerm,
    includeLocal,
    excludeLocal,
    includeSearchTerm,
    includePinned,
    excludePinned,
  }: {
    pinnedIds?: string[],
    searchTerm?: string,
    includeLocal?: boolean,
    excludeLocal?: boolean,
    includeSearchTerm?: boolean,
    includePinned?: boolean,
    excludePinned?: boolean,
  }): PaginationParam[] {
    const commonClusterFilters = paginationFilterClusters({ getters: this.$store.getters });
    const filters: PaginationParam[] = [...commonClusterFilters];

    if (pinnedIds) {
      if (includePinned) {
        // cluster id is 1 OR 2 OR 3 OR 4...
        filters.push(PaginationParamFilter.createMultipleFields(
          pinnedIds.map((id) => ({
            field: 'id', value: id, equals: true, exact: true
          }))
        ));
      }

      if (excludePinned) {
        // cluster id is NOT 1 AND NOT 2 AND NOT 3 AND NOT 4...
        filters.push(...pinnedIds.map((id) => PaginationParamFilter.createSingleField({
          field: 'id', equals: false, value: id
        })));
      }
    }

    if (searchTerm && includeSearchTerm) {
      filters.push(PaginationParamFilter.createSingleField({
        field: 'spec.displayName', exact: false, value: searchTerm
      }));
    }

    if (includeLocal) {
      filters.push(PaginationParamFilter.createSingleField({ field: 'id', value: 'local' }));
    }

    if (excludeLocal) {
      // `local` is fetched by its own dedicated request and shown as the fixed top tile, so keep it out
      // of every other slice's results (pinned / recent / others / search). SURE-8192.
      filters.push(PaginationParamFilter.createSingleField({
        field: 'id', equals: false, value: 'local'
      }));
    }

    return filters;
  }

  /**
   * The ALL list (`clustersOthers`) — UNWATCHED, select-style page-increment. Fetches one FIXED-size page
   * and either replaces (reset → page 1, on open/search) or appends (loadMore → next page, on scroll) the
   * accumulated rows, exactly like `useLabeledSelectPagination`. `local` has its own fixed slot so it's
   * excluded; no pinned-exclusion (railAll dedupes). SURE-8192.
   */
  private async fetchOthers(reset: boolean): Promise<void> {
    const args = this.args;

    if (!args) {
      return;
    }

    if (reset) {
      this.othersPage = 1;
    } else if (this.othersPage >= this.othersPages) {
      return; // no more pages
    } else {
      this.othersPage += 1;
    }

    const r = await this.clustersOthersWrapper.request({
      pagination: {
        filters: this.constructParams({
          searchTerm:        args.searchTerm,
          includeSearchTerm: !!args.searchTerm,
          excludeLocal:      true,
        }),
        page:                 this.othersPage,
        pageSize:             MENU_MAX_CLUSTERS,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      }
    });

    // Server-side totals live under pagination.result (r.count doesn't exist on the wrapper Result).
    this.counts.others = r.pagination?.result?.count ?? r.data.length;
    this.othersPages = r.pagination?.result?.pages ?? Math.ceil(this.counts.others / MENU_MAX_CLUSTERS);

    const data = r.data.map((mgmtCluster: MgmtCluster) => this.convertToCluster(mgmtCluster));

    if (reset) {
      this.clustersOthers.length = 0;
    }
    this.clustersOthers.push(...data);
  }

  /**
   * Fetch page 1 of the ALL list, replacing what's loaded (open / search / chevron triggers). Accepts the
   * current args (pinned/recent/searchTerm) so the reset always uses the live search term. SURE-8192.
   */
  public resetOthers(args?: UpdateArgs): Promise<void> {
    if (args) {
      this.args = args;
    }

    return this.fetchOthers(true);
  }

  /** Append the next page of the ALL list (infinite scroll). SURE-8192. */
  public loadMoreOthers(): Promise<void> {
    return this.fetchOthers(false);
  }

  /** More ALL-list pages remain to load. SURE-8192. */
  public hasMoreOthers(): boolean {
    return this.othersPage < this.othersPages;
  }

  /**
   * Update the cluster count used when showing lists of home page + resource menu cluster count
   *
   * This is a convenient place to make the request
   */
  public async updateCount(count: number) {
    if (count === this.clusterCount) {
      return;
    }

    this.clusterCount = count;

    try {
      const args:ActionFindPageArgs = {
        pagination: {
          // ALWAYS exclude `local`: the ALL CLUSTERS count never includes it (local has its own fixed
          // tile), so the count must be identical whether or not the hide-local setting is on. Excluding
          // local also guarantees a non-empty filter set, so this query always runs and the saved count
          // never goes stale — which used to make the count wobble ±1 on a hide-local toggle. SURE-8192.
          filters:              this.constructParams({ excludeLocal: true }),
          page:                 1,
          pageSize:             1,
          sort:                 [],
          projectsOrNamespaces: [],
        },
        transient:   true,
        saveCountAs: SAVED_COUNTS.K8S_CLUSTERS
      };

      await this.$store.dispatch('management/findPage', {
        type: MANAGEMENT.CLUSTER,
        opt:  args
      });
    } catch (err) {
      console.warn('Unable to set saved count for clusters', err); // eslint-disable-line no-console
    }
  }
}

/**
 * Helper designed to supply non-paginated results for the top level menu cluster resources
 */
export class TopLevelMenuHelperLegacy extends BaseTopLevelMenuHelper implements TopLevelMenuHelper {
  protected hasProvCluster: boolean;

  // Everything is in memory here, so "pagination" is just a growing slice over the full list — but the
  // page-increment API (reset/loadMore/hasMore) matches the SSP helper so the component is agnostic.
  private othersLimit = MENU_MAX_CLUSTERS;
  private othersFull: TopLevelMenuCluster[] = [];

  constructor({ $store }: {
    $store: VuexStore,
  }) {
    super({ $store });

    this.hasProvCluster = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);

    if (this.hasProvCluster) {
      $store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }
  }

  async update(args: UpdateArgs) {
    // `updateClusters` converts every in-memory cluster, which upserts them into the shared cache — so the
    // derived shelf getters (clustersPinned/Recent/Local) see the full set. Non-SSP has everything in
    // memory, so there's never an incomplete "seed". SURE-8192.
    const clusters = this.updateClusters();
    const nonLocal = clusters.filter((c) => !c.isLocal);

    // Prune deleted clusters from the shared cache: legacy holds the FULL live estate in memory, so any
    // cached row whose cluster is no longer present was removed — drop it so it also leaves the derived
    // pinned/recent shelf (matching pre-SURE-8192, where removing a cluster removed it from the switcher).
    // `local` is preserved (fixed top tile). SURE-8192.
    const liveIds = new Set(clusters.map((c) => c.id));

    Object.keys(this.clusterCache).forEach((id) => {
      if (id !== 'local' && !liveIds.has(id)) {
        delete this.clusterCache[id];
      }
    });

    // Keep the FULL ALL list; the visible slice is applied by `applyOthers` (reset/loadMore). SURE-8192.
    this.othersFull = this.clustersFiltered(nonLocal, args);
    this.counts.others = this.othersFull.length;

    this.applyOthers();
  }

  async destroy() {
    // No-op
  }

  private applyOthers() {
    this.clustersOthers.length = 0;
    this.clustersOthers.push(...this.othersFull.slice(0, this.othersLimit));
  }

  public resetOthers(): Promise<void> {
    this.othersLimit = MENU_MAX_CLUSTERS;
    this.applyOthers();

    return Promise.resolve();
  }

  public loadMoreOthers(): Promise<void> {
    this.othersLimit += MENU_MAX_CLUSTERS;
    this.applyOthers();

    return Promise.resolve();
  }

  public hasMoreOthers(): boolean {
    return this.clustersOthers.length < this.othersFull.length;
  }

  /**
   * Filter mgmt clusters by
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Harvester type 2 (filterHiddenLocalCluster)
   * 3. There's a matching prov cluster
   *
   * Convert remaining clusters to special format
   */
  private updateClusters(): TopLevelMenuCluster[] {
    if (!this.hasProvCluster) {
      // We're filtering out mgmt clusters without prov clusters, so if the user can't see any prov clusters at all
      // exit early
      return [];
    }

    const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
    const mgmtClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(all, this.$store), this.$store);
    const provClusters = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER);
    const provClustersByMgmtId = provClusters.reduce((res: any, provCluster: ProvCluster) => {
      if (provCluster.mgmt?.id) {
        res[provCluster.mgmt.id] = provCluster;
      }

      return res;
    }, {});

    return (mgmtClusters || []).reduce((res: any, mgmtCluster: MgmtCluster) => {
      // Filter to only show mgmt clusters that exist for the available provisioning clusters
      // Addresses issue where a mgmt cluster can take some time to get cleaned up after the corresponding
      // provisioning cluster has been deleted
      if (!provClustersByMgmtId[mgmtCluster.id]) {
        return res;
      }

      res.push(this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));

      return res;
    }, []);
  }

  /**
   * Filter clusters by
   * 1. Not pinned
   * 2. Includes search term
   *
   * Sort remaining clusters
   *
   * Reduce number of clusters if too many too show
   *
   * Important! This is used to show unpinned clusters OR results of search
   */
  private clustersFiltered(clusters: TopLevelMenuCluster[], args: UpdateArgs): TopLevelMenuCluster[] {
    const search = (args.searchTerm || '').toLowerCase();

    // ALL lists the WHOLE estate — no pinned-exclusion and no cap (the groups are independent and may
    // overlap). `local` is already excluded upstream (its own fixed slot). While searching, narrow to
    // matches. SURE-8192.
    const filtered = clusters.filter((c) => !search || c.label?.toLowerCase().includes(search));

    return sortBy(filtered, ['ready:desc', 'label']);
  }


  public async updateCount(count: number) {}
}

/**
 * Retain state of the side nav, no matter when the TopLevelMenu component is created/deleted (on layout change)
 *
 * This means there's no flickering when the user changes pages and the side nav component re-renders
 *
 * Also it means we're not unwatching then watching the clusters
 */
class TopLevelMenuHelperService {
  private _helper?: TopLevelMenuHelper;
  public initialized = false;

  public init($store: VuexStore) {
    if (this._helper) {
      return;
    }

    const canPagination = $store.getters[`management/paginationEnabled`]({
      id:      MANAGEMENT.CLUSTER,
      context: 'side-bar',
    });

    this._helper = canPagination ? new TopLevelMenuHelperPagination({ $store }) : new TopLevelMenuHelperLegacy({ $store });

    this.initialized = true;
  }

  public async reset() {
    await this._helper?.destroy();
    delete this._helper;
  }

  get helper(): TopLevelMenuHelper {
    if (!this._helper) {
      throw new Error('Unable to use the side nav cluster helper (not initialised)');
    }

    return this._helper;
  }
}

const instance = new TopLevelMenuHelperService();

export default instance;
