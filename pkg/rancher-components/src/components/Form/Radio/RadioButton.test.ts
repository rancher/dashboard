import { shallowMount, mount } from '@vue/test-utils';
import { RadioButton } from './index';

describe('radioButton.vue', () => {
  it('renders label slot contents', () => {
    const wrapper = shallowMount(RadioButton, { slots: { label: 'Test Label' }, propsData: { val: {}, value: {} } });

    expect(wrapper.find('.radio-label').text()).toBe('Test Label');
  });

  it('renders label prop contents', () => {
    const wrapper = shallowMount(
      RadioButton,
      {
        propsData: {
          label: 'Test Label', val: {}, value: {}
        }
      });

    expect(wrapper.find('.radio-label').text()).toBe('Test Label');
  });

  it('renders slot contents when both slot and label prop are provided', () => {
    const wrapper = shallowMount(RadioButton, {
      slots:     { label: 'Test Label - Slot' },
      propsData: {
        label: 'Test Label - Props', val: {}, value: {}
      },
    });

    expect(wrapper.find('.radio-label').text()).toBe('Test Label - Slot');
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const val = 'foo';
    const value = 'foo';
    const description = 'some-description';
    const itemLabel = 'some-label';
    const radioOptionId = 'some-id-from-parent';

    const wrapper = mount(
      RadioButton,
      {
        propsData: {
          label: itemLabel,
          val,
          value,
          description,
          radioOptionId
        }
      });

    const radioInputElem = wrapper.find('span[role="radio"]');
    const role = radioInputElem.attributes('role');
    const ariaLabel = radioInputElem.attributes('aria-label');
    const ariaChecked = radioInputElem.attributes('aria-checked');
    const ariaDisabled = radioInputElem.attributes('aria-disabled');
    const ariaDescribedBy = radioInputElem.attributes('aria-describedby');
    const itemId = radioInputElem.attributes('id');

    expect(role).toBe('radio');
    expect(ariaLabel).toBe(itemLabel);
    expect(ariaChecked).toBe('true');
    expect(ariaDisabled).toBe('false');
    expect(ariaDescribedBy).toBe(wrapper.vm.describeById);
    expect(itemId).toBe(radioOptionId);
  });
});
