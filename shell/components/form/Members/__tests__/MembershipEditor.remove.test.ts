import { mount } from '@vue/test-utils';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor.vue';

const CachedPrincipal = {
  props: ['value'],
  data() {
    return { principal: this.value };
  },
  template: '<span class="principal">{{ principal }}</span>',
};

describe('component: MembershipEditor removal', () => {
  it('renders the remaining member after removing a member in the middle of the list', async() => {
    const wrapper = mount(MembershipEditor, {
      data() {
        return {
          schema:            null,
          lastSavedBindings: [],
          bindings:          [1, 2, 3, 4, 5].map((number) => ({
            principalId:    `local://user-${ number }`,
            roleDisplay:    `Member ${ number }`,
            roleTemplateId: 'member',
          })),
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
        stubs: { Principal: CachedPrincipal },
      }
    });

    await wrapper.find('[data-testid="remove-item-3"]').trigger('click');

    expect(wrapper.findAll('.principal').map((principal) => principal.text())).toStrictEqual([
      'local://user-1',
      'local://user-2',
      'local://user-3',
      'local://user-5',
    ]);
  });
});
