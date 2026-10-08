import {
  GRID_COLUMNS, clampSpan, eachList, atPlace, placeExists, canPlace, findWidget, placeOf
} from './view-model';
import type { WidgetNode, WidgetPlace } from './types';

// WHERE a widget sits on the grid, and the rules for moving and sizing it there.
//
// A list is still one flat, ordered run of widgets that wraps into lines - but a widget can say how
// many columns to leave empty before it (`offset`) and that it starts a line (`newLine`). Those two
// are enough to put a widget on any column of any line, so a drop lands where it was let go rather
// than packed to the left.
//
// The rules, applied the same way to a drop and to a resize:
//   - A widget sits on whole columns and never overlaps another.
//   - The widgets around one that moves keep their place: a widget lifted off a line leaves its
//     room empty, and one dropped into empty room takes it without moving anybody.
//   - When there is no empty room where it is dropped, the widgets on its line make room - the ones
//     after it shift right, then the line packs back from the right edge if it has to. A line never
//     holds more than its twelve columns: a widget that cannot fit starts a new line below instead.
//
// Every operation reads the list into LINES of widgets on absolute columns, changes those, and
// writes it back - with every line start marked, so a line no longer re-wraps when a neighbour
// changes size above it.

/** One widget on its line: the column it starts at (0-based) and how many it spans. */
interface Placed {
  node: WidgetNode;
  col: number;
  span: number;
}

/** Where a widget is drawn: its line, the column it starts at (0-based) and how many it spans. */
export interface GridCell {
  line: number;
  col: number;
  span: number;
}

/**
 * Where a drop goes. `col` is the column its left edge lands on.
 *   - `join`: onto the line that holds this widget. `at` is the column the pointer is over, which
 *     decides which side of a widget it goes when there is no empty room for it.
 *   - `before`: onto a new line of its own, just above the line that holds this widget - or below
 *     the last line when null.
 */
export type DropTarget = { col: number; join: string; at?: number } | { col: number; before: string | null };

function offsetOf(node: WidgetNode): number {
  const n = Math.round(Number(node.offset));

  return n > 0 ? n : 0;
}

/** Read a list into its lines, every widget on the column it is drawn at. */
function toLines(list: WidgetNode[]): Placed[][] {
  const lines: Placed[][] = [];
  let used = 0;

  for (const node of list || []) {
    const span = clampSpan(node.colSpan);
    const offset = Math.min(offsetOf(node), GRID_COLUMNS - span);

    if (!lines.length || node.newLine || used + offset + span > GRID_COLUMNS) {
      lines.push([]);
      used = 0;
    }

    const col = used + offset;

    lines[lines.length - 1].push({
      node, col, span
    });
    used = col + span;
  }

  return lines;
}

function place(node: WidgetNode, span: number, offset: number, newLine: boolean): WidgetNode {
  const out: WidgetNode = { ...node, colSpan: span };

  delete out.offset;
  delete out.newLine;
  if (offset > 0) {
    out.offset = offset;
  }
  if (newLine) {
    out.newLine = true;
  }

  return out;
}

/** Write lines back as a list: each widget's offset from the one before it, each line start marked. */
function fromLines(lines: Placed[][]): WidgetNode[] {
  const out: WidgetNode[] = [];

  lines.filter((line) => line.length).forEach((line, i) => {
    let end = 0;

    line.forEach((p, k) => {
      out.push(place(p.node, p.span, p.col - end, i > 0 && k === 0));
      end = p.col + p.span;
    });
  });

  return out;
}

function lineOf(lines: Placed[][], id: string | null): number {
  return id ? lines.findIndex((line) => line.some((p) => p.node.id === id)) : -1;
}

/** Where each widget of a list is drawn, by id. */
export function gridCells(list: WidgetNode[]): Map<string, GridCell> {
  const cells = new Map<string, GridCell>();

  toLines(list).forEach((line, i) => line.forEach((p) => cells.set(p.node.id, {
    line: i, col: p.col, span: p.span
  })));

  return cells;
}

/** The ids on each line of a list, in order. */
export function gridLines(list: WidgetNode[]): string[][] {
  return toLines(list).map((line) => line.map((p) => p.node.id));
}

