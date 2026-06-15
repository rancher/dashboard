import { mount } from '@vue/test-utils';
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';
import Scaler from '@shell/components/Resource/Detail/Card/Scaler.vue';

describe('component: StatusCard', () => {
  const mockResource = (stateDisplay: string, stateSimpleColor: string) => ({
    stateDisplay,
    stateSimpleColor,
  });

  const defaultMocks = {
    $store: {
      getters:  { 'i18n/t': (key: string) => key },
      dispatch: jest.fn(),
    },
  };

  const mountCard = (props: Record<string, unknown> = {}) => {
    return mount(StatusCard, {
      props:  { title: 'Pods', ...props },
      global: {
        mocks: defaultMocks,
        stubs: {
          StatusBar: true,
          StatusRow: true,
          Scaler:    true,
        },
      },
    });
  };

  describe('with resources', () => {
    it('should render StatusBar and StatusRows when resources are present', () => {
      const resources = [
        mockResource('Running', 'text-success'),
        mockResource('Running', 'text-success'),
        mockResource('Error', 'text-error'),
      ];

      const wrapper = mountCard({ resources });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(true);
      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(2);
    });

    it('should not render noResourcesMessage when resources are present', () => {
      const resources = [mockResource('Running', 'text-success')];

      const wrapper = mountCard({ resources, noResourcesMessage: 'No pods' });

      expect(wrapper.find('.text-deemphasized').exists()).toBe(false);
    });
  });

  describe('with empty resources', () => {
    it('should not render StatusBar or StatusRows', () => {
      const wrapper = mountCard({ resources: [], noResourcesMessage: 'No pods' });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(false);
      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(0);
    });

    it('should render noResourcesMessage when provided', () => {
      const wrapper = mountCard({ resources: [], noResourcesMessage: 'There are no pods currently present.' });

      const emptyDiv = wrapper.find('.text-deemphasized');

      expect(emptyDiv.exists()).toBe(true);
      expect(emptyDiv.text()).toBe('There are no pods currently present.');
    });

    it('should not render empty-state div when noResourcesMessage is not provided', () => {
      const wrapper = mountCard({ resources: [] });

      expect(wrapper.find('.text-deemphasized').exists()).toBe(false);
    });
  });

  describe('with undefined resources', () => {
    it('should not render StatusBar, StatusRows, or noResourcesMessage', () => {
      const wrapper = mountCard({ noResourcesMessage: 'No pods' });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(false);
      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(0);
      expect(wrapper.find('.text-deemphasized').exists()).toBe(true);
      expect(wrapper.find('.text-deemphasized').text()).toBe('No pods');
    });
  });

  describe('scaling', () => {
    it('should render Scaler when showScaling is true', () => {
      const resources = [mockResource('Running', 'text-success')];

      const wrapper = mountCard({ resources, showScaling: true });

      expect(wrapper.findComponent(Scaler).exists()).toBe(true);
    });

    it('should not render Scaler when showScaling is false', () => {
      const resources = [mockResource('Running', 'text-success')];

      const wrapper = mountCard({ resources, showScaling: false });

      expect(wrapper.findComponent(Scaler).exists()).toBe(false);
    });
  });
});
