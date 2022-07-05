import { mount } from '@vue/test-utils';
import Probe from '@shell/components/form/Probe.vue';
import { _EDIT } from '@shell/config/query-params';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

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
      const wrapper = mount(Probe as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
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
      const wrapper = mount(Probe as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
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
  ])('should emit an update on %p selection change', async(field) => {
    const wrapper = mount(Probe as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { mode: _EDIT } });

    const select = wrapper.find(`[data-testid="input-probe-${ field }"]`);

    select.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('input')).toHaveLength(2);
  });
});
