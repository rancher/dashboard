import { shallowMount, Wrapper, mount } from '@vue/test-utils';
import { Checkbox } from './index';

describe('checkbox.vue', () => {
  const event = {
    target:          { tagName: 'input', href: null },
    stopPropagation: () => { },
    preventDefault:  () => { }
  } as unknown as MouseEvent;

  it('is unchecked by default', () => {
    const wrapper = shallowMount(Checkbox);
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(false);
  });

  it('renders a true value', () => {
    const wrapper = shallowMount(Checkbox, { propsData: { value: true } });
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(true);
  });

  it('updates from false to true when props change', async() => {
    const wrapper = shallowMount(Checkbox);
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(false);

    await wrapper.setProps({ value: true });

    expect(cbInput.checked).toBe(true);
  });

  it('emits an input event with a true value', async() => {
    const wrapper: Wrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox);

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')[0][0]).toBe(true);
  });

  it('emits an input event with a custom valueWhenTrue', async() => {
    const valueWhenTrue = 'BIG IF TRUE';

    const wrapper: Wrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox, { propsData: { value: false, valueWhenTrue } });

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')[0][0]).toBe(valueWhenTrue);
  });

  it('updates from valueWhenTrue to falsy', async() => {
    const valueWhenTrue = 'REAL HUGE IF FALSE';

    const wrapper: Wrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox, { propsData: { value: valueWhenTrue, valueWhenTrue } });

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')[0][0]).toBeNull();
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const alternateLabel = 'some-alternate-aria-label';
    const description = 'some-description';
    const ariaDescribedById = 'some-external-id';

    const wrapper: Wrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        propsData: {
          value: false, alternateLabel, description
        },
        attrs: { 'aria-describedby': ariaDescribedById },
      }
    );

    const field = wrapper.find('.checkbox-custom');
    const ariaChecked = field.attributes('aria-checked');
    const ariaLabel = field.attributes('aria-label');
    const ariaLabelledBy = field.attributes('aria-labelledby');
    const ariaDescribedBy = field.attributes('aria-describedby');

    // validates type of input rendered
    expect(ariaChecked).toBe('false');
    expect(ariaLabelledBy).toBeUndefined();
    expect(ariaLabel).toBe(alternateLabel);
    expect(ariaDescribedBy).toBe(`${ ariaDescribedById } ${ wrapper.vm.describedById }`);
  });

  it('a11y: having a label should not render "aria-label" prop and have "aria-labelledby"', async() => {
    const label = 'some-label';

    const wrapper: Wrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        propsData: {
          value: true, label, disabled: true
        }
      }
    );

    const field = wrapper.find('.checkbox-custom');
    const ariaChecked = field.attributes('aria-checked');
    const ariaLabel = field.attributes('aria-label');
    const ariaLabelledBy = field.attributes('aria-labelledby');
    const ariaDisabled = field.attributes('aria-disabled');
    const tabIndex = field.attributes('tabindex');

    // validates type of input rendered
    expect(field.exists()).toBe(true);
    expect(ariaChecked).toBe('true');
    expect(ariaLabelledBy).toBe(wrapper.vm.idForLabel);
    expect(ariaLabel).toBeUndefined();
    expect(wrapper.find(`#${ wrapper.vm.idForLabel }`).text()).toBe(label);

    expect(ariaDisabled).toBe('true');
    expect(tabIndex).toBe('-1');
  });
});
