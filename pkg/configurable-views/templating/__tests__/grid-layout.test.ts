import {
  dropInto, gridCells, gridLines, liftFrom, liftWidget, moveWidgetToCell, resizeIn, resizeStartIn, resizeWidget
} from '@pkg/configurable-views/templating/grid-layout';
import { findWidget, migrateViewSet, newWidgetNode } from '@pkg/configurable-views/templating/view-model';
import type { WidgetNode } from '@pkg/configurable-views/templating/types';

const w = (id: string, colSpan: number, extra: Partial<WidgetNode> = {}): WidgetNode => ({ ...newWidgetNode('links', { id, colSpan }), ...extra });

// Where each widget is drawn, as "id@col+span" per line.
const drawn = (list: WidgetNode[]) => {
  const cells = gridCells(list);

  return gridLines(list).map((line) => line.map((id) => `${ id }@${ cells.get(id)?.col }+${ cells.get(id)?.span }`).join(' '));
};

describe('the grid layout', () => {
  it('wraps a plain list the way it always did', () => {
    expect(drawn([w('a', 6), w('b', 6), w('c', 4), w('d', 12)])).toStrictEqual(['a@0+6 b@6+6', 'c@0+4', 'd@0+12']);
  });

  it('leaves the offset empty before a widget, and starts a line where asked', () => {
    expect(drawn([w('a', 4, { offset: 2 }), w('b', 4, { offset: 1 }), w('c', 2, { newLine: true, offset: 10 })])).toStrictEqual(['a@2+4 b@7+4', 'c@10+2']);
  });

  it('wraps a widget whose offset no longer fits, and keeps a stored offset on the line', () => {
    expect(drawn([w('a', 8), w('b', 4, { offset: 3 })])).toStrictEqual(['a@0+8', 'b@3+4']);
    expect(drawn([w('a', 4, { offset: 11 })])).toStrictEqual(['a@8+4']);
  });

  it('reads stored offsets and line starts, and leaves them out when they say nothing', () => {
    const set = migrateViewSet({
      views: [{
        id:      'v',
        name:    'V',
        widgets: [
          {
            type: 'widget', widget: { kind: 'links' }, id: 'a', colSpan: 4, offset: 3
          },
          {
            type: 'widget', widget: { kind: 'links' }, id: 'b', colSpan: 4, newLine: true
          },
          {
            type: 'widget', widget: { kind: 'links' }, id: 'c', colSpan: 4, offset: 0, newLine: false
          },
        ]
      }]
    });
    const [a, b, c] = (set.views[0] as { widgets: WidgetNode[] }).widgets;

    expect([a.offset, a.newLine, b.newLine, 'offset' in c, 'newLine' in c]).toStrictEqual([3, undefined, true, false, false]);
  });

  describe('lifting a widget off', () => {
    it('leaves its room empty, so the widget after it stays put', () => {
      expect(drawn(liftFrom([w('a', 4), w('b', 4), w('c', 4)], 'a'))).toStrictEqual(['b@4+4 c@8+4']);
    });

    it('keeps the next line where it is when a line empties', () => {
      expect(drawn(liftFrom([w('a', 12), w('b', 6), w('c', 6)], 'a'))).toStrictEqual(['b@0+6 c@6+6']);
    });

    it('does not pull a wrapped line up into the room it leaves', () => {
      expect(drawn(liftFrom([w('a', 6), w('b', 6), w('c', 6)], 'b'))).toStrictEqual(['a@0+6', 'c@0+6']);
    });
  });

  describe('dropping', () => {
    const line = () => [w('a', 4), w('b', 4, { offset: 4 })]; // a@0, room 4..7, b@8

    it('takes empty room where it is let go, moving nobody', () => {
      expect(drawn(dropInto(line(), w('n', 3), { col: 5, join: 'a' }))).toStrictEqual(['a@0+4 n@5+3 b@8+4']);
    });

    it('never lets a widget run past the right edge', () => {
      expect(drawn(dropInto([w('a', 4)], w('n', 4), { col: 11, join: 'a' }))).toStrictEqual(['a@0+4 n@8+4']);
    });

    it('makes room by shifting the widgets after it right', () => {
      expect(drawn(dropInto([w('a', 4), w('b', 4)], w('n', 4), { col: 2, join: 'a' }))).toStrictEqual(['a@0+4 n@4+4 b@8+4']);
    });

    it('packs back from the right edge when shifting right is not enough', () => {
      expect(drawn(dropInto([w('a', 4), w('b', 4, { offset: 4 })], w('n', 4), { col: 8, join: 'a' }))).toStrictEqual(['a@0+4 b@4+4 n@8+4']);
    });

    it('goes before a widget when its middle is left of that widget\'s middle', () => {
      expect(drawn(dropInto([w('a', 4), w('b', 4)], w('n', 4), { col: 0, join: 'a' }))).toStrictEqual(['n@0+4 a@4+4 b@8+4']);
    });

    it('goes by the pointer, so a wide widget can be put past a narrow one', () => {
      // A wide widget's middle can never pass a narrow one's: the pointer can
      expect(drawn(dropInto([w('s', 4, { offset: 8 })], w('t', 8), {
        col: 4, join: 's', at: 11
      }))).toStrictEqual(['s@0+4 t@4+8']);
      expect(drawn(dropInto([w('s', 4)], w('t', 8), {
        col: 0, join: 's', at: 1
      }))).toStrictEqual(['t@0+8 s@8+4']);
    });

    it('stays inside the empty room it is let go over, when it fits there', () => {
      // Picked up so its left edge is over a, but let go over the room from 4
      expect(drawn(dropInto([w('a', 4)], w('n', 4), {
        col: 2, join: 'a', at: 6
      }))).toStrictEqual(['a@0+4 n@4+4']);
    });

    it('narrows a NEW widget to the empty room it is let go in, and never one being moved', () => {
      const line = () => [w('a', 4), w('b', 5, { offset: 3 })]; // room 4..6

      expect(drawn(dropInto(line(), w('n', 6), {
        col: 3, join: 'a', at: 5
      }, { fit: true }))).toStrictEqual(['a@0+4 n@4+3 b@7+5']);
      expect(drawn(dropInto(line(), w('n', 6), {
        col: 3, join: 'a', at: 5
      }))).toStrictEqual(['a@0+4 b@7+5', 'n@3+6']);
      expect(drawn(moveWidgetToCell([...line(), w('n', 6)], 'n', {
        col: 3, join: 'a', at: 5
      }))).toStrictEqual(['a@0+4 b@7+5', 'n@3+6']);
    });

    it('starts a new line below when its line has no room left', () => {
      expect(drawn(dropInto([w('a', 6), w('b', 6), w('c', 12)], w('n', 4), { col: 3, join: 'a' }))).toStrictEqual(['a@0+6 b@6+6', 'n@3+4', 'c@0+12']);
    });

    it('opens a new line above a line, or below the last one', () => {
      const list = [w('a', 12), w('b', 12)];

      expect(drawn(dropInto(list, w('n', 4), { col: 6, before: 'b' }))).toStrictEqual(['a@0+12', 'n@6+4', 'b@0+12']);
      expect(drawn(dropInto(list, w('n', 4), { col: 0, before: null }))).toStrictEqual(['a@0+12', 'b@0+12', 'n@0+4']);
    });
  });

  describe('moving a widget', () => {
    it('lifts it and drops it, so it can be put back in its own place', () => {
      const list = [w('a', 4), w('b', 4), w('c', 4)];

      expect(drawn(moveWidgetToCell(list, 'b', { col: 4, join: 'a' }))).toStrictEqual(['a@0+4 b@4+4 c@8+4']);
      expect(drawn(moveWidgetToCell(list, 'c', { col: 0, join: 'a' }))).toStrictEqual(['c@0+4 a@4+4 b@8+4']);
      expect(drawn(moveWidgetToCell(list, 'a', { col: 6, before: null }))).toStrictEqual(['b@4+4 c@8+4', 'a@6+4']);
    });

    it('moves it into a tab of a Tabs widget', () => {
      const tabs = newWidgetNode({
        kind: 'tabs',
        tabs: [{
          id: 't', name: 'T', widgets: [w('x', 6)]
        }]
      }, { id: 'tabs', colSpan: 12 });
      const out = moveWidgetToCell([w('a', 6), tabs], 'a', { col: 6, join: 'x' }, { parentId: 'tabs', tabId: 't' });

      expect(drawn(out)).toStrictEqual(['tabs@0+12']);
      expect(drawn(findWidget(out, 'tabs')?.widget.tabs?.[0].widgets || [])).toStrictEqual(['x@0+6 a@6+6']);
    });

    it('leaves the rest of the view alone when the widget is not there', () => {
      const list = [w('a', 4)];

      expect(liftWidget(list, 'nope')).toStrictEqual(list);
    });
  });

  describe('resizing', () => {
    it('by its edge: pushes the widgets after it, and stops at the right edge', () => {
      const list = [w('a', 4), w('b', 4, { offset: 2 })]; // a@0, b@6

      expect(drawn(resizeIn(list, 'a', 6, 'stop'))).toStrictEqual(['a@0+6 b@6+4']);
      expect(drawn(resizeIn(list, 'a', 7, 'stop'))).toStrictEqual(['a@0+7 b@7+4']);
      expect(drawn(resizeIn(list, 'a', 12, 'stop'))).toStrictEqual(['a@0+8 b@8+4']);
    });

    it('by its left edge: keeps the right edge, and cannot cross the widget before it', () => {
      const list = [w('a', 4), w('b', 4, { offset: 4 })]; // a@0, b@8

      expect(drawn(resizeStartIn(list, 'b', 5))).toStrictEqual(['a@0+4 b@5+7']);
      expect(drawn(resizeStartIn(list, 'b', 1))).toStrictEqual(['a@0+4 b@4+8']);
      expect(drawn(resizeStartIn(list, 'b', 12))).toStrictEqual(['a@0+4 b@11+1']);
    });

    it('to a picked width: takes it, and moves what no longer fits beside it to a line below', () => {
      const list = [w('a', 4), w('b', 4), w('c', 4), w('d', 12)];

      expect(drawn(resizeIn(list, 'b', 12, 'wrap'))).toStrictEqual(['b@0+12', 'a@0+4 c@8+4', 'd@0+12']);
      expect(drawn(resizeIn(list, 'c', 6, 'wrap'))).toStrictEqual(['a@0+4 c@6+6', 'b@4+4', 'd@0+12']);
      expect(drawn(resizeIn(list, 'a', 2, 'wrap'))).toStrictEqual(['a@0+2 b@4+4 c@8+4', 'd@0+12']);
    });

    it('in a tab as well as on the view', () => {
      const tabs = newWidgetNode({
        kind: 'tabs',
        tabs: [{
          id: 't', name: 'T', widgets: [w('x', 6)]
        }]
      }, { id: 'tabs', colSpan: 12 });
      const out = resizeWidget([tabs], 'x', 9, 'stop');

      expect(drawn(findWidget(out, 'tabs')?.widget.tabs?.[0].widgets || [])).toStrictEqual(['x@0+9']);
    });
  });
});
