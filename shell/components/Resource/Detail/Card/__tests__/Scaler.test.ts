import { mount } from '@vue/test-utils';
import Scaler from '@shell/components/Resource/Detail/Card/Scaler.vue';
import { useStore } from 'vuex';

describe('component: Scaler', () => {
  const ariaResourceName = 'pods';
  const global = { provide: { store: useStore() } };

  it('should have two buttons and a value', async() => {
    const wrapper = mount(Scaler, {
      props: { ariaResourceName, value: 2 },
      global
    });

    expect(wrapper.find('.decrease').exists()).toBeTruthy();
    expect(wrapper.find('.value').exists()).toBeTruthy();
    expect(wrapper.find('.increase').exists()).toBeTruthy();
  });

  it('should render value in the correct location', async() => {
    const value = 2;
    const wrapper = mount(Scaler, {
      props: { ariaResourceName, value },
      global
    });

    expect(wrapper.find('.value').element.innerHTML).toStrictEqual(`${ value }`);
  });

  it('should not mark buttons disabled when within bounds', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, min: 1, max: 3
      },
      global
    });

    expect(wrapper.find('.decrease').attributes('aria-disabled')).toStrictEqual('false');
    expect(wrapper.find('.increase').attributes('aria-disabled')).toStrictEqual('false');
  });

  it('should mark buttons disabled when out of bounds', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, min: 2, max: 2
      },
      global
    });

    expect(wrapper.find('.decrease').attributes('aria-disabled')).toStrictEqual('true');
    expect(wrapper.find('.increase').attributes('aria-disabled')).toStrictEqual('true');
  });

  it('should keep disabled buttons focusable and out of the native disabled state', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, disabled: true
      },
      attachTo: document.body,
      global
    });

    // A native `disabled` button leaves the tab order, which drops focus to the body the moment a
    // scale request starts. `aria-disabled` gives the same state to assistive technology without
    // moving focus.
    expect(wrapper.find('.decrease').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.increase').attributes('disabled')).toBeUndefined();

    const increase = wrapper.find('.increase').element as HTMLButtonElement;

    increase.focus();

    expect(document.activeElement).toBe(increase);

    wrapper.unmount();
  });

  it('should disable the decrease button when the value is at a min of zero', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 0, min: 0
      },
      global
    });

    expect(wrapper.find('.decrease').attributes('aria-disabled')).toStrictEqual('true');
    expect(wrapper.find('.increase').attributes('aria-disabled')).toStrictEqual('false');
  });

  it('should disable the increase button when the value is at a max of zero', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 0, max: 0
      },
      global
    });

    expect(wrapper.find('.increase').attributes('aria-disabled')).toStrictEqual('true');
  });

  it('should disable both buttons when disabled', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, disabled: true
      },
      global
    });

    expect(wrapper.find('.decrease').attributes('aria-disabled')).toStrictEqual('true');
    expect(wrapper.find('.increase').attributes('aria-disabled')).toStrictEqual('true');
  });

  it('should not emit when disabled and clicked', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, disabled: true
      },
      global
    });

    await wrapper.find('.increase').trigger('click');
    await wrapper.find('.decrease').trigger('click');

    expect(wrapper.emitted()).not.toHaveProperty('increase');
    expect(wrapper.emitted()).not.toHaveProperty('decrease');
  });

  it('should not emit when clicked at the min or max bound', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 0, min: 0, max: 0
      },
      global
    });

    await wrapper.find('.increase').trigger('click');
    await wrapper.find('.decrease').trigger('click');

    expect(wrapper.emitted()).not.toHaveProperty('increase');
    expect(wrapper.emitted()).not.toHaveProperty('decrease');
  });

  it('should announce the value as a live region', async() => {
    const wrapper = mount(Scaler, {
      props: { ariaResourceName, value: 2 },
      global
    });

    const value = wrapper.find('.value');

    expect(value.attributes('role')).toStrictEqual('status');
    expect(value.attributes('aria-live')).toStrictEqual('polite');
  });

  it('should render aria labels', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, min: 2, max: 2
      },
      global
    });

    expect(wrapper.find('.decrease').element.attributes.getNamedItem('aria-label')?.value).toStrictEqual(`component.resource.detail.card.scaler.ariaLabel.decrease-{"resourceName":"${ ariaResourceName }"}`);
    expect(wrapper.find('.increase').element.attributes.getNamedItem('aria-label')?.value).toStrictEqual(`component.resource.detail.card.scaler.ariaLabel.increase-{"resourceName":"${ ariaResourceName }"}`);
  });

  it('should emit @increase event when increase button clicked', async() => {
    const wrapper = mount(Scaler, {
      props: { ariaResourceName, value: 2 },
      global
    });

    wrapper.find('.increase').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('increase');
  });

  it('should emit @decrease event when decrease button clicked', async() => {
    const wrapper = mount(Scaler, {
      props: { ariaResourceName, value: 2 },
      global
    });

    wrapper.find('.decrease').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('decrease');
  });
});
