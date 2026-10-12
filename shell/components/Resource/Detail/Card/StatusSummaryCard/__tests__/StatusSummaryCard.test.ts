import { mount } from '@vue/test-utils';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import SubtleLink from '@shell/components/SubtleLink.vue';
import type { StatusSummaryCardProps } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';

const mockRouterPush = jest.fn();

jest.mock('vue-router', () => ({ useRouter: () => ({ push: mockRouterPush }) }));

const listRoute = { name: 'list' };
const errorRoute = { name: 'list', query: { stateFilter: 'error' } };

const defaultProps: StatusSummaryCardProps = {
  title:    'Deployments',
  total:    3,
  segments: [{ color: 'error', percent: 33 }, { color: 'success', percent: 67 }],
  rows:     [
    {
      key: 'error', label: 'Error', color: 'error', count: 1, to: errorRoute
    },
    {
      key: 'running', label: 'Running', color: 'success', count: 2
    },
  ],
  to: listRoute,
};

describe('component: StatusSummaryCard', () => {
  const mountCard = (props: Partial<StatusSummaryCardProps> = {}, slots: Record<string, string> = {}) => {
    return mount(StatusSummaryCard, {
      props:  { ...defaultProps, ...props },
      slots,
      global: {
        stubs: {
          StatusBar:      true,
          RcCounterBadge: true,
          SubtleLink:     { props: ['to'], template: '<a class="subtle-link"><slot /></a>' },
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.getSelection = jest.fn().mockReturnValue({ toString: () => '' });
  });

  describe('content', () => {
    it('should render the title', () => {
      const wrapper = mountCard();

      expect(wrapper.find('.title').text()).toStrictEqual('Deployments');
    });

    it('should describe the card with its title and total', () => {
      const wrapper = mountCard();

      expect(wrapper.attributes('aria-label')).toStrictEqual('Deployments: 3 total');
    });

    it('should pass the segments to the status bar', () => {
      const wrapper = mountCard();

      expect(wrapper.findComponent(StatusBar).props('segments')).toStrictEqual(defaultProps.segments);
    });

    it('should not render the status bar when there are no segments', () => {
      const wrapper = mountCard({ segments: [] });

      expect(wrapper.findComponent(StatusBar).exists()).toStrictEqual(false);
    });

    it('should render one row per state', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.status-row .label').map((l) => l.text())).toStrictEqual(['Error', 'Running']);
    });

    it('should render each row count in a counter badge', () => {
      const wrapper = mountCard();

      expect(wrapper.findAllComponents(RcCounterBadge).map((b) => b.props('count'))).toStrictEqual([1, 2]);
    });

    it('should render a link for a row with a route', () => {
      const wrapper = mountCard();
      const link = wrapper.findComponent(SubtleLink);

      expect(link.props('to')).toStrictEqual(errorRoute);
    });

    it('should keep the row link inside the growing label, so the link is only as wide as its text', () => {
      const wrapper = mountCard();

      expect(wrapper.find('.status-row .label > .subtle-link').exists()).toStrictEqual(true);
    });

    it('should render plain text for a row without a route', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.status-row')[1].find('.subtle-link').exists()).toStrictEqual(false);
    });
  });

  describe('empty', () => {
    it('should render the empty slot when there are no rows', () => {
      const wrapper = mountCard({ rows: [], segments: [] }, { empty: '<span class="custom-empty">Nothing here</span>' });

      expect(wrapper.find('.custom-empty').text()).toStrictEqual('Nothing here');
    });

    it('should not render the rows list when there are no rows', () => {
      const wrapper = mountCard({ rows: [], segments: [] });

      expect(wrapper.find('.rows').exists()).toStrictEqual(false);
    });

    it('should not render the empty slot when there are rows', () => {
      const wrapper = mountCard({}, { empty: '<span class="custom-empty">Nothing here</span>' });

      expect(wrapper.find('.custom-empty').exists()).toStrictEqual(false);
    });
  });

  describe('whole card link', () => {
    it('should open the card route on a plain click', async() => {
      const wrapper = mountCard();

      await wrapper.find('.body').trigger('click');

      expect(mockRouterPush).toHaveBeenCalledWith(listRoute);
    });

    it('should open the card route on enter', async() => {
      const wrapper = mountCard();

      await wrapper.trigger('keyup.enter');

      expect(mockRouterPush).toHaveBeenCalledWith(listRoute);
    });

    it('should not open the card route when a row link is clicked', async() => {
      const wrapper = mountCard();

      await wrapper.find('.subtle-link').trigger('click');

      expect(mockRouterPush).toHaveBeenCalledTimes(0);
    });

    it('should not open the card route while text is selected', async() => {
      window.getSelection = jest.fn().mockReturnValue({ toString: () => 'Running' });
      const wrapper = mountCard();

      await wrapper.find('.body').trigger('click');

      expect(mockRouterPush).toHaveBeenCalledTimes(0);
    });

    it('should be focusable when it has a route', () => {
      const wrapper = mountCard();

      expect(wrapper.attributes('tabindex')).toStrictEqual('0');
    });

    it('should show it is clickable when it has a route', () => {
      const wrapper = mountCard();

      expect(wrapper.classes()).toContain('clickable');
    });

    it('should not navigate on click when it has no route', async() => {
      const wrapper = mountCard({ to: undefined });

      await wrapper.find('.body').trigger('click');

      expect(mockRouterPush).toHaveBeenCalledTimes(0);
    });

    it('should not be focusable when it has no route', () => {
      const wrapper = mountCard({ to: undefined });

      expect(wrapper.attributes('tabindex')).toBeUndefined();
    });

    it('should not show it is clickable when it has no route', () => {
      const wrapper = mountCard({ to: undefined });

      expect(wrapper.classes()).not.toContain('clickable');
    });
  });
});
