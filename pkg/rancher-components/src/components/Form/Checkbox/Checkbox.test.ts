import { shallowMount, VueWrapper, mount } from '@vue/test-utils';
import { Checkbox } from './index';
import { waitForTooltip } from '@shell/directives/__tests__/utils/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const wrapper = shallowMount(Checkbox, { props: { value: true } });
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
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox);

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [boolean][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(true);
  });

  it('emits an input event with a custom valueWhenTrue', async() => {
    const valueWhenTrue = 'BIG IF TRUE';

    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox, { props: { value: false, valueWhenTrue } });

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [string][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(valueWhenTrue);
  });

  it('updates from valueWhenTrue to falsy', async() => {
    const valueWhenTrue = 'REAL HUGE IF FALSE';

    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = shallowMount(Checkbox, { props: { value: valueWhenTrue, valueWhenTrue } });

    wrapper.vm.clicked(event);
    await wrapper.vm.$nextTick();

    const [[value]] = wrapper.emitted('update:value') as [string | null][];

    expect(value).toBeNull();
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const alternateLabel = 'some-alternate-aria-label';
    const description = 'some-description';
    const ariaDescribedById = 'some-external-id';

    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
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

    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
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

  it('a11y: the info icon should be a button naming itself rather than the tooltip', () => {
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
          value: false, label: 'some-label', tooltip: 'Pull secrets'
        }
      }
    );
    const button = wrapper.find('button.checkbox-info');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('%generic.moreInfo%');
    expect(button.find('i.icon-info').attributes('aria-hidden')).toBe('true');
  });

  it.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
  ])('a11y: %s on the info icon should not toggle the checkbox', async(_name, key) => {
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
          value: false, label: 'some-label', tooltip: 'Pull secrets'
        }
      }
    );

    wrapper.find('button.checkbox-info').element.dispatchEvent(new KeyboardEvent('keydown', {
      key, bubbles: true, cancelable: true
    }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toBeUndefined();
  });

  it('a11y: Escape on the info icon should still reach the surrounding dialog', async() => {
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
          value: false, label: 'some-label', tooltip: 'Pull secrets'
        },
        attachTo: document.body,
      }
    );
    const onDocumentEscape = jest.fn();

    document.addEventListener('keydown', onDocumentEscape);

    wrapper.find('button.checkbox-info').element.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, cancelable: true
    }));
    await wrapper.vm.$nextTick();

    // A dialog listens for Escape on the document, so swallowing every keydown here would leave it
    // impossible to close while the info icon has focus.
    expect(onDocumentEscape).toHaveBeenCalled();

    document.removeEventListener('keydown', onDocumentEscape);
    wrapper.unmount();
  });

  it('a11y: activating the info icon should not toggle the checkbox', async() => {
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
          value: false, label: 'some-label', tooltip: 'Pull secrets'
        }
      }
    );

    wrapper.find('button.checkbox-info').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toBeUndefined();
  });

  it('a11y: activating the info icon should leave its tooltip shown', async() => {
    const wrapper: VueWrapper<InstanceType<typeof Checkbox>> = mount(
      Checkbox,
      {
        props: {
          value: false, label: 'some-label', tooltip: 'Pull secrets'
        },
        attachTo: document.body,
      }
    );
    const icon = wrapper.find('button.checkbox-info').element;

    icon.dispatchEvent(new FocusEvent('focus'));
    await waitForTooltip();

    expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(600);

    // The click must not dismiss what the focus just opened, so this waits out the hide it would
    // have caused rather than waiting for a state to appear.
    expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();
    expect(wrapper.emitted('update:value')).toBeUndefined();

    wrapper.unmount();
  });
});
