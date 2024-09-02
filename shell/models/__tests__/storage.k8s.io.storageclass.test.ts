import StorageClass, { PROVISIONER_OPTIONS } from '@shell/models/storage.k8s.io.storageclass';

describe('class StorageClass', () => {
  describe('checking if provisionerDisplay', () => {
    it.each([
      ['kubernetes.io/azure-disk', true],
      ['kubernetes.io/portworx-volume', true],
      ['rancher.io/local-path', false],
      ['some-random-string-as-provisioner', false],
    ])('should NOT show a suffix IF they are built-in (on the PROVISIONER_OPTIONS list)', (provisioner, expectation) => {
      const storageClass = new StorageClass({
        metadata: {},
        spec:     {},
        provisioner
      });

      jest.spyOn(storageClass, '$rootGetters', 'get').mockReturnValue({ 'i18n/t': jest.fn() });

      expect(!!PROVISIONER_OPTIONS.find((opt) => opt.value === provisioner)).toBe(expectation);
    });
  });
});
