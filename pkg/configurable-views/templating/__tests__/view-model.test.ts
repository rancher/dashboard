import {
  BUILT_IN_STOCK_ID, DEFAULT_GAP, builtInStockView, canPlace, clampSpan, cssSides, findWidget, heightForPreset, heightPresetOf,
  insertWidget, isStockView, migrateViewSet, moveInOrder, moveWidget, moveWidgetTo, newLayoutView, newWidgetNode, normalizeWidget,
  orderKeyOf, orderViews, placeOf, removeWidget, setColSpan, spacingPresetOf, updateWidget, widthPresetOf
} from '@pkg/configurable-views/templating/view-model';
import type { LayoutView, WidgetNode } from '@pkg/configurable-views/templating/types';

// A view with a widget, then a Tabs widget holding one widget in each of its two tabs:
//   a | tabs [ one: b ] [ two: c ]
function tree(): WidgetNode[] {
  const b = newWidgetNode('links', { id: 'b' });
  const c = newWidgetNode('banner', { id: 'c' });
  const tabs = newWidgetNode({
    kind: 'tabs',
    tabs: [{
      id: 'one', name: 'One', widgets: [b]
    }, {
      id: 'two', name: 'Two', widgets: [c]
    }],
  }, { id: 'tabs' });

  return [newWidgetNode('table', { id: 'a' }), tabs];
}

const ids = (widgets: WidgetNode[]) => widgets.map((w) => w.id);
const tabIds = (widgets: WidgetNode[], tabId: string) => ids(findWidget(widgets, 'tabs')?.widget.tabs?.find((t) => t.id === tabId)?.widgets || []);

describe('migrateViewSet', () => {
  it('reads the current shape, keeping the default view', () => {
    const set = migrateViewSet({ views: [{ id: 'v1', name: 'One' }, { id: 'v2', name: 'Two' }], defaultViewId: 'v2' });

    expect(set.views.map((v) => v.name)).toStrictEqual(['One', 'Two']);
    expect(set.defaultViewId).toBe('v2');
  });

  it('reads the shape stored before views were called views', () => {
    const set = migrateViewSet({
      panels: [{
        id: 'p1', name: 'Old', widgets: [{ type: 'widget', widget: { kind: 'links' } }]
      }],
      defaultPanelId: 'p1'
    });

    expect(set.views.map((v) => v.id)).toStrictEqual(['p1']);
    expect(set.defaultViewId).toBe('p1');
    expect((set.views[0] as LayoutView).widgets[0].widget.kind).toBe('links');
  });

  it('prefers the current key when both are stored', () => {
    const set = migrateViewSet({ views: [{ id: 'new' }], panels: [{ id: 'old' }] });

    expect(set.views.map((v) => v.id)).toStrictEqual(['new']);
  });

  it('drops a default that names a view which is not there', () => {
    expect(migrateViewSet({ views: [{ id: 'v1' }], defaultViewId: 'gone' }).defaultViewId).toBeUndefined();
  });

  it('keeps a stock view as a stock view, with no widgets', () => {
    const [view] = migrateViewSet({
      views: [{
        id: 's', name: 'Rancher', kind: 'stock'
      }]
    }).views;

    expect(isStockView(view)).toBe(true);
    expect(view).not.toHaveProperty('widgets');
  });

  it('keeps the organization and fork markers', () => {
    const [view] = migrateViewSet({
      views: [{
        id: 'v', org: true, from: 'source'
      }]
    }).views;

    expect(view).toStrictEqual(expect.objectContaining({ org: true, from: 'source' }));
  });

  it('keeps a disabled scope disabled', () => {
    expect(migrateViewSet({ views: [], disabled: true }).disabled).toBe(true);
  });

  it('flattens the old tree of rows into widgets in reading order, dropping template nodes', () => {
    const [view] = migrateViewSet({
      views: [{
        id:        'v',
        organizer: {
          children: [
            { children: [{ type: 'widget', widget: { kind: 'table' } }, { type: 'template', name: 'gone' }] },
            { children: [{ type: 'widget', widget: { kind: 'links' } }] },
          ],
        },
      }],
    }).views;

    expect((view as LayoutView).widgets.map((w) => w.widget.kind)).toStrictEqual(['table', 'links']);
  });

  it('turns the legacy tabs of templates into empty views with the same names', () => {
    const set = migrateViewSet({ tabs: [{ id: 't1', name: 'Ops' }] });

    expect(set.views).toStrictEqual([expect.objectContaining({
      id: 't1', name: 'Ops', widgets: []
    })]);
  });

  it.each([
    ['a legacy template name', 'home'],
    ['nothing', undefined],
    ['something that is not a view set', { unrelated: true }],
    ['an empty list', { views: [] }],
  ])('reads %s as no views, without inventing one', (_, stored) => {
    expect(migrateViewSet(stored).views).toStrictEqual([]);
  });
});

