import VmwarevsphereMachineTemplate from '@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate';

describe('class VmwarevsphereMachineTemplate', () => {
  describe('providerLocation', () => {
    it.each([
      ['/DC1/host/ClusterA/Resources', 'ClusterA'],
      ['/DC1/host/ClusterA/Resources/PoolX', 'ClusterA'],
      ['/DC1/host/ClusterA/Resources/', 'ClusterA'],
      ['/DC1/host/esxi01/Resources', 'esxi01'],
      ['/DC1/vm/FolderA', null],
      ['/DC1/host/foo/ResourcesPool/bar', null],
      ['/DC1/host//Resources/PoolX', null],
      ['', null],
      [null, null],
      [undefined, null],
    ])('returns %p for pool %p', (pool: string | null | undefined, expected: string | null) => {
      const machineTemplate = new VmwarevsphereMachineTemplate({ spec: { template: { spec: { pool } } } });

      expect(machineTemplate.providerLocation).toStrictEqual(expected);
    });
  });
});
