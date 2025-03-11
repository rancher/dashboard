import { mount, type VueWrapper } from '@vue/test-utils';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';

describe('component: MembershipEditor', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(MembershipEditor, {
      data() {
        return {
          schema:            null,
          lastSavedBindings: [],
          bindings:          [
            {
              principalId: 'local://user-nkkph',
              roleDisplay: 'Cluster Owner',
            },
            {
              principalId: 'local://u-jsvzm',
              roleDisplay: 'Cluster Member 1',
            },
            {
              principalId: 'local://u-rgcfw',
              roleDisplay: 'Cluster Member 2',
            },
            {
              principalId: 'local://u-gxsrz',
              roleDisplay: 'Cluster Member 3',
            }
          ] as any,
        };
      },
      props: {
        addMemberDialogName: 'addMemberDialogName',
        parentKey:           'parentKey',
        mode:                'edit',
        type:                'no idea',
      },
      global: {
        mocks: {
          $store:      { getters: { 'rancher/schemaFor': () => ({ type: 'object' }) } },
          $fetchState: { pending: false },
        },
        stubs: { Principal: true },
      }
    });
  });

  it('should render the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should remove the correct member', async() => {
    await wrapper.find('[data-testid="remove-item-1"]').trigger('click');

    const removedMember = wrapper.find('[data-testid="role-item-1"]').text();
    const lastMember = wrapper.find('[data-testid="role-item-4"]');

    expect(removedMember).toStrictEqual('Cluster Member 2');
    expect(lastMember.exists()).toBe(false);
  });
});