describe('normalizeWidget', () => {
  it('fills every field, and makes a widget with no kind a table', () => {
    expect(normalizeWidget({})).toStrictEqual({
      kind:        'table',
      title:       '',
      resource:    '',
      source:      'home',
      cluster:     '',
      limit:       0,
      links:       [],
      fromCluster: false,
    });
  });

  it("keeps a table's two table-views switches only when on, and leaves its older columns, sort and filter behind", () => {
    const old = normalizeWidget({
      kind: 'table', resource: 'pod', columns: ['name'], sortBy: 'name', filter: 'env=prod', where: 'custom', targets: ['a']
    });

    expect(Object.keys(old).sort()).toStrictEqual(['cluster', 'fromCluster', 'kind', 'limit', 'links', 'resource', 'source', 'title']);
    expect(normalizeWidget({
      kind: 'table', viewTabs: true, ownViews: true
    })).toMatchObject({ viewTabs: true, ownViews: true });
    expect('viewTabs' in normalizeWidget({ kind: 'table', viewTabs: false })).toBe(false);
  });

  it('says where a table reads from, and reads a table saved before it could say so from where it did then', () => {
    expect(normalizeWidget({
      kind: 'table', resource: 'pod', fromCluster: false
    }).fromCluster).toBe(false);
    expect(normalizeWidget({
      kind: 'table', resource: 'management.cattle.io.cluster', fromCluster: true
    }).fromCluster).toBe(true);
    expect(normalizeWidget({ kind: 'table', resource: 'pod' }).fromCluster).toBe(true);
    expect(normalizeWidget({ kind: 'table', resource: 'apps.deployment' }).fromCluster).toBe(true);
    expect(normalizeWidget({ kind: 'table', resource: 'management.cattle.io.cluster' }).fromCluster).toBe(false);
    expect('fromCluster' in normalizeWidget({ kind: 'links' })).toBe(false);
  });

  it('keeps a kind it does not know, so the grid can name it', () => {
    expect(normalizeWidget({ kind: 'statusSummary' }).kind).toBe('statusSummary');
  });

  it('reads the one cluster out of the older list of clusters', () => {
    expect(normalizeWidget({ clusters: ['c-1', 'c-2'] }).cluster).toBe('c-1');
  });

  it('ignores a row limit that is not a positive number', () => {
    expect(normalizeWidget({ limit: -3 }).limit).toBe(0);
    expect(normalizeWidget({ limit: '25' }).limit).toBe(25);
  });

  it('keeps the banner extras only when they are set', () => {
    expect(normalizeWidget({ kind: 'banner' })).not.toHaveProperty('subtitle');
    expect(normalizeWidget({ kind: 'banner', subtitle: 'Hi' }).subtitle).toBe('Hi');
  });

  it('gives a metrics widget a dashboard, defaulting to the cluster one', () => {
    expect(normalizeWidget({ kind: 'clusterMetrics', metrics: 'etcd' }).metrics).toBe('etcd');
    expect(normalizeWidget({ kind: 'clusterMetrics', metrics: 'nope' }).metrics).toBe('cluster');
    expect(normalizeWidget({ kind: 'table', metrics: 'etcd' })).not.toHaveProperty('metrics');
  });

  it('gives a Tabs widget at least one tab, and ids to tabs that have none', () => {
    const empty = normalizeWidget({ kind: 'tabs' });
    const named = normalizeWidget({ kind: 'tabs', tabs: [{ name: 'A' }, { id: 'kept', name: 'B' }] });

    expect(empty.tabs).toHaveLength(1);
    expect(named.tabs?.map((t) => t.name)).toStrictEqual(['A', 'B']);
    expect(named.tabs?.[0].id).toMatch(/^tab-/);
    expect(named.tabs?.[1].id).toBe('kept');
  });

  it("normalizes the widgets in a Tabs widget's tabs like a view's", () => {
    const spec = normalizeWidget({ kind: 'tabs', tabs: [{ name: 'A', widgets: [{ type: 'widget', widget: { kind: 'links' } }, 'junk'] }] });

    expect(spec.tabs?.[0].widgets.map((w) => w.widget.kind)).toStrictEqual(['links']);
  });
});

