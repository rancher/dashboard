import { mount } from '@vue/test-utils';
import { UNITS } from '@shell/utils/units';
import UnitInput from '@shell/components/form/UnitInput.vue';
import LabeledInput from '@shell/components/form/LabeledInput.vue';

describe('unitInput', () => {
  it('should renders', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });

    expect(wrapper.isVisible()).toBe(true);
  });

  it('should emit input event on value change', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });
    const input = wrapper.find('input');

    input.setValue(2);
    input.setValue(4);

    expect(wrapper.emitted('input')).toHaveLength(2);
  });

  it.each([
    ['view', true],
    ['edit', false],
  ])('should contain input disabled status %p when in %p mode', (mode, status) => {
    const wrapper = mount(UnitInput, {
      propsData: {
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
    const wrapper = mount(UnitInput, { propsData: { value } });
    const label = wrapper.findComponent(LabeledInput);

    expect(label.props('value')).toBe(expected);
  });

  it('should display prefix before unit', () => {
    const inputExponent = 2;
    const baseUnit = 'B';
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1,
        inputExponent,
        baseUnit
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
      propsData: {
        value: 1, inputExponent: 3, outputModifier: !outputModifier
      }
    });
    const inputWrapper = wrapper.find('input');

    wrapper.setProps({ outputModifier });
    await wrapper.vm.$nextTick();
    inputWrapper.setValue(3);

    expect(wrapper.emitted('input')![0][0]).toBe(expected);
  });

  it('should display defined SI unit', () => {
    const inputExponent = 3;
    const wrapper = mount(UnitInput, {
      propsData: {
        value:          1,
        inputExponent,
        outputModifier: true
      }
    });

    wrapper.find('input').setValue(2);

    expect(wrapper.emitted('input')![0][0]).toContain(UNITS[inputExponent]);
  });

  it.each([
    [1024, 'MiB'],
    [1000, 'MB'],
  ])('based on increment %p and exponent M, it should use binary modifier and return unit %p', (increment, expected) => {
    const wrapper = mount(UnitInput, {
      propsData: {
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
      propsData: {
        value: 1, inputExponent: 3, outputAs
      }
    });

    wrapper.find('input').setValue(2);

    expect(typeof wrapper.emitted('input')![0][0]).toBe(outputAs);
  });

  it.each([
    [undefined, 'MB'],
    ['Coolio', 'MCoolio'],
  ])('should appended base unit %p value to SI modifier and return %p', (baseUnit, expected) => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, baseUnit, inputExponent: 2
      }
    });
    const addonText = wrapper.find('.addon').text();

    expect(addonText).toBe(expected);
  });

  it('should display suffix outside of the value', () => {
    const suffix = 'seconds';
    const wrapper = mount(UnitInput, { propsData: { value: 1, suffix } });
    const addonText = wrapper.find('.addon').text();

    wrapper.find('input').setValue(1);

    expect(addonText).toBe(suffix);
    expect(wrapper.emitted('input')![0][0]).not.toContain(suffix);
  });
});
