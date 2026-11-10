import { importTypes } from '@rancher/auto-import';
import { IPlugin, CardLocation } from '@shell/core/types';
import { ProductChildCustomPage, ProductChildGroup, ProductMetadata } from '@shell/core/plugin-products-external';
import { PRODUCT_NAME } from './types';

/**
 * Every page in this product renders the same placeholder, which reports which nav node it is.
 * The point of the extension is the shape of the side menu, not the page content.
 */
const placeholder = () => import('./pages/NavNode.vue');

// ---------------------------------------------------------------------------
// Level 4 - leaf pages
// ---------------------------------------------------------------------------

const volumesPage: ProductChildCustomPage = {
  name:      'l4-storage-volumes',
  labelKey:  'navDemo.nav.volumes',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

const snapshotsPage: ProductChildCustomPage = {
  name:      'l4-storage-snapshots',
  labelKey:  'navDemo.nav.snapshots',
  component: placeholder,
  sideMenu:  { weight: 90 },
};

const calendarPage: ProductChildCustomPage = {
  name:      'l4-windows-calendar',
  labelKey:  'navDemo.nav.calendar',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

// ---------------------------------------------------------------------------
// Level 3 - groups holding the level 4 pages, plus their own leaf pages
// ---------------------------------------------------------------------------

// Giving a group a `component` registers an overview page for it, which makes the group header
// itself a link. Without one the group header is plain text and routes to its first child.
const storageGroup: ProductChildGroup = {
  name:      'l3-storage',
  labelKey:  'navDemo.nav.storage',
  component: placeholder,
  sideMenu:  {
    weight:   90,
    children: [volumesPage, snapshotsPage],
  },
};

const nodesPage: ProductChildCustomPage = {
  name:      'l3-compute-nodes',
  labelKey:  'navDemo.nav.nodes',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

const windowsGroup: ProductChildGroup = {
  name:      'l3-windows',
  labelKey:  'navDemo.nav.windows',
  component: placeholder,
  sideMenu:  {
    weight:   90,
    children: [calendarPage],
  },
};

const policiesPage: ProductChildCustomPage = {
  name:      'l3-scheduling-policies',
  labelKey:  'navDemo.nav.policies',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

// ---------------------------------------------------------------------------
// Level 2 - groups holding the level 3 nodes, plus their own leaf pages
// ---------------------------------------------------------------------------

const computeGroup: ProductChildGroup = {
  name:      'l2-compute',
  labelKey:  'navDemo.nav.compute',
  component: placeholder,
  sideMenu:  {
    weight:   90,
    children: [nodesPage, storageGroup],
  },
};

const summaryPage: ProductChildCustomPage = {
  name:      'l2-platform-summary',
  labelKey:  'navDemo.nav.summary',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

const schedulingGroup: ProductChildGroup = {
  name:      'l2-scheduling',
  labelKey:  'navDemo.nav.scheduling',
  component: placeholder,
  sideMenu:  {
    weight:   90,
    children: [policiesPage, windowsGroup],
  },
};

const jobsPage: ProductChildCustomPage = {
  name:      'l2-operations-jobs',
  labelKey:  'navDemo.nav.jobs',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

// ---------------------------------------------------------------------------
// Level 1 - top of the side menu
// ---------------------------------------------------------------------------

const overviewPage: ProductChildCustomPage = {
  name:      'l1-overview',
  labelKey:  'navDemo.nav.overview',
  component: placeholder,
  sideMenu:  { weight: 100 },
};

const platformGroup: ProductChildGroup = {
  name:      'l1-platform',
  labelKey:  'navDemo.nav.platform',
  component: placeholder,
  sideMenu:  {
    weight:   90,
    children: [summaryPage, computeGroup],
  },
};

const operationsGroup: ProductChildGroup = {
  name:      'l1-operations',
  labelKey:  'navDemo.nav.operations',
  component: placeholder,
  sideMenu:  {
    weight:   80,
    children: [jobsPage, schedulingGroup],
  },
};

const product: ProductMetadata = {
  name:     PRODUCT_NAME,
  labelKey: 'navDemo.product.label',
  sideBar:  {
    weight: 1,
    icon:   { name: 'folder' },
  },
};

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');


  extension.addProduct(product, [overviewPage, platformGroup, operationsGroup]);
}
