import { mount } from '@vue/test-utils';
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';
import Scaler from '@shell/components/Resource/Detail/Card/Scaler.vue';
import type { SummaryResult } from '@shell/components/Resource/Detail/Card/StateCard/composables';

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

  describe('with summaryData', () => {
    it('should render StatusBar and StatusRows from summary counts', () => {
      const summaryData: SummaryResult = {
        count:   5,
        summary: [{ property: 'metadata.state.name', counts: { running: 3, error: 2 } }]
      };

      const wrapper = mountCard({ summaryData });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(true);
      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(2);
    });

    it('should use summaryData over resources when both are provided', () => {
      const summaryData: SummaryResult = {
        count:   4,
        summary: [{ property: 'metadata.state.name', counts: { running: 3, completed: 1 } }]
      };
      const resources = [
        mockResource('Running', 'text-success'),
      ];

      const wrapper = mountCard({ summaryData, resources });

      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(2);
    });

    it('should fall back to resources when summaryData has no summary', () => {
      const summaryData: SummaryResult = { count: 0, summary: null };
      const resources = [
        mockResource('Running', 'text-success'),
        mockResource('Error', 'text-error'),
      ];

      const wrapper = mountCard({ summaryData, resources });

      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(2);
    });

    it('should show noResourcesMessage when summaryData has no counts', () => {
      const summaryData: SummaryResult = { count: 0, summary: [] };

      const wrapper = mountCard({ summaryData, noResourcesMessage: 'No pods' });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(false);
      expect(wrapper.find('.text-deemphasized').text()).toBe('No pods');
    });

    it('should render a single state from summary', () => {
      const summaryData: SummaryResult = {
        count:   2,
        summary: [{ property: 'metadata.state.name', counts: { active: 2 } }]
      };

      const wrapper = mountCard({ summaryData });

      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(1);
    });
  });
});
