import {
  findDatacenterPath, findInventoryPaths, findResolvedOption, nameOnly, toDriverFolder, toFolderPath
} from '@shell/machine-config/vmwarevsphere-paths';

describe('vmwarevsphere-paths', () => {
  describe('nameOnly', () => {
    it.each([
      ['/dc1/network/net1', 'net1'],
      ['net1', 'net1'],
      ['', ''],
    ])('should return the last part of %p', (path, expected) => {
      expect(nameOnly(path)).toStrictEqual(expected);
    });
  });

  describe('findInventoryPaths', () => {
    const base = '/dc1/datastore';
    const paths = ['/dc1/datastore/ds1', '/dc1/datastore/dir/ds2', '/dc1/datastore/a/ds3', '/dc1/datastore/b/ds3', '/dc2/datastore/ds4'];

    it.each([
      ['/dc1/datastore/ds1', ['/dc1/datastore/ds1']],
      ['/dc1/datastore/missing', []],
      ['dir/ds2', ['/dc1/datastore/dir/ds2']],
      ['ds2', ['/dc1/datastore/dir/ds2']],
      ['ds3', ['/dc1/datastore/a/ds3', '/dc1/datastore/b/ds3']],
      ['ds4', []],
      ['missing', []],
    ])('should resolve %p to %p', (value, expected) => {
      expect(findInventoryPaths(value, base, paths)).toStrictEqual(expected);
    });
  });

  describe('findDatacenterPath', () => {
    it.each([
      ['dc1', ['/dc1', '/dc2'], '/dc1'],
      ['/dc1', ['/dc1', '/dc2'], '/dc1'],
      ['dc3', ['/dc1', '/folder1/dc3'], '/folder1/dc3'],
      ['folder1/dc3', ['/dc1', '/folder1/dc3'], '/folder1/dc3'],
    ])('should resolve %p with the options %p to %p', (datacenter, paths, expected) => {
      expect(findDatacenterPath(datacenter, paths)).toStrictEqual(expected);
    });

    it.each([
      ['dc1', ['/dc1', '/folder1/dc1']],
      ['dc3', ['/dc1', '/dc2']],
      ['', ['/dc1']],
      [undefined, ['/dc1']],
      [null, ['/dc1']],
    ])('should NOT resolve %p with the options %p', (datacenter, paths) => {
      expect(findDatacenterPath(datacenter, paths)).toBeUndefined();
    });
  });

  describe('toFolderPath', () => {
    it.each([
      ['', 'dc1', '/dc1', '/dc1/vm'],
      ['/', 'dc1', '/dc1', '/dc1/vm'],
      ['folder1', 'dc1', '/dc1', '/dc1/vm/folder1'],
      ['/folder1/', 'dc1', '/dc1', '/dc1/vm/folder1'],
      ['/dc1/vm/folder1', 'dc1', '/dc1', '/dc1/vm/dc1/vm/folder1'],
      ['dc1/vm/folder1', 'dc1', '/dc1', '/dc1/dc1/vm/folder1'],
      ['/dc1/vm/folder1', '/dc1', '/dc1', '/dc1/vm/folder1'],
      ['folder1', '/dc1', '/dc1', '/dc1/vm/folder1'],
      ['folder1', 'dc3', '/folder1/dc3', '/folder1/dc3/vm/folder1'],
    ])('should resolve folder %p in datacenter %p (%p) to %p', (folder, datacenter, datacenterPath, expected) => {
      expect(toFolderPath(folder, datacenter, datacenterPath)).toStrictEqual(expected);
    });
  });

  describe('toDriverFolder', () => {
    it.each([
      ['', 'dc1', '/dc1', ''],
      [null, 'dc1', '/dc1', ''],
      [undefined, 'dc1', '/dc1', ''],
      ['/dc1/vm/folder1', 'dc1', '/dc1', 'folder1'],
      ['/dc1/vm', 'dc1', '/dc1', ''],
      ['/dc1/vm/folder1', '/dc1', '/dc1', '/dc1/vm/folder1'],
      ['/dc1/vm/folder1', 'dc1', undefined, '/dc1/vm/folder1'],
    ])('should convert %p in datacenter %p (%p) to %p', (path, datacenter, datacenterPath, expected) => {
      expect(toDriverFolder(path, datacenter, datacenterPath)).toStrictEqual(expected);
    });
  });

  describe('findResolvedOption', () => {
    it.each([
      ['datastore', 'ds1', ['/dc1/datastore/ds1'], '/dc1/datastore/ds1'],
      ['datastore', 'dir/ds1', ['/dc1/datastore/dir/ds1'], '/dc1/datastore/dir/ds1'],
      ['datastoreCluster', 'dsc1', ['/dc1/datastore/dsc1'], '/dc1/datastore/dsc1'],
      ['pool', 'cluster1/Resources', ['/dc1/host/cluster1/Resources'], '/dc1/host/cluster1/Resources'],
      ['hostsystem', '10.0.0.1', ['', '/dc1/host/cluster1/10.0.0.1'], '/dc1/host/cluster1/10.0.0.1'],
      ['cloneFrom', 'template1', ['/dc1/vm/templates/template1'], '/dc1/vm/templates/template1'],
      ['folder', 'folder1', ['', 'folder1'], 'folder1'],
      ['folder', '/folder1/', ['', 'folder1'], 'folder1'],
      ['folder', '/', ['', 'folder1'], ''],
    ])('should resolve %p value %p with the options %p to %p', (key, value, options, expected) => {
      expect(findResolvedOption(key, value, options, 'dc1', '/dc1')).toStrictEqual(expected);
    });

    it.each([
      ['datastore', 'missing', ['/dc1/datastore/ds1']],
      ['datastore', 'ds1', ['/dc1/datastore/a/ds1', '/dc1/datastore/b/ds1']],
      ['datastore', 'ds1', ['/dc1/host/ds1']],
      ['pool', 'Resources', ['/dc1/host/cluster1/Resources', '/dc1/host/cluster2/Resources']],
      ['folder', '/dc1/vm/folder1', ['', 'folder1']],
      ['contentLibrary', 'library1', ['/dc1/library1']],
      ['datastore', '', ['/dc1/datastore/ds1']],
      ['datastore', null, ['/dc1/datastore/ds1']],
      ['datastore', ['ds1'], ['/dc1/datastore/ds1']],
    ])('should NOT resolve %p value %p with the options %p', (key, value, options) => {
      expect(findResolvedOption(key, value, options, 'dc1', '/dc1')).toBeUndefined();
    });
  });
});
