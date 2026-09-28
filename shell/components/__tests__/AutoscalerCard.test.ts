
import { mount } from '@vue/test-utils';
import AutoscalerCard from '@shell/components/AutoscalerCard.vue';
import { ref } from 'vue';
import { createStore } from 'vuex';

const mockUseFetch = jest.fn();

jest.mock('@shell/components/Resource/Detail/FetchLoader/composables', () => ({ useFetch: (...args: any[]) => mockUseFetch(...args) }));

const mockUseInterval = jest.fn();

jest.mock('@shell/composables/useInterval', () => ({ useInterval: (...args: any[]) => mockUseInterval(...args) }));

describe('component: AutoscalerCard.vue', () => {
  const mockLoadDetails = jest.fn();
  const mockRefresh = jest.fn();

  const createWrapper = (props: any, useFetchState: any) => {
    // Reset and configure the useFetch mock for each test
    mockUseFetch.mockImplementation(() => {
      return ref({
        loading:    false,
        refreshing: false,
        data:       null,
        refresh:    mockRefresh,
        ...useFetchState,
      });
    });

    return mount(AutoscalerCard, {
      props: {
        value: { loadAutoscalerDetails: mockLoadDetails },
        ...props,
      },
      global:  { plugins: [createStore({})] },
      // Shallow mount to avoid rendering child components like the dynamic ones
      shallow: true,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useFetch with the correct loader function', () => {
    createWrapper({}, {});
    // The first argument to useFetch is the loader function
    expect(mockUseFetch).toHaveBeenCalledWith(expect.any(Function));
    // We can invoke the loader to ensure it calls the prop method
    const loader = mockUseFetch.mock.calls[0][0];

    loader();
    expect(mockLoadDetails).toHaveBeenCalledWith();
  });

  it('should setup a polling interval to refresh data', () => {
    createWrapper({}, {});
    expect(mockUseInterval).toHaveBeenCalledWith(expect.any(Function), 10000);

    // Invoke the interval function to ensure it calls refresh
    const intervalFn = mockUseInterval.mock.calls[0][0];

    intervalFn();
    expect(mockRefresh).toHaveBeenCalledWith();
  });

  describe('uI States', () => {
    it('should display a loading spinner on initial load', () => {
      const wrapper = createWrapper({}, { loading: true, refreshing: false });

      expect(wrapper.find('.loading').exists()).toBe(true);
      expect(wrapper.find('.icon-spinner').exists()).toBe(true);
      expect(wrapper.find('.details').exists()).toBe(false);
      expect(wrapper.find('.text-warning').exists()).toBe(false);
    });

    it('should NOT display the main loading spinner during a background refresh', () => {
      const wrapper = createWrapper({}, {
        loading: true, refreshing: true, data: []
      });

      expect(wrapper.find('.loading').exists()).toBe(false);
      // Data should still be visible
      expect(wrapper.find('.details').exists()).toBe(true);
    });

    it('should display an error message if loading fails', () => {
      const wrapper = createWrapper({}, { loading: false, data: null });

      expect(wrapper.find('.text-warning').exists()).toBe(true);
      expect(wrapper.find('.text-warning').text()).toBe('autoscaler.card.loadingError');
      expect(wrapper.find('.loading').exists()).toBe(false);
      expect(wrapper.find('.details').exists()).toBe(false);
    });

    it('should display details when data is loaded', () => {
      const mockData = [
        { label: 'Status', value: 'Active' },
        { label: 'Nodes', value: '3' },
      ];
      const wrapper = createWrapper({}, { loading: false, data: mockData });

      expect(wrapper.find('.details').exists()).toBe(true);
      const details = wrapper.findAll('.detail');

      expect(details).toHaveLength(2);
      expect(details[0].text()).toContain('Status');
      expect(details[0].text()).toContain('Active');
      expect(details[1].text()).toContain('Nodes');
      expect(details[1].text()).toContain('3');
    });
  });

  describe('detail Rendering', () => {
    it('should render a string value', () => {
      const mockData = [{ label: 'My Label', value: 'My Value' }];
      const wrapper = createWrapper({}, { data: mockData });
      const valueDiv = wrapper.find('.value');

      expect(valueDiv.find('span').exists()).toBe(true);
      expect(valueDiv.text()).toBe('My Value');
    });

    it('should render a dynamic component value', () => {
      const DynamicComponent = {
        name:     'DynamicComponent',
        props:    ['text'],
        template: '<div>{{ text }}</div>'
      };
      const mockData = [{
        label: 'My Component',
        value: { component: DynamicComponent, props: { text: 'Dynamic Text' } }
      }];
      const wrapper = createWrapper({}, { data: mockData });
      const valueDiv = wrapper.find('.value');
      const renderedComponent = valueDiv.findComponent(DynamicComponent);

      expect(renderedComponent.exists()).toBe(true);
      expect(renderedComponent.props('text')).toBe('Dynamic Text');
    });

    it('should render a heading for details without a value', () => {
      const mockData = [{ label: 'Section Header' }];
      const wrapper = createWrapper({}, { data: mockData });

      expect(wrapper.find('h5').exists()).toBe(true);
      expect(wrapper.find('h5').text()).toBe('Section Header');
      // Label and value should not be rendered
      expect(wrapper.find('label').exists()).toBe(false);
      expect(wrapper.find('.value').exists()).toBe(false);
    });
  });
});
