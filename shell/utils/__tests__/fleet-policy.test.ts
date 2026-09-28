import { getFleetPolicyDefaults } from '@shell/utils/fleet-policy';
import { FLEET } from '@shell/config/types';

describe('fx: getFleetPolicyDefaults', () => {
  const policy = (name: string, gitRepo = {}, helmOp = {}, namespace = 'fleet-default') => ({
    metadata: { name, namespace }, gitRepo, helmOp
  });

  const storeWith = (policies: any[], schema: boolean = true) => ({
    getters:  { 'management/schemaFor': (type: string) => (schema && type === FLEET.POLICY ? {} : undefined) },
    dispatch: jest.fn().mockResolvedValue(policies),
  } as any);

  it('should take the defaults from the policies in the workspace', async() => {
    const store = storeWith([
      policy('tenant-1', { defaultClientSecretName: 'git-credentials' }, { defaultHelmSecretName: 'helm-credentials' }),
    ]);

    await expect(getFleetPolicyDefaults(store, 'fleet-default')).resolves.toStrictEqual({
      clientSecretName: 'git-credentials',
      helmSecretName:   'helm-credentials',
    });
  });

  // Fleet sorts the namespace's policies by name and keeps the first non-empty value
  it('should take the first default by policy name when several set one', async() => {
    const store = storeWith([
      policy('second', { defaultClientSecretName: 'from-second' }),
      policy('first', { defaultClientSecretName: 'from-first' }),
    ]);

    await expect(getFleetPolicyDefaults(store, 'fleet-default')).resolves.toStrictEqual({
      clientSecretName: 'from-first',
      helmSecretName:   '',
    });
  });

  it('should skip a policy that sets no default of its own', async() => {
    const store = storeWith([
      policy('first', {}, {}),
      policy('second', { defaultClientSecretName: 'from-second' }),
    ]);

    await expect(getFleetPolicyDefaults(store, 'fleet-default')).resolves.toStrictEqual({
      clientSecretName: 'from-second',
      helmSecretName:   '',
    });
  });

  it('should ignore the policies of other workspaces', async() => {
    const store = storeWith([policy('elsewhere', { defaultClientSecretName: 'other-credentials' }, {}, 'fleet-local')]);

    await expect(getFleetPolicyDefaults(store, 'fleet-default')).resolves.toStrictEqual({
      clientSecretName: '',
      helmSecretName:   '',
    });
  });

  it('should ask for nothing where the cluster serves no policies', async() => {
    const store = storeWith([], false);

    await expect(getFleetPolicyDefaults(store, 'fleet-default')).resolves.toStrictEqual({
      clientSecretName: '',
      helmSecretName:   '',
    });
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should ask for nothing before a workspace is known', async() => {
    const store = storeWith([]);

    await expect(getFleetPolicyDefaults(store, undefined)).resolves.toStrictEqual({
      clientSecretName: '',
      helmSecretName:   '',
    });
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
