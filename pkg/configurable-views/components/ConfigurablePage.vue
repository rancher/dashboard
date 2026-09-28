<script setup lang="ts">
import {
  computed, nextTick, provide, reactive, ref, watch, type CSSProperties
  , Component
} from 'vue';
import { useStore } from 'vuex';
import WidgetGrid from './WidgetGrid.vue';
import ViewBar from './ViewBar.vue';
import EditViewSidebar from './EditViewSidebar.vue';
import WidgetSettingsModal from './WidgetSettingsModal.vue';
import { VIEW_EDITOR, type SettingsAnchor, type ViewEditorUi } from '../composables/viewEditor';
import { useConfirm } from '../composables/useConfirm';
import {
  isTemplatingEnabled, appliedViewScopes, saveView, fetchTemplatingConfigMaps, type PageKey
} from '../templating/template-engine';
import {
  DEFAULT_GAP, DEFAULT_PAGE_PADDING, newId, newLayoutView, newWidgetNode, isStockView, findWidget, builtInStockView,
  insertWidget, removeWidget, moveWidget, moveWidgetTo, updateWidget,
  setColSpan as setSpan, heightForPreset, SPACING_PRESETS
} from '../templating/view-model';
import type { CatalogEntry } from '../templating/widget-catalog';
import type {
  LayoutView, View, Sides, ViewSet, WidgetNode, WidgetSpec
} from '../templating/types';

// A configurable PAGE: the Home, or a cluster's dashboard. It holds that page's views, and one of
// them is the page Rancher already had, rendered as itself.
//
//   VIEW      one named dashboard — "Cluster overview", "Upgrade week". Views are the tabs in the
//              bar at the top, and each is edited, renamed, duplicated and deleted on its own.
//   WIDGET     one building block on a view's grid (a table, a cluster's capacity, a links box),
//              sized in twelfths and configured in place through its ⚙.
//
// A view is a FLAT, ordered list of widgets that wrap onto lines — there are no rows to manage.
//
// WHERE VIEWS LIVE. Your views are saved to YOUR account; the ones an admin publishes live in the
// organization's scope and appear in the same bar. Editing one of those does not change what
// everyone else sees — it forks the view into your account first, which is what lets the editing
// bar promise "Changes are saved to your account only" without an asterisk. Publishing is the
// separate, deliberate step in the ⋮ menu.
//
// Edits are a DRAFT: nothing is written until Save.

defineOptions({
  name:         'ConfigurableViewsPage',
  // Two roots in stock mode (the bar and the page), so the router-view's attrs - `class="outlet"` -
  // are placed by hand: on the stock page itself, or on the configurable surface. See showsStockPage.
  inheritAttrs: false,
});

const props = defineProps<{
  /** Which page this is - where its views are stored. */
  page: PageKey;
  /** Rancher's own page, kept as a view and rendered as itself. */
  stock: Component;
  /** What the bar calls the page. */
  title: string;
  /**
   * Which layout the page sits in. The home layout takes the global outlet padding back with a
   * scoped rule this component has to restate (see the styles); the default layout does not, and a
   * page there keeps its padding.
   */
  layout: 'home' | 'default';
  /** The name a first view gets when you start editing with none. */
  firstViewName: string;
}>();

const store = useStore();
const confirm = useConfirm();

const clone = <T, >(value: T): T => JSON.parse(JSON.stringify(value));

// ---- state ----------------------------------------------------------------------------------------

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
const error = ref('');
const bar = ref<InstanceType<typeof ViewBar> | null>(null);

// Shared, reactive editor UI state: what is being dragged — a widget already on the grid, or a
// catalog entry on its way in.
const ui = reactive<ViewEditorUi>({
  dragId: null, dragEntry: null, dragLabel: '', showBoxModel: false
});

// ---- what is stored, and what is shown --------------------------------------------------------------

const templatingEnabled = computed(() => isTemplatingEnabled(store.getters));

const scopes = computed(() => appliedViewScopes(store.getters, userId.value, props.page));

// Your saved views (what the editor writes), and the ones an admin published for the organization.
const myViews = computed(() => scopes.value.user?.views || []);
const orgViews = computed(() => scopes.value.global?.views || []);

