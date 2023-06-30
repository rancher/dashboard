export type SaveHook = (hook: Function, name: string) => void;

/**
 * Interface that a custom Cluster Provisioner should implement
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
}
