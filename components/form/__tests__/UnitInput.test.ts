import { mount } from '@vue/test-utils';
import { UNITS } from '@/utils/units';
import UnitInput from '@/components/form/UnitInput.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';

describe('component: UnitInput', () => {
  it('should renders', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });

    expect(wrapper.isVisible()).toBe(true);
  });

  it('should emit input event on value change', async() => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, delay: 0 } });
    const input = wrapper.find('input');

    await input.setValue(2);
    await input.setValue(4);

    expect(wrapper.emitted('input')).toHaveLength(2);
  });

  it.each([
    ['view', true],
    ['edit', false],
  ])('should contain input disabled status %p when in %p mode', (mode, status) => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1,
        delay: 0,
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
    const wrapper = mount(UnitInput, { propsData: { value, delay: 0 } });
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
        baseUnit,
        delay: 0
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
        value: 1, inputExponent: 3, outputModifier: !outputModifier, delay: 0
      }
    });
    const inputWrapper = wrapper.find('input');

    await wrapper.setProps({ outputModifier });
    await inputWrapper.setValue(3);

    expect(wrapper.emitted('input')![0][0]).toBe(expected);
  });

  it('should display defined SI unit', async() => {
    const inputExponent = 3;
    const wrapper = mount(UnitInput, {
      propsData: {
        value:          1,
        inputExponent,
        outputModifier: true,
        delay:          0
      }
    });

    await wrapper.find('input').setValue(2);

    expect(wrapper.emitted('input')![0][0]).toContain(UNITS[inputExponent]);
  });

  it.each([
    [1024, 'MiB'],
    [1000, 'MB'],
  ])('based on increment %p and exponent M, it should use binary modifier and return unit %p', (increment, expected) => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 2, increment, delay: 0
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
        value: 1, inputExponent: 3, outputAs, delay: 0
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
        value: 1, baseUnit, inputExponent: 2, delay: 0
      }
    });
    const addonText = wrapper.find('.addon').text();

    expect(addonText).toBe(expected);
  });

  it('should display suffix outside of the value', () => {
    const suffix = 'seconds';
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, suffix, delay: 0
      }
    });
    const addonText = wrapper.find('.addon').text();

    wrapper.find('input').setValue(1);

    expect(addonText).toBe(suffix);
    expect(wrapper.emitted('input')![0][0]).not.toContain(suffix);
  });

  it('should format value to a valid integer', () => {
    const wrapper = mount(UnitInput, { propsData: { delay: 0 } });
    const value = '096';
    const expectation = 96;

    wrapper.find('input').setValue(value);

    expect(wrapper.emitted('input')![0][0]).toBe(expectation);
  });

  it('should not correct value to a valid integer while typing', () => {
    const value = 5096;
    const delay = 1;
    const wrapper = mount(UnitInput, { propsData: { delay } });

    jest.useFakeTimers();
    wrapper.find('input').setValue('4096');
    wrapper.find('input').setValue('096');
    wrapper.find('input').setValue(value);
    jest.advanceTimersByTime(delay);
    jest.useRealTimers();

    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')![0][0]).toBe(value);
  });
});
