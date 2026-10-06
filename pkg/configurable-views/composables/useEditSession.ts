import { computed } from 'vue';
import type { Store } from 'vuex';
import type { I18n } from '@shell/composables/useI18n';
import { saveView, fetchTemplatingConfigMaps, type PageKey } from '../templating/template-engine';
import { DEFAULT_GAP, newId, newLayoutView, isStockView } from '../templating/view-model';
import { stockWidgets, stockView } from '../templating/stock-layouts';
import { clone, type ViewSetState } from './useViewSet';
import type { ConfirmOptions } from './useConfirm';
import type { LayoutView, View, ViewSet } from '../templating/types';

// A starting point that is no saved view: Rancher's own page, rebuilt from widgets.
const STOCK_START = 'stock-page';

/**
 * Editing a page's views: the DRAFT, and the way in and out of it.
 *
 * Edits are a draft - nothing is written until Save. The draft is always YOUR views: editing a
 * published view forks it into your account first, so an edit can never change what the organization
 * sees by accident.
 */
export function useEditSession(
  vs: ViewSetState,
  props: { page: PageKey; title: string; firstViewName: string },
  store: Store<unknown>,
  t: I18n['t'],
  confirm: (options: ConfirmOptions) => Promise<boolean>,
) {
  const {
    editing, working, savedBaseline, activeViewId, pinnedView, selectedNodeId, newViewId, startedFrom,
    settingsNodeId, saving, drawerOpen, error, userId, orgViews, orgTemplate, activeView, views, dirty,
  } = vs;

  // With nothing of yours to edit - no views on this page, and the one showing is Rancher's own or
  // the organization's - a first view is started for you. Not when a new view is about to be made
  // anyway: that is the view you are starting, and seeding one as well left an empty extra behind.
  function enterEdit({ seedFirst = true } = {}): void {
    error.value = '';

    const draft = vs.userDraft();
    const active = activeView.value;

    working.value = draft;

    if (active?.org) {
      const fork: View = {
        ...clone(active), id: newId('view'), from: active.id
      };

      delete fork.org;
      draft.views.push(fork);
      vs.setActiveView(fork.id);
    } else if (seedFirst && !draft.views.length) {
      const first = newLayoutView(props.firstViewName);

      draft.views.push(first);
      vs.setActiveView(first.id);
    }

    savedBaseline.value = JSON.stringify(draft);
    editing.value = true;
    drawerOpen.value = true;
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
    vs.syncActiveView();
  }

  async function cancelEdit(): Promise<void> {
    if (dirty.value && !await confirm({
      title:  t('configurableViews.page.discard.title'),
      body:   t('configurableViews.page.discard.body'),
      action: t('configurableViews.page.discard.action'),
      danger: true,
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
    const view = vs.workingView();

    if (!draft || !view || savedBaseline.value === null) {
      return;
    }

    const copy: View = {
      ...clone(view), id: newId('view'), name: t('configurableViews.page.copyName', { name: view.name }, true)
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
    vs.setActiveView(copy.id);

    await save();
  }

  // The name typed into the bar while editing.
  function renameView(name: string): void {
    const view = vs.workingView();

    if (view) {
      view.name = name;
    }
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
      ...clone(template), id: newId('view'), name: t('configurableViews.page.untitled')
    } : newLayoutView(t('configurableViews.page.untitled'));

    delete view.org;
    delete view.from;

    draft.views.push(view);
    vs.setActiveView(view.id);
    newViewId.value = view.id;
    startedFrom.value = template ? t('configurableViews.page.orgTemplate') : '';
  }

  const stockStartLabel = computed(() => t('configurableViews.sidebar.startStock', { page: props.title }));

  // The starting points a brand-new view offers: empty, Rancher's own page as widgets, or a copy of
  // any view you already have.
  const startingPoints = computed(() => [
    { id: STOCK_START, label: stockStartLabel.value },
    ...views.value
      .filter((p) => p.id !== newViewId.value && !isStockView(p))
      .map((p) => ({ id: p.id, label: t('configurableViews.page.copyOf', { name: p.name }) })),
  ]);

  // The starting-point chips on a brand-new view: swap what it was seeded with.
  function startFrom(sourceId: string): void {
    const view = vs.workingLayout();

    if (!view) {
      return;
    }

    if (sourceId === STOCK_START) {
      view.widgets = stockWidgets(props.page, t);
      Object.assign(view, stockView(props.page));
      startedFrom.value = stockStartLabel.value;

      return;
    }

    const source = sourceId ? views.value.find((p) => p.id === sourceId) : null;
    const layout = source && !isStockView(source) ? source : null;

    view.widgets = layout ? clone(layout.widgets) : [];
    view.gap = layout?.gap ?? DEFAULT_GAP;
    startedFrom.value = source ? source.name : '';
    selectedNodeId.value = null;
  }

  return {
    enterEdit,
    leaveEdit,
    cancelEdit,
    save,
    saveAsNewView,
    renameView,
    newView,
    startingPoints,
    startFrom,
  };
}
