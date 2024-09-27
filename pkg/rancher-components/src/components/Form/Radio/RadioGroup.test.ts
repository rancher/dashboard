import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { RadioGroup } from './index';

describe('component: RadioGroup', () => {
  describe('when disabled', () => {
    it.each([true, false])('should expose disabled slot prop for indexed slots for %p', (disabled) => {
      const wrapper = mount(RadioGroup, {
        propsData: {
          name:    'whatever',
          options: [{ label: 'whatever', value: 'whatever' }],
          disabled
        },
        slots: {
          0: (props: {isDisabled: boolean}) => h('input', {
            id:       'test',
            disabled: props.isDisabled
          })
        }
      });

      const slot = wrapper.find('#test').element as HTMLInputElement;

      expect(slot.disabled).toBe(disabled);
    });
  });
});
