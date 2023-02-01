---
toc_max_heading_level: 4
---

# Extensions API

## Introduction

Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime. This is covered mostly by the Extensions API which provides several methods on the `plugin` object to enhance the Rancher Dashboard UI in key areas of the interface. They should be defined where the extension is initialized.

In order understand how these methods work, there are some key concepts that should be learnt, like:

## `locationConfig` object definition

The `locationConfig` object defines **where** (which area of the UI) and **when** (product, resource, cluster...) these UI enhancement methods are applied on the UI. The **when** is based on the current routing system employed on Rancher Dashboard. Let's take on a simple example to try and understand the routing structure.

Example URL:
```
<INSTANCE-BASE-URL>/dashboard/c/local/explorer/apps.deployment/cattle-system/rancher-webhook
```

How to recognize the URL structure on the example above:

```
<INSTANCE-BASE-URL>/dashboard/c/<CLUSTER-ID>/<PRODUCT-ID>/<RESOURCE-ID>/<NAMESPACE-ID>/<ID>
```

**Note:** There are Kubernetes resources that aren't namespaced, such as `catalog.cattle.io.clusterrepo`, and in those cases the following structure applies:

```
<INSTANCE-BASE-URL>/dashboard/c/<CLUSTER-ID>/<PRODUCT-ID>/<RESOURCE-ID>/<ID>
```

There is another different routing pattern for "extensions as products" which follows a slightly different convention of the core Rancher Dashboard routes. An example of this would be:

```
<INSTANCE-BASE-URL>/dashboard/elemental/c/local/elemental.cattle.io.machineinventory/nvxml-6mtga
```

which translates to:

```
<INSTANCE-BASE-URL>/dashboard/<PRODUCT-ID>/c/<CLUSTER-ID>/<RESOURCE-ID>/<ID>
```

With this it's then possible to easily identify the parameters needed to populate the `locationConfig` and add the UI enhancements to the areas that you like. YES, it's possible to also even enhance other extensions!


The admissable parameters for the `locationConfig` object are:

| Key | Type | Description |
|---|---|---|
|`where`| String | The identifier of the UI area where to apply the given enhancement |
|`when`| Object | the `locationObject` which is based on the Vue router experience above described |

<br/>

The admissable string values for the `where` are:

