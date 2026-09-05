import { CAPI, LOCAL_CLUSTER, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import { MENU_MAX_RECENT_CLUSTERS, PINNED_CLUSTERS, RECENT_CLUSTERS, SWITCHER_PAGE_SIZE } from '@shell/store/prefs';
import { STORE } from '@shell/store/store-types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationParam, PaginationParamFilter, PaginationSort } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import PaginationWrapper from '@shell/utils/pagination-wrapper';
import { sortBy } from '@shell/utils/sort';
import { reactive } from 'vue';
import { LocationAsRelativeRaw } from 'vue-router';

/**
 * The recent clusters to actually SHOW: drop any that are currently pinned (they appear under PINNED),
 * preserve visit order, and cap at the display limit.
 */
export function visibleRecentClusters(
  recents: string[] = [],
  pinnedIds: string[] = [],
  max: number = MENU_MAX_RECENT_CLUSTERS
): string[] {
  const pinned = Array.isArray(pinnedIds) ? pinnedIds : [];

  return (Array.isArray(recents) ? recents : [])
    .filter((id) => !pinned.includes(id))
    .slice(0, max);
}

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
  // Meta shown on a cluster-switcher row: distro/provider (e.g. "RKE2", "EKS") and k8s version.
  providerDisplay: string,
  kubernetesVersion: string,
  // The model routes these through the serialized pref writer, so they resolve with the write's outcome
  // (`{ type, status }` on failure) — callers must not drop the promise.
  pin: () => Promise<unknown> | void,
  unpin: () => Promise<unknown> | void,
  clusterRoute: LocationAsRelativeRaw,
}

interface UpdateArgs {
  searchTerm: string,
  pinnedIds: string[],
  recentIds?: string[],
  forceWatch?: boolean,
  mgmtClusterRevision?: string,
  provClusterRevision?: string,
}

/**
 * Order `clusters` by their position in `ids`, drop any not in `ids`, and cap — so a shelf renders in
 * the pref's recorded order rather than the API's default sort.
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
   * PINNED clusters (uncapped).
   *
   * Filter by
   * 1. If harvester or not (filterOnlyKubernetesClusters)
   * 2. If local or not (filterHiddenLocalCluster) — local is the fixed top tile, never listed here
   * 3. Is pinned
   *
   * Sort By
   * 1. The pinned pref's recorded order (the order the clusters were pinned)
   */
  clustersPinned: Array<TopLevelMenuCluster>;

  /**
   * The ALL list — the whole estate, or the search matches while searching.
   *
   * Filter by
   * 1. If harvester or not (filterOnlyKubernetesClusters)
   * 2. If local or not (filterHiddenLocalCluster) — local is the fixed top tile
   * 3.
   *    a) if search term, filter on it (name match)
   *    b) if no search term, the whole estate (no pinned-exclusion, no cap)
   *
   * Sort By
   * 1. ready
   * 2. name
   */
  clustersOthers: Array<TopLevelMenuCluster>;

  /** Recently-visited clusters, most-recent-first, capped and pinned-excluded; empty while searching. */
  clustersRecent: Array<TopLevelMenuCluster>;

  /** The `local` cluster, fetched by its own request as the fixed top tile (every other slice filters it out). */
  clustersLocal: Array<TopLevelMenuCluster>;

  /** Server-side total for the ALL list; the UI compares loaded length against it to know if more remain. */
  counts: { others: number };

  /** Flip every cached cluster's `pinned` flag from the pinned pref (keeps the pin icon in sync). */
  syncPinnedFlags: (pinnedIds: string[]) => void;

  /** Refresh the watched context set (local/pinned/recent). */
  update: (args: UpdateArgs) => Promise<void>;

  /** Fetch page 1 of the ALL list, replacing what's loaded (open / search / chevron triggers). */
  resetOthers: (args?: UpdateArgs) => Promise<void>;
  /** Append the next page of the ALL list (infinite scroll). */
  loadMoreOthers: () => Promise<void>;

  /** Cleanup on destroy of TopLevelMenu. */
  destroy: () => Promise<void>;

  updateCount: (count: number) => Promise<void>;
}

export abstract class BaseTopLevelMenuHelper {
  protected $store: VuexStore;

  // Every fetched cluster, id-keyed. The pinned/recent/local shelf slices are DERIVED from this cache ×
  // the prefs, so membership + order always follow the pref (cross-tab safe) and the fetch only supplies
  // live row data.
  protected clusterCache: Record<string, TopLevelMenuCluster> = reactive({});

  private get pinnedPref(): string[] {
    return this.$store.getters['prefs/get'](PINNED_CLUSTERS) || [];
  }

  private get recentPref(): string[] {
    return this.$store.getters['prefs/get'](RECENT_CLUSTERS) || [];
  }

  // Cached clusters minus `local` (the fixed top tile); a stale `local` id in the pinned pref is thus ignored.
  private get cachedNonLocal(): TopLevelMenuCluster[] {
    return Object.values(this.clusterCache).filter((c) => !c.isLocal);
  }

