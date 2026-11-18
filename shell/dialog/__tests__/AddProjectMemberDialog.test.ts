import { nextTick } from 'vue';
import { flushPromises, shallowMount, VueWrapper } from '@vue/test-utils';
import AddProjectMemberDialog from '@shell/dialog/AddProjectMemberDialog.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor.vue';

const CardStub = { template: '<div><slot name="title" /><slot name="body" /><slot name="actions" /></div>' };

describe('component: AddProjectMemberDialog', () => {
  let wrapper: VueWrapper<any>;

  const createWrapper = (props = {}) => shallowMount(AddProjectMemberDialog, {
    props: {
      resources: [],
      projectId: 'local:p-abc12',
      ...props,
    },
    global: {
      mocks: { $store: { dispatch: jest.fn().mockResolvedValue({ save: jest.fn() }) } },
      stubs: { Card: CardStub },
    },
  });

  const selectMember = async(principalId: string) => {
    wrapper.findComponent(ProjectMemberEditor).props('value').principalId = principalId;
    await nextTick();
  };

  afterEach(() => {
    wrapper.unmount();
  });

  describe('when saving in the modal', () => {
    const createButton = () => wrapper.findComponent(AsyncButton);

    it('should disable Create while no member is selected', () => {
      wrapper = createWrapper({ saveInModal: true });

      expect(createButton().props('disabled')).toBe(true);
    });

    it('should enable Create once a member is selected', async() => {
      wrapper = createWrapper({ saveInModal: true });

      await selectMember('local://u-abc12');

      expect(createButton().props('disabled')).toBe(false);
    });
  });

  describe('when handing the bindings back to the caller', () => {
    const addButton = () => wrapper.find('button.role-primary');

    it('should disable Add while no member is selected', () => {
      wrapper = createWrapper();

      expect(addButton().attributes('disabled')).toStrictEqual('');
    });

    it('should not call onAdd when Add is clicked with no member selected', async() => {
      const onAdd = jest.fn();

      wrapper = createWrapper({ onAdd });

      await addButton().trigger('click');
      await flushPromises();

      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should enable Add once a member is selected', async() => {
      wrapper = createWrapper();

      await selectMember('local://u-abc12');

      expect(addButton().attributes('disabled')).toBeUndefined();
    });
  });
});
