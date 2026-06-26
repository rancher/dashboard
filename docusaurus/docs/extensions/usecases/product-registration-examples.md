# Product Registration Examples (Experimental)

> Note: These examples use the experimental product registration API, which may change in future releases. For the current stable approach, see [Extension as a top-level product](./top-level-product.md) and [Extension as a cluster-level product](./cluster-level-product.md).

This page provides a set of copy-paste-ready examples for common product registration use cases. Each example is self-contained and shows the complete `index.ts` for an Extension.

For a detailed explanation of each API method and its types, see the [Product Registration API reference](../api/nav/product-registration.md).

## Quick start: empty product

Register a product with a single call. Useful for bootstrapping a new Extension before adding real pages:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  extension.addProduct('my-first-product');
}
```

**Result:** A product named "my-first-product" appears in the top-level slide-in menu with a default empty page.

---

## Single page product

A product that shows one full-page component with no side-menu. Good for dashboards or settings screens:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductSinglePage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const product: ProductSinglePage = {
    name:      'status-board',
    label:     'Status Board',
    icon:      'globe',
    component: () => import('./pages/StatusBoard.vue'),
  };

  extension.addProduct(product);
}
```

**Result:** A product with a single full-page view and no side-menu.

---

## Multiple custom pages

A product with several custom pages listed as side-menu entries:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildCustomPage
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const overviewPage: ProductChildCustomPage = {
    name:      'overview',
    label:     'Overview',
    component: () => import('./pages/Overview.vue'),
    weight:    3,
  };

  const usersPage: ProductChildCustomPage = {
    name:      'users',
    label:     'Users',
    component: () => import('./pages/Users.vue'),
    weight:    2,
  };

  const logsPage: ProductChildCustomPage = {
    name:      'logs',
    label:     'Logs',
    component: () => import('./pages/Logs.vue'),
    weight:    1,
  };

  const product: ProductMetadata = {
    name:  'my-app',
    label: 'My App',
    icon:  'gear',
  };

  extension.addProduct(product, [overviewPage, usersPage, logsPage]);
}
```

**Result:** A product with three pages in the side-menu, ordered by weight (bigger number on top).

---

## Resource pages (Kubernetes resources)

A product that uses Rancher Dashboard's built-in list/detail/edit views for Kubernetes resource types:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildResourcePage
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const clusterPage: ProductChildResourcePage = {
    type:   'provisioning.cattle.io.cluster',
    weight: 2,
    config: {
      displayName: 'Clusters',
      isCreatable: true,
      isEditable:  true,
      isRemovable: true,
      canYaml:     true,
      showState:   true,
      showAge:     true,
    },
  };

  const secretsPage: ProductChildResourcePage = {
    type:   'secret',
    weight: 1,
  };

  const product: ProductMetadata = {
    name:  'cluster-tools',
    label: 'Cluster Tools',
  };

  extension.addProduct(product, [clusterPage, secretsPage]);
}
```

**Result:** A product with two resource pages. Clicking a resource in the side-menu shows Rancher's standard list view; clicking a row opens the detail view.

---

## Mixed pages: custom + resource

