import { CAPI, LOCAL_CLUSTER, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import {
  PINNED_CLUSTERS, RECENT_CLUSTERS, RECENT_CLUSTERS_FETCHED, SWITCHER_MAX_RECENT, SWITCHER_PAGE_SIZE
} from '@shell/store/prefs';
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
 * The head of the visit log, in visit order. `max` is the caller's — the fetch asks for more ids than the
 * flyout shows, because an id can stop resolving — so it is required rather than defaulted to one of the
 * two. Pinned clusters are NOT held back: pinning says to keep something to hand, not to erase where it
 * sits in the history, so a cluster can appear under both headings.
 */
export function visibleRecentClusters(recents: string[] = [], max: number): string[] {
  return (Array.isArray(recents) ? recents : []).slice(0, max);
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
  pin: () => Promise<unknown>,
  unpin: () => Promise<unknown>,
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
  kubernetesVersionRaw?: string,
  // Routed through the serialized pref writer, so they resolve with the write's outcome.
  pin: () => Promise<unknown>
  unpin: () => Promise<unknown>
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
   * 1. SSP: the server's DEFAULT_SORT (internal, then connected, then display name) — preserved as
   *    returned, so "active first" holds across pages rather than only within the loaded window
   * 2. legacy (in-memory): ready, then name
   */
  clustersOthers: Array<TopLevelMenuCluster>;

  /** Recently-visited clusters, most-recent-first, capped. Independent of PINNED: a pinned cluster keeps
   * whatever place its visit history earned it, and `local` is listed like any other cluster. */
  clustersRecent: Array<TopLevelMenuCluster>;

  /** The `local` cluster, fetched by its own request as the fixed top tile (every other slice filters it out). */
  clustersLocal: Array<TopLevelMenuCluster>;

  /** Server-side total for the ALL list; the UI compares loaded length against it to know if more remain. */
  counts: { others: number };

  /** Flip every cached cluster's `pinned` flag from the pinned pref (keeps the pin icon in sync). */
  syncPinnedFlags: (pinnedIds: string[]) => void;

  /** Refresh the watched context set (local + pinned). */
  update: (args: UpdateArgs) => Promise<void>;

  /** Fetch RECENTLY USED. Unwatched and on demand: it is only on screen while the flyout is open, so it
   * is read fresh each time rather than kept live. */
  refreshRecent: () => Promise<void>;

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

  protected get recentPref(): string[] {
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

  // RECENT = the recent pref (most-recent-first), capped — matched to whatever cluster data is loaded.
  // Unlike PINNED and the ALL directory this draws on the WHOLE cache: `local` has its own fixed tile, but
  // it is somewhere the user goes like any other cluster, so it earns its place in the visit history.
  public get clustersRecent(): Array<TopLevelMenuCluster> {
    const recentIds = visibleRecentClusters(this.recentPref, RECENT_CLUSTERS_FETCHED);

    return orderByIdsAndCap(Object.values(this.clusterCache), recentIds, SWITCHER_MAX_RECENT);
  }

  // Nothing to fetch by default: the in-memory path already has every cluster loaded, so RECENT is just a
  // view of the pref over it. The paginated path overrides this with a request.
  public async refreshRecent(): Promise<void> {}

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

  // local + pinned share ONE query + watch — the "context" set, small enough for a single id-IN fetch;
  // split client-side. These two are on screen in the nav all the time, so they have to stay live.
  private clustersContextWrapper: PaginationWrapper<any>;
  // The ALL list is unwatched, select-style page-increment (fetched on open + scroll): grows a page per
  // load, appending each new page. `othersPages` is the server-side total page count.
  private clustersOthersWrapper: PaginationWrapper<any>;
  // RECENTLY USED is unwatched too, and read on demand: it only exists inside the flyout, which fetches it
  // on open. Nothing keeps it live between opens, and nothing needs to — the next open asks again.
  private clustersRecentWrapper: PaginationWrapper<any>;
  private recentClusters: Array<TopLevelMenuCluster> = reactive([]);
  // Monotonic token, as the ALL list has: two opens in quick succession put two requests in flight, and
  // only the newest may write the list — an older response landing last would replace it with staler rows.
  private recentSeq = 0;
  private othersPage = 1;
  private othersPages = 0;
  // How many page-1 resets are in flight. `loadMoreOthers` stands down while any is: taking the sequence
  // token below would make that reset's own response stale, so its page 1 would be discarded and the
  // load-more's page appended to the very list the reset was meant to replace. A COUNT, not a flag —
  // successive searches overlap, and a boolean would let the first reset to settle unlock the load-more
  // while a newer one is still open.
  private othersResetting = 0;

  // Monotonic token for the ALL list: a search `resetOthers` and a scroll `loadMoreOthers` can be in
  // flight together, and only the newest response may touch `clustersOthers`.
  private othersSeq = 0;

  private clusterCount = 0;

  constructor({ $store }: {
      $store: VuexStore,
  }) {
    super({ $store });

    // local + pinned fetched in ONE `id IN (...)` query with ONE watch, split client-side. `local` is
    // always in the union so the query (and its watch) always runs — a newly-pinned cluster goes live
    // immediately (no empty-watch gap).
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
    // RECENTLY USED — an id-IN fetch of the stored visit log, unwatched, run when the flyout opens.
    this.clustersRecentWrapper = new PaginationWrapper({
      $store,
      id:         'top-level-menu-recent-clusters',
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
   * Fetch the "context" set — local + pinned — in ONE `id IN (...)` query. The only watched request: its
   * onChange re-runs this to keep those rows live, which they have to be because the nav shows them for
   * as long as it is on screen. Converted rows upsert into the shared cache; the shelf slices are derived
   * from that cache, so there's nothing to seed or split here.
   */
  private async updateContext(args: UpdateArgs): Promise<void> {
    const pinnedIds = args.pinnedIds || [];
    // Union of the ids we care about (deduped); `local` is always present.
    const contextIds = Array.from(new Set([LOCAL_CLUSTER, ...pinnedIds]));

    const r = await this.clustersContextWrapper.request({
      forceWatch: args.forceWatch,
      pagination: {
        filters: this.constructParams({
          ids:        contextIds,
          includeIds: true,
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
    // it so it leaves the pinned shelf at once. Only prune ids we actually requested (never rows the
    // ALL-list fetch cached); no backfill — the shelf just shows fewer rows until a fresh pin.
    contextIds.forEach((id) => {
      if (!returnedIds.has(id)) {
        delete this.clusterCache[id];
      }
    });
  }

  // RECENT is its own list here, not a view of the shared cache: the cache only holds what the watch keeps
  // live (local + pinned) plus whatever the ALL list happens to have paged in, and a recently-visited
  // cluster is often neither.
  public get clustersRecent(): Array<TopLevelMenuCluster> {
    return this.recentClusters;
  }

  /**
   * Fetch RECENTLY USED: the stored visit log, resolved in one id-IN query and cut to what the flyout
   * shows. Asks for more ids than it shows because an id can stop resolving — the cluster was deleted, or
   * access was lost — and takes the first that come back, in visit order.
   */
  public async refreshRecent(): Promise<void> {
    const recentIds = visibleRecentClusters(this.recentPref, RECENT_CLUSTERS_FETCHED);
    const seq = ++this.recentSeq;

    if (!recentIds.length) {
      this.recentClusters.length = 0;

      return;
    }

    const r = await this.clustersRecentWrapper.request({
      pagination: {
        filters: this.constructParams({
          ids:        recentIds,
          includeIds: true,
        }),
        page:                 1,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      }
    });

    // Rows still upsert into the shared cache — a newer request has the same right to that — but only the
    // newest may replace the list itself.
    const found = r.data.map((mgmtCluster: MgmtCluster) => this.convertToCluster(mgmtCluster));

    if (seq !== this.recentSeq) {
      return;
    }

    // The server answers in ITS order; the visit log is the order that matters here.
    this.recentClusters.length = 0;
    this.recentClusters.push(...orderByIdsAndCap(found, recentIds, SWITCHER_MAX_RECENT));
  }

  // ---------- requests ----------
  // Refreshes ONLY the watched context set (local + pinned); called on init and every pin/unpin/visit.
  // The ALL list is fetched separately by `resetOthers`/`loadMoreOthers` on open/scroll, so a pin doesn't
  // re-page it.
  async update(args: UpdateArgs) {
    this.args = args;

    await this.updateContext(args).catch((e) => {
      console.warn('Unable to update the side nav cluster context (local/pinned)', e); // eslint-disable-line no-console
    });
  }

  async destroy() {
    this.clustersContextWrapper.onDestroy();
    this.clustersOthersWrapper.onDestroy();
    this.clustersRecentWrapper.onDestroy();
  }

  /**
   * Construct SSP filter params.
   */
  private constructParams({
    ids,
    searchTerm,
    excludeLocal,
    includeSearchTerm,
    includeIds,
  }: {
    ids?: string[],
    searchTerm?: string,
    excludeLocal?: boolean,
    includeSearchTerm?: boolean,
    includeIds?: boolean,
  }): PaginationParam[] {
    const commonClusterFilters = paginationFilterClusters({ getters: this.$store.getters });
    const filters: PaginationParam[] = [...commonClusterFilters];

    if (ids && includeIds) {
      // cluster id is 1 OR 2 OR 3 OR 4...
      filters.push(PaginationParamFilter.createMultipleFields(
        ids.map((id) => ({
          field: 'id', value: id, equals: true, exact: true
        }))
      ));
    }

    if (searchTerm && includeSearchTerm) {
      filters.push(PaginationParamFilter.createSingleField({
        field: 'spec.displayName', exact: false, value: searchTerm
      }));
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

    const previousPage = this.othersPage;

    if (reset) {
      this.othersPage = 1;
    } else if (this.othersPage >= this.othersPages) {
      return; // no more pages
    } else {
      this.othersPage += 1;
    }

    // Take the token only once a request is definitely going out — a call that returns above must not
    // invalidate an in-flight response it never replaced.
    const seq = ++this.othersSeq;

    let r;

    try {
      r = await this.clustersOthersWrapper.request({
        pagination: {
          filters: this.constructParams({
            searchTerm:        args.searchTerm,
            includeSearchTerm: !!args.searchTerm,
            // `local` is held back from the resting ALL list because it has its own tile above it — but a
            // search takes that tile down, so it has to be searchable like every other cluster.
            excludeLocal:      !args.searchTerm,
          }),
          page:                 this.othersPage,
          pageSize:             SWITCHER_PAGE_SIZE,
          sort:                 DEFAULT_SORT,
          projectsOrNamespaces: []
        }
      });
    } catch (e) {
      // The counter moved BEFORE the request; leaving it moved would make the next scroll ask for page
      // N+1 and skip page N for the lifetime of the flyout — a whole page of clusters silently missing
      // from ALL CLUSTERS. Put it back so the retry re-requests the page that failed — but only if no
      // newer fetch has since claimed the counter, or this failure would rewind ITS page.
      if (seq === this.othersSeq) {
        this.othersPage = previousPage;
      }

      throw e;
    }

    // A newer fetch started while this one was in flight — e.g. a search reset landing on top of an
    // in-flight load-more. Drop this response rather than append a stale page (and a stale total) to
    // the list that has already replaced it.
    if (seq !== this.othersSeq) {
      return;
    }

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

    this.othersResetting += 1;

    return this.fetchOthers(true).finally(() => {
      this.othersResetting -= 1;
    });
  }

  /**
   * Append the next page of the ALL list (infinite scroll). Skipped while a page-1 reset is in flight —
   * a reset replaces the whole list, so an older-intent load-more must not outrank it. `ClusterSwitcher`'s
   * `fillViewport` makes the overlap reachable: it emits `load-more` as soon as the loaded rows don't fill
   * the scroller, which is exactly the state right after `onFlyoutOpen` calls `resetOthersList`.
   */
  public loadMoreOthers(): Promise<void> {
    if (this.othersResetting > 0) {
      return Promise.resolve();
    }

    return this.fetchOthers(false);
  }

  /**
   * Update the SHARED saved cluster count — the home page and the Cluster Management nav badge read it as
   * well as the switcher, so it counts what those surfaces list: everything the user can see, `local`
   * included, minus whatever the environment hides (Harvester, and `local` itself when hide-local is on).
   *
   * The switcher's own chip wants one fewer, because `local` has its own tile above its list — it takes
   * that off the shared number rather than narrowing it here, which is what made the home page and the
   * nav badge under-count by one.
   */
  public async updateCount(count: number) {
    if (count === this.clusterCount) {
      return;
    }

    this.clusterCount = count;

    try {
      const commonClusterFilters = paginationFilterClusters({ getters: this.$store.getters });

      if (commonClusterFilters.length === 0) {
        // Nothing is being filtered out, so the raw count consumers already have is the right answer and
        // there is nothing to save.
        return;
      }

      const args:ActionFindPageArgs = {
        pagination: {
          filters:              commonClusterFilters,
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
    // present was removed — drop it so it leaves the derived pinned shelf. `local` is exempt only
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

    // Keep the full ALL list; the visible slice is applied by `applyOthers` (reset/loadMore). `local` is
    // held back from the resting list because it has its own tile above it, but a search takes that tile
    // down — so while searching it is a candidate like any other cluster (mirrors the SSP helper).
    this.othersFull = this.clustersFiltered(args.searchTerm ? clusters : nonLocal, args);
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
