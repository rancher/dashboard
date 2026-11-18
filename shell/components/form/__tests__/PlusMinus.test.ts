import { mount, VueWrapper } from '@vue/test-utils';
import PlusMinus from '@shell/components/form/PlusMinus.vue';

describe('component: PlusMinus', () => {
  const mockT = (key: string) => {
    const translations: { [key: string]: string } = {
      'workload.plus':  'Scale up workload',
      'workload.minus': 'Scale down workload'
    };

    return translations[key] || key;
  };

  it('should render plus and minus buttons', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props:  { value: 3 },
      global: { mocks: { t: mockT } }
    });

    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0].find('i').classes()).toContain('icon-minus');
    expect(buttons[1].find('i').classes()).toContain('icon-plus');
  });

  it('a11y: minus button should have correct aria-label', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props:  { value: 3 },
      global: { mocks: { t: mockT } }
    });

    const minusButton = wrapper.findAll('button')[0];
    const ariaLabel = minusButton.attributes('aria-label');

    expect(ariaLabel).toBe('Scale down workload');
    expect(minusButton.find('i').attributes('alt')).toBe('Scale down workload');
  });

  it('a11y: plus button should have correct aria-label', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props:  { value: 3 },
      global: { mocks: { t: mockT } }
    });

    const plusButton = wrapper.findAll('button')[1];
    const ariaLabel = plusButton.attributes('aria-label');

    expect(ariaLabel).toBe('Scale up workload');
    expect(plusButton.find('i').attributes('alt')).toBe('Scale up workload');
  });

  it('should emit minus event when minus button is clicked', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props:  { value: 3 },
      global: { mocks: { t: mockT } }
    });

    const minusButton = wrapper.findAll('button')[0];

    minusButton.trigger('click');

    expect(wrapper.emitted('minus')).toHaveLength(1);
  });

  it('should emit plus event when plus button is clicked', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props:  { value: 3 },
      global: { mocks: { t: mockT } }
    });

    const plusButton = wrapper.findAll('button')[1];

    plusButton.trigger('click');

    expect(wrapper.emitted('plus')).toHaveLength(1);
  });

  it('should disable minus button when value is at minimum', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props: {
        value: 0,
        min:   0
      },
      global: { mocks: { t: mockT } }
    });

    const minusButton = wrapper.findAll('button')[0];

    expect(minusButton.attributes('disabled')).toBeDefined();
    expect(minusButton.attributes('aria-disabled')).toBe('true');
  });

  it('should disable plus button when value is at maximum', () => {
    const wrapper: VueWrapper<InstanceType<typeof PlusMinus>> = mount(PlusMinus, {
      props: {
        value: 10,
        max:   10
      },
      global: { mocks: { t: mockT } }
    });

    const plusButton = wrapper.findAll('button')[1];

    expect(plusButton.attributes('disabled')).toBeDefined();
    expect(plusButton.attributes('aria-disabled')).toBe('true');
  });
});
