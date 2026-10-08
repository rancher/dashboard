import {
  computed, onBeforeUnmount, provide, reactive, ref, type CSSProperties
} from 'vue';
import type { I18n } from '@shell/composables/useI18n';
import { VIEW_EDITOR, type ViewEditorUi, type WidgetResize } from './viewEditor';
import {
  DEFAULT_PAGE_PADDING, newWidgetNode, isStockView, findWidget, insertWidget, moveWidget, updateWidget, heightForPreset,
  SPACING_PRESETS
} from '../templating/view-model';
import {
  dropWidget, liftWidget, moveWidgetToCell, resizeWidget, resizeWidgetStart, type DropTarget
} from '../templating/grid-layout';
import type { CatalogEntry } from '../templating/widget-catalog';
import type { ViewSetState } from './useViewSet';
import type { WidgetNode, WidgetPlace, WidgetSpec } from '../templating/types';

/**
 * The spacing just changed in the drawer, lit on the page for a moment so you see what it moves:
 * the view's gap or padding, or the selected widget's padding.
 */
type Spacing = 'gap' | 'pad' | 'padding';

const FLASH_MS = 1000;

/**
 * Editing the open view's GRID, in the draft: dropping widgets on it, moving and resizing them, their
 * spacing and settings. Every change is a pure list operation (see grid-layout) over the draft.
 *
 * Provides the editor the grid and its widgets ask of (VIEW_EDITOR), so neither has to re-emit up a
 * chain.
 */
