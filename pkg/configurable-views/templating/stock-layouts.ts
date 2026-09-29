// Rancher's own pages, rebuilt from widgets.
//
// A starting point for a new view: the page as Rancher draws it, part by part, in the order it
// draws them - so what you then change is a change to the page you know, not a blank grid. Each part
// is the widget that IS that part of the page (see the widget catalog), so the result looks like the
// stock page rather than an approximation of it.
//
// Pure: no store, no Vue. Tab names are the page's own labels, so they are handed in translated.

import { newWidgetNode } from './view-model';
import {
  WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_LINKS, WIDGET_CLUSTER_HEADER, WIDGET_RESOURCE_CARDS, WIDGET_EXTENSION_CARDS,
  WIDGET_CAPACITY, WIDGET_COMPONENT_STATUS, WIDGET_EVENTS, WIDGET_ALERTS, WIDGET_CERTIFICATES, WIDGET_METRICS, WIDGET_TABS
} from './widget-catalog';
import type { PageKey } from './template-engine';
import type { WidgetNode, WidgetSpec } from './types';

/** Translates a key - the shell's `t`. */
export type Translate = (key: string) => string;

// Rancher's pages put no card around their parts, so neither do these widgets; the Tabs panels keep
// the 20px the shell's tab panels have.
const FLUSH = {
  top: 0, right: 0, bottom: 0, left: 0
};
const TAB_PANEL = {
  top: 20, right: 20, bottom: 20, left: 20
};

/**
 * The view a rebuilt page sits in, measured off the stock page:
 *
 *   Home               a 5% inset (72px on a 1430px page) with the shell grid's 1.75% gutter
 *                      (22.5px) - which makes the cluster list and the links exactly the stock
 *                      columns at 9 and 3 of 12
 *   Cluster dashboard  the page's 24px inset and no gap; each part carries the space the page puts
 *                      above it (see `above`)
 */
export function stockView(page: PageKey): { gap: number; pad: number } {
  return page === 'home' ? { gap: 22.5, pad: 72 } : { gap: 0, pad: 24 };
}

interface PartOptions {
  colSpan?: number;
  padding?: typeof FLUSH;
  /** Space above, px. Negative pulls the part up into the view's inset. */
  above?: number;
  /** Space to either side, px. Negative runs the part out to the page's edges. */
  sides?: number;
}

function part(spec: Partial<WidgetSpec> & { kind: WidgetSpec['kind'] }, {
  colSpan = 12, padding = FLUSH, above = 0, sides = 0
}: PartOptions = {}): WidgetNode {
  return newWidgetNode({ title: '', ...spec }, {
    colSpan,
    padding,
    margin: {
      top: above, right: sides, bottom: 0, left: sides
    },
  });
}

// A Tabs widget holding one part per tab, as the dashboard's Tabbed sections do - 30px below what
// comes before, as the dashboard spaces them.
function tabs(t: Translate, entries: [labelKey: string, spec: Partial<WidgetSpec> & { kind: WidgetSpec['kind'] }][]): WidgetNode {
  return part({
    kind: WIDGET_TABS,
    tabs: entries.map(([labelKey, spec]) => ({
      id: '', name: t(labelKey), widgets: [part(spec)]
    })),
  }, { padding: TAB_PANEL, above: 30 });
}

/**
 * The widgets that rebuild `page` as Rancher draws it.
 *
 *   Home               the banner; the cluster list, with Rancher's own links beside it
 *   Cluster dashboard  the header, the resource cards, extension cards, capacity, component status,
 *                      then the Events / Alerts / Certificates tabs and the three metrics tabs
 *
 * Parts a cluster may not have (the monitoring tabs, extension cards) are included all the same:
 * like the dashboard, the view leaves them out wherever a cluster does not have them.
 */
export function stockWidgets(page: PageKey, t: Translate): WidgetNode[] {
  if (page === 'home') {
    const { gap, pad } = stockView(page);

    // The banner runs edge to edge over the view's inset, as the Home's does; the panel below it
    // sits 20px under it, where the view's gap would put it 22.5px.
    return [
      part({ kind: WIDGET_BANNER }, { above: -pad, sides: -pad }),
      part({ kind: WIDGET_CLUSTER_TABLE }, { colSpan: 9, above: 20 - gap }),
      part({ kind: WIDGET_LINKS, source: 'home' }, { colSpan: 3, above: 20 - gap }),
    ];
  }

  // The space above each part is the dashboard's own: its heading sits 10px lower than the page's
  // inset, its extension cards 20px below the resource cards, and Capacity 40px.
  return [
    part({ kind: WIDGET_CLUSTER_HEADER }, { above: 10 }),
    part({ kind: WIDGET_RESOURCE_CARDS }),
    part({ kind: WIDGET_EXTENSION_CARDS }, { above: 20 }),
    part({ kind: WIDGET_CAPACITY }, { above: 40 }),
    part({ kind: WIDGET_COMPONENT_STATUS }),
    tabs(t, [
      ['clusterIndexPage.sections.events.label', { kind: WIDGET_EVENTS }],
      ['clusterIndexPage.sections.alerts.label', { kind: WIDGET_ALERTS }],
      ['clusterIndexPage.sections.certs.label', { kind: WIDGET_CERTIFICATES }],
    ]),
    tabs(t, [
      ['clusterIndexPage.sections.clusterMetrics.label', { kind: WIDGET_METRICS, metrics: 'cluster' }],
      ['clusterIndexPage.sections.k8sMetrics.label', { kind: WIDGET_METRICS, metrics: 'k8s' }],
      ['clusterIndexPage.sections.etcdMetrics.label', { kind: WIDGET_METRICS, metrics: 'etcd' }],
    ]),
  ];
}
