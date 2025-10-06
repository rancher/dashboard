
import { mount } from '@vue/test-utils';
import AutoscalerTab from '@shell/components/AutoscalerTab.vue';
import { ref } from 'vue';
import { createStore } from 'vuex';

const mockUseFetch = jest.fn();

jest.mock('@shell/components/Resource/Detail/FetchLoader/composables', () => ({ useFetch: (...args: any[]) => mockUseFetch(...args) }));

const mockUseInterval = jest.fn();

jest.mock('@shell/composables/useInterval', () => ({ useInterval: (...args: any[]) => mockUseInterval(...args) }));

describe('component: AutoscalerTab.vue', () => {
  const mockLoadEvents = jest.fn();
  const mockRefresh = jest.fn();
  const mockChangeSort = jest.fn();

  const SortableTableStub = {
    name:     'SortableTable',
    template: '<div></div>',
    setup() {
      return { changeSort: mockChangeSort };
    },
    props: ['namespaced', 'rowActions', 'defaultSortBy', 'headers', 'rows']
  };

  const createWrapper = (props: any, useFetchState: any) => {
    mockUseFetch.mockImplementation(() => {
      return ref({
        data:    null,
        refresh: mockRefresh,
        ...useFetchState,
      });
    });

    return mount(AutoscalerTab, {
      props: {
        value: { loadAutoscalerEvents: mockLoadEvents },
        ...props,
      },
      global: {
        plugins: [createStore({})],
        stubs:   {
          Tab: {
            name:     'Tab',
            template: '<div><slot/></div>',
            props:    ['label']
          },
          SortableTable: SortableTableStub,
        },
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization and Data Fetching', () => {
    it('should call useFetch with the correct loader function', () => {
      createWrapper({}, {});
      expect(mockUseFetch).toHaveBeenCalledWith(expect.any(Function));

      const loader = mockUseFetch.mock.calls[0][0];

      loader();
      expect(mockLoadEvents).toHaveBeenCalledWith();
    });

    it('should setup a polling interval to refresh data', () => {
      createWrapper({}, {});
      expect(mockUseInterval).toHaveBeenCalledWith(expect.any(Function), 20000);

      const intervalFn = mockUseInterval.mock.calls[0][0];

      intervalFn();
      expect(mockRefresh).toHaveBeenCalledWith();
    });

    it('should call changeSort on the table on mounted', () => {
      createWrapper({}, {});
      expect(mockChangeSort).toHaveBeenCalledWith('date', true);
    });
  });

  describe('sortableTable props', () => {
    it('should pass static props to the table', () => {
      const wrapper = createWrapper({}, {});
      const table = wrapper.findComponent(SortableTableStub);

      expect(table.props('namespaced')).toBe(false);
      expect(table.props('rowActions')).toBe(false);
      expect(table.props('defaultSortBy')).toBe('date');
      expect(table.props('headers')).toHaveLength(4);
      expect(table.props('headers')[0].name).toBe('type');
    });

    it('should pass an empty array to rows when data is null', () => {
      const wrapper = createWrapper({}, { data: null });
      const table = wrapper.findComponent(SortableTableStub);

      expect(table.props('rows')).toStrictEqual([]);
    });

    it('should pass fetched data to the rows prop', () => {
      const mockEvents = [
        { id: 1, message: 'Event 1' },
        { id: 2, message: 'Event 2' },
      ];
      const wrapper = createWrapper({}, { data: mockEvents });
      const table = wrapper.findComponent(SortableTableStub);

      expect(table.props('rows')).toStrictEqual(mockEvents);
    });
  });

  it('should pass correct label to Tab component', () => {
    const wrapper = createWrapper({}, {});
    const tab = wrapper.findComponent({ name: 'Tab' });

    expect(tab.props('label')).toBe('autoscaler.tab.title');
  });
});
