import { mount } from '@vue/test-utils';
import HarvesterEditNetwork from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork/base.vue';
import { _EDIT } from '@shell/config/query-params';
import vSelect, { VueSelectMethods } from 'vue-select';

describe('component: HarvesterEditNetwork', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(HarvesterEditNetwork, { propsData: { mode: _EDIT } });

    const inputWraps = wrapper.findAll('[data-testid^=input-hen-]');

    expect(inputWraps).toHaveLength(5);
  });

  it.each([
    'name',
    'macAddress',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(HarvesterEditNetwork, { propsData: { mode: _EDIT } });
    const input = wrapper.find(`[data-testid="input-hen-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it.each([
    'model',
    'networkName',
    'type',
  ])('should emit an update on %p selection change', (field) => {
    const wrapper = mount(HarvesterEditNetwork, { propsData: { mode: _EDIT } });
    const select = wrapper
      .find(`[data-testid="input-hen-${ field }"]`)
      .find(vSelect);

    // Component is not in Typescript
    (select.vm as any as VueSelectMethods).select('whatever');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });
});
