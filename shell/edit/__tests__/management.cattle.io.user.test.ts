import { shallowMount, VueWrapper } from '@vue/test-utils';
import { _CREATE } from '@shell/config/query-params';
import UserEdit from '@shell/edit/management.cattle.io.user.vue';

const t = (key: string) => key;

let grbSaveImpl: () => Promise<any> = () => Promise.resolve();

// Stub for the GlobalRoleBindings child so the component can resolve `$refs.grb.save()`.
const GrbStub = {
  name:     'GlobalRoleBindings',
  template: '<div></div>',
  methods:  {
    save() {
      return grbSaveImpl();
    }
  },
};

const buildUser = () => {
  const user: any = {
    id:       'u-abc',
    kind:     'User',
    username: 'admin5',
    remove:   jest.fn(() => Promise.resolve()),
  };

  user.save = jest.fn(() => Promise.resolve(user));

  return user;
};

const createWrapper = (user: any): VueWrapper<any> => {
  const wrapper = shallowMount(UserEdit, {
    props: {
      mode:     _CREATE,
      realMode: _CREATE,
      value:    { id: 'u-abc', username: 'admin5' },
    },
    global: {
      mocks: {
        $store: {
          getters:  { 'management/schemaFor': () => ({}) },
          dispatch: jest.fn((action: string) => (action === 'management/create' ? Promise.resolve(user) : Promise.resolve())),
        },
        $router: { replace: jest.fn() },
        $route:  { name: 'r', query: {} },
      },
      stubs: {
        GlobalRoleBindings: GrbStub,
        ChangePassword:     true,
        CruResource:        { template: '<div><slot/></div>' },
        LabeledInput:       { template: '<input/>', methods: { focus() {} } },
      },
    },
  });

  // `t` is normally provided by a global mixin that isn't wired up in this unit mount
  (wrapper.vm as any).t = t;

  return wrapper;
};

describe('management.cattle.io.user create: role assignment failure feedback', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => {
    jest.restoreAllMocks();
    grbSaveImpl = () => Promise.resolve();
  });

  it('rolls the user back and shows only the escalation reason when roles fail and cleanup succeeds', async() => {
    const user = buildUser();

    grbSaveImpl = () => Promise.reject(new Error('some errors due to escalation'));
    const wrapper = createWrapper(user);
    const buttonDone = jest.fn();

    await (wrapper.vm as any).save(buttonDone);

    expect(user.remove).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.errors).toStrictEqual(['rbac.errors.escalation']);
    expect(buttonDone).toHaveBeenCalledWith(false);
  });

  it('warns about a role-less orphaned account when roles fail and cleanup also fails', async() => {
    const user = buildUser();

    user.remove = jest.fn(() => Promise.reject(new Error('cannot delete')));
    grbSaveImpl = () => Promise.reject(new Error('some errors due to escalation'));
    const wrapper = createWrapper(user);
    const buttonDone = jest.fn();

    await (wrapper.vm as any).save(buttonDone);

    expect(user.remove).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.errors).toStrictEqual(['rbac.errors.escalation', 'user.edit.roleUpdateFailed.orphaned']);
    expect(buttonDone).toHaveBeenCalledWith(false);
  });

  it('completes the create when role assignment succeeds', async() => {
    const user = buildUser();

    grbSaveImpl = () => Promise.resolve();
    const wrapper = createWrapper(user);
    const buttonDone = jest.fn();

    await (wrapper.vm as any).save(buttonDone);

    expect(user.remove).not.toHaveBeenCalled();
    expect(wrapper.vm.errors).toStrictEqual([]);
    expect(buttonDone).toHaveBeenCalledWith(true);
  });
});
