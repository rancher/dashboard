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

  it('should pass title to Card prop correctly', () => {
    const title = 'component.resource.detail.card.podsCard.title';
    const wrapper = mount(PodsCard, { props: { title, showScaling: true }, global: { provide: { store } } });

    const card = wrapper.findComponent(Card);

    expect(card.props('title')).toStrictEqual(title);
  });

  it('should show Scaler when showScaling is true', () => {
    const wrapper = mount(PodsCard, { props: { title: 'Test', showScaling: true }, global: { provide: { store } } });

    expect(wrapper.findComponent(Scaler).exists()).toBeTruthy();
  });

  it('should hide scaler when showScaling is false', () => {
    const wrapper = mount(PodsCard, { props: { title: 'Test', showScaling: false }, global: { provide: { store } } });

    expect(wrapper.findComponent(Scaler).exists()).toBeFalsy();
  });

  it('should pass the appropriate props to the Scaler component', () => {
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

  it('should pass the appropriate props to the StatusBar component based on the resources input', () => {
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

  it('should pass the appropriate props to the StatusRow component based on the resources input', () => {
    const wrapper = mount(PodsCard, {
      props: {
        title: 'Test', showScaling: true, resources: [podSuccess, podFail]
      },
      global: { provide: { store } }
    });
    const rows = wrapper.findComponent(StatusRow);

    expect(rows.props()).toStrictEqual({
      color:       'success',
      count:       1,
      label:       'Completed',
      percent:     50,
      showPercent: true,
      to:          undefined,
    });
  });

  it('should not render StatusBar or StatusRow when resources is empty', () => {
    const wrapper = mount(PodsCard, {
      props:  { title: 'Test', resources: [] },
      global: { provide: { store } }
    });

    expect(wrapper.findComponent(StatusBar).exists()).toBeFalsy();
    expect(wrapper.findComponent(StatusRow).exists()).toBeFalsy();
  });

  describe('pre-aggregated count support', () => {
    it('should use resource.count when provided instead of counting array length', () => {
      const resources = [
        {
          stateSimpleColor: 'success', stateDisplay: 'Running', stateId: 'running', count: 50
        },
        {
          stateSimpleColor: 'error', stateDisplay: 'Error', stateId: 'error', count: 3
        },
      ];
      const wrapper = mount(PodsCard, {
        props:  { title: 'Test', resources },
        global: { provide: { store } }
      });
      const rows = wrapper.findAllComponents(StatusRow);

      expect(rows[0].props('count')).toStrictEqual(50);
      expect(rows[0].props('label')).toStrictEqual('Running');
      expect(rows[1].props('count')).toStrictEqual(3);
      expect(rows[1].props('label')).toStrictEqual('Error');
    });

    it('should calculate correct percentages with pre-aggregated counts', () => {
      const resources = [
        {
          stateSimpleColor: 'success', stateDisplay: 'Running', stateId: 'running', count: 75
        },
        {
          stateSimpleColor: 'error', stateDisplay: 'Error', stateId: 'error', count: 25
        },
      ];
      const wrapper = mount(PodsCard, {
        props:  { title: 'Test', resources },
        global: { provide: { store } }
      });
      const rows = wrapper.findAllComponents(StatusRow);

      expect(rows[0].props('percent')).toStrictEqual(75);
      expect(rows[1].props('percent')).toStrictEqual(25);
    });

    it('should calculate correct status bar segments with pre-aggregated counts', () => {
      const resources = [
        {
          stateSimpleColor: 'success', stateDisplay: 'Running', stateId: 'running', count: 80
        },
        {
          stateSimpleColor: 'error', stateDisplay: 'Error', stateId: 'error', count: 20
        },
      ];
      const wrapper = mount(PodsCard, {
        props:  { title: 'Test', resources },
        global: { provide: { store } }
      });
      const statusBar = wrapper.findComponent(StatusBar);
      const segments = statusBar.props('segments');

      expect(segments[0].color).toStrictEqual('success');
      expect(segments[0].percent).toStrictEqual(80);
      expect(segments[1].color).toStrictEqual('error');
      expect(segments[1].percent).toStrictEqual(20);
    });

    it('should default to count of 1 when resource.count is not provided', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'error', stateDisplay: 'Error' },
      ];
      const wrapper = mount(PodsCard, {
        props:  { title: 'Test', resources },
        global: { provide: { store } }
      });
      const rows = wrapper.findAllComponents(StatusRow);

      expect(rows[0].props('count')).toStrictEqual(2);
      expect(rows[1].props('count')).toStrictEqual(1);
    });
  });
});
