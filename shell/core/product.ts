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
  private router: any;
  private modern = false;
  private product: any;
  private productBaseName: any;
  private productBasePath: any;
  private productCluster: any;

  // Track changes made via the IProduct API and apply them once
  private rootDefinition: string = 'ROOT';
  private routes: RouteConfig[] = [];
  private nav: {[key: string]: any} = {};
  private virtualTypes: {[key: string]: any} = {};
  private configureTypes: {[key: string]: any} = {};
  private spoofedTypes: {[key: string]: any} = {};

  constructor(store: any, public name: string, router: any) {
    this.store = store;
    this.DSL = STORE_DSL(this.store, this.name);
    this.router = router;
    this.productBaseName = `c-cluster-product`;
    this.productBasePath = `c/:cluster/:product`;
    this.productCluster = this.store.getters['currentCluster'] ? this.store.getters['currentCluster'] : BLANK_CLUSTER;
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

    // update routing variables for a "modern" product
    this.productBaseName = `${ this.name }-c-cluster`;
    this.productBasePath = `${ this.name }/c/:cluster`;
    this.productCluster = BLANK_CLUSTER;
  }

  addRoutes(routes: RouteConfig[]): void {
    console.log('*** ADD ROUTES ***', routes);
    this.routes.push(...routes);
  }

  addNavigation(routes: Navigation | Navigation[], grp?: {[key: string]: any} | string): void {
    console.log('**** ADD NAVIGATION ***', routes, grp);
    // Undefined group means the root group
    const navigationItems = Array.isArray(routes) ? routes : [routes];
    const group = grp || this.rootDefinition;
    let groupIdentifier: any;

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
      // string-like notations should only be used for kube resources that already exist, hence we push it to configureTypes
      if (typeof route === 'string') {
        this.nav[groupIdentifier].items.push({ name: route });
        this.configureTypes[route] = { name: route };
      } else {
        const r = route as RouteLink;

        // handle label translations for each type (labelKey)
        if (r.labelKey || r.label) {
          if (r.labelKey) {
            r.label = this.store.getters['i18n/t'](r.labelKey) ? this.store.getters['i18n/t'](r.labelKey) : r.labelKey; // FALLBACK TO BE DELETED!!!!
            delete r.labelKey;
          }
        }

        // Ensure r has a label populated by the "name" prop if it doesn't exist yet
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
  }

  configurePage(name: string, options?: object): void {
    console.log('**** CONFIGURE PAGE ***', name, options);
    // TODO: should we only consider unique names? currently not using the type to do this match here
    const configArray = ['configureTypes', 'virtualTypes', 'spoofedTypes'];
    let configArrayItem: string | undefined;

    // let's go over the different types to see if we can find where name has been registered
    for (let i = 0; i < configArray.length; i++) {
      const configType = configArray[i];

      if (this[configType] && Object.keys(this[configType]) && Object.keys(this[configType]).length && Object.keys(this[configType]).includes(name)) {
        configArrayItem = configType;
        break;
      }
    }

    // we found it, then let's apply the configuration to that object
    if (configArrayItem) {
      const currentConfig = { ...this[configArrayItem][name] };
      const currentOptions = { ...this[configArrayItem][name].options };

      this[configArrayItem][name] = {
        ...currentConfig,
        options: {
          ...currentOptions,
          ...options
        }
      };
    } else {
      console.error(`Couldn't find the resource named ${ name } to apply the given configuration ::: configurePage`); // eslint-disable-line no-console
    }
  }

  _applyRoutes(addRoutes: Function) {
    console.error('APPLY ROUTES');
    // Prepend name and paths for routes coming from addRoutes method on this class
    this.routes.forEach((r) => {
      if (r.name) {
        r.name = `${ this.productBaseName }-${ r.name }`;
      }

      r.path = `/${ this.productBasePath }/${ r.path }`;
    });

    // get all registered routes by addRoutes method and check if they have already been defined on the router instance
    const allRoutesToAdd = [];
    const registeredRoutes = this.router.getRoutes();

    this.routes.forEach((route) => {
      if (!registeredRoutes.find((regRoute:any) => regRoute.name === route.name)) {
        allRoutesToAdd.push(route);
      }
    });

    // If configureTypes or spoofedTypes types are used, then add routes for types - List, Create, View/Edit
    // Make sure we don't do this for explorer
    // TODO: CHANGE THIS TO COVER OTHER PRODUCTS!!! we should check if they have a c-cluster-resource route registered
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
        cluster: this.productCluster,
      };

      // Add metadata
      r.meta = r.meta || {};
      r.meta.product = this.name;
      r.meta.cluster = this.productCluster;

      // Route needs to be in an object in the key 'route'
      extRoutes.push({ route: r });
    });

    // only add redirect route if product is modern (new top level product => modern = true - uses DefaultProductComponent)
    if (this.modern) {
      // Figure out the default route for the product
      const defaultRoute: any = {};

      if (this.nav[this.rootDefinition] && this.nav[this.rootDefinition].items?.length > 0) {
        const firstRootNavItem = this.nav[this.rootDefinition].items[0];

        const redirect = {
          name:   `${ this.name }-c-cluster-${ firstRootNavItem.name }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        };

        defaultRoute.meta = { redirect };
      }

      defaultRoute.meta = defaultRoute.meta || {};
      defaultRoute.meta.product = this.name;
      defaultRoute.meta.cluster = BLANK_CLUSTER;

      // prepare top-level route for the product
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

      addRoutes([productBaseRoute]);
    }

    addRoutes(extRoutes);
  }

  // Internal - not exposed by the IProduct interface
  // Called by extensions system after product init - applies the routes and navigation to the store
  _apply() {
    // NOTE: weightType doesn't seem to work... passing the weight's directly as options when
    // configuring each type seems to do the trick (also it gets registered "per product" for virtualTypes and SpoofedTypes)

    // NOTE: changing list cols (DSL.headers) for a type 'resource' will override the early col definition
    // on the other registration -> this may be due to the initialization steps for extensions vs internal products (ex: explorer)

    // Register the product
    this.DSL.product(this.product);

    // Go through the virtual types and register those
    Object.keys(this.virtualTypes).forEach((name) => {
      const vt = this.virtualTypes[name];
      const options = vt.options || {};

      this.DSL.virtualType({
        name:   vt.name,
        weight: vt.weight,
        label:  vt.label,
        ...options,
        route:  {
          name:   `${ this.productBaseName }-${ vt.name }`,
          path:   `/${ this.productBasePath }/${ vt.name }`,
          params: {
            product: this.name,
            cluster: this.productCluster,
          }
        }
      });

      if (vt.listCols || vt.options?.listCols) {
        this._handleListColsRegistration(vt.name, vt.listCols || vt.options?.listCols);
      }
    });

    // Go through the kube resource types (configureType) and register those
    // also the route for the default list/edit/create are added a bit below
    Object.keys(this.configureTypes).forEach((name) => {
      const ct = this.configureTypes[name];
      const options = ct.options || {};

      this.DSL.configureType(ct.name, {
        weight:      ct.weight,
        label:       ct.label,
        ...options,
        customRoute: {
          name:   `${ this.productBaseName }-resource`,
          params: {
            product:  this.name,
            cluster:  this.productCluster,
            resource: ct.name,
          }
        }
      });

      if (ct.listCols || ct.options?.listCols) {
        this._handleListColsRegistration(ct.name, ct.listCols || ct.options?.listCols);
      }
    });

    // Go through the spoofed types and register those
    Object.keys(this.spoofedTypes).forEach((name) => {
      const st = this.spoofedTypes[name];
      const options = st.options || {};

      this.DSL.spoofedType({
        type:   st.name, // for spoofedType we need the 'type' param populated
        name:   st.name,
        weight: st.weight,
        label:  st.label,
        ...options,
        route:  {
          name:   `${ this.productBaseName }-resource`,
          params: {
            product:  this.name,
            cluster:  this.productCluster,
            resource: st.name,
          }
        }
      });

      if (st.listCols || st.options?.listCols) {
        this._handleListColsRegistration(st.name, st.listCols || st.options?.listCols);
      }
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

  // Internal function to handle list columns registration (DSL.headers)
  _handleListColsRegistration(resourceName: string, listColsDefinition: []) {
    if (listColsDefinition && Array.isArray(listColsDefinition)) {
      this.DSL.headers(resourceName, listColsDefinition);
    }
  }
}
