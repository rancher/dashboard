import eksVersions from '../eks-versions';

const EKS_VERSION_REGEX = /^[0-9]+\.[0-9]+$/;

describe('eks versions', () => {
  it('should be valid version numbers', () => {
    eksVersions.forEach((version) => {
      const m = version.match(EKS_VERSION_REGEX);

      expect(m).not.toBe(undefined);
      expect(m).not.toBe(null);
      expect(m?.length).toBe(1);
      expect(m?.[0]).toBe(version);
    });
  });
});
