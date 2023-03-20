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

  // Track changes made via the IProduct API and apply them once
  private rootDefinition: string = 'ROOT';
  private routes: RouteConfig[] = [];
  private nav: {[key: string]: any} = {};
  private virtualTypes: {[key: string]: any} = {};
  private configureTypes: {[key: string]: any} = {};
  private spoofedTypes: {[key: string]: any} = {};
  private basicTypes: string[] = [];

  constructor(store: any, public name: string) {
    this.store = store;
    this.DSL = STORE_DSL(this.store, this.name);
  }

  // Create the product
  public create(options: ProductOptions) {
    // Use legacy type-map to create the product

    // TODO: Mangle ProductOptions
    const prodOptions = {
      icon:                'extension',
      category:            'global',
      inStore:             'management',
      removable:           false,
      showClusterSwitcher: false,
      ...options,
      to:                  { name: this.name, path: `/${ this.name }` }
    };

    console.log('prodOptions on create', prodOptions);

    // Smallest set of defaults for the product to show up in 'Global Apps'
    this.DSL.product(prodOptions);

    // Products created via this interface should be consider 'modern' - versus the legacy products with legacy routes
    this.modern = true;
  }

  addRoutes(routes: RouteConfig[]): void {
    console.log('*** addRoutes ***', routes);
    this.routes.push(...routes);
  }

  addNavigation(routes: Navigation | Navigation[], grp?: string): void {
    // Undefined group means the root group
    const navigationItems = Array.isArray(routes) ? routes : [routes];
    const group = grp || this.rootDefinition;

    if (!this.nav[group]) {
      this.nav[group] = [];
    }

    navigationItems.forEach((route) => {
      if (typeof route === 'string') {
        // Type name
        this.nav[group].push(route);
        this.basicTypes.push(route);
      } else {
        const r = route as RouteLink;

        // Ensure r has a label
        if (!r.labelKey && !r.label) {
          r.label = r.name;
        }

        // RouteLink - so need to create a virtual type for the route
        // Store in a map, so other methods can update the virtual type
        // TODO: Do we allow user to configure a virtual type before adding the nav? If so, need to check here
        this.virtualTypes[r.name] = r;

        if (r.type === 'resource') {
          this.configureTypes[r.name] = r;
        } else if (r.type === 'custom-page') {
          this.virtualTypes[r.name] = r;
        } else if (r.type === 'virtual-resource') {
          this.spoofedTypes[r.name] = r;
        }

        // Add name to the navigation
        this.nav[group].push(r.name);
      }
    });

    console.log('*** addNavigation this.configureTypes ***', this.configureTypes);
    console.log('*** addNavigation this.virtualTypes ***', this.virtualTypes);
    console.log('*** addNavigation this.spoofedTypes ***', this.spoofedTypes);
    console.log('*** addNavigation this.nav ***', this.nav);
  }

  // Internal - not exposed by the IProduct interface
  // Called by extensions system after product init - applies the routes and navigation to the store
  _apply(addRoutes: Function) {
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    // console.error('Applying product types');

    const baseName = this.modern ? `${ this.name }-c-cluster` : `c-cluster-${ this.name }`;
    const basePath = this.modern ? `${ this.name }/c/:cluster` : `c/:cluster/${ this.name }`;

    // Go through the kube resource types (configureType) and register those
    Object.keys(this.configureTypes).forEach((name) => {
      const ct = this.configureTypes[name];
      const options = ct.options || {};

      this.DSL.configureType(ct.name, {
        name:  ct.name,
        ...options,
        route: {
          name:   `${ baseName }-${ ct.name }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        }
      });
    });

    // Go through the virtual types and register those
    Object.keys(this.virtualTypes).forEach((name) => {
      const vt = this.virtualTypes[name];
      const options = vt.options || {};

      const vtOptions = {
        name:       vt.name,
        namespaced: false,
        labelKey:   vt.labelKey,
        icon:       'compass',
        weight:     100,
        label:      vt.name, // TODO: label key etc
        ...options,
        route:      {
          name:   `${ baseName }-${ vt.name }`,
          path:   `/${ basePath }/${ vt.name }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        }
      };

      console.log('virtual type to be registered', vt);
      console.log('virtual type options', vtOptions);

      this.DSL.virtualType(vtOptions);
    });

    // Go through the spoofed types and register those
    Object.keys(this.spoofedTypes).forEach((name) => {
      const st = this.spoofedTypes[name];
      const options = st.options || {};

      this.DSL.spoofedType({
        type:  st.name, // for spoofedType we need the 'type' param populated
        name:  st.name,
        ...options,
        route: {
          name:   `${ baseName }-${ st.name }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        }
      });
    });

    // Navigation
    Object.keys(this.nav).forEach((grp) => {
      const group = grp === this.rootDefinition ? undefined : grp;
      const items = this.nav[grp];

      this.DSL.basicType(items, group);
    });

    // Figure out the default route for the product
    const defaultRoute: any = {};

    if (this.nav[this.rootDefinition] && this.nav[this.rootDefinition].length > 0) {
      const first = this.nav[this.rootDefinition][0];

      console.log('first route (on default route)', first);

      let redirect = first;

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

    console.log('defaultRoute', defaultRoute);

    // Update the names of the child routes (should be recursive)
    // Names are always absolute - child names are not within the context of the parent
    // Prepend name
    this.routes.forEach((r) => {
      if (r.name) {
        r.name = `${ baseName }-${ r.name }`;
      }

      r.path = `/${ basePath }/${ r.path }`;
    });

    // Routes
    // Add top-level route for the product
    const productBaseRoute = {
      route: {
        name:      this.name,
        path:      `/${ this.name }`,
        component: DefaultProductComponent,
        meta:      { ...defaultRoute.meta },
        params:    { product: defaultRoute.meta.product, cluster: defaultRoute.meta.cluster },
      }
    };

    const allRoutesToAdd = [
      ...this.routes
    ];

    // If basic types are used, then add routes for types - List, Detail, Edit
    // Make sure we don't do this for explorer
    const isExplorer = this.name === 'explorer';

    if (!isExplorer && this.basicTypes.length > 0) {
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
        cluster: BLANK_CLUSTER,
      };

      // Add metadata
      r.meta = r.meta || {};
      r.meta.product = this.name;
      r.meta.cluster = BLANK_CLUSTER;

      // Route needs to be in an object in the key 'route'
      extRoutes.push({ route: r });
    });

    console.log('--- PROD BASE ROUTE TO ADD! ---', [productBaseRoute]);
    console.log('--- PROD ROUTES TO ADD! ---', extRoutes);

    addRoutes([productBaseRoute]);
    addRoutes(extRoutes);
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
