import { UserTypesApiImpl } from '@shell/apis/shell/user-types';
import { UserTypePreferences } from '@shell/apis/intf/shell';
import { AUTHORIZATION, CUSTOMIZATION, SCHEMA } from '@shell/config/types';
import { USER_TYPE_PREFERENCES } from '@shell/store/prefs';
import { PolicyRule } from '@shell/types/resources/rbac';

interface FakeUserType {
  metadata: { name: string };
  spec: { displayName: string, priority?: number, rules?: PolicyRule[] };
}

interface FakeSchema {
  attributes: { group: string, resource: string };
  resourceMethods?: string[];
  collectionMethods?: string[];
}

const userType = (name: string, spec: Partial<FakeUserType['spec']> = {}): FakeUserType => ({ metadata: { name }, spec: { displayName: name, ...spec } });

const schema = (group: string, resource: string, { resourceMethods = [] as string[], collectionMethods = [] as string[] } = {}): FakeSchema => ({
  attributes: { group, resource }, resourceMethods, collectionMethods
});

const haveRule = (...names: string[]) => ({
  apiGroups: ['customization.ui.rancher'], resources: ['usertypes'], resourceNames: names, verbs: ['have']
});

function createStore({
  userTypes = [] as FakeUserType[],
  resourceRules = [] as object[],
  preferences = undefined as UserTypePreferences | undefined,
  currentStore = 'cluster',
  schemas = {} as Record<string, FakeSchema[]>,
  saveFails = false,
  listFails = false,
} = {}) {
  const state = { preferences };
  const review = {
    status: { resourceRules },
    save:   jest.fn(() => (saveFails ? Promise.reject(new Error('no')) : Promise.resolve())),
  };
  const dispatch = jest.fn((action: string, args: any) => {
    switch (action) {
    case 'management/findAll':
      return listFails ? Promise.reject(new Error('no')) : Promise.resolve(userTypes);
    case 'management/create':
      return Promise.resolve(review);
    case 'prefs/set':
      state.preferences = args.value;

      return Promise.resolve();
    }

    return Promise.resolve();
  });
  const store = {
    dispatch,
    getters: {
      'prefs/get':      (key: string) => (key === USER_TYPE_PREFERENCES ? state.preferences : undefined),
      currentStore:     () => currentStore,
      'management/all': (type: string) => (type === SCHEMA ? schemas.management : []),
      'cluster/all':    (type: string) => (type === SCHEMA ? schemas.cluster : []),
    },
  };

  return {
    store, review, dispatch, state
  };
}

const names = (userTypes: FakeUserType[]) => userTypes.map((u) => u.metadata.name);

