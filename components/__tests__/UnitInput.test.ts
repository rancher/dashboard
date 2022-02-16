import { mount } from '@vue/test-utils';
import UnitInput from '@/components/form/UnitInput.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';
import { UNITS } from '../../utils/units';

describe('UnitInput', () => {
  test('renders', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });

    expect(wrapper.isVueInstance).toBeTruthy();
  });

  test('emits input event when input value changes', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1 } });
    const inputWrapper = wrapper.find('input');

    inputWrapper.setValue(2);
    inputWrapper.setValue(4);

    expect((wrapper.emitted('input') || []).length).toBe(2);
  });

  test("input is disabled when mode='view'", () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, mode: 'view' } });
    const inputElement = wrapper.find('input').element as HTMLInputElement;

    expect(inputElement.disabled).toBeTruthy();
  });

  test('Input strings with any si modifier are parsed', async() => {
    const wrapper = mount(UnitInput, { propsData: { value: '1000m' } });
    const labeledInputWrapper = wrapper.findComponent(LabeledInput);

    expect(labeledInputWrapper.props('value')).toBe('1');

    wrapper.setProps({ value: '2G' });
    await wrapper.vm.$nextTick();

    expect(labeledInputWrapper.props('value')).toBe('2000000000');

    wrapper.setProps({ value: '3' });
    await wrapper.vm.$nextTick();

    expect(labeledInputWrapper.props('value')).toBe('3');
  });

  test('Prop inputExponent determines unit prefix', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, inputExponent: 2 } });
    const expectedUnits = `${ UNITS[2] }B`;

    const suffixDiv = wrapper.find('.addon');

    expect((suffixDiv.element.textContent || '').trim() === expectedUnits).toBeTruthy();
  });

  test('Prop outputModifier toggles inclusion of si modifier in output', async() => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 3, outputModifier: true
      }
    });
    const inputWrapper = wrapper.find('input');

    inputWrapper.setValue(2);
    let inputEventValue = wrapper.emitted('input')[0][0];

    expect(inputEventValue).toBe('2G');

    wrapper.setProps({ outputModifier: false });
    await wrapper.vm.$nextTick();
    inputWrapper.setValue(3);
    inputEventValue = wrapper.emitted('input')[1][0];

    expect(inputEventValue).toBe(3000000000);
  });

  test('Output si modifier matches displayed units', () => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 3, outputModifier: true
      }
    });
    const inputWrapper = wrapper.find('input');

    inputWrapper.setValue(2);
    const inputEventValue = wrapper.emitted('input')[0][0];
    const inputEventUnitModifier = inputEventValue.split(/[0-9]/)[1];

    const addonText = wrapper.find('.addon').text();
    const addonUnitModifier = addonText.slice(0, -1);

    expect(inputEventUnitModifier).toEqual(addonUnitModifier);
  });

  test('Prop increment=1024 changes si base unit (MB to MiB)', async() => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 2, increment: 1024
      }
    });
    let addonText = wrapper.find('.addon').text();
    let addonUnitModifier = addonText.slice(0, -1);

    expect(addonUnitModifier).toBe('Mi');

    wrapper.setProps({ increment: 1000 });
    await wrapper.vm.$nextTick();

    addonText = wrapper.find('.addon').text();
    addonUnitModifier = addonText.slice(0, -1);
    expect(addonUnitModifier).toBe('M');
  });

  test('Prop outputAs toggles string/number output', async() => {
    const wrapper = mount(UnitInput, {
      propsData: {
        value: 1, inputExponent: 3, outputAs: 'string'
      }
    });
    const inputWrapper = wrapper.find('input');

    inputWrapper.setValue(2);
    let inputEventValue = wrapper.emitted('input')[0][0];

    expect(typeof inputEventValue).toBe('string');

    wrapper.setProps({ outputAs: 'number' });
    await wrapper.vm.$nextTick();
    inputWrapper.setValue(1);
    inputEventValue = wrapper.emitted('input')[1][0];

    expect(typeof inputEventValue).toBe('number');
  });

  test('Prop baseUnit controls text appended to si modifier', async() => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, inputExponent: 2 } });
    let addonText = wrapper.find('.addon').text();

    expect(addonText).toBe('MB');

    wrapper.setProps({ baseUnit: 'Coolio' });
    await wrapper.vm.$nextTick();
    addonText = wrapper.find('.addon').text();

    expect(addonText).toBe('MCoolio');
  });

  test('Prop suffix sets a display-only suffix', () => {
    const wrapper = mount(UnitInput, { propsData: { value: 1, suffix: 'seconds' } });
    const addonText = wrapper.find('.addon').text();

    expect(addonText).toBe('seconds');

    const inputWrapper = wrapper.find('input');

    inputWrapper.setValue(1);
    const inputEventValue = wrapper.emitted('input')[0][0];

    expect(inputEventValue).toBe(1);
  });
});
