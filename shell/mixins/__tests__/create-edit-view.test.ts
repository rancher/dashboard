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
});
