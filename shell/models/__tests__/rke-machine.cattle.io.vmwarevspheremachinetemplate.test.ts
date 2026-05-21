import VmwarevsphereMachineTemplate from '@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate';

describe('class VmwarevsphereMachineTemplate', () => {
  describe('providerLocation', () => {
    it.each([
      ['/DC1/host/ClusterA/Resources', 'ClusterA'],
      ['/DC1/host/ClusterA/Resources/PoolX', 'ClusterA'],
      ['/DC1/host/esxi01/Resources', 'esxi01'],
      ['/DC1/vm/FolderA', null],
      [undefined, null],
    ])('should derive provider location from pool path %p', (pool: string | undefined, expected: string | null) => {
      const machineTemplate = new VmwarevsphereMachineTemplate({
        spec: {
          template: {
            spec: { pool }
          }
        }
      });

      expect(machineTemplate.providerLocation).toStrictEqual(expected);
    });
  });
});
