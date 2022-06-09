import { mount } from '@vue/test-utils';
import HarvesterEditContainer from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/container.vue';
import { _EDIT } from '@shell/config/query-params';
import vSelect, { VueSelectMethods } from 'vue-select';

describe('component: HarvesterEditContainer', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(HarvesterEditContainer, { propsData: { mode: _EDIT, value: {} } });

    const inputWraps = wrapper.findAll('[data-testid^=input-hec-]');

    expect(inputWraps).toHaveLength(4);
  });

  it.each([
    'name',
    'container',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(HarvesterEditContainer, { propsData: { mode: _EDIT, value: {} } });
    const input = wrapper.find(`[data-testid="input-hec-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it.each([
    'type',
    'bus',
  ])('should emit an update on %p selection change', (field) => {
    const wrapper = mount(HarvesterEditContainer, { propsData: { mode: _EDIT, value: {} } });
    const select = wrapper
      .find(`[data-testid="input-hec-${ field }"]`)
      .find(vSelect);

    // Component is not in Typescript
    (select.vm as any as VueSelectMethods).select('whatever');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });
});