describe('boxes and presets', () => {
  it('lands a new widget at half width, 16px padding, content height', () => {
    const node = newWidgetNode('links');

    expect(node).toStrictEqual(expect.objectContaining({
      type:    'widget',
      colSpan: 6,
      height:  'auto',
      padding: {
        top: 16, right: 16, bottom: 16, left: 16
      },
    }));
    expect(node.widget.kind).toBe('links');
  });

  it.each([[0, 6], [-4, 1], [7.4, 7], [40, 12], ['nope', 6]])('clamps a span of %p to %p', (span, expected) => {
    expect(clampSpan(span)).toBe(expected);
  });

  it('writes sides as CSS, in px unless given a unit', () => {
    expect(cssSides({
      top: 8, right: '5%', bottom: 0, left: '2rem'
    })).toBe('8px 5% 0px 2rem');
  });

  it('maps spans, heights and paddings to their presets and back', () => {
    expect(widthPresetOf(8)).toBe('twoThirds');
    expect(widthPresetOf(5)).toBeNull();
    // Two rows of 156 plus the gap between them.
    expect(heightForPreset('rows2', DEFAULT_GAP)).toBe(332);
    expect(heightPresetOf(332, DEFAULT_GAP)).toBe('rows2');
    expect(heightPresetOf('auto')).toBe('fit');
    expect(spacingPresetOf({
      top: 24, right: 24, bottom: 24, left: 24
    })).toBe('spacious');
    expect(spacingPresetOf({
      top: 24, right: 0, bottom: 24, left: 24
    })).toBeNull();
  });
});

describe('views', () => {
  it('makes a new view with the default spacing and no widgets', () => {
    expect(newLayoutView('Mine')).toStrictEqual(expect.objectContaining({
      name: 'Mine', gap: 20, pad: 20, widgets: []
    }));
  });

  it("offers Rancher's own page as a view that is always there", () => {
    expect(builtInStockView('Home')).toStrictEqual({
      id: BUILT_IN_STOCK_ID, name: 'Home', kind: 'stock'
    });
  });
});

describe('list operations', () => {
  it('finds a widget, and says which list it is in, wherever it is', () => {
    const widgets = tree();

    expect(findWidget(widgets, 'c')?.widget.kind).toBe('banner');
    expect(findWidget(widgets, 'nope')).toBeNull();
    expect(placeOf(widgets, 'a')).toBeNull();
    expect(placeOf(widgets, 'c')).toStrictEqual({ parentId: 'tabs', tabId: 'two' });
    expect(placeOf(widgets, 'nope')).toBeUndefined();
  });

  it('changes and removes a widget inside a tab by its id', () => {
    const widgets = tree();
    const sized = setColSpan(widgets, 'b', 12);
    const renamed = updateWidget(widgets, 'b', (w) => ({ ...w, widget: { ...w.widget, title: 'Renamed' } }));

    expect(findWidget(sized, 'b')?.colSpan).toBe(12);
    expect(findWidget(renamed, 'b')?.widget.title).toBe('Renamed');
    expect(tabIds(removeWidget(widgets, 'b'), 'one')).toStrictEqual([]);
  });

  it('never changes the list it was given', () => {
    const widgets = tree();
    const before = JSON.stringify(widgets);

    removeWidget(widgets, 'b');
    moveWidgetTo(widgets, 'a', 0, { parentId: 'tabs', tabId: 'one' });
    setColSpan(widgets, 'c', 3);

    expect(JSON.stringify(widgets)).toBe(before);
  });

  it('moves a widget one place within its own list', () => {
    const widgets = tree();

    expect(ids(moveWidget(widgets, 'a', 1))).toStrictEqual(['tabs', 'a']);
    expect(ids(moveWidget(widgets, 'a', -1))).toStrictEqual(['a', 'tabs']);
  });

  it('drops a widget within its own list, allowing for the gap it leaves', () => {
    const widgets = [newWidgetNode('links', { id: 'x' }), newWidgetNode('links', { id: 'y' }), newWidgetNode('links', { id: 'z' })];

    expect(ids(moveWidgetTo(widgets, 'x', 2))).toStrictEqual(['y', 'x', 'z']);
    expect(ids(moveWidgetTo(widgets, 'x', 1))).toStrictEqual(['x', 'y', 'z']);
    expect(ids(moveWidgetTo(widgets, 'z', 0))).toStrictEqual(['z', 'x', 'y']);
  });

  it('drops a widget into a tab, out of one, and from one tab to another', () => {
    const into = moveWidgetTo(tree(), 'a', 0, { parentId: 'tabs', tabId: 'one' });
    const out = moveWidgetTo(tree(), 'b', 0);
    const across = moveWidgetTo(tree(), 'b', 1, { parentId: 'tabs', tabId: 'two' });

    expect(ids(into)).toStrictEqual(['tabs']);
    expect(tabIds(into, 'one')).toStrictEqual(['a', 'b']);
    expect(ids(out)).toStrictEqual(['b', 'a', 'tabs']);
    expect(tabIds(out, 'one')).toStrictEqual([]);
    expect(tabIds(across, 'one')).toStrictEqual([]);
    expect(tabIds(across, 'two')).toStrictEqual(['c', 'b']);
  });

  it('refuses a drop into a tab that is not there, rather than losing the widget', () => {
    const widgets = moveWidgetTo(tree(), 'a', 0, { parentId: 'tabs', tabId: 'gone' });

    expect(findWidget(widgets, 'a')).not.toBeNull();
    expect(ids(widgets)).toStrictEqual(['a', 'tabs']);
  });

  it('keeps Tabs out of a tab, whether dropped in new or moved in', () => {
    const place = { parentId: 'tabs', tabId: 'one' };
    const another = newWidgetNode({ kind: 'tabs' }, { id: 'more' });

    expect(canPlace('tabs', place)).toBe(false);
    expect(canPlace('tabs', null)).toBe(true);
    expect(canPlace('links', place)).toBe(true);
    expect(findWidget(insertWidget(tree(), another, 0, place), 'more')).toBeNull();
    expect(ids(moveWidgetTo(tree(), 'tabs', 0, place))).toStrictEqual(['a', 'tabs']);
  });

  it('inserts at an index, or at the end without one', () => {
    const extra = newWidgetNode('links', { id: 'new' });

    expect(ids(insertWidget(tree(), extra, 0))).toStrictEqual(['new', 'a', 'tabs']);
    expect(ids(insertWidget(tree(), extra))).toStrictEqual(['a', 'tabs', 'new']);
    expect(tabIds(insertWidget(tree(), extra, 99, { parentId: 'tabs', tabId: 'two' }), 'two')).toStrictEqual(['c', 'new']);
  });
});

