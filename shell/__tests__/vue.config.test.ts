const { getWatcherIgnored } = require('../vue-config-utils.js');

describe('shell vue.config', () => {
  describe('getWatcherIgnored', () => {
    it('includes the default ignored directories', () => {
      const ignored: RegExp = getWatcherIgnored();

      expect(ignored.test('/tmp/node_modules/some-package/index.js')).toBe(true);
      expect(ignored.test('/tmp/dist-pkg/index.js')).toBe(true);
      expect(ignored.test('/tmp/scripts/standalone/dev.js')).toBe(true);
    });

    it('includes excluded package paths and escapes regex characters', () => {
      const ignored: RegExp = getWatcherIgnored(['harvester', 'foo.bar']);

      expect(ignored.test('/workspace/node_modules/some-package/index.ts')).toBe(true);
      expect(ignored.test('/workspace/pkg.harvester/index.ts')).toBe(true);
      expect(ignored.test('/workspace/pkg.foo.bar/index.ts')).toBe(true);
      expect(ignored.test('/workspace/pkg.harvester')).toBe(false);
      expect(ignored.test('/workspace/pkg-harvester/index.ts')).toBe(false);
      expect(ignored.test('/workspace/pkg.other/index.ts')).toBe(false);
      expect(ignored.test('/workspace/pkgXfooYbar/index.ts')).toBe(false);
    });
  });
});
