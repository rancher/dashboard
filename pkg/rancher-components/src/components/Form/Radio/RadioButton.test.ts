import { shallowMount } from '@vue/test-utils';
import { RadioButton } from './index';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('RadioButton.vue', () => {
  it('renders label slot contents', () => {
    const wrapper = shallowMount(
      RadioButton,
      {
        slots:     { label: 'Test Label' },
        propsData: { value: 'test', val: 'test' }
      }
    );

    expect(wrapper.find('.radio-label').text()).toBe('Test Label');
  });

  it('renders label prop contents', () => {
    const wrapper = shallowMount(
      RadioButton,
      {
        directives: { cleanHtmlDirective },
        propsData:  { label: 'Test Label', value: 'test', val: 'test' }
      });

    expect(wrapper.find('.radio-label').text()).toBe('Test Label');
  });

  it('renders slot contents when both slot and label prop are provided', () => {
    const wrapper = shallowMount(RadioButton, {
      slots:     { label: 'Test Label - Slot'},
      propsData: { value: 'test', val: 'test' }
    });

    expect(wrapper.find('.radio-label').text()).toBe('Test Label - Slot');
  });
});
