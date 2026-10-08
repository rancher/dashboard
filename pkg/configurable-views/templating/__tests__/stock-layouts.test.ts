import { stockWidgets } from '@pkg/configurable-views/templating/stock-layouts';
import type { WidgetNode } from '@pkg/configurable-views/templating/types';

// A translation that shows which key was asked for.
const t = (key: string) => `[${ key.split('.').slice(-2, -1)[0] }]`;
const kinds = (widgets: WidgetNode[]) => widgets.map((w) => w.widget.kind);

describe('stockWidgets', () => {
  it('rebuilds the Home: the banner, then the cluster list with the links beside it', () => {
    const widgets = stockWidgets('home', t);

    expect(kinds(widgets)).toStrictEqual(['banner', 'clusterTable', 'links']);
    expect(widgets.map((w) => w.colSpan)).toStrictEqual([12, 9, 3]);
    expect(widgets[2].widget.source).toBe('home');
    // The banner runs out over the view's inset to the page's edges.
    expect(widgets[0].margin).toStrictEqual({
      top: -72, right: -72, bottom: 0, left: -72
    });
  });

  it("rebuilds a cluster's dashboard in the order the dashboard draws it", () => {
    const widgets = stockWidgets('clusterDashboard', t);

    expect(kinds(widgets)).toStrictEqual([
      'clusterHeader', 'resourceCards', 'clusterExtensionCards', 'clusterCapacity', 'clusterComponentStatus', 'tabs', 'tabs'
    ]);
  });

  it("puts the dashboard's two tabbed sections in Tabs widgets, one part per tab, named as the dashboard names them", () => {
    const [, , , , , events, metrics] = stockWidgets('clusterDashboard', t);

    expect(events.widget.tabs?.map((tab) => [tab.name, kinds(tab.widgets)])).toStrictEqual([
      ['[events]', ['clusterEvents']], ['[alerts]', ['clusterAlerts']], ['[certs]', ['clusterCertificates']],
    ]);
    expect(metrics.widget.tabs?.map((tab) => tab.widgets[0].widget.metrics)).toStrictEqual(['cluster', 'k8s', 'etcd']);
  });

  it('follows the page: no part names a cluster', () => {
    const all = stockWidgets('clusterDashboard', t).flatMap((w) => [w, ...(w.widget.tabs || []).flatMap((tab) => tab.widgets)]);

    expect(all.every((w) => w.widget.cluster === '')).toBe(true);
  });

  it('draws the parts flush, as the page does, with the tab panels keeping their 20px', () => {
    const widgets = stockWidgets('clusterDashboard', t);

    expect(widgets[0].padding).toStrictEqual({
      top: 0, right: 0, bottom: 0, left: 0
    });
    expect(widgets[5].padding.top).toBe(20);
  });

  it('gives every widget its own id', () => {
    const ids = stockWidgets('clusterDashboard', t).flatMap((w) => [w.id, ...(w.widget.tabs || []).flatMap((tab) => [tab.id, ...tab.widgets.map((x) => x.id)])]);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