/** Take a widget off its list, leaving its room empty: nothing else on the grid moves. */
export function liftFrom(list: WidgetNode[], id: string): WidgetNode[] {
  if (!(list || []).some((w) => w.id === id)) {
    return list || [];
  }

  return fromLines(toLines(list).map((line) => line.filter((p) => p.node.id !== id)));
}

/**
 * Fit `item` into `line` at its column, or null when the line has no room for it. Empty room is
 * taken as it is; otherwise the widgets whose middle is left of the pointer (`at`, else the item's
 * own middle) stay before it, the rest after, and they shift right - then back from the right edge
 * - only as far as they must. The pointer, not the item's middle: a wide widget's middle can never
 * get past a narrow one's, so it could not be put on the far side of it.
 */
function fitInto(line: Placed[], item: Placed, at?: number): Placed[] | null {
  const free = line.every((p) => p.col + p.span <= item.col || p.col >= item.col + item.span);

  if (free) {
    return [...line, item].sort((a, b) => a.col - b.col);
  }

  if (line.reduce((sum, p) => sum + p.span, item.span) > GRID_COLUMNS) {
    return null;
  }

  // Level middles: held against the right edge it goes last, anywhere else first.
  const middle = at ?? item.col + (item.span / 2);
  const atEdge = item.col + item.span === GRID_COLUMNS;
  const goesBefore = (p: Placed) => p.col + (p.span / 2) < middle || (atEdge && p.col + (p.span / 2) === middle);
  const seq = [
    ...line.filter(goesBefore),
    item,
    ...line.filter((p) => !goesBefore(p)),
  ].map((p) => ({ ...p }));

  // Right, as far as the one before needs...
  let end = 0;

  for (const p of seq) {
    p.col = Math.max(p.col, end);
    end = p.col + p.span;
  }
  // ...and back from the edge, as far as the one after needs.
  let start = GRID_COLUMNS;

  for (let i = seq.length - 1; i >= 0; i--) {
    seq[i].col = Math.min(seq[i].col, start - seq[i].span);
    start = seq[i].col;
  }

  return seq;
}

/** The empty column runs of a line, as [from, to). */
function emptyRuns(line: Placed[]): [number, number][] {
  const runs: [number, number][] = [];
  let end = 0;

  for (const p of line) {
    if (p.col > end) {
      runs.push([end, p.col]);
    }
    end = p.col + p.span;
  }
  if (end < GRID_COLUMNS) {
    runs.push([end, GRID_COLUMNS]);
  }

  return runs;
}

/** How a drop is taken. */
export interface DropOptions {
  /**
   * A NEW widget: dropped into empty room narrower than its width, it narrows to fill that room
   * rather than pushing the widgets beside it along.
   */
  fit?: boolean;
}

/**
 * Put a widget - not already in the list - where `target` says, by the rules above. Let go over
 * empty room it has space in, it stays inside that room.
 */
export function dropInto(list: WidgetNode[], node: WidgetNode, target: DropTarget, { fit = false }: DropOptions = {}): WidgetNode[] {
  const span = clampSpan(node.colSpan);
  const item: Placed = {
    node, span, col: Math.max(0, Math.min(GRID_COLUMNS - span, Math.round(target.col) || 0))
  };
  const lines = toLines(list);

  if ('join' in target) {
    const at = lineOf(lines, target.join);

    if (at >= 0) {
      const pointer = target.at ?? item.col + (item.span / 2);
      const room = emptyRuns(lines[at]).find(([from, to]) => pointer >= from && pointer < to);

      if (room && room[1] - room[0] >= item.span) {
        item.col = Math.max(room[0], Math.min(room[1] - item.span, item.col));
      } else if (room && fit) {
        item.col = room[0];
        item.span = room[1] - room[0];
      }

      const fitted = fitInto(lines[at], item, target.at);

      if (fitted) {
        lines[at] = fitted;
      } else {
        lines.splice(at + 1, 0, [item]);
      }

      return fromLines(lines);
    }
  }

  const before = 'before' in target ? lineOf(lines, target.before) : -1;

  lines.splice(before >= 0 ? before : lines.length, 0, [item]);

  return fromLines(lines);
}

/**
 * Resize a widget to `span` columns.
 *   - `stop`, for dragging its edge: the widgets after it on its line shift right as it grows, and
 *     it stops growing when they reach the edge.
 *   - `wrap`, for picking a width: it takes the width it is given - moving left when it has to - and
 *     whatever no longer fits beside it moves onto a line of its own just below.
 */
