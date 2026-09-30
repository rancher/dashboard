import { inject, type InjectionKey } from 'vue';
import type { CatalogEntry } from '../templating/widget-catalog';
import type { DropTarget } from '../templating/grid-layout';
import type { Size } from '../templating/view-model';
import type { Sides, WidgetPlace } from '../templating/types';

/**
 * What the grid and every widget on it share while a view is being edited. One reactive object,
 * owned by the Home, so a drag started on one widget lights up the drop targets everywhere else.
 */
export interface ViewEditorUi {
  /** The widget being dragged to a new place. */
  dragId: string | null;
  /** The catalog entry being dragged in from the drawer. */
  dragEntry: CatalogEntry | null;
  /** What the drop target calls the thing being dragged in ("Drop here to add a Table"). */
  dragLabel: string;
  /** The kind of whatever is being dragged, so a tab can refuse a Tabs widget before it is dropped. */
  dragKind: string;
  /** Which grid the pointer is over (see placeKey), so only that one draws where the drop lands. */
  dropPlace: string;
  /** The columns what is being dragged spans, so a grid can show where it will land at its size. */
  dragSpan: number;
  /** How far right of its left edge the dragged widget was picked up, in px; null to centre it on the pointer. */
  dragGrab: number | null;
  /** The selected widget's margin or padding just changed: that band is lit for a moment. */
  flashBox: 'margin' | 'padding' | null;
  /** Which side of that band changed; null when all four did (a spacing preset). */
  flashSide: keyof Sides | null;
}

/** One edge of a widget, moved: its right edge (span), its left edge (start column) or its bottom (height). */
export interface WidgetResize {
  span?: number;
  start?: number;
  height?: Size;
}

/** Where a widget's settings open: beside the widget, at its top-left corner. */
export interface SettingsAnchor {
  left: number;
  top: number;
}

/** What a widget on the grid can ask the Home to do. */
export interface ViewEditor {
  /** The view is being edited. A grid inside a Tabs widget reads this rather than being told. */
  readonly editing: boolean;
  /** The selected widget, wherever it is. */
  readonly selectedId: string | null;
  select(id: string | null): void;
  move(id: string, delta: number): void;
  remove(id: string): void;
  configure(id: string, anchor: SettingsAnchor | null): void;
  /** `grab`: how far right of the widget's left edge it was picked up, in px. */
  beginDrag(id: string, grab?: number): void;
  endDrag(): void;
  /** Drop what is being dragged at `target` on the list at `place` (null: the view's own). */
  dropAt(target: DropTarget, place?: WidgetPlace | null): void;
  /**
   * Resize a widget by one of its edges. Every change is measured from where the widget and its
   * neighbours were when the resize began, so dragging back puts them back.
   */
  beginResize(id: string): void;
  resize(id: string, change: WidgetResize): void;
  endResize(): void;
  ui: ViewEditorUi;
}

/** A grid's name in `ui.dropPlace`: '' for the view's own, the tab's address for one inside a Tabs widget. */
export function placeKey(place: WidgetPlace | null | undefined): string {
  return place ? `${ place.parentId }/${ place.tabId }` : '';
}

/** The key the Home provides the editor under. */
export const VIEW_EDITOR: InjectionKey<ViewEditor> = Symbol('viewEditor');

/**
 * The editor, or - for a grid rendered outside an editing Home - one that does nothing, so the grid
 * and its widgets draw the same either way.
 */
export function useViewEditor(): ViewEditor {
  return inject(VIEW_EDITOR, () => ({
    editing:     false,
    selectedId:  null,
    select:      () => undefined,
    move:        () => undefined,
    remove:      () => undefined,
    configure:   () => undefined,
    beginDrag:   () => undefined,
    endDrag:     () => undefined,
    dropAt:      () => undefined,
    beginResize: () => undefined,
    resize:      () => undefined,
    endResize:   () => undefined,
    ui:          {
      dragId: null, dragEntry: null, dragLabel: '', dragKind: '', dropPlace: '', dragSpan: 0, dragGrab: null, flashBox: null, flashSide: null
    },
  }), true);
}
