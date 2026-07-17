import CapiMachineDeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';

describe('class CapiMachineDeployment', () => {
  describe('scalePool', () => {
    it('should not allow quantity to become negative', () => {
      const machinePool = {
        machineConfigRef: { name: 'pool1' },
        quantity:         0,
      };
      const cluster = {
        spec: {
          rkeConfig: {
            machinePools: [machinePool]
          }
        }
      };
      const machineDeployment = new CapiMachineDeployment({
        metadata: { namespace: 'fleet-default' },
        spec:     {
          clusterName: 'test-cluster',
          template: {
            spec: {
              infrastructureRef: { name: 'pool1' }
            }
          }
        }
      }, {
        rootGetters: {
          'management/byId': jest.fn(() => cluster)
        }
      });

      machineDeployment.scalePool(-1, false);

      expect(machinePool.quantity).toBe(0);
    });
  });
});