export function resizeIn(list: WidgetNode[], id: string, span: number, mode: 'stop' | 'wrap'): WidgetNode[] {
  const lines = toLines(list);
  const at = lineOf(lines, id);

  if (at < 0) {
    return list;
  }

  const line = lines[at].map((p) => ({ ...p }));
  const k = line.findIndex((p) => p.node.id === id);
  const me = line[k];
  const after = line.slice(k + 1);

  if (mode === 'stop') {
    const room = GRID_COLUMNS - me.col - after.reduce((sum, p) => sum + p.span, 0);

    me.span = Math.max(1, Math.min(room, clampSpan(span)));
    let end = me.col + me.span;

    for (const p of after) {
      p.col = Math.max(p.col, end);
      end = p.col + p.span;
    }
    lines[at] = line;

    return fromLines(lines);
  }

  me.span = clampSpan(span);
  me.col = Math.min(me.col, GRID_COLUMNS - me.span);

  const stays: Placed[] = [];
  const moves: Placed[] = [];
  let end = me.col + me.span;

  line.slice(0, k).forEach((p) => (p.col + p.span <= me.col ? stays : moves).push(p));
  stays.push(me);
  for (const p of after) {
    const col = Math.max(p.col, end);

    if (col + p.span <= GRID_COLUMNS) {
      stays.push({ ...p, col });
      end = col + p.span;
    } else {
      moves.push(p);
    }
  }

  lines.splice(at, 1, stays, ...(moves.length ? [moves] : []));

  return fromLines(lines);
}

/** Move a widget's LEFT edge to column `col`, keeping its right edge: it cannot cross the one before it. */
export function resizeStartIn(list: WidgetNode[], id: string, col: number): WidgetNode[] {
  const lines = toLines(list);
  const at = lineOf(lines, id);

  if (at < 0) {
    return list;
  }

  const line = lines[at].map((p) => ({ ...p }));
  const k = line.findIndex((p) => p.node.id === id);
  const me = line[k];
  const floor = k > 0 ? line[k - 1].col + line[k - 1].span : 0;
  const right = me.col + me.span;

  me.col = Math.max(floor, Math.min(right - 1, Math.round(col)));
  me.span = right - me.col;
  lines[at] = line;

  return fromLines(lines);
}

// ---- the same, for a widget wherever it is: the view's own list or a tab of a Tabs widget ----

function inItsList(widgets: WidgetNode[], id: string, fn: (list: WidgetNode[]) => WidgetNode[]): WidgetNode[] {
  return eachList(widgets, (list) => (list.some((w) => w.id === id) ? fn(list) : list));
}

/** Remove a widget, leaving its room empty. */
export function liftWidget(widgets: WidgetNode[], id: string): WidgetNode[] {
  return inItsList(widgets, id, (list) => liftFrom(list, id));
}

/** Drop a NEW widget at `target` on the list at `place`. */
export function dropWidget(widgets: WidgetNode[], node: WidgetNode, target: DropTarget, place: WidgetPlace | null = null, options: DropOptions = { fit: true }): WidgetNode[] {
  if (!canPlace(node.widget.kind, place) || !placeExists(widgets, place)) {
    return [...(widgets || [])];
  }

  return atPlace(widgets, place, (list) => dropInto(list, node, target, options));
}

/** Move a widget to `target` on the list at `place` - its own list, or another one. */
export function moveWidgetToCell(widgets: WidgetNode[], id: string, target: DropTarget, place: WidgetPlace | null = null): WidgetNode[] {
  const node = findWidget(widgets, id);

  if (!node || placeOf(widgets, id) === undefined || !canPlace(node.widget.kind, place) || !placeExists(widgets, place)) {
    return [...(widgets || [])];
  }

  return dropWidget(liftWidget(widgets, id), node, target, place, { fit: false });
}

/** Resize a widget to `span` columns (see resizeIn). */
export function resizeWidget(widgets: WidgetNode[], id: string, span: number, mode: 'stop' | 'wrap'): WidgetNode[] {
  return inItsList(widgets, id, (list) => resizeIn(list, id, span, mode));
}

/** Move a widget's left edge to column `col` (see resizeStartIn). */
export function resizeWidgetStart(widgets: WidgetNode[], id: string, col: number): WidgetNode[] {
  return inItsList(widgets, id, (list) => resizeStartIn(list, id, col));
}
