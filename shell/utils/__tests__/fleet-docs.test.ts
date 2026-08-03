import {
  getDownstreamResourcesDocsUrl, FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL, getContinuousDeliveryPoliciesDocsUrl, FLEET_CD_POLICIES_DOCS_FALLBACK_URL, getGitRepoRestrictionMigrationDocsUrl, FLEET_GITREPORESTRICTION_MIGRATION_DOCS_FALLBACK_URL
} from '@shell/utils/fleet-docs';

describe('fleet-docs utils', () => {
  describe('getDownstreamResourcesDocsUrl', () => {
    it.each([
      ['v2.15.0', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['2.15.0', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.16.3', 'https://fleet.rancher.io/0.17/downstream-resources'],
      ['v2.15.0-rc1', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.15-head', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.20.0', 'https://fleet.rancher.io/0.21/downstream-resources'],
    ])('should map Rancher %s to Fleet docs %s', (version, expected) => {
      expect(getDownstreamResourcesDocsUrl(version)).toStrictEqual(expected);
    });

    it.each([
      ['v2.14.0'],
      ['v2.9.0'],
      ['dev'],
      [''],
      [undefined],
    ])('should fall back to the unversioned docs for %s', (version) => {
      expect(getDownstreamResourcesDocsUrl(version)).toStrictEqual(FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL);
    });
  });

  describe('getContinuousDeliveryPoliciesDocsUrl', () => {
    it.each([
      ['v2.15.0', 'https://fleet.rancher.io/0.16/reference/ref-policy'],
      ['2.15.0', 'https://fleet.rancher.io/0.16/reference/ref-policy'],
      ['v2.16.3', 'https://fleet.rancher.io/0.17/reference/ref-policy'],
      ['v2.15.0-rc1', 'https://fleet.rancher.io/0.16/reference/ref-policy'],
      ['v2.15-head', 'https://fleet.rancher.io/0.16/reference/ref-policy'],
      ['v2.20.0', 'https://fleet.rancher.io/0.21/reference/ref-policy'],
    ])('should map Rancher %s to Fleet Policy docs %s', (version, expected) => {
      expect(getContinuousDeliveryPoliciesDocsUrl(version)).toStrictEqual(expected);
    });

    it.each([
      ['v2.14.0'],
      ['v2.9.0'],
      ['dev'],
      [''],
      [undefined],
    ])('should fall back to the unversioned Policy docs for %s', (version) => {
      expect(getContinuousDeliveryPoliciesDocsUrl(version)).toStrictEqual(FLEET_CD_POLICIES_DOCS_FALLBACK_URL);
    });
  });

  describe('getGitRepoRestrictionMigrationDocsUrl', () => {
    it.each([
      ['v2.15.0', 'https://fleet.rancher.io/0.16/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction'],
      ['2.15.0', 'https://fleet.rancher.io/0.16/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction'],
      ['v2.16.3', 'https://fleet.rancher.io/0.17/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction'],
      ['v2.20.0', 'https://fleet.rancher.io/0.21/how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction'],
    ])('should map Rancher %s to Fleet migration docs %s', (version, expected) => {
      expect(getGitRepoRestrictionMigrationDocsUrl(version)).toStrictEqual(expected);
    });

    it.each([
      ['v2.14.0'],
      ['dev'],
      [''],
      [undefined],
    ])('should fall back to the unversioned migration docs for %s', (version) => {
      expect(getGitRepoRestrictionMigrationDocsUrl(version)).toStrictEqual(FLEET_GITREPORESTRICTION_MIGRATION_DOCS_FALLBACK_URL);
    });
  });
});
