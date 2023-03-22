import { IProduct, ProductOptions, RouteLink, Navigation } from '@shell/core/types';
import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import DefaultProductComponent from './DefaultProductComponent.vue';

// Default resource handling views
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ListNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';
import { BLANK_CLUSTER } from '@shell/store';

export class Product implements IProduct {
  private store: any;
  private DSL: any;
  private modern = false;
  private product: any;

  // Track changes made via the IProduct API and apply them once
  private rootDefinition: string = 'ROOT';
  private routes: RouteConfig[] = [];
  private nav: {[key: string]: any} = {};
  private virtualTypes: {[key: string]: any} = {};
  private configureTypes: {[key: string]: any} = {};
  private spoofedTypes: {[key: string]: any} = {};

  constructor(store: any, public name: string) {
    this.store = store;
    this.DSL = STORE_DSL(this.store, this.name);
  }

  // Create the product
  public create(options: ProductOptions) {
    // Use legacy type-map to create the product

    // TODO: Mangle ProductOptions
    // Smallest set of defaults for the product to show up in 'Global Apps'
    const prodOptions = {
      icon:                'extension',
      category:            'global',
      inStore:             'management',
      removable:           false,
      showClusterSwitcher: false,
      ...options,
      to:                  { name: this.name, path: `/${ this.name }` }
    };

    this.product = prodOptions;

    // Products created via this interface should be consider 'modern' - versus the legacy products with legacy routes
    this.modern = true;
  }

  addRoutes(routes: RouteConfig[]): void {
    console.log('*** addRoutes ***', routes);
    this.routes.push(...routes);
  }

  addNavigation(routes: Navigation | Navigation[], grp?: {[key: string]: any} | string): void {
    // Undefined group means the root group
    const navigationItems = Array.isArray(routes) ? routes : [routes];
    const group = grp || this.rootDefinition;
    let groupIdentifier: string;

    // here we take care of any label or labelKey props on the group object, so that we can handle translation
    if (typeof group === 'object' && !Array.isArray(group) && group !== null && (group.label || group.labelKey)) {
      // TO BE DELETED!!! safeguard to at least have a meaningful string if groupIdentifier is undefined because there's no translation...
      /* ------------ */
      if (group.labelKey) {
        groupIdentifier = this.store.getters['i18n/t'](group.labelKey) ? this.store.getters['i18n/t'](group.labelKey) : group.labelKey;
      } else {
        groupIdentifier = group.label;
      }
      /* ------------ */

      // groupIdentifier = group.labelKey ? this.store.getters['i18n/t'](group.labelKey) : group.label;
    } else {
      groupIdentifier = group;
    }

    if (!this.nav[groupIdentifier]) {
      this.nav[groupIdentifier] = {
        items:       [],
        groupWeight: grp?.weight
      };
    }

    navigationItems.forEach((route) => {
      // string-like notations should only be used for kube resources , hence we push it to configureTypes
      if (typeof route === 'string') {
        this.nav[groupIdentifier].items.push({ name: route });
        this.configureTypes[route] = { name: route };
      } else {
        const r = route as RouteLink;

        // Ensure r has a label
        if (!r.labelKey && !r.label) {
          r.label = r.name;
        }

        // RouteLink - so need to create a virtual type for the route
        // Store in a map, so other methods can update the virtual type
        // TODO: Do we allow user to configure a virtual type before adding the nav? If so, need to check here
        if (r.type === 'resource') {
          this.configureTypes[r.name] = r;
        } else if (r.type === 'custom-page') {
          this.virtualTypes[r.name] = r;
        } else if (r.type === 'virtual-resource') {
          this.spoofedTypes[r.name] = r;
        }

        // Add name to the navigation
        this.nav[groupIdentifier].items.push({
          name:   r.name,
          weight: r.weight
        });
      }
    });
    console.log(`*** addNavigation for product ${ this.product?.to?.name } this.configureTypes ***`, this.configureTypes);
    console.log(`*** addNavigation for product ${ this.product?.to?.name } this.virtualTypes ***`, this.virtualTypes);
    console.log(`*** addNavigation for product ${ this.product?.to?.name } this.spoofedTypes ***`, this.spoofedTypes);
    console.log(`*** addNavigation for product ${ this.product?.to?.name } this.nav ***`, this.nav);
    console.log(`***************************** addNavigation END *****************************`);
  }

