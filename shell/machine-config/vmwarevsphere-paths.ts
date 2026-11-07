/**
 * Helpers to resolve vSphere inventory paths in the same way as the vSphere driver (govmomi finder).
 * Machine configs created outside of Rancher (e.g. Terraform) can contain values relative to the datacenter.
 */

// The datacenter folder the vSphere driver resolves relative values against
const DATACENTER_FOLDERS: Record<string, string> = {
  datastore:        'datastore',
  datastoreCluster: 'datastore',
  pool:             'host',
  hostsystem:       'host',
  cloneFrom:        'vm',
};

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

export const nameOnly = (path: string): string => {
  return path.split('/').pop() as string;
};

/**
 * Find the inventory paths a value resolves to
 * - '/dc1/datastore/ds1' must match exactly
 * - 'dir/ds1' is relative to the base folder, e.g. '/dc1/datastore/dir/ds1'
 * - 'ds1' matches every path with that name anywhere below the base folder
 */
export function findInventoryPaths(value: string, base: string, paths: string[]): string[] {
  if (value.startsWith('/')) {
    return paths.filter((p) => p === value);
  }

  if (value.includes('/')) {
    return paths.filter((p) => p === `${ base }/${ value }`);
  }

  return paths.filter((p) => p.startsWith(`${ base }/`) && nameOnly(p) === value);
}

/**
 * The full inventory path of a datacenter, e.g. 'dc1' => '/dc1'
 */
export function findDatacenterPath(datacenter: unknown, paths: string[]): string | undefined {
  if (typeof datacenter !== 'string' || !datacenter) {
    return undefined;
  }

  const matches = findInventoryPaths(datacenter, '', paths);

  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * The folder path used by the vSphere driver, see findFolder in rancher/machine drivers/vmwarevsphere/utils.go
 *
 * @param folder the folder value
 * @param datacenter the saved datacenter value
 * @param datacenterPath the full inventory path of the datacenter
 */
export function toFolderPath(folder: string, datacenter: string, datacenterPath: string): string {
  const vmFolder = `${ datacenterPath }/vm`;

  if (folder.startsWith(`${ datacenter.replace(/\/+$/, '') }/vm`)) {
    return folder.startsWith('/') ? folder : `${ datacenterPath }/${ folder }`;
  }

  return trimSlashes(folder) ? `${ vmFolder }/${ trimSlashes(folder) }` : vmFolder;
}

/**
 * A folder value the vSphere driver resolves to the given folder path
 */
export function toDriverFolder(path: string | null | undefined, datacenter: string, datacenterPath?: string): string {
  if (!path || !datacenterPath || toFolderPath(path, datacenter, datacenterPath) === path) {
    return path || '';
  }

  return trimSlashes(path.slice(`${ datacenterPath }/vm`.length));
}

/**
 * The option the vSphere driver resolves a value to
 *
 * @param key the machine config field
 * @param value the field value
 * @param options the option values
 * @param datacenter the saved datacenter value
 * @param datacenterPath the full inventory path of the datacenter
 */
export function findResolvedOption(key: string, value: unknown, options: string[], datacenter: string, datacenterPath: string): string | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  if (key === 'folder') {
    const folderPath = toFolderPath(value, datacenter, datacenterPath);

    return options.find((o) => toFolderPath(o, datacenter, datacenterPath) === folderPath);
  }

  const folder = DATACENTER_FOLDERS[key];

  if (!folder) {
    return undefined;
  }

  const matches = findInventoryPaths(value, `${ datacenterPath }/${ folder }`, options);

  return matches.length === 1 ? matches[0] : undefined;
}
