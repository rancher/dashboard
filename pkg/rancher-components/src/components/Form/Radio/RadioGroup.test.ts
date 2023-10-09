import { mount } from '@vue/test-utils';
import { RadioGroup } from './index';

describe('component: RadioGroup', () => {
  describe('when disabled', () => {
    /**
     * NOTE: Current setup does not match guidelines for the test of scoped slots
     * https://test-utils.vuejs.org/guide/advanced/slots.html#Scoped-Slots
     * This seems not covered till the latest version of the library
     * https://github.com/vuejs/vue-test-utils
     */
    it.each([true, false])('should expose disabled slot prop for indexed slots for %p', (disabled) => {
      const ExampleWrapper = {
        template: `
          <RadioGroup
            :options="[{ label: 'whatever', value: 'whatever' }]"
            :disabled="${ disabled }"
            name="whatever"
          >
            <template #0="{isDisabled}">
            <input id="test" :disabled="isDisabled"/>
            </template>
          </RadioGroup>
        `,
        components: { RadioGroup },
        data() {
          return { msg: 'world' };
        }
      };
      const wrapper = mount(ExampleWrapper, {});

      const slot = wrapper.find('#test').element as HTMLInputElement;

      expect(slot.disabled).toBe(disabled);
    });
  });
});
