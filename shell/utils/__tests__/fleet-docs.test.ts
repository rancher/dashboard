import { getDownstreamResourcesDocsUrl, getBundleDeploymentOptionsDocsUrl, getGitRepoRestrictionMigrationDocsUrl } from '@shell/utils/fleet-docs';
import { getVersionData, isRancherPrime } from '@shell/config/version';

// The docs URLs depend on the running Rancher version and whether it's a Prime install, both
// read from the server version data, so mock it. CURRENT_RANCHER_VERSION is the fallback used
// for dev/head builds that don't report a clean X.Y.Z.
jest.mock('@shell/config/version', () => ({
  getVersionData:          jest.fn(() => ({ Version: 'v2.15.1', RancherPrime: 'false' })),
  isRancherPrime:          jest.fn(() => false),
  CURRENT_RANCHER_VERSION: '2.15',
}));

const mockVersionData = (version: string, isPrime = false) => {
  (getVersionData as jest.Mock).mockReturnValue({ Version: version, RancherPrime: isPrime ? 'true' : 'false' });
  (isRancherPrime as jest.Mock).mockReturnValue(isPrime);
};

describe('fleet-docs utils', () => {
  describe('getDownstreamResourcesDocsUrl (AppCo, Prime-aware)', () => {
    it('should use the community docs at the root on a later release when not Prime', () => {
      mockVersionData('v2.15.1', false);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://fleet.rancher.io/how-tos-for-users/downstream-resource-propagation');
    });

    it('should use the community "next" docs on the release that introduced them', () => {
      mockVersionData('v2.15.0', false);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://fleet.rancher.io/next/how-tos-for-users/downstream-resource-propagation');
    });

    it('should use the community docs at the root on a later minor', () => {
      mockVersionData('v2.16.0', false);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://fleet.rancher.io/how-tos-for-users/downstream-resource-propagation');
    });

    it('should use the latest SUSE docs on a later release when Prime', () => {
      mockVersionData('v2.15.1', true);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/latest/en/how-tos-for-users/downstream-resource-propagation.html');
    });

    it('should use the SUSE "next" docs on the introducing release when Prime', () => {
      mockVersionData('v2.15.0', true);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/next/en/how-tos-for-users/downstream-resource-propagation.html');
    });

    it('should fall back to the community "next" docs for dev/head builds', () => {
      mockVersionData('master-head', false);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://fleet.rancher.io/next/how-tos-for-users/downstream-resource-propagation');
    });

    it('should fall back to the SUSE "next" docs for dev/head builds when Prime', () => {
      mockVersionData('master-head', true);
      expect(getDownstreamResourcesDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/next/en/how-tos-for-users/downstream-resource-propagation.html');
    });
  });

  describe('getBundleDeploymentOptionsDocsUrl (AppCo, Prime-aware, with anchor)', () => {
    it('should use the community CRD reference (with anchor) at the root on a later release when not Prime', () => {
      mockVersionData('v2.15.1', false);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://fleet.rancher.io/reference/ref-crds#_bundledeploymentoptions');
    });

    it('should use the community "next" CRD reference (with anchor) on the release that introduced them', () => {
      mockVersionData('v2.15.0', false);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://fleet.rancher.io/next/reference/ref-crds#_bundledeploymentoptions');
    });

    it('should use the latest SUSE CRD reference (with anchor) on a later release when Prime', () => {
      mockVersionData('v2.15.1', true);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/latest/en/reference/ref-crds.html#_bundledeploymentoptions');
    });

    it('should use the SUSE "next" CRD reference (with anchor) on the release that introduced them when Prime', () => {
      mockVersionData('v2.15.0', true);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/next/en/reference/ref-crds.html#_bundledeploymentoptions');
    });

    it('should fall back to the community "next" CRD reference for dev/head builds', () => {
      mockVersionData('master-head', false);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://fleet.rancher.io/next/reference/ref-crds#_bundledeploymentoptions');
    });

    it('should fall back to the SUSE "next" CRD reference for dev/head builds when Prime', () => {
      mockVersionData('master-head', true);
      expect(getBundleDeploymentOptionsDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/next/en/reference/ref-crds.html#_bundledeploymentoptions');
    });
  });

  describe('getGitRepoRestrictionMigrationDocsUrl (Prime-aware, with anchor)', () => {
    it('should use the community docs (with anchor) at the root on a later release', () => {
      mockVersionData('v2.15.1', false);
      expect(getGitRepoRestrictionMigrationDocsUrl()).toStrictEqual('https://fleet.rancher.io/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction');
    });

    it('should use the community "next" docs (with anchor) on the release that introduced them', () => {
      mockVersionData('v2.15.0', false);
      expect(getGitRepoRestrictionMigrationDocsUrl()).toStrictEqual('https://fleet.rancher.io/next/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction');
    });

    it('should use the latest SUSE docs (with anchor) on a later release when Prime', () => {
      mockVersionData('v2.15.1', true);
      expect(getGitRepoRestrictionMigrationDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/latest/en/how-tos-for-operators/tenant-setup.html#_migration_from_gitreporestriction');
    });

    it('should use the SUSE "next" docs (with anchor) on the release that introduced them when Prime', () => {
      mockVersionData('v2.15.0', true);
      expect(getGitRepoRestrictionMigrationDocsUrl()).toStrictEqual('https://documentation.suse.com/cloudnative/continuous-delivery/next/en/how-tos-for-operators/tenant-setup.html#_migration_from_gitreporestriction');
    });
  });
});
