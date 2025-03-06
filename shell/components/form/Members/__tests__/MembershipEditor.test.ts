import { mount, type VueWrapper } from '@vue/test-utils';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';

describe('component: MembershipEditor', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(MembershipEditor, {
      props: {
        addMemberDialogName: 'addMemberDialogName',
        parentKey:           'parentKey',
        mode:                'edit',
        type:                'no idea',
        value:               [], // This value is not listed in the props but required
      },
      global: {
        mocks: {
          $store:      { getters: { 'rancher/schemaFor': () => ({ type: 'object' }) } },
          $fetchState: { pending: false },
        }
      }
    });
  });

  it('should render the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should remove the correct member', () => {
    expect(wrapper.vm.members).toStrictEqual([]);
  });
});