  // PINNED = the pinned pref (membership + order), matched to cached data. Uncapped.
  public get clustersPinned(): Array<TopLevelMenuCluster> {
    return orderByIdsAndCap(this.cachedNonLocal, this.pinnedPref, Infinity);
  }

  public clustersOthers: Array<TopLevelMenuCluster> = reactive([]);

  // RECENT = the recent pref (most-recent-first), minus pinned, capped — matched to cached data.
  public get clustersRecent(): Array<TopLevelMenuCluster> {
    const recentIds = visibleRecentClusters(this.recentPref, this.pinnedPref, MENU_MAX_RECENT_CLUSTERS);

    return orderByIdsAndCap(this.cachedNonLocal, recentIds, MENU_MAX_RECENT_CLUSTERS);
  }

  // LOCAL = the `local` cluster from the cache (rendered as the fixed top tile).
  public get clustersLocal(): Array<TopLevelMenuCluster> {
    const c = this.clusterCache[LOCAL_CLUSTER];

    return c ? [c] : [];
  }

  // Flip every cached cluster's `pinned` flag from the pref so the pin icon on any surface updates the
  // instant the pref changes, instead of lagging until the next fetch.
  public syncPinnedFlags(pinnedIds: string[]): void {
    const pinned = new Set(pinnedIds || []);

    Object.values(this.clusterCache).forEach((c) => {
      c.pinned = pinned.has(c.id);
    });
  }

  // Server-side total for the ALL list; the UI compares loaded length against it to know if more remain.
  public counts = reactive({ others: 0 });

  constructor({ $store }: {
    $store: VuexStore,
}) {
    this.$store = $store;
  }

  // Convert a mgmt cluster to a shelf row and upsert it into the shared cache (id-keyed). On a repeat it
  // copies fresh fields into the existing object so its identity is stable across fetches and every list
  // references the same object.
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
      // `kubernetesVersion` falls back to `generic.provisioning` ('—'), so it is never falsy and the meta
      // line would read "Imported · —". Read the raw getter so it collapses to just the provider instead.
      kubernetesVersion: mgmtCluster.kubernetesVersionRaw || '',
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

  // local + pinned + recent share ONE query + watch — the "context" set, small enough for a single
  // id-IN fetch; split client-side.
  private clustersContextWrapper: PaginationWrapper<any>;
  // The ALL list is unwatched, select-style page-increment (fetched on open + scroll): grows a page per
  // load, appending each new page. `othersPages` is the server-side total page count.
  private clustersOthersWrapper: PaginationWrapper<any>;
  private othersPage = 1;
  private othersPages = 0;

  private clusterCount = 0;

