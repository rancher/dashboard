import { shallowMount } from '@vue/test-utils';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor.vue';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { RcIconTooltip } from '@components/RcIconTooltip';

describe('component: ProjectMemberEditor', () => {
  it('should mark Select Member as required', () => {
    const wrapper = shallowMount(ProjectMemberEditor, {
      props: {
        value: {
          permissionGroup: 'member', custom: {}, principalId: '', roleTemplateIds: []
        }
      },
      global: { mocks: { $fetchState: { pending: false } } },
    });

    expect(wrapper.findComponent(SelectPrincipal).attributes('required')).toStrictEqual('');
  });

  it('should mark locked project roles and locked custom permissions as disabled with a lock tooltip', async() => {
    const value = {
      permissionGroup: 'member', custom: {}, principalId: '', roleTemplateIds: []
    };
    const wrapper = shallowMount(ProjectMemberEditor, {
      props: { value },
      data() {
        return {
          roleTemplates: [
            {
              id: 'project-owner', builtin: true, context: 'project', locked: false
            },
            {
              id: 'project-member', builtin: true, context: 'project', locked: false
            },
            {
              id: 'read-only', builtin: true, context: 'project', locked: true
            },
            {
              id:          'locked-custom-role',
              nameDisplay: 'Locked Custom Role',
              description: 'Locked project role',
              builtin:     false,
              external:    false,
              hidden:      false,
              context:     'project',
              locked:      true
            },
            {
              id:          'unlocked-custom-role',
              nameDisplay: 'Unlocked Custom Role',
              description: 'Unlocked project role',
              builtin:     false,
              external:    false,
              hidden:      false,
              context:     'project',
              locked:      false
            },
            {
              id: 'configmaps-manage', builtin: true, context: 'project', locked: true
            }
          ] as any
        };
      },
      global: {
        mocks: { $fetchState: { pending: false } },
        stubs: { Card: { template: '<div><slot name="title" /><slot name="body" /></div>' } }
      },
    });

    await wrapper.setProps({
      value: {
        ...value,
        permissionGroup: 'custom'
      }
    });

    const options = wrapper.findComponent(RadioGroup).props('options') as any[];
    const ownerOpt = options.find((o) => o.value === 'owner');
    const readOnlyOpt = options.find((o) => o.value === 'read-only');
    const lockedCustomOpt = options.find((o) => o.value === 'locked-custom-role');
    const unlockedCustomOpt = options.find((o) => o.value === 'unlocked-custom-role');

    expect(ownerOpt.disabled).toBeUndefined();
    expect(readOnlyOpt).toStrictEqual(expect.objectContaining({
      value:       'read-only',
      disabled:    true,
      locked:      true,
      tooltip:     '%members.clusterPermissions.custom.lockedRole%',
      tooltipIcon: 'lock'
    }));
    expect(lockedCustomOpt).toStrictEqual(expect.objectContaining({
      value:       'locked-custom-role',
      disabled:    true,
      locked:      true,
      tooltip:     '%members.clusterPermissions.custom.lockedRole%',
      tooltipIcon: 'lock'
    }));
    expect(unlockedCustomOpt.disabled).toBeUndefined();

    const checkboxes = wrapper.findAllComponents(Checkbox);

    expect(checkboxes[0].props('disabled')).toStrictEqual(false);
    expect(checkboxes[1].props('disabled')).toStrictEqual(true);

    const tooltips = wrapper.findAllComponents(RcIconTooltip);

    expect(tooltips).toHaveLength(1);
    expect(tooltips[0].props('iconType')).toStrictEqual('lock');
    expect(tooltips[0].props('content')).toStrictEqual('%members.clusterPermissions.custom.lockedRole%');

    await checkboxes[0].vm.$emit('update:value', true);

    expect(wrapper.props('value').roleTemplateIds).toStrictEqual(['create-ns']);
  });

  it('should clear permissionGroup and roleTemplateIds when the default project-member role is locked on fetch', async() => {
    const value = {
      permissionGroup: 'member', custom: {}, principalId: '', roleTemplateIds: [] as string[]
    };
    const roleTemplates = [
      {
        id: 'project-owner', builtin: true, context: 'project', locked: false
      },
      {
        id: 'project-member', builtin: true, context: 'project', locked: true
      }
    ];
    const dispatch = jest.fn((_action: string, { type }: { type: string }) => {
      if (type === 'management.cattle.io.roletemplate') {
        return Promise.resolve(roleTemplates);
      }

      return Promise.resolve([]);
    });

    const wrapper = shallowMount(ProjectMemberEditor, {
      props:  { value },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      { dispatch }
        }
      },
    });

    await (ProjectMemberEditor as any).fetch.call(wrapper.vm);

    expect(value.permissionGroup).toStrictEqual('');
    expect(value.roleTemplateIds).toStrictEqual([]);
  });

  it('should keep the current permissionGroup on fetch when it is not locked', async() => {
    const value = {
      permissionGroup: 'member', custom: {}, principalId: '', roleTemplateIds: [] as string[]
    };
    const dispatch = jest.fn(() => Promise.resolve([]));

    const wrapper = shallowMount(ProjectMemberEditor, {
      props:  { value },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      { dispatch }
        }
      },
    });

    await (ProjectMemberEditor as any).fetch.call(wrapper.vm);

    expect(value.permissionGroup).toStrictEqual('member');
  });
});
