import ComplianceProfile from '@shell/models/compliance.cattle.io.clusterscanprofile';

describe('class: ComplianceProfile', () => {
  describe('getter: numberTestsSkipped', () => {
    it('should return 0 if skipTests is not present in spec', () => {
      const complianceProfile = new ComplianceProfile({ spec: {} });

      expect(complianceProfile.numberTestsSkipped).toBe(0);
    });

    it('should return 0 if skipTests is null', () => {
      const complianceProfile = new ComplianceProfile({ spec: { skipTests: null } });

      expect(complianceProfile.numberTestsSkipped).toBe(0);
    });

    it('should return 0 if skipTests is an empty array', () => {
      const complianceProfile = new ComplianceProfile({ spec: { skipTests: [] } });

      expect(complianceProfile.numberTestsSkipped).toBe(0);
    });

    it('should return the correct number of skipped tests', () => {
      const tests = ['test-1', 'test-2', 'test-3'];
      const complianceProfile = new ComplianceProfile({ spec: { skipTests: tests } });

      expect(complianceProfile.numberTestsSkipped).toBe(tests.length);
    });
  });
});
