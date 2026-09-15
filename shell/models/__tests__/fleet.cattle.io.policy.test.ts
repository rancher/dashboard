import FleetPolicy from '@shell/models/fleet.cattle.io.policy';

const ctx = { rootGetters: { workspace: 'fleet-default' } };

const policy = (data: Record<string, any> = {}) => new FleetPolicy({
  type:     'fleet.cattle.io.policy',
  metadata: {},
  ...data
}, ctx);

describe('class FleetPolicy', () => {
  describe('applyDefaults', () => {
    it('should default the namespace to the current workspace', () => {
      const instance = policy();

      instance.applyDefaults();

      expect(instance.metadata.namespace).toBe('fleet-default');
    });

    it('should keep a namespace that is already set', () => {
      const instance = policy({ metadata: { namespace: 'fleet-local' } });

      instance.applyDefaults();

      expect(instance.metadata.namespace).toBe('fleet-local');
    });

    it('should leave the enforcement flags to the user, as Fleet applies them across the whole workspace', () => {
      const instance = policy();

      instance.applyDefaults();

      expect(instance.requireServiceAccount).toBeUndefined();
    });
  });

  describe('cleanForSave', () => {
    it('should drop sub-objects the user never filled in', () => {
      const instance = policy();

      const out = instance.cleanForSave({
        requireServiceAccount: true,
        gitRepo:               {},
        helmOp:                { defaultServiceAccount: '', allowedHelmSecretNames: [] }
      });

      expect(out).toStrictEqual({ requireServiceAccount: true });
    });

    it('should drop an empty allowedServiceAccounts list', () => {
      const instance = policy();

      const out = instance.cleanForSave({ allowedServiceAccounts: [], requireServiceAccount: false });

      expect(out).toStrictEqual({ requireServiceAccount: false });
    });

    it('should keep the fields the user did fill in', () => {
      const instance = policy();

      const out = instance.cleanForSave({
        allowedServiceAccounts: ['tenant-1-deployer'],
        gitRepo:                {
          defaultServiceAccount:    'tenant-1-deployer',
          defaultClientSecretName:  '',
          allowedClientSecretNames: ['tenant-1-git-credentials']
        },
        helmOp: { defaultHelmSecretName: 'tenant-1-helm-credentials', allowedHelmSecretNames: [] }
      });

      expect(out).toStrictEqual({
        allowedServiceAccounts: ['tenant-1-deployer'],
        gitRepo:                {
          defaultServiceAccount:    'tenant-1-deployer',
          allowedClientSecretNames: ['tenant-1-git-credentials']
        },
        helmOp: { defaultHelmSecretName: 'tenant-1-helm-credentials' }
      });
    });
  });
});