describe('userTypesApiImpl', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  const create = (opts: Parameters<typeof createStore>[0] = {}) => {
    const fixture = createStore(opts);
    const api = new UserTypesApiImpl(fixture.store as any);

    return { ...fixture, api };
  };

  describe('assigned via role', () => {
    it('should create and save a self subject rules review in the default namespace', async() => {
      const { api, dispatch, review } = create();

      await api.currentUserTypes();

      expect(dispatch).toHaveBeenCalledWith('management/create', { type: AUTHORIZATION.SELF_SUBJECT_RULES_REVIEW, spec: { namespace: 'default' } });
      expect(review.save).toHaveBeenCalledTimes(1);
    });

    it('should assign the user types named in rules with have on usertypes', async() => {
      const { api } = create({
        userTypes:     [userType('a'), userType('b'), userType('c')],
        resourceRules: [haveRule('a', 'b'), haveRule('b')],
      });

      expect(names(await api.currentUserTypes())).toStrictEqual(['a', 'b']);
    });

    it.each([
      ['a wildcard verb', {
        apiGroups: ['customization.ui.rancher'], resources: ['usertypes'], resourceNames: ['a'], verbs: ['*']
      }],
      ['another verb', {
        apiGroups: ['customization.ui.rancher'], resources: ['usertypes'], resourceNames: ['a'], verbs: ['get']
      }],
      ['another group', {
        apiGroups: ['management.cattle.io'], resources: ['usertypes'], resourceNames: ['a'], verbs: ['have']
      }],
      ['another resource', {
        apiGroups: ['customization.ui.rancher'], resources: ['roles'], resourceNames: ['a'], verbs: ['have']
      }],
    ])('should not assign a user type from %s rule', async(_, rule) => {
      const { api } = create({ userTypes: [userType('a')], resourceRules: [rule] });

      expect(await api.currentUserTypes()).toStrictEqual([]);
    });

    it('should save one review for two calls, and another after a refresh or a reset', async() => {
      const { api, review } = create({ userTypes: [userType('a')], resourceRules: [haveRule('a')] });

      await api.currentUserTypes();
      await api.currentUserTypes();
      expect(review.save).toHaveBeenCalledTimes(1);

      await api.refreshCurrentUserTypes();
      expect(review.save).toHaveBeenCalledTimes(2);

      api.reset();
      await api.currentUserTypes();
      expect(review.save).toHaveBeenCalledTimes(3);
    });

    it('should assign nothing when the review fails, and try again on the next call', async() => {
      const { api, review } = create({
        userTypes: [userType('a')], resourceRules: [haveRule('a')], saveFails: true
      });

      expect(await api.currentUserTypes()).toStrictEqual([]);
      await api.currentUserTypes();

      expect(review.save).toHaveBeenCalledTimes(2);
    });

    it('should give no user types when they cannot be listed', async() => {
      const { api } = create({ resourceRules: [haveRule('a')], listFails: true });

      await expect(api.currentUserTypes()).resolves.toStrictEqual([]);
    });

    it('should list the user types by findAll', async() => {
      const { api, dispatch } = create();

      await api.currentUserTypes();

      expect(dispatch).toHaveBeenCalledWith('management/findAll', { type: CUSTOMIZATION.USER_TYPE });
    });
  });

  describe('associated via resource permissions', () => {
    const deployments = (methods: { resourceMethods?: string[], collectionMethods?: string[] }) => schema('apps', 'deployments', methods);
    const withRules = (...rules: PolicyRule[]) => [userType('rp', { rules })];
    const associated = async(rules: PolicyRule[], schemas: Record<string, FakeSchema[]>, currentStore = 'cluster') => {
      const { api } = create({
        userTypes: withRules(...rules), schemas, currentStore
      });

      return names(await api.currentUserTypes()).includes('rp');
    };

    it('should associate a user type when the schema allows every verb of the rule', async() => {
      const rule = {
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['get', 'create']
      };

      expect(await associated([rule], { cluster: [deployments({ resourceMethods: ['GET'], collectionMethods: ['POST'] })] })).toBe(true);
      expect(await associated([rule], { cluster: [deployments({ resourceMethods: ['GET'] })] })).toBe(false);
    });

    it('should not associate a resource that has no schema', async() => {
      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['get']
      }], {})).toBe(false);
    });

    it('should match the core API group and a named one', async() => {
      const pods = schema('', 'pods', { resourceMethods: ['GET'] });

      expect(await associated([{
        apiGroups: [''], resources: ['pods'], verbs: ['get']
      }], { cluster: [pods] })).toBe(true);
      expect(await associated([{
        apiGroups: ['apps'], resources: ['pods'], verbs: ['get']
      }], { cluster: [pods] })).toBe(false);
    });

    it('should associate on any one of several rules', async() => {
      const cluster = [deployments({ resourceMethods: ['GET'] })];

      expect(await associated([
        {
          apiGroups: ['apps'], resources: ['deployments'], verbs: ['delete']
        },
        {
          apiGroups: ['apps'], resources: ['deployments'], verbs: ['get']
        },
      ], { cluster })).toBe(true);
    });

    it.each([
      ['no rules', []],
      ['empty verbs', [{
        apiGroups: ['apps'], resources: ['deployments'], verbs: []
      }]],
      ['empty resources', [{
        apiGroups: ['apps'], resources: [], verbs: ['get']
      }]],
    ])('should not associate a user type with %s', async(_, rules) => {
      expect(await associated(rules, { cluster: [deployments({ resourceMethods: ['GET'] })] })).toBe(false);
    });

    it('should treat * in resources and apiGroups as any one matching schema, and * in verbs as any one verb', async() => {
      const cluster = [deployments({ collectionMethods: ['POST'] })];

      expect(await associated([{
        apiGroups: ['*'], resources: ['deployments'], verbs: ['create']
      }], { cluster })).toBe(true);
      expect(await associated([{
        apiGroups: ['apps'], resources: ['*'], verbs: ['create']
      }], { cluster })).toBe(true);
      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['*']
      }], { cluster })).toBe(true);
      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['*']
      }], { cluster: [deployments({})] })).toBe(false);
    });

    it('should meet watch with list, and never meet an unknown verb', async() => {
      const cluster = [deployments({ collectionMethods: ['GET'] })];

      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['watch']
      }], { cluster })).toBe(true);
      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['deletecollection']
      }], { cluster })).toBe(false);
    });

    it('should count a blocked method as having the right', async() => {
      const cluster = [deployments({ collectionMethods: ['blocked-POST'] })];

      expect(await associated([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
      }], { cluster })).toBe(true);
    });

    it('should use the management store only when the current store has no schema for the resource', async() => {
      const rule = {
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
      };
      const allowed = [deployments({ collectionMethods: ['POST'] })];
      const denied = [deployments({})];

      expect(await associated([rule], { cluster: [], management: allowed })).toBe(true);
      expect(await associated([rule], { cluster: denied, management: allowed })).toBe(false);
    });

    it('should list a user type both assigned and associated once', async() => {
      const { api } = create({
        userTypes: withRules({
          apiGroups: ['apps'], resources: ['deployments'], verbs: ['get']
        }),
        resourceRules: [haveRule('rp')],
        schemas:       { cluster: [deployments({ resourceMethods: ['GET'] })] },
      });

      expect(names(await api.currentUserTypes())).toStrictEqual(['rp']);
    });
  });

  describe('order', () => {
    const assigned = (userTypes: FakeUserType[], preferences?: UserTypePreferences) => create({
      userTypes, preferences, resourceRules: [haveRule(...names(userTypes))]
    }).api.currentUserTypes();

    it('should put the highest priority first, a user type without one as 0, ties by display name', async() => {
      const result = await assigned([
        userType('low', { priority: -1 }),
        userType('none'),
        userType('b-high', { priority: 1, displayName: 'B' }),
        userType('a-high', { priority: 1, displayName: 'A' }),
      ]);

      expect(names(result)).toStrictEqual(['a-high', 'b-high', 'none', 'low']);
    });

    it('should use the user\'s own priority over the user type\'s, including a user priority of 0', async() => {
      const result = await assigned([userType('a', { priority: 5 }), userType('b', { priority: 3 }), userType('c', { priority: 1 })], {
        a: { priority: 0 },
        c: { priority: 10 },
      });

      expect(names(result)).toStrictEqual(['c', 'b', 'a']);
    });
  });

  describe('user preferences', () => {
    it('should read the user type preferences, {} when unset, and save them', async() => {
      const { api, dispatch } = create();

      expect(api.currentUserTypePreferences()).toStrictEqual({});

      await api.setCurrentUserTypePreferences({ a: { priority: 2 } });

      expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: USER_TYPE_PREFERENCES, value: { a: { priority: 2 } } });
      expect(api.currentUserTypePreferences()).toStrictEqual({ a: { priority: 2 } });
    });

    it('should hand out the listed user types\' priorities again in the new order, keeping other entries and disabled', async() => {
      const { api, state } = create({
        userTypes:   [userType('a', { priority: 10 }), userType('b', { priority: 5 }), userType('c', { priority: 1 })],
        preferences: { b: { disabled: true }, other: { priority: 7 } },
      });

      await api.reorderCurrentUserTypes(['c', 'a', 'unknown', 'b']);

      expect(state.preferences).toStrictEqual({
        c: { priority: 10 }, a: { priority: 5 }, b: { priority: 1, disabled: true }, other: { priority: 7 }
      });
    });

    it('should nudge a tie to one less than the user type above', async() => {
      const { api, state } = create({ userTypes: [userType('a', { priority: 3 }), userType('b', { priority: 3 })] });

      await api.reorderCurrentUserTypes(['b', 'a']);

      expect(state.preferences).toStrictEqual({ b: { priority: 3 }, a: { priority: 2 } });
    });

    it('should leave disabled user types out unless includeDisabled is set, keeping their place', async() => {
      const { api } = create({
        userTypes:     [userType('a', { priority: 3 }), userType('b', { priority: 2 }), userType('c', { priority: 1 })],
        resourceRules: [haveRule('a', 'b', 'c')],
        preferences:   { b: { disabled: true } },
      });

      expect(names(await api.currentUserTypes())).toStrictEqual(['a', 'c']);
      expect(names(await api.currentUserTypes({ includeDisabled: true }))).toStrictEqual(['a', 'b', 'c']);
    });

    it('should disable a user type keeping its priority, enable it again, and drop an entry left empty', async() => {
      const { api, state } = create({ preferences: { a: { priority: 4 }, b: { disabled: true } } });

      await api.setCurrentUserTypeEnabled('a', false);
      expect(state.preferences).toStrictEqual({ a: { priority: 4, disabled: true }, b: { disabled: true } });

      await api.setCurrentUserTypeEnabled('a', true);
      expect(state.preferences).toStrictEqual({ a: { priority: 4 }, b: { disabled: true } });

      await api.setCurrentUserTypeEnabled('b', true);
      expect(state.preferences).toStrictEqual({ a: { priority: 4 } });
    });
  });
});
