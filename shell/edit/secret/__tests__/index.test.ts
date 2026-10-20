import CruSecret from '@shell/edit/secret/index.vue';

describe('component: CruSecret', () => {
  describe('nameRules', () => {
    it.each([
      ['Kubernetes secret', false, 'metadata.name'],
      ['cloud credential', true, 'cloudCredentialName'],
    ])('should use the %s name rules', (_, isCloud, path) => {
      const getRules = jest.fn(() => []);

      (CruSecret as any).computed.nameRules.call({ isCloud, getRules });

      expect(getRules).toHaveBeenCalledWith(path);
    });
  });
});
