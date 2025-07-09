/**
 * A function to run as part of the save cluster process
 */
export type ClusterSaveHook = (cluster: any) => Promise<any>

/**
 * Register a function to run as part of the save cluster process
 *
 * @param hook function to run
 * @param name unique identifier
 * @param priority higher numbers are lower priority
 * @param fnContext the `this` context from inside the function. If left blank will be a Vue component (where this.value will be the cluster)
 */
export type RegisterClusterSaveHook = (hook: ClusterSaveHook, name: string, priority?: number, fnContext?: any) => void;

export type ClusterDetailTabs = {
  /**
   * RKE2 machine pool tabs
   */
  machines: boolean,
  /**
   * RKE2 provisioning logs
   */
  logs: boolean,
  /**
   * RKE2 registration commands
   */
  registration: boolean,
  /**
   * RKE2 snapshots
   */
  snapshots: boolean,
  /**
   * Kube resources related to the instance of provisioning.cattle.io.cluster
   */
  related: boolean,
  /**
   * Kube events associated with the instance of provisioning.cattle.io.cluster
   */
  events: boolean,
  /**
   * Kube conditions of the provisioning.cattle.io.cluster instance
   */
  conditions: boolean
};

/**
 * Params used when constructing an instance of the cluster provisioner
 */
export interface ClusterProvisionerContext {
  /**
   * Dispatch vuex actions
   */
  dispatch: any,
  /**
   * Get from vuex store
   */
  getters: any,
  /**
   * Used to make http requests
   */
  axios: any,
  /**
   * Definition of the extension
   */
  $plugin: any,
  /**
   * Function to retrieve a localised string
   */
  t: (key: string) => string,
  /**
   * Are we in the context of creating a cluster
   */
  isCreate: boolean
  /**
   * Are we in the context of editing an existing cluster
   */
  isEdit: boolean
  /**
   * Are we viewing an existing cluster
   */
  isView: boolean
}

/**
 * Interface that a custom Cluster Provisioner should implement
 *
 * The majority of these hooks are used in shell/edit/provisioning.cattle.io.cluster/rke2.vue
 */
export interface IClusterProvisioner {
  /**
   * Unique ID of the Cluster Provisioner
   * If this overlaps with the name of an existing provisioner (seen in the type query param while creating a cluster) this provisioner will overwrite the built-in ui
   */
  id: string;

  /**
   * Should the UI show a namespace selector when using this provisioner
   */
  namespaced?: boolean;

  /* --------------------------------------------------------------------------------------
   * Define how the cluster provider is presented in a card to the user
   * --------------------------------------------------------------------------------------- */

  /**
   * If missing the `cluster.provider.<provider id>` translation will be used
   *
   * It is recommended to not hardcode anything that might be localised
   */
  label?: string;

  /**
   * The description will be shown when the user is selecting the type of cluster provider
   *
   * This isn't normally used.
   */
  description?: string;

  /**
   * Icon shown when the user is selecting the type of cluster provider
   */
  icon?: any;

  /**
   * Cluster providers are in groups
   *
   * `rke2` - default
   * `kontainer`
   * `custom2`
   */
  group?: string;

  /**
   * Disable the cluster provider card
   */
  disabled?: boolean;

  /**
   * Hide the cluster provider card
   */
  hidden?: boolean;

  /**
   * Custom Dashboard route to navigate to when the cluster provider card is clicked
   */
  link?: string;

  /**
   * Text to show top right on the cluster provider card. For example `Experimental`
   */
  tag?: string;
  /**
   * Hide the provider card in the cluster creation flow.
   * By default we show providers in create wizard, however, there are some providers we want to only show on import.
   * For that case, we should set hideCreate to true and showImport to true.
   * If not set, the card will be shown in the cluster creation page
   */
  hideCreate?: boolean

  /**
   * Also show the provider card in the cluster importing flow
   * If not set, the card will only be shown in the cluster creation page
   */
  showImport?: boolean

  /* --------------------------------------------------------------------------------------
   * Custer Details View
   * --------------------------------------------------------------------------------------- */

  /**
   * Existing tabs to show or hide in the cluster's detail view
   *
   * `plugin.addTab(TabLocation.RESOURCE_DETAIL... ` can be used to add additional tabs to the same view
   */
  detailTabs: {
    /**
     * RKE2 machine pool tabs
     */
    machines: boolean,
    /**
     * RKE2 provisioning logs
     */
    logs: boolean,
    /**
     * RKE2 registration commands
     */
    registration: boolean,
    /**
     * RKE2 snapshots
     */
    snapshots: boolean,
    /**
     * Kube resources related to the instance of provisioning.cattle.io.cluster
     */
    related: boolean,
    /**
     * Kube events associated with the instance of provisioning.cattle.io.cluster
     */
    events: boolean,
    /**
     * Kube conditions of the provisioning.cattle.io.cluster instance
     */
    conditions: boolean
  };

  /* --------------------------------------------------------------------------------------
   * Getters / Functions for Managing Machine Configs
  * --------------------------------------------------------------------------------------- */

  /**
   * Schema for machine config object. For example rke-machine-config.cattle.io.digitaloceanconfig
   *
   * The `id` should be in the format of `rke-machine-config.cattle.io.${ provider id }config`
   *
   * The `attributes: { kind: <value> }` should match the last part of the id
   * The `attributes: { group: <value> }` should match the remaining parts of the id
   */
  machineConfigSchema?: { [key: string]: any };

