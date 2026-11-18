import { Store } from 'vuex';
import {
  canViewClusterMembershipEditor,
  canViewMembershipEditor,
  canViewMembershipEditorList,
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
});