// What a brand-new view is seeded from: the organization template. A stock view is skipped — it
// has no grid, so starting from it would give you nothing to edit.
const orgTemplate = computed(() => orgViews.value.find((p): p is LayoutView => !isStockView(p)) || null);

// Every view in the bar: the organization's, then your own.
//
// A view you have forked takes its source's PLACE rather than being appended — the bar has to stay
// still. Editing "Cluster overview" must not make it jump to the end of the strip.
const views = computed<View[]>(() => {
  const mine = editing.value ? (working.value?.views || []) : myViews.value;
  const forks = new Map(mine.filter((p) => p.from).map((p) => [p.from, p]));
  const orgIds = new Set(orgViews.value.map((p) => p.id));

  const published = orgViews.value.map((p) => forks.get(p.id) || { ...p, org: true });
  const own = mine.filter((p) => !p.from || !orgIds.has(p.from));
  const all = [...published, ...own];

  // Rancher's own page is always one of the tabs - first, when nothing stored already is it.
  return all.some(isStockView) ? all : [builtInStockView(props.title), ...all];
});

const activeView = computed(() => views.value.find((p) => p.id === activeViewId.value) || views.value[0] || null);

const defaultViewId = computed(() => scopes.value.user?.defaultViewId || '');

const isNewView = computed(() => !!newViewId.value && newViewId.value === activeViewId.value);

// A STOCK view renders the page's stock component and has no layout to edit.
const activeIsStock = computed(() => isStockView(activeView.value));

// The active view's widgets, in order. A flat list — they wrap onto lines by themselves.
const widgets = computed(() => (activeView.value && !isStockView(activeView.value) ? activeView.value.widgets : []));

const gap = computed(() => (activeView.value && !isStockView(activeView.value) ? activeView.value.gap : DEFAULT_GAP));

// The space between the grid and the edges of the page — a view-level setting like the gap.
const surfaceStyle = computed<CSSProperties>(() => ({ padding: `${ activeView.value && !isStockView(activeView.value) ? activeView.value.pad : DEFAULT_PAGE_PADDING }px` }));

const hasContent = computed(() => activeIsStock.value || widgets.value.length > 0);

/**
 * True when what is on screen is the stock page - and then it is rendered exactly as Rancher renders it.
 *
 * Not wrapped. The stock page is the router's outlet: it takes `class="outlet"` and sits straight in
 * <main>, with nothing around it. Rendered inside this component's layout it was none of that - four
 * wrappers deep, with the view's spacing applied to it, 20px in, 20px down and 40px narrower than
 * the real thing. So in this state the component renders the bar and then the stock page with our
 * attrs on it, which makes its root the outlet exactly as stock. The bar is the only addition.
 *
 * Covers every way of arriving at the stock page: the stock view chosen, the feature switched off,
 * no view applied, or an empty one. Editing is the exception - that is our own page, the stock one
 * shown inside it only so there is something to look at beside the drawer.
 */
const showsStockPage = computed(() => loaded.value && !editing.value && (activeIsStock.value || !(templatingEnabled.value && activeView.value && hasContent.value)));

// True when the draft differs from the last saved state.
const dirty = computed(() => editing.value && savedBaseline.value !== null && JSON.stringify(working.value) !== savedBaseline.value);

// The widget the Layout tab acts on, and the one whose settings are open.
const selectedNode = computed(() => findWidget(widgets.value, selectedNodeId.value));
const settingsNode = computed(() => findWidget(widgets.value, settingsNodeId.value));

// The starting points a brand-new view offers: empty, or a copy of any view you already have.
const startingPoints = computed(() => views.value
  .filter((p) => p.id !== newViewId.value && !isStockView(p))
  .map((p) => ({ id: p.id, label: `Copy ${ p.name }` })));

// ---- which view is open ------------------------------------------------------------------------------

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

load();

// ---- the draft ---------------------------------------------------------------------------------------

/** The view being edited, as it is in the draft. */
function workingView(): View | null {
  return working.value?.views.find((p) => p.id === activeViewId.value) || null;
}

/** The same, when it is a view with a grid - which is the only kind with widgets to change. */
function workingLayout(): LayoutView | null {
  const view = workingView();

  return view && !isStockView(view) ? view : null;
}

