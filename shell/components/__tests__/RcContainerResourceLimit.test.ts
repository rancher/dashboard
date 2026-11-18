import { mount } from '@vue/test-utils';
import RcContainerResourceLimit from '@shell/components/RcContainerResourceLimit.vue';
import { _VIEW } from '@shell/config/query-params';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@shell/config/labels-annotations';

// The default stub doesn't render its default slot, which would hide the content under test
const RcContentGroupStub = {
  name:     'RcContentGroup',
  template: '<div><slot /></div>',
};

describe('component: RcContainerResourceLimit', () => {
  const mountComponent = (props = {}) => {
    return mount(RcContainerResourceLimit, {
      props,
      global: { stubs: { RcContentGroup: RcContentGroupStub } },
    });
  };

  it('should wrap its content in an RcContentGroup', () => {
    const wrapper = mountComponent();

    expect(wrapper.findComponent(RcContentGroupStub).exists()).toBe(true);
  });

  it.each([
    ['limitsCpu', 'cpu-limit', '111m', '111'],
    ['limitsMemory', 'memory-limit', '111Mi', '111'],
    ['requestsCpu', 'cpu-reservation', '111m', '111'],
    ['requestsMemory', 'memory-reservation', '111Mi', '111'],
  ])('given value prop key %p as %p should display value %p', (key, id, value, expectation) => {
    const wrapper = mountComponent({ value: { [key]: value } });

    const element = wrapper.find(`[data-testid="${ id }"]`).element as HTMLInputElement;

    expect(element.value).toBe(expectation);
  });

  describe.each([
    'cpu-reservation',
    'memory-reservation',
    'cpu-limit',
    'memory-limit',
  ])('given input %p', (id) => {
    it.each(['input', 'blur'])('on %p 123 should display input value 123', async(trigger) => {
      const wrapper = mountComponent();
      const input = wrapper.find(`[data-testid="${ id }"]`);

      await input.setValue('123');
      await input.trigger(trigger);

      expect((input.element as HTMLInputElement).value).toBe('123');
    });
  });

  it('should emit update:value with the cleaned up requests and limits', async() => {
    const wrapper = mountComponent({ value: { limitsMemory: '256Mi' } });
    const input = wrapper.find('[data-testid="cpu-reservation"]');

    await input.setValue('250');
    await input.trigger('blur');

    const emitted = wrapper.emitted('update:value') as object[][];

    expect(emitted[emitted.length - 1][0]).toStrictEqual({ requestsCpu: '250m', limitsMemory: '256Mi' });
  });

  it('should render the gpu limit only when handleGpuLimit is true', () => {
    expect(mountComponent().find('[data-testid="gpu-limit"]').exists()).toBe(true);
    expect(mountComponent({ handleGpuLimit: false }).find('[data-testid="gpu-limit"]').exists()).toBe(false);
  });

  it.each([
    [true, true],
    [false, false],
  ])('given showTip %p should render the help text: %p', (showTip, expected) => {
    const wrapper = mountComponent({ showTip });

    expect(wrapper.find('[data-testid="container-resource-limit-tip"]').exists()).toBe(expected);
  });

  it('should render the detail help text in view mode', () => {
    const wrapper = mountComponent({ mode: _VIEW });

    const tip = wrapper.find('[data-testid="container-resource-limit-tip"]').html();

    expect(tip).toContain('containerResourceLimit.helpTextDetail');
    expect(tip).not.toContain('containerResourceLimit.helpText"');
  });

  it('should load the defaults from the namespace annotation', () => {
    const namespace = {
      id:       'ns',
      metadata: { annotations: { [CONTAINER_DEFAULT_RESOURCE_LIMIT]: JSON.stringify({ limitsCpu: '500m', requestsMemory: '64Mi' }) } },
    };
    const wrapper = mountComponent({ namespace });

    expect((wrapper.find('[data-testid="cpu-limit"]').element as HTMLInputElement).value).toBe('500');
    expect((wrapper.find('[data-testid="memory-reservation"]').element as HTMLInputElement).value).toBe('64');
  });

  it('should write the limits to the namespace annotation from the registered before hook', () => {
    const registerBeforeHook = jest.fn();
    const namespace = {
      id: 'ns', metadata: { annotations: {} }, setAnnotation: jest.fn()
    };

    mountComponent({
      namespace, registerBeforeHook, value: { limitsCpu: '1' }
    });

    const hook = registerBeforeHook.mock.calls[0][0];

    hook();

    expect(namespace.setAnnotation).toHaveBeenCalledWith(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify({ limitsCpu: '1' }));
  });
});