| Key | Type | Description |
|---|---|---|
|`ActionLocation.HEADER`| String | Location for an action on the Header of Rancher Dashboard. Check [screenshot](#where-header-option-for-addaction) for location. |
|`ActionLocation.TABLE`| String | Location for an action on a List View Table of Rancher Dashboard. Check [screenshot](#where-table-option-for-addaction) for location. |
|`TabLocation.RESOURCE_DETAIL`| String | Location for a Tab on a Resource Detail page. Check [screenshot](#where-resourcetabs-option-for-addtab) for location. |
|`PanelLocation.DETAILS_MASTHEAD`| String | Location for a panel on the Details Masthead area of a Resource Detail page. Check [screenshot](#where-detailsmasthead-option-for-addpanel) for location. |
|`PanelLocation.DETAIL_TOP`| String | Location for a panel on the Detail Top area of a Resource Detail page. Check [screenshot](#where-detailtop-option-for-addpanel) for location. |
|`PanelLocation.RESOURCE_LIST`| String | Location for a panel on a Resource List View page (above the table area). Check [screenshot](#where-listview-option-for-addpanel) for location. |
|`CardLocation.CLUSTER_DASHBOARD_CARD`| String | Location for a card on the Cluster Dashboard page. Check [screenshot](#where-clusterdashboard-option-for-addcard) for location. |
|`TableColumnLocation.RESOURCE`| String | Location for a table column on a Resource List View page. Check [screenshot](#where-listview-option-for-addtablecolumn) for location. |

<br/>

The admissable parameters for the `when` object are:

| Key | Type | Description |
|---|---|---|
|`product`| String | The product identifier. Ex: `fleet`, `manager` (Cluster Management), `harvesterManager` (Virtualization Management), `explorer` (Cluster Explorer) or `home` (Homepage) |
|`resource`| String | The identifier of the kubernetes resource to be bound to. Ex: `apps.deployment`, `storage.k8s.io.storageclass` or `secret`  |
|`namespace`| String | The namespace identifier. Ex: `kube-system`, `cattle-global-data` or `cattle-system` |
|`cluster`| String | The cluster identifier. Ex: `local` |
|`id`| String | The identifier for a given resource. Ex: `deployment-unt6xmz` |
|`mode`| String | Relates to the type of view on which the given enhancement should be applied. Admissable values are: `edit`, `config`, `detail` and `list` |

### Examples

Example 1:
```
{
  where: '...',
  when: {}
}
```

Passing an empty object as a `locationObject` will apply a given extension enhancement to all locations where it can be apllied.

Example 2:
```
{
  where: '...',
  when: { product: 'home' }
}
```

Extension enhancement will be applied on the homepage of rancher dashboard (if applicable).

Example 3:
```
{
  where: '...',
  when: { resource: 'pod', id: 'pod-nxr5vm' }
}
```

Extension enhancement will be applied on the resource `pod` with id `pod-nxr5vm` (if applicable).

Example 4:
```
{
  where: '...',
  when: { 
    cluster:  'local', 
    resource: 'catalog.cattle.io.clusterrepo', 
    mode:     'edit' 
  }
}
```

Extension enhancement will be applied on the `edit` view/mode of the resource `catalog.cattle.io.clusterrepo` inside the `local` cluster (if applicable).

<br/>
<br/>

## Extension API methods

### `addAction`
This method adds a button/action to the UI.

Method:

```
plugin.addAction(where: String, when: locationConfig, options: Object)
```

_Arguments_

`where` string parameter admissable values:

| Key | Type | Description |
|---|---|---|
|`ActionLocation.HEADER`| String | Location for an action on the Header of Rancher Dashboard |
|`ActionLocation.TABLE`| String | Location for an action on a List View Table of Rancher Dashboard |


`when` Object admissable values:

`locationConfig` as described above for the [locationConfig object](#locationconfig-object-definition).

<br/>
<br/>

#### **`where: 'HEADER'`** option for addAction

![Header Actions](./screenshots/header-actions.png)

`options` config object. Admissable parameters for the `options` with `where: 'header'` are:

| Key | Type | Description |
|---|---|---|
|`tooltip`| String | Text for tooltip of button |
|`tooltipKey`| String | Same as "tooltip" but allows for translation. Will superseed "tooltip" |
|`shortcut`| Object or String | Shortcut key binding. Check examples |
|`icon`| String | icon name (based on [rancher icons](https://rancher.github.io/icons/)) |
|`svg`| Function | icon based on a SVG file which can be included using `@require` |
|`enabled`| Function | Whether the action/button is enabled or not |
|`invoke`| Function | function executed when action/button is clicked |

Usage example for `where: 'HEADER'`:

```
plugin.addAction(
  {
    where: ActionLocation.HEADER,
    when:  {}
  },
  {
    tooltipKey: 'plugin-examples.header-action-one',
    tooltip:    'Test Action1',
    shortcut:   'm',
    icon:       'icon-pipeline',
    invoke(opts: any, resources: any) {
      console.log('action executed 1', this); // eslint-disable-line no-console
      console.log(opts); // eslint-disable-line no-console
      console.log(resources); // eslint-disable-line no-console
    }
  }
);
```

```
plugin.addAction(
  {
    where: ActionLocation.HEADER,
    when:  {}
  },
  {
    tooltipKey: 'plugin-examples.header-action-two',
    tooltip:    'Test Action2',
    shortcut:   { windows: ['ctrl', 'b'], mac: ['meta', 'b'] },
    svg:        require('@pkg/test-features/icons/rancher-desktop.svg'),
    enabled(ctx: any) {
      return true;
    },
    invoke(opts: any, resources: any) {
      console.log('action executed 2', this); // eslint-disable-line no-console
      console.log(opts); // eslint-disable-line no-console
      console.log(resources); // eslint-disable-line no-console
    }
  }
);
```
<br/>
<br/>

#### **`where: 'TABLE'`** option for addAction

_INLINE TABLE ACTION_

![inline table action](./screenshots/inline-table-action.png)

_BULKABLE/GLOBAL TABLE ACTION_

![bulkable table action](./screenshots/inline-and-bulkable.png)

`options` config object. Admissable parameters for the `options` with `where: 'TABLE'` are:

| Key | Type | Description |
|---|---|---|
|`label`| String | Action label |
|`labelKey`| String | Same as "label" but allows for translation. Will superseed "label" |
|`icon`| String | icon name (based on [rancher icons](https://rancher.github.io/icons/)) |
|`svg`| Function | icon based on a SVG file which can be included using `@require` |
|`divider`| Boolean | Shows a line separator (divider) in actions menu |
|`multiple`| Boolean | Whether the action/button is bulkable (can be performed on multiple list items) |
|`invoke`| Function | function executed when action/button is clicked |


Usage example for `where: 'TABLE'`:

_RENDERING A SIMPLE DIVIDER_

```
plugin.addAction( 
  { 
    where: ActionLocation.TABLE,
    when: { resource: 'catalog.cattle.io.clusterrepo' }
  }, 
  { divider: true });
```


_CONFIGURING A NON-BULKABLE ACTION (inline action)_

```
plugin.addAction(
  { 
    where: ActionLocation.TABLE,
    when: { resource: 'catalog.cattle.io.clusterrepo' }
  }, 
  {
    label:    'some-extension-action',
    labelKey: 'plugin-examples.table-action-one',
    icon:     'icon-pipeline',
    invoke(opts: ActionOpts, values: any[]) {
      console.log('table action executed 1', this, opts, values); // eslint-disable-line no-console
    }
  }
);
```


_CONFIGURING AN INLINE AND BULKABLE ACTION_

```
plugin.addAction(
  { 
    where: ActionLocation.TABLE,
    when: { resource: 'catalog.cattle.io.clusterrepo' }
  }, 
  {
    label:    'some-bulkable-action',
    labelKey: 'plugin-examples.table-action-two',
    svg:      require('@pkg/test-features/icons/rancher-desktop.svg'),
    multiple: true,
    invoke(opts: ActionOpts, values: any[]) {
      console.log('table action executed 2', this); // eslint-disable-line no-console
      console.log(opts); // eslint-disable-line no-console
      console.log(values); // eslint-disable-line no-console
    },
  }
);
```

### `addTab`
This method adds a tab to the UI.

Method:

```
plugin.addTab(where: String, when: locationConfig, options: Object)
```

_Arguments_

`where` string parameter admissable values:

| Key | Type | Description |
|---|---|---|
|`TabLocation.RESOURCE_DETAIL`| String | Location for a Tab on a Resource Detail page |

`when` Object admissable values:

`locationConfig` as described above for the [locationConfig object](#locationconfig-object-definition).

<br/>
<br/>

#### **`where: 'RESOURCE_DETAIL'`** option for addTab

![Tabs](./screenshots/add-tab.png)

`options` config object. Admissable parameters for the `options` with `where: 'RESOURCE_DETAIL'` are:

| Key | Type | Description |
|---|---|---|
|`name`| String | Query param name used in url when tab is active/clicked |
|`label`| String | Text for the tab label |
|`labelKey`| String | Same as "label" but allows for translation. Will superseed "label" |
|`weight`| Int | Defines the order on which the tab is displayed in relation to other tabs in the component |
|`showHeader`| Boolean | Whether the tab header is displayed or not |
|`tooltip`| String | Tooltip message (on tab header) |
|`component`| Function | Component to be rendered as content on the tab |

Usage example:

```
plugin.addTab( 
  { 
    where: TabLocation.RESOURCE_DETAIL,
    when: { resource: 'pod' }
  }, 
  {
    name:       'some-name',
    labelKey:   'plugin-examples.tab-label',
    label:      'some-label',
    weight:     -5,
    showHeader: true,
    tooltip:    'this is a tooltip message',
    component:  () => import('./MyTabComponent.vue')
  }
);
```


### `addPanel`
This method adds a panel/content to the UI.

Method:

```
plugin.addPanel(where: String, when: locationConfig, options: Object)
```

_Arguments_

`where` string parameter admissable values:

| Key | Type | Description |
|---|---|---|
|`PanelLocation.DETAILS_MASTHEAD`| String | Location for a panel on the Details Masthead area of a Resource Detail page |
|`PanelLocation.DETAIL_TOP`| String | Location for a panel on the Detail Top area of a Resource Detail page |
|`PanelLocation.RESOURCE_LIST`| String | Location for a panel on a Resource List View page (above the table area) |

`when` Object admissable values:

`locationConfig` as described above for the [locationConfig object](#locationconfig-object-definition).

<br/>
<br/>

#### **`where: 'DETAILS_MASTHEAD'`** option for addPanel

![Details Masthead](./screenshots/masthead.png)

`options` config object. Admissable parameters for the `options` with `where: 'DETAILS_MASTHEAD'` are:

| Key | Type | Description |
|---|---|---|
|`component`| Function | Component to be rendered as content on the "detail view" Masthead component |

Usage example for `where: 'DETAILS_MASTHEAD'`:

```
plugin.addPanel(
  {
    where: PanelLocation.DETAILS_MASTHEAD,
    when:  { resource: 'catalog.cattle.io.clusterrepo' }
  },
  { component: () => import('./MastheadDetailsComponent.vue') });
```

<br/>
<br/>

#### **`where: 'DETAIL_TOP'`** option for addPanel

![DetailTop](./screenshots/detailtop.png)

`options` config object. Admissable parameters for the `options` with `where: 'DETAIL_TOP'` are:

| Key | Type | Description |
|---|---|---|
|`component`| Function | Component to be rendered as content on the "detail view" detailTop component |

Usage example for `where: 'DETAIL_TOP'`:

```
plugin.addPanel(
  {
    where: PanelLocation.DETAIL_TOP,
    when:  { resource: 'catalog.cattle.io.clusterrepo' }
  },
  { component: () => import('./DetailTopComponent.vue') });
```

<br/>
<br/>

#### **`where: 'RESOURCE_LIST'`** option for addPanel

![List View](./screenshots/list-view.png)

`options` config object. Admissable parameters for the `options` with `where: 'RESOURCE_LIST'` are:

| Key | Type | Description |
|---|---|---|
|`component`| Function | Component to be rendered as content above a table on a "list view" |

Usage example for `where: 'RESOURCE_LIST'`:

```
plugin.addPanel(
  {
    where: PanelLocation.RESOURCE_LIST,
    when:  { resource: 'catalog.cattle.io.app' }
  },
  { component: () => import('./BannerComponent.vue') });
```

<br/>
<br/>

### `addCard`

This method adds a card element to the UI.

Method:

```
plugin.addCard(where: String, when: locationConfig, options: Object)
```

_Arguments_

`where` string parameter admissable values:

| Key | Type | Description |
|---|---|---|
|`CardLocation.CLUSTER_DASHBOARD_CARD`| String | Location for a card on the Cluster Dashboard page |

`when` Object admissable values:

`locationConfig` as described above for the [locationConfig object](#locationconfig-object-definition).

<br/>
<br/>

#### **`where: 'CLUSTER_DASHBOARD_CARD'`** option for addCard

![Cluster Dashboard Card](./screenshots/cluster-cards.png)

`options` config object. Admissable parameters for the `options` with `where: 'CLUSTER_DASHBOARD_CARD'` are:

| Key | Type | Description |
|---|---|---|
|`label`| String | Card title |
|`labelKey`| String | Same as "label" but allows for translation. Will superseed "label" |
|`component`| Function | Component to be rendered aas content of a "Cluster Dashboard Card" |

Usage example for `where: 'CLUSTER_DASHBOARD_CARD'`:

```
plugin.addCard(
  {
    where: CardLocation.CLUSTER_DASHBOARD_CARD,
    when:  { cluster: 'local' }
  },
  {
    label:     'some-label',
    labelKey:  'generic.comingSoon',
    component: () => import('./MastheadDetailsComponent.vue')
  }
);
```

<br/>
<br/>

### `addTableColumn`

This method adds a table column to a `SortableTable`/`ResourceList` element-based table on the UI.

Method:

```
plugin.addTableColumn(where: String, when: locationConfig, options: Object)
```

_Arguments_

`where` string parameter admissable values:

| Key | Type | Description |
|---|---|---|
|`TableColumnLocation.RESOURCE`| String | Location for a table column on a Resource List View page |

`when` Object admissable values:

`locationConfig` as described above for the [locationConfig object](#locationconfig-object-definition).

<br/>
<br/>

#### **`where: 'RESOURCE'`** option for addTableColumn

![Table Col](./screenshots/table-cols.png)

`options` config object. Admissable parameters for the `options` with `where: 'RESOURCE'` are:

| Key | Type | Description |
|---|---|---|
|`name`| String | Label for column |
|`labelKey`| String | Same as "name" but allows for translation. Will superseed "name" |
|`value`| String | Object property to obtain the value from |
|`getValue`| Fuction | Same as "value", but it can be a function. Will superseed "value" |
|`width`| Int | Column width (in px). Optional |
|`sort`| Array | Object properties to be bound to the table sorting. Optional |
|`search`| Array | Object properties to be bound to the table search. Optional |

Usage example for `where: 'RESOURCE'`:

```
plugin.addTableColumn(
  {
    where: TableColumnLocation.RESOURCE,
    when:  { resource: 'configmap' }
  },
  {
    name:     'some-prop-col',
    labelKey: 'generic.comingSoon',
    getValue: (row: any) => {
      return `${ row.id }-DEMO-COL-STRING-ADDED!`;
    },
    width: 100,
    sort: ['stateSort', 'nameSort'],
    search: ['stateSort', 'nameSort'],
  }
);
```

<br/>
<br/>
