import { mount } from '@vue/test-utils';
import Probe from '@shell/components/form/Probe.vue';
import { _EDIT } from '@shell/config/query-params';
import vSelect, { VueSelectMethods } from 'vue-select';

describe('component: Probe', () => {
  describe.each([
    ['HTTPS', ['port', 'path']],
    ['tcp', ['socket']],
    ['exec', ['command']],
  ])('given kind %p', (kind, extraFields) => {
    it.each([
      ...extraFields,
      'successThreshold',
      'failureThreshold',
    ])('should emit an update on %p input', (field) => {
      const wrapper = mount(Probe, {
        propsData: { mode: _EDIT },
        data:      () => ({ kind })
      });
      const input = wrapper.find(`[data-testid="input-probe-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('input')).toHaveLength(1);
    });

    it.each([
      'periodSeconds',
      'initialDelaySeconds',
      'timeoutSeconds',
    ])('should emit an update on %p input and blur', (field) => {
      const wrapper = mount(Probe, {
        propsData: { mode: _EDIT },
        data:      () => ({ kind })
      });
      const input = wrapper.find(`[data-testid="input-probe-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);
      input.trigger('blur');

      expect(wrapper.emitted('input')).toHaveLength(1);
    });
  });

  it.each([
    'kind',
  ])('should emit an update on %p selection change', (field) => {
    const wrapper = mount(Probe, { propsData: { mode: _EDIT } });
    const select = wrapper
      .find(`[data-testid="input-probe-${ field }"]`)
      .find(vSelect);

    // Component is not in Typescript
    (select.vm as any as VueSelectMethods).select('whatever');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });
});