  _applyRoutes(addRoutes: Function) {
    // TODO: these should be defined once

    console.error('APPLY ROUTES');

    const baseName = this.modern ? `${ this.name }-c-cluster` : `c-cluster-product`;
    const basePath = this.modern ? `${ this.name }/c/:cluster` : `c/:cluster/:product`;
    const currCluster = this.modern ? BLANK_CLUSTER : this.store.getters['currentCluster'] ? this.store.getters['currentCluster'] : BLANK_CLUSTER;
    // Figure out the default route for the product
    const defaultRoute: any = {};

    if (this.nav[this.rootDefinition] && this.nav[this.rootDefinition].items?.length > 0) {
      const firstRootNavItem = this.nav[this.rootDefinition].items[0];

      console.log('first route (on default route)', firstRootNavItem);

      let redirect = firstRootNavItem.name;

      // Can be a string or a Route
      if (typeof redirect === 'string') {
        redirect = {
          name:   `${ this.name }-c-cluster-${ redirect }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        };
      } else {
        // TODO
        // console.log('*************************************************************************************************');
        // console.error('>>>>>>> ERROR >>>>>>>>>>>');
      }

      defaultRoute.meta = { redirect };
    }

    defaultRoute.meta = defaultRoute.meta || {};
    defaultRoute.meta.product = this.name;
    defaultRoute.meta.cluster = BLANK_CLUSTER;

    // Prepend name and paths for routes coming from addRoutes method on this class
    this.routes.forEach((r) => {
      if (r.name) {
        r.name = `${ baseName }-${ r.name }`;
      }

      r.path = `/${ basePath }/${ r.path }`;
    });

    // Add top-level route for the product (for creating a new product only)
    const productBaseRoute = {
      route: {
        name:      this.name,
        path:      `/${ this.name }`,
        component: DefaultProductComponent,
        meta:      { ...defaultRoute.meta },
        params:    {
          product: defaultRoute.meta.product,
          cluster: defaultRoute.meta.cluster
        }
      }
    };

    const allRoutesToAdd = [
      ...this.routes
    ];

    // If configureTypes or spoofedTypes types are used, then add routes for types - List, Detail, Edit
    // Make sure we don't do this for explorer
    const isExplorer = this.name === 'explorer';

    if (!isExplorer && (Object.keys(this.configureTypes).length > 0 || Object.keys(this.spoofedTypes).length > 0)) {
      const typeRoutes: any[] = [
        {
          name:      `${ this.name }-c-cluster-resource`,
          path:      `/${ this.name }/c/:cluster/:resource`,
          component: ListResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-create`,
          path:      `/${ this.name }/c/:cluster/:resource/create`,
          component: CreateResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-id`,
          path:      `/${ this.name }/c/:cluster/:resource/:id`,
          component: ViewResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-namespace-id`,
          path:      `/${ this.name }c/:cluster/:resource/:namespace/:id`,
          component: ListNamespacedResource,
        }
      ];

      allRoutesToAdd.push(...typeRoutes);
    }

    const extRoutes: any[] = [];

    // add meta and params info to all routes
    allRoutesToAdd.forEach((r: any) => {
      r.params = {
        product: this.name,
        cluster: currCluster,
      };

      // Add metadata
      r.meta = r.meta || {};
      r.meta.product = this.name;
      r.meta.cluster = currCluster;

      // Route needs to be in an object in the key 'route'
      extRoutes.push({ route: r });
    });

    console.log('--- PROD BASE ROUTE TO ADD! ---', [productBaseRoute]);
    console.log('--- PROD ROUTES TO ADD! ---', extRoutes);

    addRoutes([productBaseRoute]);
    addRoutes(extRoutes);
  }

  // Internal - not exposed by the IProduct interface
  // Called by extensions system after product init - applies the routes and navigation to the store
  _apply() {
    // Register the product
    this.DSL.product(this.product);

    // NOTE: weightType doesn't seem to work... passing the weight's directly as options when
    // configuring each type seems to do the trick

    // TODO LIST:
    // handle "headers"
    // check "label" and "labelKey" for all types

    const baseName = this.modern ? `${ this.name }-c-cluster` : `c-cluster-product`;
    const basePath = this.modern ? `${ this.name }/c/:cluster` : `c/:cluster/:product`;
    const currCluster = this.modern ? BLANK_CLUSTER : this.store.getters['currentCluster'] ? this.store.getters['currentCluster'] : BLANK_CLUSTER;

    // Go through the virtual types and register those
    Object.keys(this.virtualTypes).forEach((name) => {
      const vt = this.virtualTypes[name];
      const options = vt.options || {};

      const vtOptions = {
        name:   vt.name,
        weight: vt.weight,
        ...options,
        route:  {
          name:   `${ baseName }-${ vt.name }`,
          path:   `/${ basePath }/${ vt.name }`,
          params: {
            product: this.name,
            cluster: currCluster,
          }
        }
      };

      this.DSL.virtualType(vtOptions);
    });

    // Go through the kube resource types (configureType) and register those
    // also the route for the default list/edit/create are added a bit below
    Object.keys(this.configureTypes).forEach((name) => {
      const ct = this.configureTypes[name];
      const options = ct.options || {};

      this.DSL.configureType(ct.name, {
        weight:      ct.weight,
        ...options,
        customRoute: {
          name:   `${ baseName }-resource`,
          params: {
            product:  this.name,
            cluster:  currCluster,
            resource: ct.name,
          }
        }
      });
    });

    // Go through the spoofed types and register those
    Object.keys(this.spoofedTypes).forEach((name) => {
      const st = this.spoofedTypes[name];
      const options = st.options || {};

      this.DSL.spoofedType({
        type:   st.name, // for spoofedType we need the 'type' param populated
        name:   st.name,
        weight: st.weight,
        ...options,
        route:  {
          name:   `${ baseName }-resource`,
          params: {
            product:  this.name,
            cluster:  currCluster,
            resource: st.name,
          }
        }
      });
    });

    // Navigation (basicType and weight's)
    Object.keys(this.nav).forEach((grp) => {
      const group = grp === this.rootDefinition ? undefined : grp;
      const items = this.nav[grp].items;

      if (items.length) {
        const mappedItems = items.map((item:any) => item.name);

        // set the basic type per group (menu nav entry)
        this.DSL.basicType(mappedItems, group);
      }

      if (group && this.nav[grp].groupWeight) {
        this.DSL.weightGroup(group, this.nav[grp].groupWeight, true);
      }
    });
  }

