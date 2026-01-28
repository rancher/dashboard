import { mount } from '@vue/test-utils';
import PodsCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import Scaler from '@shell/components/Resource/Detail/Card/Scaler.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';
import { createStore } from 'vuex';

describe('component: PodsCard', () => {
  const store = createStore({});

  const podSuccess = { stateSimpleColor: 'success', stateDisplay: 'Completed' };
  const podFail = { stateSimpleColor: 'error', stateDisplay: 'Error' };

  it('should pass title to Card prop correctly', async() => {
    const title = 'component.resource.detail.card.podsCard.title';
    const wrapper = mount(PodsCard, { props: { title, showScaling: true }, global: { provide: { store } } });

    const card = wrapper.findComponent(Card);

    expect(card.props('title')).toStrictEqual(title);
  });

  it('should show Scaler when showScaling is true', async() => {
    const wrapper = mount(PodsCard, { props: { showScaling: true }, global: { provide: { store } } });

    expect(wrapper.find('.scaler').exists()).toBeTruthy();
  });

  it('should hide scaler when showScaling is false', async() => {
    const wrapper = mount(PodsCard, { props: { showScaling: false }, global: { provide: { store } } });

    expect(wrapper.find('.scaler').exists()).toBeFalsy();
  });

  it('should pass the appropriate props to the Scaler component', async() => {
    const wrapper = mount(PodsCard, {
      props: {
        title: 'Test', showScaling: true, resources: [podSuccess]
      },
      global: { provide: { store } }
    });
    const scaler = wrapper.findComponent(Scaler);

    expect(scaler.props('value')).toStrictEqual(1);
    expect(scaler.props('min')).toStrictEqual(0);
  });

  it('should pass the appropriate props to the StatusBar component based on the resources input', async() => {
    const wrapper = mount(PodsCard, {
      props: {
        title: 'Test', showScaling: true, resources: [podSuccess, podFail]
      },
      global: { provide: { store } }
    });
    const statusBar = wrapper.findComponent(StatusBar);

    const segments = statusBar.props('segments');

    expect(segments[0].color).toStrictEqual('success');
    expect(segments[0].percent).toStrictEqual(50);

    expect(segments[1].color).toStrictEqual('error');
    expect(segments[1].percent).toStrictEqual(50);
  });

  it('should pass the appropriate props to the StatusRow component based on the resources input', async() => {
    const wrapper = mount(PodsCard, {
      props: {
        title: 'Test', showScaling: true, resources: [podSuccess, podFail]
      },
      global: { provide: { store } }
    });
    const rows = wrapper.findComponent(StatusRow);

    expect(rows.props()).toStrictEqual({
      color:   'success',
      count:   1,
      label:   'Completed',
      percent: 50
    });
  });
});