  /**
   * Override the default method to create a machine config object that will be inserted into a new machine pool
   *
   * The machine config will be an instance related to the machine config schema
   *
   * This is usually used when the user has selected to add a machine pool when creating/editing the cluster.
   *
   * > If the user updates the cluster's namespace after pools have been created.... the machine config's will need updating later on
   *
   * @param idx Index of new pool
   * @param pools Existing machine pools
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   * @returns Instance of a machine config
   */
  createMachinePoolMachineConfig?(idx: number, pools: any[], cluster: any): Promise<{[key: string]: any}>;

  /**
   * Override the default process to save the machine config's associated with the machine pools
   *
   * If machine config's will be the pool's `config` property.
   *
   * The pool will have `create: true` if the pool is new or `update: true` if the pool already exists
   *
   * For information on proxying HTTP requests from the browser via Rancher https://rancher.github.io/dashboard/code-base-works/machine-drivers#api-calls
   * These docs also cover how to reference a Cloud Credential and use it's properties in the proxy's request `Authorization` header
   *
   * @param pools Machine pools
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   * @returns Content of async result / promise N/A, only the success / fail state
   */
  saveMachinePoolConfigs?(pools: any[], cluster: any): Promise<any>

  /* --------------------------------------------------------------------------------------
   * Optionally override parts of the cluster save process with
   * - hooks that run before or after the cluster resource is saved
   * - the actual save of the cluster resource
  * --------------------------------------------------------------------------------------- */

  /**
   * Update the cluster before and or after the cluster is saved
   *
   * @param registerBeforeHook
   *  Call `registerBeforeHook` with a function. The function will be executed before the cluster is saved.
   *  This allows the model used in the API request to be updated before being sent
   * @param registerAfterHook
   *  Call `registerAfterHook` with a function. The function will be executed after the cluster has been saved.
   *  This allows the model received in response to the API request to be updated
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   */
  registerSaveHooks?(registerBeforeHook: RegisterClusterSaveHook, registerAfterHook: RegisterClusterSaveHook, cluster: any): void;

  /**
   * Optionally override the save of the cluster resource itself
   *
   * https://github.com/rancher/dashboard/blob/master/shell/mixins/create-edit-view/impl.js#L179
   *
   * This means a lot of the generic handling of cluster provisioning is not skipped (as per the `provision` method)
   *
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   * @returns Rejected promise / exception from `await` if failed to save
   */
  saveCluster?(cluster: any): Promise<any>

  /* --------------------------------------------------------------------------------------
   * Optionally override all of cluster save process
   * --------------------------------------------------------------------------------------- */

  /**
   * Optionally override all of the ui's save cluster process (including hooks and saving the resource)
   *
   * https://github.com/rancher/dashboard/blob/master/shell/edit/provisioning.cattle.io.cluster/rke2.vue#L1420
   *
   * For information on proxying HTTP requests from the browser via Rancher https://rancher.github.io/dashboard/code-base-works/machine-drivers#api-calls
   * These docs also cover how to reference a Cloud Credential and use it's properties in the proxy's request `Authorization` header
   *
   * @param pools Machine pools
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   * @param isCreate True if the cluster is being created, false if an existing cluster being edited
   * @returns Array of errors. If there are no errors the array will be empty
   */
  provision?(cluster: any, pools: any[]): Promise<any[]>;
}

/**
 * Interface that a model extension for the provisioning cluster model should implement
 */
export interface IClusterModelExtension {
  /**
   * Indicates if this extension should be used for the given cluster
   *
   * This allows the extension to determine if it should be used for a cluster based on attributes/metadata of its choosing
   *
   * @param cluster The cluster model (`provisioning.cattle.io.cluster`)
   * @returns Whether to use this provisioner for the given cluster.
   */
  useFor(cluster: any): boolean;

  /**
   * Optionally Process the available actions for a cluster and return a (possibly modified) set of actions
   *
   * @param cluster The cluster model (`provisioning.cattle.io.cluster`)
   * @returns List of actions for the cluster or undefined if the list is modified in-place
   */
  availableActions?(cluster: any, actions: any[]): any[] | undefined;

  /**
   * Get the display name for the machine provider for this model
   *
   * @param cluster The cluster model (`provisioning.cattle.io.cluster`)
   * @returns Machine provider display name
   */
  machineProviderDisplay?(cluster: any): string;

  /**
   * Get the display name for the provisioner for this model
   *
   * @param cluster The cluster model (`provisioning.cattle.io.cluster`)
   * @returns Provisioner display name
   */
  provisionerDisplay?(cluster: any): string;

  /**
   * Get the parent cluster for this cluster, or undefined if no parent cluster
   *
   * @param cluster The cluster model (`provisioning.cattle.io.cluster`)
   * @returns ID of the parent cluster
   */
  parentCluster?(cluster: any): string;

  /**
   * Function to run after the cluster has been deleted
   *
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   */
  postDelete?(cluster: any): void;

  /**
   * Existing tabs to show or hide in the cluster's detail view
   */
  get detailTabs(): ClusterDetailTabs;
}