// The draft is always YOUR views. Editing a published view forks it into your account first, so an
// edit can never change what the organization sees by accident.
//
// With nothing of yours to edit - no views on this page, and the one showing is Rancher's own or
// the organization's - a first view is started for you. Not when a new view is about to be made
// anyway: that is the view you are starting, and seeding one as well left an empty extra behind.
function enterEdit({ seedFirst = true } = {}): void {
  error.value = '';

  const draft: ViewSet = scopes.value.user ? clone(scopes.value.user) : { views: [] };
  const active = activeView.value;

  working.value = draft;

  if (active?.org) {
    const fork: View = {
      ...clone(active), id: newId('view'), from: active.id
    };

    delete fork.org;
    draft.views.push(fork);
    setActiveView(fork.id);
  } else if (seedFirst && !draft.views.length) {
    const first = newLayoutView(props.firstViewName);

    draft.views.push(first);
    setActiveView(first.id);
  }

  savedBaseline.value = JSON.stringify(draft);
  editing.value = true;
  selectedNodeId.value = null;
}

async function leaveEdit(): Promise<void> {
  editing.value = false;
  working.value = null;
  savedBaseline.value = null;
  newViewId.value = null;
  startedFrom.value = '';
  selectedNodeId.value = null;
  settingsNodeId.value = null;
  await fetchTemplatingConfigMaps(store);
  syncActiveView();
}

async function cancelEdit(): Promise<void> {
  if (dirty.value && !await confirm({
    title: 'Discard changes?',
    body:  'The changes to this view have not been saved. Leaving the editor discards them.',
  })) {
    return;
  }

  await leaveEdit();
}

/**
 * A fork that still matches the published view it came from is not a decision you made — it is just
 * where the editor had to put the draft. Saving it would leave a duplicate in the bar forever, so
 * those are dropped on the way out.
 */
function pruneUntouchedForks(draft: ViewSet): void {
  const strip = (view: View) => {
    const copy: Partial<View> = { ...view };

    delete copy.id;
    delete copy.from;
    delete copy.org;

    return JSON.stringify(copy);
  };
  const sources = new Map(orgViews.value.map((p) => [p.id, strip(p)]));
  const dropped = new Set<string>();

  draft.views = draft.views.filter((view) => {
    const untouched = !!view.from && sources.get(view.from) === strip(view);

    if (untouched) {
      dropped.add(view.id);
    }

    return !untouched;
  });

  // Looking at one that just went? Fall back to the published view it mirrored.
  if (activeViewId.value && dropped.has(activeViewId.value)) {
    activeViewId.value = null;
    pinnedView.value = false;
  }
  if (draft.defaultViewId && dropped.has(draft.defaultViewId)) {
    delete draft.defaultViewId;
  }
}

