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

  describe('publicData', () => {
    const credentialFor = (provider: string, data: Record<string, string>, publicKey: string, publicMode: string) => new CloudCredential({
      id:                                'cattle-global-data:cc-abc123',
      annotations:                       { 'provisioning.cattle.io/driver': provider },
      [`${ provider }credentialConfig`]: data,
    }, { rootGetters: { 'plugins/credentialOptions': () => ({ publicKey, publicMode }) } });

    it.each([
      ['prefix', 'a&b<c>d"e\'f', 'a&b<c…'],
      ['suffix', 'a&b<c>d"e\'f', '…d"e\'f'],
      ['full', 'a&b<c>d"e\'f', 'a&b<c>d"e\'f'],
    ])('shows the %s of the key as plain text, so it reads as typed wherever it is shown', (publicMode, key, expected) => {
      const cc = credentialFor('digitalocean', { accessToken: key }, 'accessToken', publicMode);

      expect(cc.publicData).toBe(expected);
    });
  });
});