Combine custom pages and resource pages in the same product:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildCustomPage,
  ProductChildResourcePage
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const dashboardPage: ProductChildCustomPage = {
    name:      'dashboard',
    label:     'Dashboard',
    component: () => import('./pages/Dashboard.vue'),
    weight:    3,
  };

  const clusterPage: ProductChildResourcePage = {
    type:   'provisioning.cattle.io.cluster',
    weight: 2,
  };

  const settingsPage: ProductChildCustomPage = {
    name:      'settings',
    label:     'Settings',
    component: () => import('./pages/Settings.vue'),
    weight:    1,
  };

  const product: ProductMetadata = {
    name:  'my-platform',
    label: 'My Platform',
  };

  extension.addProduct(product, [dashboardPage, clusterPage, settingsPage]);
}
```

---

## Pages organized in groups

Use groups to create collapsible folder/groups in the side-menu:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildCustomPage,
  ProductChildGroup
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  // Standalone page (outside any group)
  const homePage: ProductChildCustomPage = {
    name:      'home',
    label:     'Home',
    component: () => import('./pages/Home.vue'),
    weight:    10,
  };

  // "Monitoring" group with two pages
  const alertsPage: ProductChildCustomPage = {
    name:      'alerts',
    label:     'Alerts',
    component: () => import('./pages/Alerts.vue'),
  };

  const metricsPage: ProductChildCustomPage = {
    name:      'metrics',
    label:     'Metrics',
    component: () => import('./pages/Metrics.vue'),
  };

  const monitoringGroup: ProductChildGroup = {
    name:     'monitoring',
    label:    'Monitoring',
    weight:   5,
    children: [alertsPage, metricsPage],
  };

  // "Admin" group with two pages
  const usersPage: ProductChildCustomPage = {
    name:      'users',
    label:     'Users',
    component: () => import('./pages/Users.vue'),
  };

  const rolesPage: ProductChildCustomPage = {
    name:      'roles',
    label:     'Roles',
    component: () => import('./pages/Roles.vue'),
  };

  const adminGroup: ProductChildGroup = {
    name:     'admin',
    label:    'Administration',
    weight:   1,
    children: [usersPage, rolesPage],
  };

  const product: ProductMetadata = {
    name:  'my-platform',
    label: 'My Platform',
  };

  extension.addProduct(product, [homePage, monitoringGroup, adminGroup]);
}
```

**Result:** The side-menu will look like:

```
Home
▾ Monitoring
    Alerts
    Metrics
▾ Administration
    Users
    Roles
```

---

## Group with its own page

A group can have its own component that renders when the group header is clicked, instead of navigating to the first child:

```ts
const monitoringGroup: ProductChildGroup = {
  name:      'monitoring',
  label:     'Monitoring',
  component: () => import('./pages/MonitoringOverview.vue'), // group's own page
  children:  [alertsPage, metricsPage],
};
```

**Result:** Clicking "Monitoring" in the side-menu shows the `MonitoringOverview` component. Expanding the group reveals the child pages.

---

## Extending Cluster Explorer

Add a standalone custom page to the Cluster Explorer product:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ProductChildCustomPage } from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const customPage: ProductChildCustomPage = {
    name:      'cost-analysis',
    label:     'Cost Analysis',
    component: () => import('./pages/CostAnalysis.vue'),
  };

  extension.extendProduct('explorer', [customPage]);
}
```

Or, to add pages inside a group:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import {
  ProductChildCustomPage,
  ProductChildGroup
} from '@shell/core/plugin-types';

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  const costPage: ProductChildCustomPage = {
    name:      'cost-analysis',
    label:     'Cost Analysis',
    component: () => import('./pages/CostAnalysis.vue'),
  };

  const usagePage: ProductChildCustomPage = {
    name:      'usage-report',
    label:     'Usage Report',
    component: () => import('./pages/UsageReport.vue'),
  };

  const insightsGroup: ProductChildGroup = {
    name:     'insights',
    label:    'Insights',
    children: [costPage, usagePage],
  };

  extension.extendProduct('explorer', [insightsGroup]);
}
```

The products available for extension are: `'explorer'`, `'manager'`, `'settings'`, and `'auth'`.

---

## Using translation keys instead of labels

For i18n support, use `labelKey` instead of `label`. The key will be resolved from your Extension's translation files:

```ts
const product: ProductMetadata = {
  name:     'my-app',
  labelKey: 'product.myApp.label',
  icon:     'gear',
};

const overviewPage: ProductChildCustomPage = {
  name:      'overview',
  labelKey:  'product.myApp.overview',
  component: () => import('./pages/Overview.vue'),
};

extension.addProduct(product, [overviewPage]);
```

> Note: See the [Localization documentation](../advanced/localization.md) for details on setting up translation files.
