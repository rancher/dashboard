export type ClusterSaveHook = (hook: (cluster: any) => void, name: string, priority?: number, ) => void;

/**
 * Interface that a custom Cluster Provisioner should implement
 *
 * The majority of these hooks are used in shell/edit/provisioning.cattle.io.cluster/rke2.vue
 */
export interface IClusterProvisioner {

  /**
   * Unique ID of the Cluster Provisioner
   */
  id: String;

  /**
   * Should the UI show a namespace selector when using this provisioner
   */
  namespaced: Boolean;

  /**
   * Icon shown when the user is selecting the type of cluster provider
   */
  icon: any;

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
   * This is usually used when the user has selected to add a machine pool when creating/editing the cluster
   *
   * @param idx Index of new pool
   * @param pools Existing machine pools
   * @returns Instance of a machine config
   */
  createMachinePoolMachineConfig?(idx: number, pools: any[]): Promise<{[key: string]: any}>;

  /**
   * Update the cluster before and or after the cluster is saved
   *
   * @param registerBeforeHook
   *  Call `registerBeforeHook` with a function. The function will be executed before the cluster is saved.
   *  This allows the model used in the API request to be updated before being sent.
   * @param registerAfterHook
   *  Call `registerAfterHook` with a function. The function will be executed after the cluster has been saved.
   *  This allows the model received in response to the API request to be updated
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   */
  registerSaveHooks?(registerBeforeHook: ClusterSaveHook, registerAfterHook: ClusterSaveHook, cluster: any): void;

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

  /**
   * Override the default process to save the cluster (`provisioning.cattle.io.cluster`)
   *
   * For information on proxying HTTP requests from the browser via Rancher https://rancher.github.io/dashboard/code-base-works/machine-drivers#api-calls
   * These docs also cover how to reference a Cloud Credential and use it's properties in the proxy's request `Authorization` header
   *
   * @param pools Machine pools
   * @param cluster The cluster (`provisioning.cattle.io.cluster`)
   * @returns Array of errors. If there are no errors the array will be empty
   */
  provision?(cluster: any, pools: any[]): Promise<any[]>;
}
