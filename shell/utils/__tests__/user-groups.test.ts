import type { Store } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { fetchUserGroupPrincipals } from '@shell/utils/user-groups';

const OPS_GROUP = 'openldap_group://cn=ops,ou=Groups,dc=example,dc=test';
const DEV_TEAM = 'github_team://1234';

const createStore = ({ schema = {} as object | null, find = jest.fn() } = {}) => ({
  getters:  { 'management/schemaFor': (type: string) => (type === MANAGEMENT.USER_ATTRIBUTE ? schema : null) },
  dispatch: find,
}) as unknown as Store<unknown>;

describe('fetchUserGroupPrincipals', () => {
  it('maps every provider\'s groups to their display name', async() => {
    const find = jest.fn().mockResolvedValue({
      GroupPrincipals: {
        local:    { Items: null },
        openldap: { Items: [{ metadata: { name: OPS_GROUP }, displayName: 'ops' }] },
        github:   { Items: [{ metadata: { name: DEV_TEAM }, loginName: 'dev-team' }] },
      }
    });

    const groups = await fetchUserGroupPrincipals(createStore({ find }), 'u-alice');

    expect(find).toHaveBeenCalledWith('management/find', { type: MANAGEMENT.USER_ATTRIBUTE, id: 'u-alice' });
    expect(groups).toStrictEqual({ [OPS_GROUP]: 'ops', [DEV_TEAM]: 'dev-team' });
  });

  it('falls back to the principal id when a group has no name', async() => {
    const find = jest.fn().mockResolvedValue({ GroupPrincipals: { openldap: { Items: [{ metadata: { name: OPS_GROUP } }] } } });

    expect(await fetchUserGroupPrincipals(createStore({ find }), 'u-alice')).toStrictEqual({ [OPS_GROUP]: OPS_GROUP });
  });

  it('returns no groups when the viewer cannot see UserAttributes', async() => {
    const find = jest.fn();

    expect(await fetchUserGroupPrincipals(createStore({ schema: null, find }), 'u-alice')).toStrictEqual({});
    expect(find).not.toHaveBeenCalled();
  });

  it('returns no groups when the user has no UserAttribute', async() => {
    const find = jest.fn().mockRejectedValue(new Error('not found'));

    expect(await fetchUserGroupPrincipals(createStore({ find }), 'u-alice')).toStrictEqual({});
  });

  it('returns no groups without a user id', async() => {
    const find = jest.fn();

    expect(await fetchUserGroupPrincipals(createStore({ find }), '')).toStrictEqual({});
    expect(find).not.toHaveBeenCalled();
  });
});
