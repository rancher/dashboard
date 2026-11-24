import { Store } from 'vuex';
import {
  canViewClusterMembershipEditor,
  canViewMembershipEditor,
  canViewMembershipEditorList,
  getRoleLockProps,
  resolveUnlockedPermissionGroup,
} from '@shell/utils/membership-permissions';

const MGMT_ROLE_TEMPLATE = 'management.cattle.io.roletemplate';
const MGMT_PRTB = 'management.cattle.io.projectroletemplatebinding';
const MGMT_CRTB = 'management.cattle.io.clusterroletemplatebinding';
const NORMAN_PRINCIPAL = 'principal';
const NORMAN_CRTB = 'clusterroletemplatebinding';
const NORMAN_PRTB = 'projectroletemplatebinding';

interface Schemas {
  management?: string[];
  rancher?: string[];
}

interface Case {
  description: string;
  schemas: Schemas;
  expected: boolean;
}

function storeWithSchemas({ management = [], rancher = [] }: Schemas): Store<any> {
  const schemaFor = (ids: string[]) => (id: string) => (ids.includes(id) ? { id } : undefined);

  return {
    getters: {
      'management/schemaFor': schemaFor(management),
      'rancher/schemaFor':    schemaFor(rancher),
    }
  } as unknown as Store<any>;
}

const ALL_SCHEMAS: Schemas = {
  management: [MGMT_ROLE_TEMPLATE, MGMT_PRTB, MGMT_CRTB],
  rancher:    [NORMAN_PRINCIPAL, NORMAN_CRTB, NORMAN_PRTB],
};

