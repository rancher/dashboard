import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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

  const mountCard = (props: Record<string, unknown> = {}, errorHandler?: (err: unknown) => void) => {
    return mount(StatusCard, {
      props:  { title: 'Pods', ...props },
      global: {
        mocks:  defaultMocks,
        config: errorHandler ? { errorHandler } : {},
        stubs:  {
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

    it('should label the scaler and name its buttons for replicas', () => {
      const wrapper = mountCard({ showScaling: true, scaleValue: 2 });

      // The card counts pods, but the buttons change replicas. Both numbers are on show, so the
      // rocker says which one it is, and says the same thing to a screen reader.
      expect(wrapper.find('.scale-label').text()).toBe('tableHeaders.scale');
      expect(wrapper.findComponent(Scaler).props('ariaResourceName')).toBe('component.resource.detail.card.scaler.ariaResourceName');
    });

    it('should show the scale value rather than the number of resources', () => {
      const resources = [
        mockResource('Running', 'text-success'),
        mockResource('Running', 'text-success'),
        mockResource('Running', 'text-success'),
      ];

      const wrapper = mountCard({
        resources, showScaling: true, scaleValue: 1
      });

      expect(wrapper.findComponent(Scaler).props('value')).toBe(1);
    });

    it('should show the scale value rather than the summary count', () => {
      const summaryData: SummaryResult = {
        count:   4,
        summary: [{ property: 'metadata.state.name', counts: { running: { total: 4 } } }]
      };

      const wrapper = mountCard({
        summaryData, showScaling: true, scaleValue: 2
      });

      expect(wrapper.findComponent(Scaler).props('value')).toBe(2);
    });

    it('should disable the Scaler until the scale request settles', async() => {
      let resolveScale = () => {};
      const onIncrease = jest.fn(() => new Promise<void>((resolve) => {
        resolveScale = resolve;
      }));

      const wrapper = mountCard({
        showScaling: true, scaleValue: 1, onIncrease
      });
      const scaler = wrapper.findComponent(Scaler);

      expect(scaler.props('disabled')).toBe(false);

      scaler.vm.$emit('increase', 2);
      await nextTick();

      expect(onIncrease).toHaveBeenCalledWith();
      expect(scaler.props('disabled')).toBe(true);

      resolveScale();
      await flushPromises();

      expect(scaler.props('disabled')).toBe(false);
    });

    it('should ignore scale requests made whilst one is in flight', async() => {
      const onIncrease = jest.fn(() => new Promise<void>(() => {}));
      const onDecrease = jest.fn(() => new Promise<void>(() => {}));

      const wrapper = mountCard({
        showScaling: true, scaleValue: 1, onIncrease, onDecrease
      });
      const scaler = wrapper.findComponent(Scaler);

      scaler.vm.$emit('increase', 2);
      scaler.vm.$emit('increase', 3);
      scaler.vm.$emit('decrease', 1);
      await nextTick();

      expect(onIncrease).toHaveBeenCalledTimes(1);
      expect(onIncrease).toHaveBeenCalledWith();
      expect(onDecrease).toHaveBeenCalledTimes(0);
    });

    it('should re-enable the Scaler when the scale request fails', async() => {
      const error = new Error('nope');
      const onDecrease = jest.fn(() => Promise.reject(error));
      const errorHandler = jest.fn();

      const wrapper = mountCard({
        showScaling: true, scaleValue: 1, onDecrease
      }, errorHandler);
      const scaler = wrapper.findComponent(Scaler);

      scaler.vm.$emit('decrease', 0);
      await flushPromises();

      expect(onDecrease).toHaveBeenCalledWith();
      // The failure is left to the handler and the app to report, but the buttons must not be
      // left disabled for ever
      expect(errorHandler).toHaveBeenCalledWith(error, expect.anything(), expect.any(String));
      expect(scaler.props('disabled')).toBe(false);
    });
  });

  describe('with summaryData', () => {
    it('should render StatusBar and StatusRows from summary counts', () => {
      const summaryData: SummaryResult = {
        count:   5,
        summary: [{ property: 'metadata.state.name', counts: { running: { total: 3 }, error: { total: 2 } } }]
      };

      const wrapper = mountCard({ summaryData });

      expect(wrapper.findComponent(StatusBar).exists()).toBe(true);
      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(2);
    });

    it('should use summaryData over resources when both are provided', () => {
      const summaryData: SummaryResult = {
        count:   4,
        summary: [{ property: 'metadata.state.name', counts: { running: { total: 3 }, completed: { total: 1 } } }]
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
        summary: [{ property: 'metadata.state.name', counts: { active: { total: 2 } } }]
      };

      const wrapper = mountCard({ summaryData });

      expect(wrapper.findAllComponents(StatusRow)).toHaveLength(1);
    });
  });
});
