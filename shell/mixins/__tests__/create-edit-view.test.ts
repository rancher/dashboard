import { _EDIT } from '@shell/config/query-params';
import { mount } from '@vue/test-utils';
import CreateEditView from '@shell/mixins/create-edit-view';

describe('createEditView should', () => {
  it('add value', () => {
    const Component = {
      render() {},
      mixins: [CreateEditView],
      props:  { value: { id: '123' } }
    };

    // TODO: Investigate type to be used for the .vm property to access the component instance instead of using any
    const instance = mount(Component).vm as any;

    expect(instance.mode).toContain(_EDIT);
  });

  it.each([
    ['_status', { _status: 409 }],
    ['status', { status: 409 }],
  ])('catch conflict error by %p field and retry save()', async(_, error) => {
    const Component = {
      render() {},
      mixins: [CreateEditView],
    };

    const wrapper = mount(Component, {
      props:  { value: { id: '123', type: '' } },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:         () => 'current_store',
              'type-map/isSpoofed': jest.fn().mockImplementation(() => false),
            }
          },
        },
      },
    });

    const instance = (wrapper as any).vm;

    instance.actuallySave = async() => {
      throw error;
    };
    instance.conflict = async() => '';
    instance.done = async() => '';

    const spyConflict = jest.spyOn(wrapper.vm, 'conflict');

    await instance.save(() => '', 'url');

    expect(spyConflict).toHaveBeenCalledTimes(1);
  });
});
