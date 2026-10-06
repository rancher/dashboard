import { computed, ref, watch } from 'vue';
import type { Store } from 'vuex';
import { useRoute } from 'vue-router';
import type { I18n } from '@shell/composables/useI18n';
import {
  isTemplatingEnabled, viewsOffInUrl, appliedViewScopes, saveView, fetchTemplatingConfigMaps, type PageKey
} from '../templating/template-engine';
import {
  DEFAULT_GAP, newId, isStockView, builtInStockView, orderKeyOf, orderViews
} from '../templating/view-model';
import type { SettingsAnchor } from './viewEditor';
import type { LayoutView, View, ViewSet } from '../templating/types';


export const clone = <T, >(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * What a view shows, without what only says WHICH view it is (its id, the published view it was copied
 * from, whether it is the organization's) - so a copy and its source compare equal until one changes.
 */
export function viewContent(view: View): string {
  const copy: Partial<View> = { ...view };

  delete copy.id;
  delete copy.from;
  delete copy.org;

  return JSON.stringify(copy);
}

/**
 * A configurable page's VIEWS: what is stored, what the bar shows, and which one is open.
 *
 * The state every other part of the page reads - the editor, the bar's actions, the grid - lives here,
 * so each of those can be a composable of its own over the same views. Includes the editor's own
 * state (the draft, the selected widget, the drawer), because opening another view resets it.
 *
 * WHERE VIEWS LIVE. Your views are saved to YOUR account; the ones an admin publishes live in the
 * organization's scope and appear in the same bar. Editing one of those does not change what everyone
 * else sees: it forks the view into your account first.
 */
export function useViewSet(props: { page: PageKey }, store: Store<unknown>, t: I18n['t']) {
  // ---- state ----

  const userId = ref<string | null>(null);
  const loaded = ref(false);
  const editing = ref(false);
  /** The draft: a working copy of YOUR views while editing. */
  const working = ref<ViewSet | null>(null);
  /** JSON of the last SAVED state, for the dirty check. */
  const savedBaseline = ref<string | null>(null);
  const activeViewId = ref<string | null>(null);
  // True once the active view is a DELIBERATE choice (you clicked it, or an action moved you to it)
  // rather than the fallback taken while the config was still loading.
  const pinnedView = ref(false);
  const selectedNodeId = ref<string | null>(null);
  /** The view being created, while it has never been saved. */
  const newViewId = ref<string | null>(null);
  /** What a new view was started from, for the bar's "From …". */
  const startedFrom = ref('');
  /** The widget whose settings are open, and where it is on screen so they open beside it. */
  const settingsNodeId = ref<string | null>(null);
  const settingsAnchor = ref<SettingsAnchor | null>(null);
  const saving = ref(false);
  /** The editor's drawer. Closing it keeps you editing, with the whole width for the grid. */
  const drawerOpen = ref(true);
  const error = ref('');
  /**
   * What a view-mode action just wrote, shown until the stored copy catches up - so a dragged tab, a
   * rename or a delete lands at once rather than after the round trip.
   */
  const optimistic = ref<ViewSet | null>(null);

  // ---- what is stored, and what is shown ----

  // Off when the kill switch is off - or, for as long as the URL says so, when it carries
  // `?confviews=false`: Rancher's own page, with nothing stored and the switch untouched.
  const route = useRoute();
  const templatingEnabled = computed(() => isTemplatingEnabled(store.getters) && !viewsOffInUrl(route?.query));

  const scopes = computed(() => appliedViewScopes(store.getters, userId.value, props.page));

  // Your saved views (what the editor writes), and the ones an admin published for the organization.
  const userSet = computed<ViewSet | null>(() => optimistic.value || scopes.value.user);
  const orgViews = computed(() => scopes.value.global?.views || []);
  const orgIds = computed(() => new Set(orgViews.value.map((p) => p.id)));

  /** A working copy of your stored views, for an action to change and write back. */
  const userDraft = (): ViewSet => (userSet.value ? clone(userSet.value) : { views: [] });

  // What a brand-new view is seeded from: the organization template. A stock view is skipped — it
  // has no grid, so starting from it would give you nothing to edit.
  const orgTemplate = computed(() => orgViews.value.find((p): p is LayoutView => !isStockView(p)) || null);

  const defaultViewId = computed(() => userSet.value?.defaultViewId || '');

  // Every view in the bar, in the order you dragged them into: the organization's, then your own,
  // until you do. The view the page opens on leads.
  //
  // A view you have forked takes its source's PLACE rather than being appended — the bar has to stay
  // still. Editing "Cluster overview" must not make it jump to the end of the strip.
  const views = computed<View[]>(() => {
    const set = editing.value ? working.value : userSet.value;
    const mine = set?.views || [];
    const forks = new Map(mine.filter((p) => p.from).map((p) => [p.from, p]));

    const published = orgViews.value.map((p) => forks.get(p.id) || { ...p, org: true });
    const own = mine.filter((p) => !p.from || !orgIds.value.has(p.from));
    const all = [...published, ...own];

    // Rancher's own page is always one of the tabs.
    const list = all.some(isStockView) ? all : [builtInStockView(t('configurableViews.page.stockName')), ...all];

    return orderViews(list, set?.order, (view) => orderKeyOf(view, orgIds.value), defaultViewId.value);
  });

  /** The tabs showing a published view, or your copy of one. */
  const publishedIds = computed(() => views.value.filter((p) => p.org || (p.from && orgIds.value.has(p.from))).map((p) => p.id));

  /** Your copies of a published view that no longer match it: what "Publish your changes" sends. */
  const changedIds = computed(() => {
    const published = new Map(orgViews.value.map((p) => [p.id, viewContent(p)]));

    return views.value.filter((p) => !p.org && p.from && published.has(p.from) && published.get(p.from) !== viewContent(p)).map((p) => p.id);
  });

  const activeView = computed(() => views.value.find((p) => p.id === activeViewId.value) || views.value[0] || null);

  const isNewView = computed(() => !!newViewId.value && newViewId.value === activeViewId.value);

  // A STOCK view renders the page's stock component and has no layout to edit.
  const activeIsStock = computed(() => isStockView(activeView.value));

  // The active view's widgets, in order. A flat list — they wrap onto lines by themselves.
  const widgets = computed(() => (activeView.value && !isStockView(activeView.value) ? activeView.value.widgets : []));

  const gap = computed(() => (activeView.value && !isStockView(activeView.value) ? activeView.value.gap : DEFAULT_GAP));

  // True when the draft differs from the last saved state.
  const dirty = computed(() => editing.value && savedBaseline.value !== null && JSON.stringify(working.value) !== savedBaseline.value);

  const viewById = (id: string): View | null => views.value.find((p) => p.id === id) || null;

  /** The view being edited, as it is in the draft. */
  function workingView(): View | null {
    return working.value?.views.find((p) => p.id === activeViewId.value) || null;
  }

  /** The same, when it is a view with a grid - which is the only kind with widgets to change. */
  function workingLayout(): LayoutView | null {
    const view = workingView();

    return view && !isStockView(view) ? view : null;
  }

  // ---- which view is open ----

  /**
   * Open on your default view, or the first one there is.
   *
   * The config arrives in pieces — the organization's views resolve before your own — so the first
   * pass can only fall back to the first view there is. That fallback is NOT a choice, and this runs
   * again when the rest lands: your default still wins. A view you actually picked (`pinnedView`) is
   * never moved underneath you.
   */
  function syncActiveView(): void {
    if (pinnedView.value && views.value.find((p) => p.id === activeViewId.value)) {
      return;
    }

    const preferred = views.value.find((p) => p.id === defaultViewId.value);

    if (preferred) {
      activeViewId.value = preferred.id;
      selectedNodeId.value = null;

      return;
    }

    if (!views.value.find((p) => p.id === activeViewId.value)) {
      activeViewId.value = views.value[0]?.id || null;
      selectedNodeId.value = null;
    }
  }

  // Move to a view on purpose — and remember that it was on purpose.
  function setActiveView(id: string | null): void {
    activeViewId.value = id;
    pinnedView.value = true;
    selectedNodeId.value = null;
  }

  // If what is stored changes underneath us (or on first load), keep a valid active view.
  watch(scopes, () => {
    if (!editing.value) {
      syncActiveView();
    }
  });

  // The first read can land before the user is known, or before the ConfigMaps exist; a few short
  // retries cover a Home opened straight after login.
  async function load(): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt++) {
      await fetchTemplatingConfigMaps(store);

      const user = await store.dispatch('auth/getUser').catch(() => null);

      userId.value = user?.id || store.getters['auth/user']?.id || null;

      if (scopes.value.user || scopes.value.global || attempt >= 4) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    syncActiveView();
    loaded.value = true;
  }

  // ---- writing ----

  // Write a whole user-scope draft straight through (the view-mode actions, which have no draft). It
  // shows at once, and the stored copy takes over when it lands.
  async function persist(draft: ViewSet, activeId: string | null): Promise<void> {
    saving.value = true;
    error.value = '';
    optimistic.value = draft;
    activeViewId.value = activeId;
    pinnedView.value = !!activeId;

    try {
      await saveView(store, 'user', draft, userId.value, props.page);
      await fetchTemplatingConfigMaps(store);
    } catch (e) {
      error.value = (e as Error)?.message || String(e);
    } finally {
      optimistic.value = null;
      saving.value = false;
      syncActiveView();
    }
  }

  /**
   * A published view is everyone's, so changing it for yourself - renaming it, making it your default,
   * editing it - forks it into your account first. Returns the id to change.
   */
  function ownCopy(draft: ViewSet, view: View): string {
    if (!view.org) {
      return view.id;
    }

    const fork: View = {
      ...clone(view), id: newId('view'), from: view.id
    };

    delete fork.org;
    draft.views.push(fork);

    return fork.id;
  }

  return {
    userId,
    loaded,
    editing,
    working,
    savedBaseline,
    activeViewId,
    pinnedView,
    selectedNodeId,
    newViewId,
    startedFrom,
    settingsNodeId,
    settingsAnchor,
    saving,
    drawerOpen,
    error,
    templatingEnabled,
    scopes,
    orgViews,
    orgIds,
    userDraft,
    orgTemplate,
    defaultViewId,
    views,
    publishedIds,
    changedIds,
    activeView,
    isNewView,
    activeIsStock,
    widgets,
    gap,
    dirty,
    viewById,
    workingView,
    workingLayout,
    syncActiveView,
    setActiveView,
    load,
    persist,
    ownCopy,
  };
}

/** A page's views, as useViewSet returns them - what the other parts of the page work over. */
export type ViewSetState = ReturnType<typeof useViewSet>;
