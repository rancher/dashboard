/**
 * Helper for models to use to simplify using a helper class provided by an extension.
 *
 * An example use is with provisioning.cattle.io.cluster, where a custom helper can be added via an extension
 * to support new provisioners.
 */

// ==============================================================================================

/**
 * Interface for an object that can determine if it should be used for a given model
 */
interface UseForModel {
  name: string,
  useForModel: (model: any) => boolean,
}

// Expected properties on the model
interface IModel {
  $rootState: any;
  $dispatch: any;
  $getters: any;
  $axios: any;
  $plugin: any;
  t: any;
  _modelHelper?: any;
  annotations: {[key: string]: string};
}

// Function that for a model will return the name of the model extension to use for it
type UseForFunction = (model: any) => string;

// Cache of instantiated model helpers for a given model and helper name
const modelExtensionCache: {[modelName: string]: {[name: string]: any[]}} = {};

// Cache of instantiated functions to determine if a helper should be used for a given model
const modelExtensionUseForCache: {[modelName: string]: UseForModel[]} = {};

// ==============================================================================================

export class ModelExtensions {
  constructor(private model: IModel, private modelExtensionName: string, private defaultUseFor?: UseForFunction) {
    // Initialize the cache if needed for this model extension name
    if (!modelExtensionCache[this.modelExtensionName]) {
      modelExtensionCache[this.modelExtensionName] = {};
    }
  }

  /**
   * Get a model helper for the model
   */
  get modelHelper(): any {
    // Use cached helper if set
    if (this.model._modelHelper) {
      return this.model._modelHelper;
    }

    // First ask all of the helpers that have a 'useForModel' function if they should be used
    let helper = this.useForHelpers.find((h) => h.useForModel(this.model))?.name;

    // If no helper and we have a default function, look for a helper that matches the value returned by the function
    if (!helper && this.defaultUseFor) {
      helper = this.defaultUseFor(this.model);
    }

    // Cache for next time
    this.model._modelHelper = helper ? this.instantiateModelHelper(helper) : undefined;

    return this.model._modelHelper;
  }

  /**
   * Go through all of the extension helpers with the required name and find the ones that
   * have a custom 'useForModel' static function and return those as an array
   *
   * Cache this list for a given model extension so we can use it in future calls
   */
  get useForHelpers(): UseForModel[] {
    if (!modelExtensionUseForCache[this.modelExtensionName]) {
      modelExtensionUseForCache[this.modelExtensionName] = [];

      const helpers = this.model.$rootState.$plugin.listDynamic(this.modelExtensionName);

      helpers.forEach((name: string) => {
        const customProvisionerCls = this.model.$rootState.$plugin.getDynamic(this.modelExtensionName, name);
        const useForModel = customProvisionerCls.useForModel;

        if (useForModel) {
          modelExtensionUseForCache[this.modelExtensionName].push({
            name,
            useForModel
          });
        }
      });
    }

    return modelExtensionUseForCache[this.modelExtensionName];
  }

  /**
   * Instantiate the given model helper
   *
   * @param name Name of the helper
   * @returns Instance of the helper
   */
  instantiateModelHelper(name: string): any {
    // Check if we have an instance of the helper already cached
    if (!modelExtensionCache[this.modelExtensionName][name]) {
      const customProvisionerCls = this.model.$rootState.$plugin.getDynamic(this.modelExtensionName, name);

      if (customProvisionerCls) {
        const context = {
          dispatch: this.model.$dispatch,
          getters:  this.model.$getters,
          $axios:   this.model.$axios,
          $plugin:  this.model.$plugin,
          $t:       this.model.t
        };

        modelExtensionCache[this.modelExtensionName][name] = new customProvisionerCls(context);
      }
    }

    return modelExtensionCache[this.modelExtensionName][name];
  }
}
