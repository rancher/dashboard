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

  it('should render buttons without disabled class when within bounds', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, min: 1, max: 3
      },
      global
    });

    expect(wrapper.find('.decrease').element.attributes.getNamedItem('disabled')).toBeNull();
    expect(wrapper.find('.increase').element.attributes.getNamedItem('disabled')).toBeNull();
  });

  it('should render buttons with disabled class when out of bounds', async() => {
    const wrapper = mount(Scaler, {
      props: {
        ariaResourceName, value: 2, min: 2, max: 2
      },
      global
    });

    expect(wrapper.find('.decrease').element.attributes.getNamedItem('disabled')).toBeTruthy();
    expect(wrapper.find('.increase').element.attributes.getNamedItem('disabled')).toBeTruthy();
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
