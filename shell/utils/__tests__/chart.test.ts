import { compareChartVersions } from '@shell/utils/chart';

describe('compareChartVersions', () => {
  describe('standard SemVer Comparison', () => {
    it('should correctly compare standard versions', () => {
      expect(compareChartVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareChartVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareChartVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should compare minor and patch versions correctly', () => {
      expect(compareChartVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareChartVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareChartVersions('1.1.0', '1.0.1')).toBe(1);
    });

    it('should handle loose parsing (v-prefix)', () => {
      expect(compareChartVersions('v1.0.0', '1.0.0')).toBe(0);
      expect(compareChartVersions('v1.0.0', 'v2.0.0')).toBe(-1);
    });
  });

  describe('rancher "up" Build Metadata Logic', () => {
    it('should compare inner versions when both have "up" prefix', () => {
      // 1.0.0 vs 2.0.0 inside the metadata
      expect(compareChartVersions('1.0.0+up1.0.0', '1.0.0+up2.0.0')).toBe(-1);
      expect(compareChartVersions('1.0.0+up2.0.0', '1.0.0+up1.0.0')).toBe(1);
      // Equal inner versions
      expect(compareChartVersions('1.0.0+up1.0.0', '1.0.0+up1.0.0')).toBe(0);
    });

    it('should handle pre-releases within "up" metadata correctly', () => {
      // Crucial test: semver logic ensures 1.0.0-rc.1 < 1.0.0
      // Standard string sort would often fail here depending on the string
      expect(compareChartVersions('1.0.0+up1.0.0-rc.1', '1.0.0+up1.0.0')).toBe(-1);
      expect(compareChartVersions('1.0.0+up1.0.0', '1.0.0+up1.0.0-rc.1')).toBe(1);
    });

    it('should compare different inner major/minor/patch versions', () => {
      expect(compareChartVersions('0.0.1+up1.0.0', '0.0.1+up0.1.0')).toBe(1);
      expect(compareChartVersions('0.0.1+up0.1.0', '0.0.1+up1.0.0')).toBe(-1);
    });

    it('should prioritize valid inner semver over invalid inner semver', () => {
      // Valid "up" version > Invalid "up" version
      expect(compareChartVersions('1.0.0+up1.0.0', '1.0.0+upInvalid')).toBe(1);
      expect(compareChartVersions('1.0.0+upInvalid', '1.0.0+up1.0.0')).toBe(-1);
    });

    it('should fall back to lexical sort if both "up" suffixes are invalid semver', () => {
      // Both are "up..." but not valid semver, so it falls back to semver.compareBuild (lexical)
      expect(compareChartVersions('1.0.0+upA', '1.0.0+upB')).toBe(-1);
      expect(compareChartVersions('1.0.0+upB', '1.0.0+upA')).toBe(1);
    });
  });

  describe('standard Build Metadata Fallback', () => {
    it('should correctly compare versions with standard build metadata (lexicographical)', () => {
      // 1.0.0+a vs 1.0.0+b -> -1
      expect(compareChartVersions('1.0.0+a', '1.0.0+b')).toBe(-1);
      expect(compareChartVersions('1.0.0+b', '1.0.0+a')).toBe(1);
      // 1.0.0+1 vs 1.0.0+2 -> -1
      expect(compareChartVersions('1.0.0+1', '1.0.0+2')).toBe(-1);
    });

    it('should use standard comparison if only one has "up" prefix', () => {
      // "up" comes after "foo" lexically
      expect(compareChartVersions('1.0.0+foo', '1.0.0+up1.0.0')).toBe(-1);
      expect(compareChartVersions('1.0.0+up1.0.0', '1.0.0+foo')).toBe(1);
    });
  });

  describe('edge Cases and Invalid Inputs', () => {
    it('should handle null or undefined inputs safely', () => {
      // Implementation behavior: fallback to utils/version compare
      // which treats falsy as "high" (return 1) if first arg is null?
      // Checking implementation of `compare` in shell/utils/version.js:
      // if (!in1) return 1; if (!in2) return -1;
      expect(compareChartVersions(null, '1.0.0')).toBe(1);
      expect(compareChartVersions('1.0.0', null)).toBe(-1);
      expect(compareChartVersions(undefined, '1.0.0')).toBe(1);
      expect(compareChartVersions('1.0.0', undefined)).toBe(-1);
      expect(compareChartVersions(null, null)).toBe(1); // First check is !in1 -> 1
    });

    it('should handle completely invalid strings', () => {
      // "invalid" is not valid semver, so it falls back to utils/version compare (string/numeric comparison)
      // "invalid" vs "1.0.0"
      // "invalid" is treated as string, "1.0.0" parsed as parts
      // Effectively tests the fallback logic stability
      expect(compareChartVersions('invalid', '1.0.0')).not.toBe(0);
      expect(compareChartVersions('a', 'b')).toBe(-1);
      expect(compareChartVersions('b', 'a')).toBe(1);
    });
  });
});