export function useGridEditing(vs: ViewSetState, t: I18n['t']) {
  const {
    editing, selectedNodeId, settingsNodeId, settingsAnchor, drawerOpen, activeView, widgets, gap,
  } = vs;

  // Shared, reactive editor UI state: what is being dragged — a widget already on the grid, or a
  // catalog entry on its way in.
  const ui = reactive<ViewEditorUi>({
    dragId: null, dragEntry: null, dragLabel: '', dragKind: '', dropPlace: '', dragSpan: 0, dragGrab: null, flashBox: null
  });

  // The widget the Layout tab acts on, and the one whose settings are open.
  const selectedNode = computed(() => findWidget(widgets.value, selectedNodeId.value));
  const settingsNode = computed(() => findWidget(widgets.value, settingsNodeId.value));

  // ---- the spacing, lit as it changes ----

  const flash = ref<Spacing | null>(null);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;

  // Only what is changing is lit: a new change puts out the last one.
  function flashSpacing(which: Spacing): void {
    clearTimeout(flashTimer);
    flash.value = which;
    ui.flashBox = which === 'padding' ? which : null;
    flashTimer = setTimeout(() => {
      flash.value = null;
      ui.flashBox = null;
    }, FLASH_MS);
  }

  onBeforeUnmount(() => clearTimeout(flashTimer));

  // The space between the grid and the edges of the page — a view-level setting like the gap.
  const surfaceStyle = computed<CSSProperties>(() => {
    const pad = activeView.value && !isStockView(activeView.value) ? activeView.value.pad : DEFAULT_PAGE_PADDING;

    return {
      padding:   `${ pad }px`,
      // The padding ring itself, painted as an inset shadow exactly as thick as the padding
      boxShadow: flash.value === 'pad' ? `inset 0 0 0 ${ pad }px color-mix(in srgb, var(--primary) 25%, transparent)` : undefined,
    };
  });

  // ---- grid mutations (draft only) ----

  // Every change to the grid goes through here: it replaces the active view's widget list with a new
  // one, so a mutation is always a pure list operation over a draft.
  function mutate(fn: (widgets: WidgetNode[]) => WidgetNode[]): void {
    const view = vs.workingLayout();

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

  // Picking a widget brings the drawer back: its Layout tab is where a widget is set.
  function selectNode(id: string | null): void {
    selectedNodeId.value = id;

    if (id) {
      drawerOpen.value = true;
    }
  }

  // A click adds to the end of the view; a drop puts it where it was let go.
  function addFromCatalog(entry: CatalogEntry | null, target?: DropTarget, place: WidgetPlace | null = null): void {
    if (!entry) {
      return;
    }

    // A Tabs widget's first tabs are named in the reader's language - the names are then the view's own.
    const spec = entry.spec.tabs ? {
      ...entry.spec,
      tabs: entry.spec.tabs.map((tab, i) => ({ ...tab, name: t('configurableViews.widgetSettings.newTab', { index: i + 1 }) })),
    } : entry.spec;
    const node = newWidgetNode(spec, { colSpan: entry.span });

    mutate((list) => (target ? dropWidget(list, node, target, place) : insertWidget(list, node)));
    selectedNodeId.value = node.id;
  }

  function onCatalogDragStart(entry: CatalogEntry, ev: DragEvent): void {
    ui.dragEntry = entry;
    ui.dragLabel = t(entry.labelKey);
    ui.dragKind = entry.spec.kind;
    ui.dragSpan = entry.span;
    ui.dragGrab = null;
    ui.dropPlace = '';

    if (ev?.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'copy';
      ev.dataTransfer.setData('text/plain', entry.id);
    }
  }

  function onCatalogDragEnd(): void {
    ui.dragEntry = null;
    ui.dragLabel = '';
    ui.dragKind = '';
  }

  // A drop on a grid - the view's, or a tab's (`place`): a catalog entry becomes a new widget there, a
  // widget already on the view moves there. Either lands where it was let go (see grid-layout).
  function dropAt(target: DropTarget, place: WidgetPlace | null = null): void {
    const entry = ui.dragEntry;
    const id = ui.dragId;

    ui.dragId = null;
    ui.dragEntry = null;
    ui.dragLabel = '';
    ui.dragKind = '';
    ui.dropPlace = '';

    if (entry) {
      addFromCatalog(entry, target, place);

      return;
    }

    if (!id) {
      return;
    }

    mutate((list) => moveWidgetToCell(list, id, target, place));
    selectedNodeId.value = id;
  }

  // Resizing by an edge: the widgets as they were when it began, so each step is measured from there
  // and dragging back puts the neighbours it pushed back where they were.
  let resizeBase: WidgetNode[] | null = null;

  function beginResize(id: string): void {
    resizeBase = vs.workingLayout()?.widgets || null;
    selectNode(id);
  }

  function resize(id: string, change: WidgetResize): void {
    const base = resizeBase;

    mutate((list) => {
      let out = base || list;

      if (change.span !== undefined) {
        out = resizeWidget(out, id, change.span, 'stop');
      }
      if (change.start !== undefined) {
        out = resizeWidgetStart(out, id, change.start);
      }
      if (change.height !== undefined) {
        const height = change.height;

        out = updateWidget(out, id, (w) => ({ ...w, height }));
      }

      return out;
    });
  }

  function endResize(): void {
    resizeBase = null;
  }

  // A width picked in the drawer is taken as given: what no longer fits beside it moves to a line below.
  function setSelectedWidth(span: number): void {
    const id = selectedNodeId.value;

    if (id) {
      mutate((list) => resizeWidget(list, id, span, 'wrap'));
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
      flashSpacing('padding');
    }
  }

  function setGap(value: string): void {
    const view = vs.workingLayout();

    if (view) {
      view.gap = Math.max(0, Math.min(64, Math.round(Number(value) || 0)));
      flashSpacing('gap');
    }
  }

  function setPagePadding(value: string): void {
    const view = vs.workingLayout();

    if (view) {
      view.pad = Math.max(0, Math.min(96, Math.round(Number(value) || 0)));
      flashSpacing('pad');
    }
  }

  // Its room is left empty: the widgets around it stay where they were put.
  function removeNode(id: string): void {
    mutate((list) => liftWidget(list, id));
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null;
    }
    if (settingsNodeId.value === id) {
      settingsNodeId.value = null;
    }
  }

  // ---- widget settings ----

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

  // What the grid and its widgets can ask of this page, so neither has to re-emit up a chain.
  provide(VIEW_EDITOR, {
    get editing() {
      return editing.value;
    },
    get selectedId() {
      return selectedNodeId.value;
    },
    select:    selectNode,
    move:      (id, delta) => mutate((list) => moveWidget(list, id, delta)),
    remove:    removeNode,
    configure: (id, anchor) => {
      settingsAnchor.value = anchor;
      settingsNodeId.value = id;
    },
    beginDrag: (id, grab) => {
      const node = findWidget(widgets.value, id);

      ui.dragId = id;
      ui.dragKind = node?.widget.kind || '';
      ui.dragSpan = node?.colSpan || 0;
      ui.dragGrab = grab ?? null;
      ui.dropPlace = '';
    },
    endDrag: () => {
      ui.dragId = null;
      ui.dragKind = '';
    },
    dropAt,
    beginResize,
    resize,
    endResize,
    ui,
  });

  return {
    selectedNode,
    settingsNode,
    flash,
    surfaceStyle,
    addFromCatalog,
    onCatalogDragStart,
    onCatalogDragEnd,
    setSelectedWidth,
    setSelectedHeight,
    setSelectedSpacing,
    setGap,
    setPagePadding,
    closeSettings,
    applySettings,
    removeConfigured,
  };
}
