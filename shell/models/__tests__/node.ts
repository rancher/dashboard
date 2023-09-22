import Node from '@shell/models/management.cattle.io.node';

describe('class Node', () => {
  const foo = 'foo';
  const bar = 'bar';
  const t = jest.fn(() => bar);
  const ctx = { rootGetters: { 'i18n/t': t } };

  const resetMocks = () => {
    // Clear all mock function calls:
    jest.clearAllMocks();
  };

  it('should not return addresses if they are not present in the resource status', () => {
    const node = new Node({ status: {} });

    expect(node.addresses).toStrictEqual([]);
    resetMocks();
  });

  describe('should return addresses', () => {
    const addresses = [foo];

    it('if they are present directly on the resource status', () => {
      const node = new Node({ status: { addresses } });

      expect(node.addresses).toStrictEqual(addresses);
    });
  });

  describe('should return an internalIp', () => {
    const addresses = [{ type: 'InternalIP', address: foo }];

    it('if addresses includes an object with an appropriate type and address', () => {
      const node = new Node({ status: { addresses } });

      expect(node.internalIp).toStrictEqual(foo);
    });
  });

  describe('should return an externalIp', () => {
    const addresses = [{ type: 'ExternalIP', address: foo }];

    it('if addresses includes an object with an appropriate type and address', () => {
      const node = new Node({ status: { addresses } });

      expect(node.externalIp).toStrictEqual(foo);
    });
    it('if internalNodeStatus.addresses includes an object with an appropriate type and address', () => {
      const node = new Node({ status: { internalNodeStatus: { addresses } } });

      expect(node.externalIp).toStrictEqual(foo);
    });
  });

  describe('should return an appropriate message', () => {
    it('if there is no internalIp to display', () => {
      const node = new Node({ status: {} }, ctx);

      expect(node.internalIp).toStrictEqual(bar);
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('generic.none');
      resetMocks();
    });
    it('if there is no externalIp to display', () => {
      const node = new Node({ status: {} }, ctx);

      expect(node.externalIp).toStrictEqual(bar);
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('generic.none');
      resetMocks();
    });
  });
});
