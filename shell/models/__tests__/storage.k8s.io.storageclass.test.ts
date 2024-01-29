import StorageClass, { PROVISIONER_OPTIONS } from '@shell/models/storage.k8s.io.storageclass';
const yaml = require('js-yaml');
const fs = require('fs');

describe('class StorageClass', () => {
  describe('checking if provisionerDisplay', () => {
    const provisionerDisplaySuffix = '(CSI)';
    const translationData = yaml.load(fs.readFileSync(`${ process.cwd() }/shell/assets/translations/en-us.yaml`, 'utf8'));

    it.each([
      [PROVISIONER_OPTIONS[2].value, true],
      [PROVISIONER_OPTIONS[6].value, true],
      ['rancher.io/local-path', false],
      ['some-random-string-as-provisioner', false]
    ])('should NOT show a suffix IF they are built-in (on the PROVISIONER_OPTIONS list)', (provisioner, expectation) => {
      const storageClass = new StorageClass({
        metadata: {},
        spec:     {},
        provisioner
      });

      const transl = jest.fn((arg) => translationData[arg] || '');
      const fb = jest.fn(() => `${ provisioner } ${ provisionerDisplaySuffix }`);

      jest.spyOn(storageClass, '$rootGetters', 'get').mockReturnValue({ 'i18n/t': transl, 'i18n/withFallback': fb });

      expect(!storageClass.provisionerDisplay.includes(provisionerDisplaySuffix)).toBe(expectation);
    });
  });
});