  // // NEW WORK!!!!
  // private _updateType(entry: any) {
  //   const {
  //     configureType,
  //     virtualType,
  //     weightType,
  //     weightGroup,
  //     headers,
  //     basicType,
  //     spoofedType
  //   } = this.dslMethods;
  //   // STILL MISSING: spoofedType...

  //   console.log('******* START --------------------------------------------------- *************');
  //   console.log('_updateType', entry);

  //   // apply menu registration (types, headers, weights)
  //   // no ID, no funny...
  //   if (!entry.id) {
  //     // eslint-disable-next-line no-console
  //     console.error('you are missing the registration identifier (id)!');

  //     return false;
  //   }

  //   // registering a resource
  //   if (entry.type === 'resource') {
  //     configureType(entry.id, entry.options || {});
  //   // registering a custom page or a virtual resource
  //   } else if (entry.type === 'custom-page' || entry.type === 'virtual-resource') {
  //     const options = entry.options || {};

  //     // inject the ID as name... needed for virtualType and spoofedType
  //     if (entry.id && !options.name) {
  //       options.name = entry.id;
  //     }

  //     if (entry.type === 'custom-page') {
  //       virtualType(options);
  //     } else if (entry.type === 'virtual-resource') {
  //       if (entry.id && !options.type) {
  //         options.type = entry.id;
  //       }
  //       spoofedType(options);
  //     }
  //   }

  //   // register headers
  //   if (entry.listCols && Array.isArray(entry.listCols)) {
  //     console.log('registering headers', entry.id, entry.listCols);
  //     headers(entry.id, entry.listCols);
  //   }

  //   // prepare data for basicType (registering menu entries)
  //   if (entry.menuGroupingId) {
  //     if (!this.menuGrouping[entry.menuGroupingId]) {
  //       this.menuGrouping[entry.menuGroupingId] = { menuItems: [entry.id] };
  //     } else {
  //       this.menuGrouping[entry.menuGroupingId].menuItems.push(entry.id);
  //     }

  //     if (entry.menuGroupingWeight && parseInt(entry.menuGroupingWeight) >= 0) {
  //       this.menuGrouping[entry.menuGroupingId].weight = entry.menuGroupingWeight;
  //     }
  //   } else {
  //     if (!this.singleMenuEntry[entry.id]) {
  //       this.singleMenuEntry[entry.id] = {};
  //     }

  //     if (entry.options?.weight && parseInt(entry.options?.weight) >= 0) {
  //       this.singleMenuEntry[entry.id].weight = entry.options?.weight;
  //     }
  //   }

  //   // console.log('singleMenuEntry', this.singleMenuEntry);
  //   // console.log('menuGrouping', this.menuGrouping);
  //   console.log('******* --------------------------------------------------- END *************');

  //   // register menu entries for non-grouped resources
  //   Object.keys(this.singleMenuEntry).forEach((key) => {
  //     basicType(Object.keys(this.singleMenuEntry));

  //     if (this.singleMenuEntry[key].weight) {
  //       weightType(key, this.singleMenuEntry[key].weight, true);
  //     }
  //   });

  //   // register menu entries for grouped resources
  //   Object.keys(this.menuGrouping).forEach((key) => {
  //     basicType(this.menuGrouping[key].menuItems, key);

  //     if (this.menuGrouping[key].weight) {
  //       weightGroup(key, this.menuGrouping[key].weight, true);
  //     }
  //   });

  //   return true;
  // }

  // // NEW WORK!!!!
  // registerType(entries: [any]) {
  //   console.log('registerType entries', entries);

  //   // apply menu registration (types, headers, weights)
  //   for (let i = 0; i < entries.length; i++) {
  //     const res = this._updateType(entries[i]);

  //     if (!res) {
  //       continue;
  //     }
  //   }
  // }

  // // NEW WORK!!!!
  // updateType(entry: any) {
  //   this._updateType(entry);
  // }
}
