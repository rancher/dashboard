import { shallowMount } from '@vue/test-utils';
import PrivateRegistry from '@shell/components/form/PrivateRegistry.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

const defaultMocks = {
  $store: {
    getters: {
      'i18n/t': (text: string) => text,
      t:        (text: string) => text,
    }
  }
};

const mountPrivateRegistry = (props = {}) => {
  return shallowMount(PrivateRegistry, {
    props: {
      mode: 'edit',
      ...props
    },
    global: { mocks: defaultMocks }
  });
};

describe('privateRegistry', () => {
  it('should render the info banner', () => {
    const wrapper = mountPrivateRegistry();
    const banner = wrapper.find('[color="info"]');

    expect(banner.exists()).toBe(true);
  });

  it('should render the enable checkbox', () => {
    const wrapper = mountPrivateRegistry();
    const checkbox = wrapper.findComponent(Checkbox);

    expect(checkbox.exists()).toBe(true);
  });

  it('should not show the URL input when no value is provided', () => {
    const wrapper = mountPrivateRegistry();

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);
  });

  it('should show the URL input when a value is provided', () => {
    const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
  });

  it('should show the URL input when checkbox is checked', async() => {
    const wrapper = mountPrivateRegistry();

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);

    const checkbox = wrapper.findComponent(Checkbox);

    await checkbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
  });

  it('should emit update:value with null when checkbox is unchecked', async() => {
    const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });

    const checkbox = wrapper.findComponent(Checkbox);

    await checkbox.vm.$emit('update:value', false);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')![0]).toStrictEqual([null]);
  });

  it('should emit update:value when the URL input changes', async() => {
    const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
    const input = wrapper.findComponent(LabeledInput);

    await input.vm.$emit('update:value', 'new-registry.example.com');

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')![0]).toStrictEqual(['new-registry.example.com']);
  });

  it('should auto-enable the checkbox when value changes from null to a string', async() => {
    const wrapper = mountPrivateRegistry();

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);

    await wrapper.setProps({ value: 'registry.example.com' });

    expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
  });

  it('should pass rules to the URL input', () => {
    const mockRule = jest.fn();
    const wrapper = mountPrivateRegistry({
      value: 'registry.example.com',
      rules: [mockRule]
    });
    const input = wrapper.findComponent(LabeledInput);

    expect(input.attributes('rules')).toBeDefined();
  });

  it('should apply custom data-testid to checkbox when provided', () => {
    const wrapper = mountPrivateRegistry({ checkboxTestId: 'my-checkbox' });
    const checkbox = wrapper.findComponent(Checkbox);

    expect(checkbox.attributes('data-testid')).toBe('my-checkbox');
  });

  it('should apply custom data-testid to input when provided', () => {
    const wrapper = mountPrivateRegistry({
      value:       'registry.example.com',
      inputTestId: 'my-input'
    });
    const input = wrapper.findComponent(LabeledInput);

    expect(input.attributes('data-testid')).toBe('my-input');
  });

  it('should not set data-testid when not provided', () => {
    const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
    const checkbox = wrapper.findComponent(Checkbox);
    const input = wrapper.findComponent(LabeledInput);

    expect(checkbox.attributes('data-testid')).toBeUndefined();
    expect(input.attributes('data-testid')).toBeUndefined();
  });
});