// Write the draft to your account.
async function save({ keepEditing = false } = {}): Promise<void> {
  const draft = working.value;

  if (!draft) {
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    pruneUntouchedForks(draft);
    await saveView(store, 'user', draft, userId.value, props.page);
    savedBaseline.value = JSON.stringify(draft);
    newViewId.value = null;
    startedFrom.value = '';
    await fetchTemplatingConfigMaps(store);

    if (!keepEditing) {
      await leaveEdit();
    }
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

// Keep the view you started from as it was, and save your changes as a view of their own.
async function saveAsNewView(): Promise<void> {
  const draft = working.value;
  const view = workingView();

  if (!draft || !view || savedBaseline.value === null) {
    return;
  }

  const copy: View = {
    ...clone(view), id: newId('view'), name: `${ view.name } copy`
  };

  delete copy.from;

  // The original goes back to how it was saved; the copy carries the edits.
  const original = (JSON.parse(savedBaseline.value) as ViewSet).views.find((p) => p.id === view.id);

  if (original) {
    Object.assign(view, clone(original));
  } else {
    draft.views = draft.views.filter((p) => p.id !== view.id);
  }

  draft.views.push(copy);
  setActiveView(copy.id);

  await save();
}

// ---- view (tab) actions -----------------------------------------------------------------------------

function renameView(name: string): void {
  const view = workingView();

  if (view) {
    view.name = name;
  }
}

// "Rename" from the ⋮ menu: there is one place a view is named — the bar — so this opens the editor
// and hands the name to the bar to select, rather than inventing a second naming dialog.
function startRename(): void {
  if (!editing.value) {
    enterEdit();
  }
  nextTick(() => bar.value?.selectName());
}

// A new view starts from the organization template when there is one — the design's "From the
// organization template. Not saved yet."
function newView(): void {
  if (!editing.value) {
    enterEdit({ seedFirst: false });
  }

  const draft = working.value;

  if (!draft) {
    return;
  }

  const template = orgTemplate.value;
  const view: LayoutView = template ? {
    ...clone(template), id: newId('view'), name: 'Untitled view'
  } : newLayoutView('Untitled view');

  delete view.org;
  delete view.from;

  draft.views.push(view);
  setActiveView(view.id);
  newViewId.value = view.id;
  startedFrom.value = template ? 'the organization template' : '';
}

// The starting-point chips on a brand-new view: swap what it was seeded with.
function startFrom(sourceId: string): void {
  const view = workingLayout();

  if (!view) {
    return;
  }

  const source = sourceId ? views.value.find((p) => p.id === sourceId) : null;
  const layout = source && !isStockView(source) ? source : null;

  view.widgets = layout ? clone(layout.widgets) : [];
  view.gap = layout?.gap ?? DEFAULT_GAP;
  startedFrom.value = source ? source.name : '';
  selectedNodeId.value = null;
}

// Write a whole user-scope draft straight through (the view-mode actions, which have no draft).
async function persist(draft: ViewSet, activeId: string | null): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    await saveView(store, 'user', draft, userId.value, props.page);
    await fetchTemplatingConfigMaps(store);
    activeViewId.value = activeId;
    pinnedView.value = !!activeId;
    syncActiveView();
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

async function duplicateView(): Promise<void> {
  const source = activeView.value;

  if (!source) {
    return;
  }

  const draft: ViewSet = scopes.value.user ? clone(scopes.value.user) : { views: [] };
  const copy: View = {
    ...clone(source), id: newId('view'), name: `${ source.name } copy`
  };

  delete copy.org;
  delete copy.from;
  draft.views.push(copy);

  await persist(draft, copy.id);
}

// Your default is the view the Home opens on. Setting it on a published view forks that view into
// your account first, for the same reason editing does.
async function setDefaultView(): Promise<void> {
  const active = activeView.value;

  if (!active) {
    return;
  }

  const draft: ViewSet = scopes.value.user ? clone(scopes.value.user) : { views: [] };
  let id = active.id;

  if (active.org) {
    const fork: View = {
      ...clone(active), id: newId('view'), from: active.id
    };

    delete fork.org;
    draft.views.push(fork);
    id = fork.id;
  }

  draft.defaultViewId = id;
  await persist(draft, id);
}

/**
 * After publishing, YOUR copy becomes a fork of the view you just published.
 *
 * Without this the bar would show the same view twice — once as yours, once as the organization's —
 * which is not two views, it is one view and its shadow.
 */
async function linkToPublished(source: View, publishedId: string): Promise<void> {
  if (source.org || source.from === publishedId) {
    return;
  }

  if (editing.value) {
    const view = workingView();

    if (view) {
      view.from = publishedId;
    }

    return;
  }

  const draft = scopes.value.user ? clone(scopes.value.user) : null;
  const mine = draft?.views.find((p) => p.id === source.id);

  if (draft && mine) {
    mine.from = publishedId;
    await saveView(store, 'user', draft, userId.value, props.page);
  }
}

// Publish the view to everyone. It joins the organization's scope, which is the only thing on this
// page that is not personal — so it asks first.
async function publishView(): Promise<void> {
  const source = editing.value ? workingView() : activeView.value;

  if (!source || !await confirm({
    title:     'Publish to the organization?',
    body:      `“${ source.name }” becomes an organization template: everyone sees it on their ${ props.title }, and can fork their own copy of it.`,
    applyMode: 'apply',
  })) {
    return;
  }

  const org: ViewSet = scopes.value.global ? clone(scopes.value.global) : { views: [] };
  const published: View = { ...clone(source), id: source.from || source.id };

  delete published.org;
  delete published.from;

  const at = org.views.findIndex((p) => p.id === published.id || p.name === published.name);

  if (at >= 0) {
    org.views.splice(at, 1, published);
  } else {
    org.views.push(published);
  }

  saving.value = true;
  error.value = '';

  try {
    await saveView(store, 'global', org, userId.value, props.page);
    await linkToPublished(source, published.id);
    await fetchTemplatingConfigMaps(store);
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

// Take a view back out of the organization scope. Any personal fork of it stays, and simply stops
// being a fork: its `from` now points at nothing, which reads as a plain personal view.
async function unpublishView(active: View): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    const org: ViewSet = scopes.value.global ? clone(scopes.value.global) : { views: [] };

    org.views = org.views.filter((p) => p.id !== active.id);
    await saveView(store, 'global', org.views.length ? org : null, userId.value, props.page);
    await fetchTemplatingConfigMaps(store);
    activeViewId.value = null;
    pinnedView.value = false;
    syncActiveView();
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

async function deleteView(): Promise<void> {
  const active = activeView.value;

  if (!active) {
    return;
  }

  // A published view is shared, so it asks for more than a personal one does. Whether the delete is
  // ALLOWED is not decided here: publishing writes the same ConfigMap with no check of its own, so a
  // check here would only be a suggestion. The write goes to the API and its RBAC answers — a user
  // who may not remove it gets that back as the error below.
  const ask = active.org ? {
    title:     'Unpublish this view?',
    body:      `“${ active.name }” is published for the organization, so this removes it for everyone. Personal copies of it are kept.`,
    applyMode: 'remove',
  } : {
    title:     'Delete this view?',
    body:      `“${ active.name }” is removed from your ${ props.title }.`,
    applyMode: 'delete',
  };

  if (!await confirm({ ...ask, actionColor: 'bg-error role-primary' })) {
    return;
  }

  if (active.org) {
    await unpublishView(active);

    return;
  }

  if (editing.value && working.value) {
    working.value.views = working.value.views.filter((p) => p.id !== active.id);
    activeViewId.value = null;
    pinnedView.value = false;
    await save();

    return;
  }

  const draft: ViewSet = scopes.value.user ? clone(scopes.value.user) : { views: [] };

  draft.views = draft.views.filter((p) => p.id !== active.id);
  await persist(draft, null);
}

// ---- grid mutations (draft only) ----------------------------------------------------------------------

// Every change to the grid goes through here: it replaces the active view's widget list with a new
// one, so a mutation is always a pure list operation over a draft.
function mutate(fn: (widgets: WidgetNode[]) => WidgetNode[]): void {
  const view = workingLayout();

  if (view) {
    view.widgets = fn(view.widgets);
  }
}

/** Change the selected widget, if there is one. */
function updateSelected(fn: (w: WidgetNode) => WidgetNode): void {
  const id = selectedNodeId.value;

  if (id) {
    mutate((list) => updateWidget(list, id, fn));
  }
}

function selectNode(id: string | null): void {
  selectedNodeId.value = id;
}

function addFromCatalog(entry: CatalogEntry | null, index?: number): void {
  if (!entry) {
    return;
  }

  const node = newWidgetNode(entry.spec, { colSpan: entry.span });

  mutate((list) => insertWidget(list, node, index));
  selectedNodeId.value = node.id;
}

function onCatalogDragStart(entry: CatalogEntry, ev: DragEvent): void {
  ui.dragEntry = entry;
  ui.dragLabel = entry.name;

  if (ev?.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'copy';
    ev.dataTransfer.setData('text/plain', entry.id);
  }
}

function onCatalogDragEnd(): void {
  ui.dragEntry = null;
  ui.dragLabel = '';
}

// A drop on the grid: a catalog entry becomes a new widget there, a widget already on it moves there.
function dropAt(index: number): void {
  const entry = ui.dragEntry;
  const id = ui.dragId;

  ui.dragId = null;
  ui.dragEntry = null;
  ui.dragLabel = '';

  if (entry) {
    addFromCatalog(entry, index);

    return;
  }

  if (!id) {
    return;
  }

  mutate((list) => moveWidgetTo(list, id, index));
  selectedNodeId.value = id;
}

function setColSpan(id: string, span: number): void {
  mutate((list) => setSpan(list, id, span));
}

function setSelectedWidth(span: number): void {
  if (selectedNodeId.value) {
    setColSpan(selectedNodeId.value, span);
  }
}

function setSelectedHeight(preset: string): void {
  updateSelected((w) => ({ ...w, height: heightForPreset(preset, gap.value) }));
}

function setSelectedSpacing(presetId: string): void {
  const preset = SPACING_PRESETS.find((p) => p.id === presetId);

  if (preset) {
    updateSelected((w) => ({
      ...w,
      padding: {
        top: preset.padding, right: preset.padding, bottom: preset.padding, left: preset.padding
      },
    }));
  }
}

// Advanced: one side of the margin or the padding, in whole pixels.
function setNodeBox(box: 'margin' | 'padding', side: keyof Sides, value: string): void {
  const px = Math.max(0, Math.round(Number(value) || 0));

  updateSelected((w) => ({ ...w, [box]: { ...w[box], [side]: px } }));
}

function setGap(value: string): void {
  const view = workingLayout();

  if (view) {
    view.gap = Math.max(0, Math.min(64, Math.round(Number(value) || 0)));
  }
}

function setPagePadding(value: string): void {
  const view = workingLayout();

  if (view) {
    view.pad = Math.max(0, Math.min(96, Math.round(Number(value) || 0)));
  }
}

function removeNode(id: string): void {
  mutate((list) => removeWidget(list, id));
  if (selectedNodeId.value === id) {
    selectedNodeId.value = null;
  }
  if (settingsNodeId.value === id) {
    settingsNodeId.value = null;
  }
}

// ---- widget settings ---------------------------------------------------------------------------------

function closeSettings(): void {
  settingsNodeId.value = null;
  settingsAnchor.value = null;
}

function applySettings(spec: WidgetSpec): void {
  const id = settingsNodeId.value;

  closeSettings();

  if (id) {
    mutate((list) => updateWidget(list, id, (w) => ({ ...w, widget: spec })));
  }
}

function removeConfigured(): void {
  const id = settingsNodeId.value;

  closeSettings();
  if (id) {
    removeNode(id);
  }
}

// ---- wiring -------------------------------------------------------------------------------------------

// What the grid and its widgets can ask of this page, so neither has to re-emit up a chain.
provide(VIEW_EDITOR, {
  select:    selectNode,
  move:      (id, delta) => mutate((list) => moveWidget(list, id, delta)),
  remove:    removeNode,
  configure: (id, anchor) => {
    settingsAnchor.value = anchor;
    settingsNodeId.value = id;
  },
  beginDrag: (id) => {
    ui.dragId = id;
  },
  endDrag: () => {
    ui.dragId = null;
  },
  dropAt,
  setColSpan,
  ui,
});

// The bar renders in both layouts, so what it is given is written once.
const barProps = computed(() => ({
  views:       views.value,
  activeId:    activeViewId.value,
  editing:     editing.value,
  isNew:       isNewView.value,
  defaultId:   defaultViewId.value,
  dirty:       dirty.value,
  saving:      saving.value,
  startedFrom: startedFrom.value,
}));

const barListeners = {
  select:         setActiveView,
  edit:           () => enterEdit(),
  cancel:         cancelEdit,
  save:           () => save(),
  'save-as-new':  saveAsNewView,
  rename:         renameView,
  'rename-start': startRename,
  'new-view':     newView,
  duplicate:      duplicateView,
  'set-default':  setDefaultView,
  publish:        publishView,
  delete:         deleteView,
};
</script>

<template>
  <!-- The stock page, as Rancher renders it: the bar, then the real page with nothing around
     it. See showsStockPage. -->
  <template v-if="showsStockPage">
    <ViewBar
      v-if="templatingEnabled"
      ref="bar"
      :title="title"
      v-bind="barProps"
      v-on="barListeners"
    />
    <p
      v-if="error"
      class="ai-home__error"
    >
      {{ error }}
    </p>
    <component
      :is="stock"
      v-bind="$attrs"
      :class="{ 'view-host__unpadded': layout === 'home' }"
    />
  </template>

  <div
    v-else
    v-bind="$attrs"
    class="ai-home view-host__unpadded"
    :class="{ 'ai-home--editing': editing }"
  >
    <ViewBar
      v-if="loaded && templatingEnabled"
      ref="bar"
      :title="title"
      v-bind="barProps"
      v-on="barListeners"
    />

    <p
      v-if="error"
      class="ai-home__error"
    >
      {{ error }}
    </p>

    <!-- While editing the page splits: the view keeps the full width it will really have, and every
       control lives in the drawer beside it. -->
    <div class="ai-home__layout">
      <div class="ai-home__main">
        <!-- A view of widgets, or the edit surface. Outside editing, the stock page never reaches
         this branch - it renders as itself, above. -->
        <div
          v-if="loaded && templatingEnabled && activeView && (editing || hasContent)"
          class="ai-home__surface"
          :style="surfaceStyle"
        >
          <!-- Editing a STOCK view: there is nothing to edit, but the drawer is open beside it. -->
          <component
            :is="stock"
            v-if="activeIsStock"
          />
          <WidgetGrid
            v-else
            :key="activeView.id"
            :widgets="widgets"
            :editing="editing"
            :selected-id="selectedNodeId"
            :gap="gap"
          />
        </div>
        <component
          :is="stock"
          v-else-if="loaded"
        />
      </div>

      <EditViewSidebar
        v-if="editing"
        :view="activeView"
        :selected="selectedNode"
        :is-default="activeViewId === defaultViewId"
        :is-stock="activeIsStock"
        :is-new="isNewView"
        :started-from="startedFrom"
        :starting-points="startingPoints"
        @close="cancelEdit"
        @add="addFromCatalog"
        @drag-start="onCatalogDragStart"
        @drag-end="onCatalogDragEnd"
        @start-from="startFrom"
        @set-width="setSelectedWidth"
        @set-height="setSelectedHeight"
        @set-spacing="setSelectedSpacing"
        @set-box="setNodeBox"
        @set-col-span="setSelectedWidth"
        @advanced="ui.showBoxModel = $event"
        @set-gap="setGap"
        @set-page-padding="setPagePadding"
        @set-name="renameView"
        @set-default="setDefaultView"
        @publish="publishView"
        @delete="deleteView"
      />
    </div>

    <WidgetSettingsModal
      v-if="settingsNode"
      :key="settingsNode.id"
      :widget="settingsNode.widget"
      :anchor="settingsAnchor"
      @done="applySettings"
      @cancel="closeSettings"
      @remove="removeConfigured"
    />
  </div>
</template>

<style lang="scss" scoped>
// Which root takes the page padding.
//
// The router-view gives its page `class="outlet"`, and a global `.outlet` rule pads it 24px. The
// home layout takes that back with a SCOPED rule of its own - `main .outlet { padding: 0 }` in
// templates/home.vue - and a scoped rule reaches only a page that is the router-view's single root,
// which this component, two levels down and sometimes rendering two roots, never is. The default
// layout (a cluster's dashboard) has no such rule: its pages keep the 24px as their own.
//
// So, restated here, where this component's own scope attribute does reach:
//
//   the stock page         padded exactly as its layout pads it: unpadded on the Home, Rancher's
//                          own 24px on a cluster's dashboard.
//   the configurable page  never padded. The bar spans the page the same way on every tab, so it
//                          does not move when you switch from the stock tab to one of yours; the
//                          grid is inset by the view's own spacing setting (see surfaceStyle).
.view-host__unpadded {
  padding: 0;
}

.ai-home {
  &--editing {
    min-height: calc(100vh - var(--header-height, 54px));
  }

  // The bar spans the whole page — it belongs to the Home, not to the column beside the drawer —
  // and the split below it is the grid and the drawer.
  &__layout {
    display: block;
  }

  &--editing &__layout {
    align-items: flex-start;
    display:     flex;
  }

  &__main {
    min-width: 0;
  }

  &--editing &__main {
    flex: 1 1 auto;
  }

  // The space around the grid is a per-view setting (see `surfaceStyle`), applied in BOTH modes so
  // a view looks the same whether or not you are editing it.
  &__surface {
    box-sizing: border-box;
  }

  &__error {
    color:     var(--error);
    font-size: 13px;
    margin:    8px 20px 0;
  }
}
</style>