  constructor({ $store }: {
      $store: VuexStore,
  }) {
    super({ $store });

    // local + pinned + recent fetched in ONE `id IN (...)` query with ONE watch, split client-side.
    // `local` is always in the union so the query (and its watch) always runs — a newly-pinned/visited
    // cluster goes live immediately (no empty-watch gap).
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
    // ALL list — the whole estate. Unwatched, select-style page-increment: fetched on open, grown on scroll.
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
   * Fetch the "context" set — local + pinned + recent — in ONE `id IN (...)` query. The only watched
   * request: its onChange re-runs this to keep those rows live. Converted rows upsert into the shared cache;
   * the shelf slices are derived from that cache, so there's nothing to seed or split here.
   */
  private async updateContext(args: UpdateArgs): Promise<void> {
    const pinnedIds = args.pinnedIds || [];
    const recentIds = visibleRecentClusters(args.recentIds, pinnedIds, MENU_MAX_RECENT_CLUSTERS);
    // Union of the ids we care about (deduped); `local` is always present.
    const contextIds = Array.from(new Set([LOCAL_CLUSTER, ...pinnedIds, ...recentIds]));

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

    // No explicit pageSize → store default (100000), far larger than the id-IN union, so the whole
    // requested set returns in one page and "a requested id is absent" reliably means the cluster no
    // longer exists (the basis for the prune below).
    const returnedIds = new Set<string>(r.data.map((c: MgmtCluster) => c.id));

    r.data.forEach((mgmtCluster: MgmtCluster) => this.convertToCluster(mgmtCluster));

    // Prune deleted clusters: any id we asked for but the server didn't return is gone/invisible, so drop
    // it so it leaves the pinned/recent shelf at once. Only prune ids we actually requested (never rows the
    // ALL-list fetch cached); no backfill — the shelf just shows fewer rows until a fresh visit/pin.
    contextIds.forEach((id) => {
      if (!returnedIds.has(id)) {
        delete this.clusterCache[id];
      }
    });
  }

  // ---------- requests ----------
  // Refreshes ONLY the watched context set (local/pinned/recent); called on init and every pin/unpin/visit.
  // The ALL list is fetched separately by `resetOthers`/`loadMoreOthers` on open/scroll, so a pin doesn't
  // re-page it.
  async update(args: UpdateArgs) {
    this.args = args;

    await this.updateContext(args).catch((e) => {
      console.warn('Unable to update the side nav cluster context (local/pinned/recent)', e); // eslint-disable-line no-console
    });
  }

  async destroy() {
    this.clustersContextWrapper.onDestroy();
    this.clustersOthersWrapper.onDestroy();
  }

  /**
   * Construct SSP filter params.
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
      filters.push(PaginationParamFilter.createSingleField({ field: 'id', value: LOCAL_CLUSTER }));
    }

    if (excludeLocal) {
      // `local` has its own request and fixed top tile, so keep it out of every other slice's results.
      filters.push(PaginationParamFilter.createSingleField({
        field: 'id', equals: false, value: LOCAL_CLUSTER
      }));
    }

    return filters;
  }

  /**
   * Fetch one fixed-size page of the ALL list, either replacing (reset → page 1) or appending
   * (loadMore → next page) the accumulated rows. `local` is excluded; no pinned-exclusion (railAll dedupes).
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
        pageSize:             SWITCHER_PAGE_SIZE,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      }
    });

    // Server-side totals live under pagination.result (r.count doesn't exist on the wrapper Result).
    this.counts.others = r.pagination?.result?.count ?? r.data.length;
    this.othersPages = r.pagination?.result?.pages ?? Math.ceil(this.counts.others / SWITCHER_PAGE_SIZE);

    const data = r.data.map((mgmtCluster: MgmtCluster) => this.convertToCluster(mgmtCluster));

    if (reset) {
      this.clustersOthers.length = 0;
    }
    this.clustersOthers.push(...data);
  }

  /** Fetch page 1 of the ALL list, replacing what's loaded; accepts current args so it uses the live search term. */
  public resetOthers(args?: UpdateArgs): Promise<void> {
    if (args) {
      this.args = args;
    }

    return this.fetchOthers(true);
  }

  /** Append the next page of the ALL list (infinite scroll). */
  public loadMoreOthers(): Promise<void> {
    return this.fetchOthers(false);
  }

  /** Update the saved cluster count used by the home page + resource menu. */
  public async updateCount(count: number) {
    if (count === this.clusterCount) {
      return;
    }

    this.clusterCount = count;

    try {
      const args:ActionFindPageArgs = {
        pagination: {
          // Always exclude `local` (it has its own tile) so the count is the same regardless of the
          // hide-local setting. It also guarantees a non-empty filter set, so the query always runs and the
          // saved count never goes stale — which used to make the count wobble ±1 on a hide-local toggle.
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

  // Everything is in memory, so "pagination" is a growing slice over the full list — but the page-increment
  // API matches the SSP helper so the component is agnostic.
  private othersLimit = SWITCHER_PAGE_SIZE;
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
    // `updateClusters` upserts every in-memory cluster into the shared cache, so the derived shelf getters
    // see the full set (everything is in memory, so there's never an incomplete seed).
    const clusters = this.updateClusters();
    const nonLocal = clusters.filter((c) => !c.isLocal);

    // Prune deleted clusters: legacy holds the full live estate in memory, so any cached row no longer
    // present was removed — drop it so it leaves the derived pinned/recent shelf. `local` is exempt only
    // until the estate has actually loaded (an empty list is "not fetched yet", not "local is gone"); once
    // it has, `local` goes the same way as any other missing id — matching the pagination helper, whose
    // `updateContext` prunes it when `hide-local-cluster` filters it out. Consumers read
    // `clustersLocal` as the source of truth for local access, so the two must not diverge.
    const liveIds = new Set(clusters.map((c) => c.id));

    Object.keys(this.clusterCache).forEach((id) => {
      if (!liveIds.has(id) && (id !== LOCAL_CLUSTER || clusters.length)) {
        delete this.clusterCache[id];
      }
    });

    // Keep the full ALL list; the visible slice is applied by `applyOthers` (reset/loadMore).
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

  public resetOthers(args?: UpdateArgs): Promise<void> {
    this.othersLimit = SWITCHER_PAGE_SIZE;

    // Rebuild from the caller's args rather than whatever the last `update()` left behind, so the search
    // term applied here can't lag a tick behind the one the user typed.
    if (args) {
      this.othersFull = this.clustersFiltered(this.updateClusters().filter((c) => !c.isLocal), args);
      this.counts.others = this.othersFull.length;
    }

    this.applyOthers();

    return Promise.resolve();
  }

  public loadMoreOthers(): Promise<void> {
    this.othersLimit += SWITCHER_PAGE_SIZE;
    this.applyOthers();

    return Promise.resolve();
  }

  /** Filter mgmt clusters (Harvester filters + a matching prov cluster) and convert the remainder to rows. */
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

  /** Build the ALL list (or search results): narrow to search matches when searching, then sort. */
  private clustersFiltered(clusters: TopLevelMenuCluster[], args: UpdateArgs): TopLevelMenuCluster[] {
    const search = (args.searchTerm || '').toLowerCase();

    // ALL lists the whole estate — no pinned-exclusion, no cap (groups are independent and may overlap).
    // `local` is already excluded upstream. While searching, narrow to matches.
    const filtered = clusters.filter((c) => !search || c.label?.toLowerCase().includes(search));

    return sortBy(filtered, ['ready:desc', 'label']);
  }

  /** No-op: the legacy helper holds the whole estate in memory, so there is no saved count to maintain. */
  public async updateCount() {}
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
