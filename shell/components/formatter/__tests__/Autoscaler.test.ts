
import { mount } from '@vue/test-utils';
import Autoscaler from '@shell/components/formatter/Autoscaler.vue';
import { createStore } from 'vuex';

describe('component: formatter/Autoscaler.vue', () => {
  const mockToggleRunner = jest.fn();
  const mockClose = jest.fn();

  const PopoverCardStub = {
    name:     'PopoverCard',
    template: `
      <div>
        <slot />
        <slot name="heading-action" :close="close" />
        <slot name="card-body" />
      </div>
    `,
    props: ['cardTitle', 'fallbackFocus'],
    setup() {
      return { close: mockClose };
    }
  };

  const createWrapper = (props: any) => {
    return mount(Autoscaler, {
      props,
      global: {
        plugins: [createStore({})],
        stubs:   {
          PopoverCard:    PopoverCardStub,
          RcButton:       { template: '<button><slot /></button>' },
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
    jest.clearAllMocks();
  });

  describe('unchecked state', () => {
    it.each([
      [false],
      ['false'],
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
      [undefined],
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
    it('should NOT render if canExplore is false', () => {
      const rowData = { canExplore: false };
      const wrapper = createWrapper({ value: true, row: rowData });

      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('should render "Pause" button if autoscaler is running', () => {
      const rowData = {
        canExplore: true, isAutoscalerPaused: false, canPauseResumeAutoscaler: true
      };
      const wrapper = createWrapper({
        value: true, row: rowData, canPauseResumeAutoscaler: true
      });
      const button = wrapper.find('button');

      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('autoscaler.card.pause');
      expect(wrapper.find('.icon-pause').exists()).toBe(true);
    });

    it('should render "Resume" button if autoscaler is paused', () => {
      const rowData = {
        canExplore: true, isAutoscalerPaused: true, canPauseResumeAutoscaler: true
      };
      const wrapper = createWrapper({ value: true, row: rowData });
      const button = wrapper.find('button');

      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('autoscaler.card.resume');
      expect(wrapper.find('.icon-play').exists()).toBe(true);
    });

    it('should hide "Resume" button if canPauseResumeAutoscaler is false', () => {
      const rowData = {
        canExplore: true, isAutoscalerPaused: true, canPauseResumeAutoscaler: false
      };
      const wrapper = createWrapper({ value: true, row: rowData });
      const button = wrapper.find('button');

      expect(button.exists()).toBe(false);
    });

    it('should call toggleAutoscalerRunner and close on click', async() => {
      const rowData = {
        canExplore: true, toggleAutoscalerRunner: mockToggleRunner, canPauseResumeAutoscaler: true
      };
      const wrapper = createWrapper({ value: true, row: rowData });

      wrapper.find('button').trigger('click');

      expect(mockToggleRunner).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
