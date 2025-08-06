import MgmtNode from '@shell/models/management.cattle.io.node';

describe('class MgmtNode', () => {
  const foo = 'foo';
  const bar = 'bar';
  const t = jest.fn(() => bar);
  const ctx = { rootGetters: { 'i18n/t': t } };

  const resetMocks = () => {
    // Clear all mock function calls:
    jest.clearAllMocks();
  };

  it('should not return addresses if they are not present in the resource status, the internalNodeStatus, or the rkeNode key in status', () => {
    const mgmtNode = new MgmtNode({ status: {} });

    expect(mgmtNode.addresses).toStrictEqual([]);
    resetMocks();
  });

  describe('should return addresses', () => {
    const addresses = [foo];

    it('if they are present directly on the resource status', () => {
      const mgmtNode = new MgmtNode({ status: { addresses } });

      expect(mgmtNode.addresses).toStrictEqual(addresses);
    });
    it('if they are not present directly on the resource status but are on "status.internalNodeStatus"', () => {
      const mgmtNode = new MgmtNode({ status: { internalNodeStatus: { addresses } } });

      expect(mgmtNode.addresses).toStrictEqual(addresses);
    });
  });

  describe('should return an internalIp', () => {
    const addresses = [{ type: 'InternalIP', address: foo }];
    const internalAddress = foo;

    it('if addresses includes an object with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { addresses } });

      expect(mgmtNode.internalIp).toStrictEqual(foo);
    });
    it('if internalNodeStatus.addresses includes an object with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { internalNodeStatus: { addresses } } });

      expect(mgmtNode.internalIp).toStrictEqual(foo);
    });
    it('if addresses and internalNodeStatus.addresses do not provide an internal ip and the status includes an rkeNode key with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { rkeNode: { internalAddress } } });

      expect(mgmtNode.internalIp).toStrictEqual(internalAddress);
    });
  });

  describe('should return an externalIp', () => {
    const addresses = [{ type: 'ExternalIP', address: foo }];
    const address = foo;

    it('if addresses includes an object with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { addresses } });

      expect(mgmtNode.externalIp).toStrictEqual(foo);
    });
    it('if internalNodeStatus.addresses includes an object with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { internalNodeStatus: { addresses } } });

      expect(mgmtNode.externalIp).toStrictEqual(foo);
    });
    it('if addresses and internalNodeStatus.addresses do not provide an external ip and the status includes an rkeNode key with an appropriate type and address', () => {
      const mgmtNode = new MgmtNode({ status: { rkeNode: { address } } });

      expect(mgmtNode.externalIp).toStrictEqual(address);
    });
  });

  describe('should return an appropriate message', () => {
    it('if there is no internalIp to display', () => {
      const mgmtNode = new MgmtNode({ status: {} }, ctx);

      expect(mgmtNode.internalIp).toStrictEqual(bar);
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('generic.none');
      resetMocks();
    });
    it('if there is no externalIp to display', () => {
      const mgmtNode = new MgmtNode({ status: {} }, ctx);

      expect(mgmtNode.externalIp).toStrictEqual(bar);
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('generic.none');
      resetMocks();
    });
  });

  describe('canScaleDown', () => {
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

    const baseCtx = {
      rootGetters: {
        'rancher/byId': () => ({ actions: { scaledown: 'scaledown' } }),
        'i18n/t':       t
      }
    };

    it.each([
      [{ spec: specs.worker, nodes: [workerNode] }, true],
      [{ spec: specs.etcd, nodes: [etcdNode, etcdNode, controlPlaneNode] }, true],
      [{ spec: specs.etcdAndControlPlane, nodes: [etcdAndControlPlaneNode, etcdAndControlPlaneNode] }, true],
      [{ spec: specs.etcdAndControlPlane, nodes: [etcdAndControlPlaneNode] }, false],
      [{ spec: specs.all, nodes: [allNode] }, false],
      [{ spec: specs.all, nodes: [allNode, allNode] }, true],
    ])('should return canScaleDown properly', (data, expected) => {
      const { spec, nodes } = data;
      const mgmtNode = new MgmtNode({
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

      expect(mgmtNode.canScaleDown).toStrictEqual(expected);
    });
  });
});
