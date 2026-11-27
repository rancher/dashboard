import jsyaml from 'js-yaml';
import GlobalRole from '@shell/models/management.cattle.io.globalrole';
import { MANAGEMENT } from '@shell/config/types';

const YAML = `apiVersion: management.cattle.io/v3
kind: GlobalRole
metadata:
  name: pasted-user
  labels:
    authz.management.cattle.io/bootstrapping: default-globalrole
    team: platform
  annotations:
    authz.management.cattle.io/cr-name: cattle-globalrole-user
    lifecycle.cattle.io/create.mgmt-auth-gr-controller: 'true'
    note: pasted
displayName: Pasted User
`;

function createGlobalRole(data: Record<string, any>) {
  const globalRole = new GlobalRole({ type: MANAGEMENT.GLOBAL_ROLE, ...data }, { getters: {}, rootGetters: {} });
  const saveYaml = jest.spyOn(globalRole, '_saveYaml').mockResolvedValue(undefined);

  return { globalRole, saveYaml };
}

describe('class GlobalRole', () => {
  describe('method: saveYaml', () => {
    it('should drop the labels and annotations Rancher\'s controllers own from a new global role', async() => {
      const { globalRole, saveYaml } = createGlobalRole({});

      await globalRole.saveYaml(YAML, 'initial');

      expect(saveYaml).toHaveBeenCalledWith(expect.any(String), 'initial');
      expect(jsyaml.load(saveYaml.mock.calls[0][0])).toStrictEqual({
        apiVersion: 'management.cattle.io/v3',
        kind:       'GlobalRole',
        metadata:   {
          name: 'pasted-user', labels: { team: 'platform' }, annotations: { note: 'pasted' }
        },
        displayName: 'Pasted User',
      });
    });

    it('should save the YAML of an existing global role as written', async() => {
      const { globalRole, saveYaml } = createGlobalRole({ id: 'user' });

      await globalRole.saveYaml(YAML, 'initial');

      expect(saveYaml).toHaveBeenCalledWith(YAML, 'initial');
    });
  });
});
