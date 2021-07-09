import { mount } from '@vue/test-utils';
import UnitInput from '@/components/form/UnitInput';
import { UNITS } from '@/utils/units';

describe('unitinput', () => {
  test('renders', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });

    expect(wrapper.isVueInstance).toBeTruthy();
  });

  test('emits input event when input value changes', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });
    const inputElement = wrapper.find('input');

    inputElement.setValue(2);
    inputElement.setValue(4);

    expect(wrapper.emitted('input').length).toBe(2);
  });

  test("input is disabled when mode='view'", () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, mode: 'view' } });
    const input = wrapper.find('input');

    expect(input.element.disabled).toBeTruthy();
  });

  test('inputExponent prop changes units displayed', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, inputExponent: 2 } });
    const expectedUnits = `${ UNITS[2] }B`;

    const suffixDiv = wrapper.find('.addon');

    expect(suffixDiv.element.textContent.trim() === expectedUnits).toBeTruthy();
  });

  test('no suffix is shown when suffix=false', () => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 2, suffix: false
      }
    });
    const suffixDiv = wrapper.find('.addon');

    expect(suffixDiv.exists()).toBeFalsy();
  });
});
