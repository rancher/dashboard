import MgmtNodePool from '@shell/models/management.cattle.io.nodepool';

describe('class MgmtNodePool', () => {
  describe('canScaleDownPool', () => {
    const mgmtClusterId = 'test';
    const nodeId = 'test/id';
    const specs = {
      worker: {
        worker: true, etcd: false, controlPlane: false
      },
      etcd: {
        worker: false, etcd: true, controlPlane: false
      },
      controlPlane: {
        worker: false, etcd: false, controlPlane: true
      },
      etcdAndControlPlane: {
        worker: false, etcd: true, controlPlane: true
      },
      all: {
        worker: true, etcd: true, controlPlane: true
      }
    };

    const workerNode = {
      id:             '01',
      isWorker:       true,
      isControlPlane: false,
      isEtcd:         false
    };
    const etcdNode = {
      id:             '02',
      isWorker:       false,
      isControlPlane: false,
      isEtcd:         true
    };
    const controlPlaneNode = {
      id:             '03',
      isWorker:       false,
      isControlPlane: true,
      isEtcd:         false
    };
    const etcdAndControlPlaneNode = {
      id:             '03',
      isWorker:       false,
      isControlPlane: true,
      isEtcd:         true
    };
    const allNode = {
      id:             '04',
      isWorker:       true,
      isControlPlane: true,
      isEtcd:         true
    };

    const baseCtx = { rootGetters: { 'rancher/byId': () => ({ actions: { scaledown: 'scaledown' } }) } };

    it.each([
      [{ spec: specs.worker, nodes: [workerNode] }, true],
      [{ spec: specs.etcd, nodes: [etcdNode, etcdNode, controlPlaneNode] }, true],
      [{ spec: specs.etcdAndControlPlane, nodes: [etcdAndControlPlaneNode, etcdAndControlPlaneNode] }, true],
      [{ spec: specs.etcdAndControlPlane, nodes: [etcdAndControlPlaneNode] }, false],
      [{ spec: specs.all, nodes: [allNode] }, false],
      [{ spec: specs.all, nodes: [allNode, allNode] }, true],
    ])('should return canScaleDownPool properly', (data, expected) => {
      const { spec, nodes } = data;
      const mgmtNode = new MgmtNodePool({
        spec,
        id: nodeId
      }, {
        ...baseCtx,
        getters: {
          all: () => [{
            mgmtClusterId,
            nodes
          }]
        }
      });

      expect(mgmtNode.canScaleDownPool()).toStrictEqual(expected);
    });
  });
});
