import { getters } from '@shell/store/auth';

describe('getter: roleTemplateGrantsAccess', () => {
  const roleTemplateGrantsAccess = getters.roleTemplateGrantsAccess();

  it('returns true when role template has a direct matching rule', () => {
    const roleTemplateMap = {
      'project-member': {
        id:                'project-member',
        rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'project-member', 'namespaces', 'create')).toBe(true);
  });

  it('returns true when role template rule uses wildcard verb', () => {
    const roleTemplateMap = {
      admin: {
        id:                'admin',
        rules:             [{ resources: ['namespaces'], verbs: ['*'] }],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'admin', 'namespaces', 'create')).toBe(true);
  });

  it('returns false when role template has no matching rule', () => {
    const roleTemplateMap = {
      'read-only': {
        id:                'read-only',
        rules:             [{ resources: ['namespaces'], verbs: ['get', 'list', 'watch'] }],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'read-only', 'namespaces', 'create')).toBe(false);
  });

  it('returns true when an inherited role template grants access', () => {
    const roleTemplateMap = {
      'custom-role': {
        id:                'custom-role',
        rules:             [],
        roleTemplateNames: ['create-ns'],
      },
      'create-ns': {
        id:                'create-ns',
        rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'custom-role', 'namespaces', 'create')).toBe(true);
  });

  it('returns true when a deeply inherited role template grants access', () => {
    const roleTemplateMap = {
      top: {
        id:                'top',
        rules:             [],
        roleTemplateNames: ['middle'],
      },
      middle: {
        id:                'middle',
        rules:             [],
        roleTemplateNames: ['bottom'],
      },
      bottom: {
        id:                'bottom',
        rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'top', 'namespaces', 'create')).toBe(true);
  });

  it('handles circular inheritance without infinite loop', () => {
    const roleTemplateMap = {
      a: {
        id:                'a',
        rules:             [],
        roleTemplateNames: ['b'],
      },
      b: {
        id:                'b',
        rules:             [],
        roleTemplateNames: ['a'],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'a', 'namespaces', 'create')).toBe(false);
  });

  it('returns false when role template ID does not exist in the map', () => {
    const roleTemplateMap = {};

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'nonexistent', 'namespaces', 'create')).toBe(false);
  });

  it('returns false when rules array is missing', () => {
    const roleTemplateMap = {
      'no-rules': {
        id:                'no-rules',
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'no-rules', 'namespaces', 'create')).toBe(false);
  });

  it('checks the correct resource and verb combination', () => {
    const roleTemplateMap = {
      mixed: {
        id:    'mixed',
        rules: [
          { resources: ['pods'], verbs: ['create'] },
          { resources: ['namespaces'], verbs: ['get'] },
        ],
        roleTemplateNames: [],
      },
    };

    expect(roleTemplateGrantsAccess(roleTemplateMap, 'mixed', 'namespaces', 'create')).toBe(false);
    expect(roleTemplateGrantsAccess(roleTemplateMap, 'mixed', 'pods', 'create')).toBe(true);
    expect(roleTemplateGrantsAccess(roleTemplateMap, 'mixed', 'namespaces', 'get')).toBe(true);
  });
});

describe('getter: userHasAccessToProjectResource', () => {
  function createGetters(principalId: string | null) {
    const state = { principalId };
    const localGetters = {
      principalId:              state.principalId,
      roleTemplateGrantsAccess: getters.roleTemplateGrantsAccess(),
    };

    return { state, localGetters };
  }

  function createRootGetters(bindings: any[], roleTemplates: any[]) {
    return {
      'management/all': (type: string) => {
        if (type === 'management.cattle.io.projectroletemplatebinding') {
          return bindings;
        }
        if (type === 'management.cattle.io.roletemplate') {
          return roleTemplates;
        }

        return [];
      },
    };
  }

  it('returns true when user has a binding with namespace create permission', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const bindings = [{
      projectId:        'local/p-12345',
      principalId:      'local://u-abc123',
      roleTemplateName: 'project-member',
    }];
    const roleTemplates = [{
      id:                'project-member',
      rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
      roleTemplateNames: [],
    }];
    const rootGetters = createRootGetters(bindings, roleTemplates);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(true);
  });

  it('returns false when user has a binding without namespace create permission', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const bindings = [{
      projectId:        'local/p-12345',
      principalId:      'local://u-abc123',
      roleTemplateName: 'read-only',
    }];
    const roleTemplates = [{
      id:                'read-only',
      rules:             [{ resources: ['namespaces'], verbs: ['get', 'list', 'watch'] }],
      roleTemplateNames: [],
    }];
    const rootGetters = createRootGetters(bindings, roleTemplates);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(false);
  });

  it('returns false when user has no bindings for the project', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const bindings = [{
      projectId:        'local/p-other',
      principalId:      'local://u-abc123',
      roleTemplateName: 'project-member',
    }];
    const roleTemplates = [{
      id:                'project-member',
      rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
      roleTemplateNames: [],
    }];
    const rootGetters = createRootGetters(bindings, roleTemplates);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(false);
  });

  it('returns false when principalId is null', () => {
    const { state, localGetters } = createGetters(null);
    const rootGetters = createRootGetters([], []);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(false);
  });

  it('returns false when projectId is empty', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const rootGetters = createRootGetters([], []);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('', 'namespaces', 'create')).toBe(false);
  });

  it('only matches bindings for the current user', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const bindings = [{
      projectId:        'local/p-12345',
      principalId:      'local://u-other',
      roleTemplateName: 'project-member',
    }];
    const roleTemplates = [{
      id:                'project-member',
      rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
      roleTemplateNames: [],
    }];
    const rootGetters = createRootGetters(bindings, roleTemplates);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(false);
  });

  it('returns true when one of multiple bindings grants access', () => {
    const { state, localGetters } = createGetters('local://u-abc123');
    const bindings = [
      {
        projectId:        'local/p-12345',
        principalId:      'local://u-abc123',
        roleTemplateName: 'read-only',
      },
      {
        projectId:        'local/p-12345',
        principalId:      'local://u-abc123',
        roleTemplateName: 'project-member',
      },
    ];
    const roleTemplates = [
      {
        id:                'read-only',
        rules:             [{ resources: ['namespaces'], verbs: ['get', 'list', 'watch'] }],
        roleTemplateNames: [],
      },
      {
        id:                'project-member',
        rules:             [{ resources: ['namespaces'], verbs: ['create'] }],
        roleTemplateNames: [],
      },
    ];
    const rootGetters = createRootGetters(bindings, roleTemplates);

    const fn = getters.userHasAccessToProjectResource(state, localGetters, {}, rootGetters);

    expect(fn('local/p-12345', 'namespaces', 'create')).toBe(true);
  });
});
