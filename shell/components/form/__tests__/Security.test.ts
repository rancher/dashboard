import { mount } from '@vue/test-utils';
import Security from '@shell/components/form/Security.vue';
import { _EDIT } from '@shell/config/query-params';
import vSelect, { VueSelectMethods } from 'vue-select';

describe('component: Security', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(Security, { propsData: { mode: _EDIT } });

    const inputWraps = wrapper.findAll('[data-testid^=input-security-]');

    expect(inputWraps).toHaveLength(7);
  });

  it.each([
    'runAsUser',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(Security, { propsData: { mode: _EDIT } });
    const input = wrapper.find(`[data-testid="input-security-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('input')).toHaveLength(1);
  });

  it.each([
    'privileged',
    'allowPrivilegeEscalation',
    'runasNonRoot',
    'readOnlyRootFilesystem',
  ])('should emit an update on %p radio option change', (field) => {
    const wrapper = mount(Security, { propsData: { mode: _EDIT } });
    const radioOption = wrapper
      .find(`[data-testid="input-security-${ field }"]`)
      .find('label');

    radioOption.trigger('click');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });

  it.each([
    'add',
    'drop',
  ])('should emit an update on %p selection change', (field) => {
    const wrapper = mount(Security, { propsData: { mode: _EDIT } });
    const select = wrapper
      .find(`[data-testid="input-security-${ field }"]`)
      .find(vSelect);

    // Component is not in Typescript
    (select.vm as any as VueSelectMethods).select('whatever');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });
});
