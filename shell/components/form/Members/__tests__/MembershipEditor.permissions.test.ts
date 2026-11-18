import { mount } from '@vue/test-utils';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';
import { NORMAN } from '@shell/config/types';
import { fetchProjectMembershipPermissions } from '@shell/utils/project-permissions';

jest.mock('@shell/utils/project-permissions', () => ({ fetchProjectMembershipPermissions: jest.fn() }));

describe('component: MembershipEditor project permissions', () => {
  const binding = {
    id:          'local:p-abc:binding',
    projectId:   'local:p-abc',
    principalId: 'local://u-abc',
    roleDisplay: 'Project Member',
  };
  const $store = {
    getters: {
      'rancher/schemaFor':    () => ({ type: 'object' }),
      'management/schemaFor': () => ({ type: 'object' }),
    },
    dispatch: jest.fn(() => Promise.resolve([binding])),
  };

  const mountWith = async(membershipPermission?: Record<string, boolean>) => {
    const wrapper = mount(MembershipEditor, {
      props: {
        addMemberDialogName: 'AddProjectMemberDialog',
        parentKey:           'projectId',
        parentId:            'local/p-abc',
        mode:                'edit',
        type:                NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        membershipPermission,
      },
      global: {
        mocks: { $store, $fetchState: { pending: false } },
        stubs: { Principal: true },
      }
    });

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    await wrapper.vm.$nextTick();

    return wrapper;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [{ create: true, remove: true }, true, true],
    [{ create: true }, true, false],
    [{ remove: true }, false, true],
    [{}, false, false],
  ])('should use the permissions %j passed by the parent without checking them again', async(membershipPermission, canAdd, canRemove) => {
    const wrapper = await mountWith(membershipPermission);

    expect(fetchProjectMembershipPermissions).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="add-item"]').exists()).toBe(canAdd);
    expect(wrapper.find('[data-testid="remove-item-0"]').exists()).toBe(canRemove);
  });

  it('should check this project\'s permissions itself when the parent passed none', async() => {
    (fetchProjectMembershipPermissions as jest.Mock).mockResolvedValue({ 'local/p-abc': { create: true, remove: false } });

    const wrapper = await mountWith();

    expect(fetchProjectMembershipPermissions).toHaveBeenCalledWith($store, 'local/p-abc');
    expect(wrapper.find('[data-testid="add-item"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="remove-item-0"]').exists()).toBe(false);
  });

  it('should hide add and remove when its own check fails', async() => {
    (fetchProjectMembershipPermissions as jest.Mock).mockResolvedValue({});

    const wrapper = await mountWith();

    expect(wrapper.find('[data-testid="add-item"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="remove-item-0"]').exists()).toBe(false);
  });
});