describe('utils: membership-permissions', () => {
  describe('canViewMembershipEditor', () => {
    describe('for cluster membership', () => {
      it.each<Case>([
        {
          description: 'all schemas exist', schemas: ALL_SCHEMAS, expected: true
        },
        {
          description: 'the role template and principal schemas exist without the project binding schema', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_PRINCIPAL] }, expected: true
        },
        {
          description: 'the role template schema is missing', schemas: { management: [MGMT_PRTB], rancher: [NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'the principal schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_CRTB] }, expected: false
        },
        {
          description: 'the role template schema exists only in the rancher store', schemas: { rancher: [MGMT_ROLE_TEMPLATE, NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'the principal schema exists only in the management store', schemas: { management: [MGMT_ROLE_TEMPLATE, NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'no schemas exist', schemas: {}, expected: false
        },
      ])('when $description, returns $expected', ({ schemas, expected }) => {
        expect(canViewMembershipEditor(storeWithSchemas(schemas))).toStrictEqual(expected);
      });
    });

    describe('for project membership', () => {
      it.each<Case>([
        {
          description: 'all schemas exist', schemas: ALL_SCHEMAS, expected: true
        },
        {
          description: 'the management project binding schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_PRINCIPAL, NORMAN_PRTB] }, expected: false
        },
        {
          description: 'the role template schema is missing', schemas: { management: [MGMT_PRTB], rancher: [NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'the principal schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE, MGMT_PRTB] }, expected: false
        },
        {
          description: 'no schemas exist', schemas: {}, expected: false
        },
      ])('when $description, returns $expected', ({ schemas, expected }) => {
        expect(canViewMembershipEditor(storeWithSchemas(schemas), true)).toStrictEqual(expected);
      });
    });
  });

  describe('canViewMembershipEditorList', () => {
    describe('for cluster membership', () => {
      it.each<Case>([
        {
          description: 'the rancher cluster binding schema exists', schemas: { rancher: [NORMAN_CRTB] }, expected: true
        },
        {
          description: 'the rancher cluster binding schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'only the management cluster binding schema exists', schemas: { management: [MGMT_CRTB] }, expected: false
        },
        {
          description: 'only the rancher project binding schema exists', schemas: { rancher: [NORMAN_PRTB] }, expected: false
        },
      ])('when $description, returns $expected', ({ schemas, expected }) => {
        expect(canViewMembershipEditorList(storeWithSchemas(schemas))).toStrictEqual(expected);
      });
    });

    describe('for project membership', () => {
      it.each<Case>([
        {
          description: 'the rancher project binding schema exists', schemas: { rancher: [NORMAN_PRTB] }, expected: true
        },
        {
          description: 'the rancher project binding schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_PRINCIPAL] }, expected: false
        },
        {
          description: 'only the management project binding schema exists', schemas: { management: [MGMT_PRTB] }, expected: false
        },
        {
          description: 'only the rancher cluster binding schema exists', schemas: { rancher: [NORMAN_CRTB] }, expected: false
        },
      ])('when $description, returns $expected', ({ schemas, expected }) => {
        expect(canViewMembershipEditorList(storeWithSchemas(schemas), true)).toStrictEqual(expected);
      });
    });
  });

  describe('canViewClusterMembershipEditor', () => {
    it.each<Case>([
      {
        description: 'the role template and principal schemas exist without the project binding schema', schemas: { management: [MGMT_ROLE_TEMPLATE], rancher: [NORMAN_PRINCIPAL] }, expected: true
      },
      {
        description: 'the role template schema is missing', schemas: { management: [MGMT_PRTB], rancher: [NORMAN_PRINCIPAL] }, expected: false
      },
      {
        description: 'the principal schema is missing', schemas: { management: [MGMT_ROLE_TEMPLATE, MGMT_PRTB] }, expected: false
      },
    ])('when $description, returns $expected', ({ schemas, expected }) => {
      expect(canViewClusterMembershipEditor(storeWithSchemas(schemas))).toStrictEqual(expected);
    });
  });

  describe('getRoleLockProps', () => {
    const t = (key: string) => `%${ key }%`;
    const roleTemplates = [
      { id: 'locked-role', locked: true },
      { id: 'unlocked-role', locked: false },
    ];

    it('returns disabled, locked, and tooltip when a role object is locked', () => {
      expect(getRoleLockProps({ id: 'custom', locked: true }, roleTemplates, t)).toStrictEqual({
        disabled: true,
        locked:   true,
        tooltip:  '%members.clusterPermissions.custom.lockedRole%',
      });
    });

    it('returns disabled, locked, and tooltip when a role ID matches a locked role template', () => {
      expect(getRoleLockProps('locked-role', roleTemplates, t)).toStrictEqual({
        disabled: true,
        locked:   true,
        tooltip:  '%members.clusterPermissions.custom.lockedRole%',
      });
    });

    it('returns an empty object when the role is unlocked or not found', () => {
      expect(getRoleLockProps('unlocked-role', roleTemplates, t)).toStrictEqual({});
      expect(getRoleLockProps('missing-role', roleTemplates, t)).toStrictEqual({});
      expect(getRoleLockProps({ id: 'custom', locked: false }, roleTemplates, t)).toStrictEqual({});
    });
  });

  describe('resolveUnlockedPermissionGroup', () => {
    const options = [
      { value: 'owner', disabled: true },
      { value: 'member' },
      { value: 'locked-1', disabled: true },
      { value: 'locked-2', disabled: true },
      { value: 'custom' },
    ];

    it('returns the selected value when it is unlocked or unknown', () => {
      expect(resolveUnlockedPermissionGroup('member', 'custom', options)).toStrictEqual('member');
      expect(resolveUnlockedPermissionGroup('unknown', 'member', options)).toStrictEqual('unknown');
    });

    it('skips consecutive disabled options when moving forward', () => {
      expect(resolveUnlockedPermissionGroup('locked-1', 'member', options)).toStrictEqual('custom');
    });

    it('skips consecutive disabled options when moving backward', () => {
      expect(resolveUnlockedPermissionGroup('locked-2', 'custom', options)).toStrictEqual('member');
    });

    it('keeps the current value when no unlocked option exists in the direction of movement', () => {
      expect(resolveUnlockedPermissionGroup('owner', 'member', options)).toStrictEqual('member');
    });

    it('finds the first unlocked option when current value is empty', () => {
      expect(resolveUnlockedPermissionGroup('owner', '', options)).toStrictEqual('member');
    });
  });
});