describe('the bar order', () => {
  const stock = builtInStockView('Home');
  const one = newLayoutView('One', { id: 'one' });
  const two = newLayoutView('Two', { id: 'two' });
  const three = newLayoutView('Three', { id: 'three' });
  const names = (list: { name: string }[]) => list.map((v) => v.name);
  const byId = (v: { id: string }) => v.id;

  it('moves one entry and leaves the list given untouched', () => {
    const order = ['a', 'b', 'c', 'd'];

    expect(moveInOrder(order, 3, 1)).toStrictEqual(['a', 'd', 'b', 'c']);
    expect(moveInOrder(order, 0, 9)).toStrictEqual(['b', 'c', 'd', 'a']);
    expect(moveInOrder(order, -1, 1)).toStrictEqual(order);
    expect(order).toStrictEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps the natural order, led by Rancher’s own page, with nothing dragged or set', () => {
    expect(names(orderViews([one, stock, two], undefined, byId))).toStrictEqual(['Home', 'One', 'Two']);
  });

  it('follows the dragged order, with views never placed after the rest', () => {
    expect(names(orderViews([stock, one, two, three], ['built-in-stock', 'two', 'one'], byId))).toStrictEqual(['Home', 'Two', 'One', 'Three']);
  });

  it('puts the default view in front, wherever it was dragged', () => {
    expect(names(orderViews([stock, one, two], ['built-in-stock', 'one', 'two'], byId, 'two'))).toStrictEqual(['Two', 'Home', 'One']);
  });

  it('leaves Rancher’s own page where it was dragged, once it is not the default', () => {
    expect(names(orderViews([one, two, three, stock], ['one', 'two', 'three', 'built-in-stock'], byId, 'two'))).toStrictEqual(['Two', 'One', 'Three', 'Home']);
    expect(names(orderViews([one, two, stock], ['one', 'two', 'built-in-stock'], byId))).toStrictEqual(['Home', 'One', 'Two']);
  });

  it('leads with Rancher’s own page when the default is gone', () => {
    expect(names(orderViews([one, stock, two], undefined, byId, 'deleted'))).toStrictEqual(['Home', 'One', 'Two']);
  });

  it('places a fork of a published view by its source', () => {
    const fork = { ...newLayoutView('Mine', { id: 'fork' }), from: 'one' };
    const published = new Set(['one']);

    expect(orderKeyOf(fork, published)).toBe('one');
    expect(orderKeyOf(fork, new Set())).toBe('fork');
    expect(names(orderViews([stock, fork, two], ['two', 'one', 'built-in-stock'], (v) => orderKeyOf(v, published)))).toStrictEqual(['Home', 'Two', 'Mine']);
  });

  it('reads a stored order, and drops one that is not a list of names', () => {
    expect(migrateViewSet({ views: [], order: ['a', 3, 'b'] }).order).toStrictEqual(['a', 'b']);
    expect(migrateViewSet({ views: [], order: 'a' }).order).toBeUndefined();
  });
});
