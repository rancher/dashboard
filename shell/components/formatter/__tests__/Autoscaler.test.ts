
import { mount } from '@vue/test-utils';
import Autoscaler from '@shell/components/formatter/Autoscaler.vue';

// Mock i18n
const mockI18n = { t: (key: string) => key };

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => mockI18n }));

// Mock Vuex store
jest.mock('vuex', () => ({ useStore: () => ({}) }));

describe('component: formatter/Autoscaler.vue', () => {
  const mockToggleRunner = jest.fn();
  const mockClose = jest.fn();

  // A stub for PopoverCard that renders slots and provides the `close` function
  const PopoverCardStub = {
    name:     'PopoverCard',
    template: `
      <div>
        <slot />
        <slot name="heading-action" :close="close" />
        <slot name="card-body" />
      </div>
    `,
    setup() {
      return { close: mockClose };
    }
  };

  const createWrapper = (props: any) => {
    return mount(Autoscaler, {
      props,
      global: {
        stubs: {
          PopoverCard:    PopoverCardStub,
          RcButton:       { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          AutoscalerCard: {
            name:     'AutoscalerCard',
            props:    ['value'],
            template: '<div></div>'
          },
        },
      }
    });
  };

  beforeEach(() => {
    mockToggleRunner.mockClear();
    mockClose.mockClear();
  });

  describe('unchecked state', () => {
    it.each([
      [false],
      ['false'],
      [null],
      [''],
    ])('should render a dash when value is %p', (value) => {
      const wrapper = createWrapper({ value, row: {} });

      expect(wrapper.text()).toBe('—');
      expect(wrapper.find('.text-muted').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PopoverCard' }).exists()).toBe(false);
    });
  });

  describe('checked state', () => {
    it.each([
      [true],
      ['true'],
      [undefined], // withDefaults makes this true
    ])('should render popover when value is %p', (value) => {
      const wrapper = createWrapper({ value, row: {} });

      expect(wrapper.findComponent({ name: 'PopoverCard' }).exists()).toBe(true);
      expect(wrapper.find('.icon-checkmark').exists()).toBe(true);
      expect(wrapper.text()).not.toBe('—');
    });

    it('should stop click propagation', async() => {
      const mockStopPropagation = jest.fn();
      const wrapper = createWrapper({ value: true, row: {} });

      await wrapper.find('.autoscaler').trigger('click', { stopPropagation: mockStopPropagation });
      expect(mockStopPropagation).toHaveBeenCalledWith();
    });

    it('should pass correct props to PopoverCard', () => {
      const wrapper = createWrapper({ value: true, row: {} });
      const popover = wrapper.findComponent(PopoverCardStub);

      expect(popover.props('cardTitle')).toBe('autoscaler.card.title');
      expect(popover.props('fallbackFocus')).toBe('.autoscaler .action');
    });

    it('should render AutoscalerCard with correct row data', () => {
      const rowData = { id: 'test-row' };
      const wrapper = createWrapper({ value: true, row: rowData });
      const card = wrapper.findComponent({ name: 'AutoscalerCard' });

      expect(card.exists()).toBe(true);
      expect(card.props('value')).toStrictEqual(rowData);
    });
  });

  describe('heading action button', () => {
    it('should NOT render if isExplorerAvailable is false', () => {
      const rowData = { isExplorerAvailable: false };
      const wrapper = createWrapper({ value: true, row: rowData });

      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('should render "Pause" button if autoscaler is running', () => {
      const rowData = { isExplorerAvailable: true, isAutoscalerPaused: false };
      const wrapper = createWrapper({ value: true, row: rowData });
      const button = wrapper.find('button');

      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('autoscaler.card.pause');
      expect(wrapper.find('.icon-pause').exists()).toBe(true);
    });

    it('should render "Resume" button if autoscaler is paused', () => {
      const rowData = { isExplorerAvailable: true, isAutoscalerPaused: true };
      const wrapper = createWrapper({ value: true, row: rowData });
      const button = wrapper.find('button');

      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('autoscaler.card.resume');
      expect(wrapper.find('.icon-play').exists()).toBe(true);
    });

    it('should call toggleAutoscalerRunner and close on click', async() => {
      const rowData = { isExplorerAvailable: true, toggleAutoscalerRunner: mockToggleRunner };
      const wrapper = createWrapper({ value: true, row: rowData });

      await wrapper.find('button').trigger('click');

      expect(mockToggleRunner).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
