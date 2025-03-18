import { mount } from '@vue/test-utils';
import { UNITS } from '@shell/utils/units';
import UnitInput from '@shell/components/form/UnitInput.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { defineComponent } from 'vue';

describe('component: UnitInput', () => {
  it('should renders', () => {
    const wrapper = mount(UnitInput, { props: { value: 1 } });

    expect(wrapper.isVisible()).toBe(true);
  });

  it.each(['blur', 'update:value'])('should emit input event when "%p" is fired', async(event) => {
    const wrapper = mount(UnitInput, { props: { value: 1, delay: 0 } });
    const input = wrapper.find('input');

    await input.setValue(2);
    await input.setValue(4);
    input.trigger(event);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[1]).toStrictEqual([4]);
  });

  it.each([
    ['view', true],
    ['edit', false],
  ])('should contain input disabled status %p when in %p mode', (mode, status) => {
    const wrapper = mount(UnitInput, {
      props: {
        value: 1,
        mode
      }
    });
    const inputElement = wrapper.find('input').element as HTMLInputElement;

    expect(inputElement.disabled).toStrictEqual(status);
  });

  it.each([
    ['1000m', '1'],
    ['2G', '2000000000'],
    ['3', '3'],
  ])('should parse values with SI modifier %p and return %p', (value, expected) => {
    const wrapper = mount(UnitInput, { props: { value } });
    const label = wrapper.findComponent(LabeledInput);

    expect(label.props('value')).toBe(expected);
  });

  it('should display prefix before unit', () => {
    const inputExponent = 2;
    const baseUnit = 'B';
    const wrapper = mount(UnitInput, {
      props: {
        value: 1,
        inputExponent,
        baseUnit,
      }
    });
    const expectedUnits = `${ UNITS[inputExponent] }${ baseUnit }`;

    const suffixDiv = wrapper.find('.addon');

    expect(suffixDiv.element.textContent).toContain(expectedUnits);
  });

  it.each([
    [true, '3G'],
    [false, 3000000000],
  ])('should (%p) force use of SI modifier and return %p', async(outputModifier, expected) => {
    const wrapper = mount(UnitInput, {
      props: {
        value: 1, inputExponent: 3, outputModifier: !outputModifier
      }
    });
    const inputWrapper = wrapper.find('input');

    await wrapper.setProps({ outputModifier });
    await inputWrapper.setValue(3);
    inputWrapper.trigger('blur');

    expect(wrapper.emitted('update:value')![0][0]).toBe(expected);
  });

  it('should display defined SI unit', async() => {
    const inputExponent = 3;
    const wrapper = mount(UnitInput, {
      props: {
        value:          1,
        inputExponent,
        outputModifier: true,
      }
    });
    const input = wrapper.find('input');

    await input.setValue(2);
    input.trigger('blur');

    expect(wrapper.emitted('update:value')![0][0]).toContain(UNITS[inputExponent]);
  });

  it.each([
    [1024, 'MiB'],
    [1000, 'MB'],
  ])('based on increment %p and exponent M, it should use binary modifier and return unit %p', (increment, expected) => {
    const wrapper = mount(UnitInput, {
      props: {
        value: 1, inputExponent: 2, increment
      }
    });

    expect(wrapper.find('.addon').text()).toBe(expected);
  });

  it.each([
    ['string'],
    ['number'],
  ])('should force emission of value type as %p', (outputAs) => {
    const wrapper = mount(UnitInput, {
      props: {
        value: 1, inputExponent: 3, outputAs
      }
    });

    const input = wrapper.find('input');

    input.setValue(2);
    input.trigger('blur');

    expect(typeof wrapper.emitted('update:value')![0][0]).toBe(outputAs);
  });

  it.each([
    [undefined, 'MB'],
    ['Coolio', 'MCoolio'],
  ])('should appended base unit %p value to SI modifier and return %p', (baseUnit, expected) => {
    const wrapper = mount(UnitInput, {
      props: {
        value: 1, baseUnit, inputExponent: 2
      }
    });
    const addonText = wrapper.find('.addon').text();

    expect(addonText).toBe(expected);
  });

  it('should display suffix outside of the value', () => {
    const suffix = 'seconds';
    const wrapper = mount(UnitInput, { props: { value: 1, suffix } });
    const addonText = wrapper.find('.addon').text();

    const input = wrapper.find('input');

    input.setValue(1);
    input.trigger('blur');

    expect(addonText).toBe(suffix);
    expect(wrapper.emitted('input')![0][0]).not.toContain(suffix);
  });

  it('should format value to a valid integer', () => {
    const wrapper = mount(UnitInput);
    const value = '096';
    const expectation = 96;
    const input = wrapper.find('input');

    input.setValue(value);
    input.trigger('blur');

    expect(wrapper.emitted('update:value')![0][0]).toBe(expectation);
  });

  it('should not correct value to a valid integer while typing', () => {
    const value = 5096;
    const delay = 1;
    const wrapper = mount(UnitInput, { props: { delay } });
    const input = wrapper.find('input');

    input.setValue('4096');
    input.setValue('096');
    input.setValue(value);
    input.trigger('blur');

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[0][0]).toBe(value);
  });

  describe.each([
    ['123m', -1, 1000, 'CPUs', true],
    // ['123Mi', 2, 1024, '', true],
  ])('given real use case with value %p, exponent %p, increment %p, baseUnit %p, modifier %p', (value, inputExponent, increment, baseUnit, outputModifier) => {
    it('should display input value 123', () => {
      const wrapper = mount(UnitInput, {
        props: {
          value,
          inputExponent,
          increment,
          outputModifier,
          baseUnit
        }
      });

      const inputElement = wrapper.find('input').element as HTMLInputElement;

      expect(inputElement.value).toBe('123');
    });

    it.each(['update:value', 'blur'])('on %p 123 should display input value 123', async(trigger) => {
      const wrapper = mount(UnitInput, {
        props: {
          value: '0',
          inputExponent,
          increment,
          outputModifier,
          baseUnit
        }
      });
      const input = wrapper.find('input');

      await input.setValue('123');
      await input.trigger(trigger);

      expect(wrapper.emitted('update:value')).toBeTruthy();
      expect(input.element.value).toBe('123');
    });

    it('should keep parent value to 123 on input', async() => {
      const ParentComponent = defineComponent({
        components: { UnitInput },
        template:   `
          <UnitInput
            :value="value"
            :input-exponent="inputExponent"
            :output-modifier="outputModifier"
            :base-unit="baseUnit"
            @update:value="event => value = event.target.value"
          />
        `,
        data() {
          return {
            value, inputExponent, outputModifier, baseUnit
          };
        }
      });
      const wrapper = mount(ParentComponent);
      const input = wrapper.find('input');

      await input.trigger('update:value');

      expect(input.element.value).toBe('123');
    });
  });
});
