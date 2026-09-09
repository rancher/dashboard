import CloudCredential from '@shell/models/cloudcredential';

describe('class CloudCredential', () => {
  describe('doneRoute', () => {
    it('points at the cloud credential list, not the unrelated (and non-existent) secret list route', () => {
      const cc = new CloudCredential({ id: 'cattle-global-data:cc-abc123' } as any);

      expect(cc.doneRoute).toBe('c-cluster-manager-cloudCredential');
    });
  });

  describe('disableResourceDetailDrawer', () => {
    it('is true, hiding "Show Configuration" since it has no custom detail component and YAML is intentionally unavailable', () => {
      const cc = new CloudCredential({ id: 'cattle-global-data:cc-abc123' } as any);

      expect(cc.disableResourceDetailDrawer).toBe(true);
    });
  });
});
