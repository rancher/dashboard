import GlobalRole from '@shell/models/management.cattle.io.globalrole';

describe('class GlobalRole', () => {
  describe('isUserTypeRole', () => {
    const role = (ownerReferences?: object[]) => new GlobalRole({ metadata: { name: 'usertype-dev', ownerReferences } });

    it.each([
      ['owned by a user type', [{ apiVersion: 'customization.ui.rancher/v1', kind: 'UserType' }], true],
      ['with no owner', undefined, false],
      ['owned by another kind', [{ apiVersion: 'customization.ui.rancher/v1', kind: 'Other' }], false],
      ['owned by a UserType from another API group', [{ apiVersion: 'example.com/v1', kind: 'UserType' }], false],
    ])('should be %s: %s', (_, owners, expected) => {
      expect(role(owners).isUserTypeRole).toBe(expected);
    });
  });
});
