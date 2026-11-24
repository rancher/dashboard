import { shallowMount, mount } from '@vue/test-utils';
import { RadioButton } from './index';
import { RcIconTooltip } from '@components/RcIconTooltip';
import { waitForTooltip } from '@shell/directives/__tests__/utils/tooltip';

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

  describe('tooltip', () => {
    it('does not render a tooltip icon when tooltip is not provided', () => {
      const wrapper = shallowMount(RadioButton, {
        propsData: {
          label: 'Role Label', val: 'role', value: 'role'
        }
      });

      expect(wrapper.findComponent(RcIconTooltip).exists()).toStrictEqual(false);
      expect(wrapper.find('span[role="radio"]').attributes('aria-describedby')).toBeUndefined();
    });

    it('renders a focusable RcIconTooltip that shows its tooltip on focus and describes the radio', async() => {
      const wrapper = mount(RadioButton, {
        attachTo:  document.body,
        propsData: {
          label: 'Role Label', val: 'role', value: 'role', tooltip: 'Helpful info'
        }
      });

      const tooltipBtn = wrapper.find('.radio-label button.rc-icon-tooltip');
      const icon = tooltipBtn.find('i.rc-icon');
      const radio = wrapper.find('span[role="radio"]');

      expect(tooltipBtn.exists()).toStrictEqual(true);
      expect(tooltipBtn.classes()).toContain('has-clean-tooltip');
      expect(icon.classes()).toContain('icon-info');
      expect(radio.attributes('aria-describedby')).toStrictEqual(wrapper.vm.tooltipDescribeById);
      expect(wrapper.find(`#${ wrapper.vm.tooltipDescribeById }`).text()).toStrictEqual('Helpful info');

      tooltipBtn.element.dispatchEvent(new FocusEvent('focus'));
      await waitForTooltip();

      expect(document.querySelector('.v-popper__popper--shown')?.textContent?.trim()).toStrictEqual('Helpful info');
      wrapper.unmount();
    });

    it('renders a custom tooltip icon and combines description and object tooltip in aria-describedby', () => {
      const wrapper = shallowMount(RadioButton, {
        propsData: {
          label:          'Locked Role',
          val:            'locked-role',
          value:          'member',
          descriptionKey: 'some.description.key',
          tooltip:        { content: 'This role is locked.' },
          tooltipIcon:    'lock'
        }
      });

      const tooltip = wrapper.findComponent(RcIconTooltip);
      const radio = wrapper.find('span[role="radio"]');

      expect(tooltip.exists()).toStrictEqual(true);
      expect(tooltip.props('iconType')).toStrictEqual('lock');
      expect(tooltip.props('content')).toStrictEqual({ content: 'This role is locked.' });
      expect(radio.attributes('aria-describedby')).toStrictEqual(`${ wrapper.vm.describeById } ${ wrapper.vm.tooltipDescribeById }`);
      expect(wrapper.find(`#${ wrapper.vm.tooltipDescribeById }`).text()).toStrictEqual('This role is locked.');
    });

    it('handles an object tooltip without content', () => {
      const wrapper = shallowMount(RadioButton, {
        propsData: {
          label:   'Role Label',
          val:     'role',
          value:   'role',
          tooltip: {}
        }
      });

      expect(wrapper.find('span[role="radio"]').attributes('aria-describedby')).toBeUndefined();
    });
  });
});
