import { shallowMount } from '@vue/test-utils';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor.vue';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';

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
});
