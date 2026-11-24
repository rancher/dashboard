import { shallowMount } from '@vue/test-utils';
import ClusterPermissionsEditor from '@shell/components/form/Members/ClusterPermissionsEditor.vue';
import MemberPermissionGroup from '@shell/components/form/Members/MemberPermissionGroup.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { RcIconTooltip } from '@components/RcIconTooltip';

describe('component: ClusterPermissionsEditor', () => {
  it('should mark locked cluster roles and locked custom permissions as disabled with a lock tooltip', async() => {
    const wrapper = shallowMount(ClusterPermissionsEditor, {
      props: { value: [] },
      data() {
        return {
          permissionGroup: 'custom',
          roleTemplates:   [
            {
              id: 'cluster-owner', builtin: true, context: 'cluster', locked: true
            },
            {
              id: 'cluster-member', builtin: true, context: 'cluster', locked: false
            },
            {
              id:          'locked-cluster-role',
              nameDisplay: 'Locked Cluster Role',
              description: 'Locked cluster role',
              builtin:     false,
              external:    false,
              hidden:      false,
              context:     'cluster',
              locked:      true
            },
            {
              id:          'unlocked-cluster-role',
              nameDisplay: 'Unlocked Cluster Role',
              description: 'Unlocked cluster role',
              builtin:     false,
              external:    false,
              hidden:      false,
              context:     'cluster',
              locked:      false
            },
            {
              id: 'backups-manage', builtin: true, context: 'cluster', locked: true
            }
          ] as any
        };
      },
      global: {
        directives: { focus: () => {} },
        mocks:      { $fetchState: { pending: false } },
        stubs:      { Card: { template: '<div><slot name="title" /><slot name="body" /></div>' } }
      },
    });

    const options = wrapper.findComponent(MemberPermissionGroup).props('options') as any[];
    const ownerOpt = options.find((o) => o.value === 'owner');
    const memberOpt = options.find((o) => o.value === 'member');
    const lockedCustomOpt = options.find((o) => o.value === 'locked-cluster-role');
    const unlockedCustomOpt = options.find((o) => o.value === 'unlocked-cluster-role');

    expect(ownerOpt).toStrictEqual(expect.objectContaining({
      value:    'owner',
      disabled: true,
      locked:   true,
      tooltip:  '%members.clusterPermissions.custom.lockedRole%'
    }));
    expect(memberOpt.disabled).toBeUndefined();
    expect(lockedCustomOpt).toStrictEqual(expect.objectContaining({
      value:    'locked-cluster-role',
      disabled: true,
      locked:   true,
      tooltip:  '%members.clusterPermissions.custom.lockedRole%'
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

    expect((wrapper.vm as any).roleTemplateIds).toStrictEqual(['projects-create']);
  });

  it('should clear permissionGroup and roleTemplateIds when the default cluster-member role is locked on fetch', async() => {
    const roleTemplates = [
      {
        id: 'cluster-owner', builtin: true, context: 'cluster', locked: false
      },
      {
        id: 'cluster-member', builtin: true, context: 'cluster', locked: true
      }
    ];
    const dispatch = jest.fn((_action: string, { type }: { type: string }) => {
      if (type === 'management.cattle.io.roletemplate') {
        return Promise.resolve(roleTemplates);
      }

      return Promise.resolve([]);
    });

    const wrapper = shallowMount(ClusterPermissionsEditor, {
      props:  { value: [] },
      global: {
        directives: { focus: () => {} },
        mocks:      {
          $fetchState: { pending: false },
          $store:      { dispatch }
        }
      },
    });

    await (ClusterPermissionsEditor as any).fetch.call(wrapper.vm);

    expect((wrapper.vm as any).permissionGroup).toStrictEqual('');
    expect((wrapper.vm as any).roleTemplateIds).toStrictEqual([]);
  });

  it('should keep the current permissionGroup on fetch when it is not locked', async() => {
    const dispatch = jest.fn(() => Promise.resolve([]));

    const wrapper = shallowMount(ClusterPermissionsEditor, {
      props:  { value: [] },
      global: {
        directives: { focus: () => {} },
        mocks:      {
          $fetchState: { pending: false },
          $store:      { dispatch }
        }
      },
    });

    await (ClusterPermissionsEditor as any).fetch.call(wrapper.vm);

    expect((wrapper.vm as any).permissionGroup).toStrictEqual('member');
  });
});
