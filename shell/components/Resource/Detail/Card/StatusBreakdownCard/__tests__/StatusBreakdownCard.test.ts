import { mount } from '@vue/test-utils';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import type { StatusBreakdownCardProps } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: Record<string, unknown>) => `%${ key }%${ args ? JSON.stringify(args) : '' }` }) }));

jest.mock('vuex', () => ({ useStore: () => ({}) }));

const podsRoute = { name: 'list', params: { resource: 'pod' } };
const podsErrorRoute = { ...podsRoute, query: { stateFilter: 'error,crashloopbackoff' } };

const defaultProps: StatusBreakdownCardProps = {
  title: 'Other, Unhealthy Resources',
  rows:  [
    {
      key:    'pod',
      label:  'Pods',
      to:     podsRoute,
      counts: [
        {
          color: 'error', count: 3, to: podsErrorRoute
        },
        { color: 'warning', count: 1 },
      ],
    },
    {
      key:    'job',
      label:  'Jobs',
      counts: [{ color: 'error', count: 2 }],
    },
  ],
};

describe('component: StatusBreakdownCard', () => {
  const mountCard = (props: Partial<StatusBreakdownCardProps> = {}, slots: Record<string, string> = {}) => {
    return mount(StatusBreakdownCard, {
      props:  { ...defaultProps, ...props },
      slots,
      global: {
        stubs: {
          StateDot:   true,
          SubtleLink: { props: ['to'], template: '<a class="subtle-link"><slot /></a>' },
        },
      },
    });
  };

  beforeEach(() => {
    window.getSelection = jest.fn().mockReturnValue({ toString: () => '' });
  });

  describe('content', () => {
    it('should render the title', () => {
      const wrapper = mountCard();

      expect(wrapper.find('.title').text()).toStrictEqual('Other, Unhealthy Resources');
    });

    it('should describe the card with its title', () => {
      const wrapper = mountCard();

      expect(wrapper.attributes('aria-label')).toStrictEqual('Other, Unhealthy Resources');
    });

    it('should render one row per item', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.breakdown-row .label').map((l) => l.text())).toStrictEqual(['Pods', 'Jobs']);
    });

    it('should render a link for a row label with a route', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.breakdown-row')[0].findComponent(SubtleLink).props('to')).toStrictEqual(podsRoute);
    });

    it('should keep the row link inside the growing label, so the link is only as wide as its text', () => {
      const wrapper = mountCard();

      expect(wrapper.find('.breakdown-row .label > .subtle-link').exists()).toStrictEqual(true);
    });

    it('should render plain text for a row label without a route', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.breakdown-row')[1].find('.subtle-link').exists()).toStrictEqual(false);
    });

    it('should render each count of a row', () => {
      const wrapper = mountCard();

      expect(wrapper.findAll('.breakdown-row')[0].findAll('.count').map((c) => c.text())).toStrictEqual(['3', '1']);
    });

    it('should render a dot in the color of each count', () => {
      const wrapper = mountCard();

      const dots = wrapper.findAll('.breakdown-row')[0].findAll('state-dot-stub');

      expect(dots.map((d) => d.attributes('color'))).toStrictEqual(['error', 'warning']);
    });

    it('should render a link for a count with a route', () => {
      const wrapper = mountCard();
      const count = wrapper.findAll('.breakdown-row')[0].findAllComponents(SubtleLink)[1];

      expect(count.props('to')).toStrictEqual(podsErrorRoute);
    });

    it('should render plain text for a count without a route', () => {
      const wrapper = mountCard();
      const count = wrapper.findAll('.breakdown-row')[0].findAll('.count')[1];

      expect(count.element.tagName).toStrictEqual('SPAN');
    });

    it('should describe each count with its label and color', () => {
      const wrapper = mountCard();
      const count = wrapper.findAll('.breakdown-row')[0].findAll('.count')[0];

      expect(count.attributes('aria-label')).toStrictEqual(
        '%component.resource.detail.card.statusBreakdownCard.ariaLabel.count%{"count":3,"label":"Pods","color":"%component.resource.detail.card.statusBreakdownCard.color.error%"}'
      );
    });
  });

  describe('empty', () => {
    it('should render the empty slot when there are no rows', () => {
      const wrapper = mountCard({ rows: [] }, { empty: '<span class="custom-empty">All good</span>' });

      expect(wrapper.find('.custom-empty').text()).toStrictEqual('All good');
    });

    it('should not render the rows list when there are no rows', () => {
      const wrapper = mountCard({ rows: [] });

      expect(wrapper.find('.rows').exists()).toStrictEqual(false);
    });

    it('should not render the empty slot when there are rows', () => {
      const wrapper = mountCard({}, { empty: '<span class="custom-empty">All good</span>' });

      expect(wrapper.find('.custom-empty').exists()).toStrictEqual(false);
    });
  });

  describe('link events', () => {
    it('should emit select-row with the row when a row link is clicked', async() => {
      const wrapper = mountCard();

      await wrapper.findAll('.breakdown-row')[0].find('.label .subtle-link').trigger('click');

      expect(wrapper.emitted('select-row')).toStrictEqual([[defaultProps.rows[0]]]);
    });

    it('should emit select-count with the row and count when a count link is clicked', async() => {
      const wrapper = mountCard();

      await wrapper.findAll('.breakdown-row')[0].find('.count').trigger('click');

      expect(wrapper.emitted('select-count')).toStrictEqual([[defaultProps.rows[0], defaultProps.rows[0].counts[0]]]);
    });
  });

  describe('selectable', () => {
    it('should emit select on a plain click', async() => {
      const wrapper = mountCard({ selectable: true });

      await wrapper.find('.body').trigger('click');

      expect(wrapper.emitted('select')).toStrictEqual([[]]);
    });

    it('should emit select on enter', async() => {
      const wrapper = mountCard({ selectable: true });

      await wrapper.trigger('keyup.enter');

      expect(wrapper.emitted('select')).toStrictEqual([[]]);
    });

    it('should not emit select when a link is clicked', async() => {
      const wrapper = mountCard({ selectable: true });

      await wrapper.find('.subtle-link').trigger('click');

      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it('should not emit select while text is selected', async() => {
      window.getSelection = jest.fn().mockReturnValue({ toString: () => 'Pods' });
      const wrapper = mountCard({ selectable: true });

      await wrapper.find('.body').trigger('click');

      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it('should be focusable and show it is clickable', () => {
      const wrapper = mountCard({ selectable: true });

      expect([wrapper.attributes('tabindex'), wrapper.classes('clickable')]).toStrictEqual(['0', true]);
    });

    it('should not emit select on click when it is not selectable', async() => {
      const wrapper = mountCard();

      await wrapper.find('.body').trigger('click');

      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it('should not be focusable or show it is clickable when it is not selectable', () => {
      const wrapper = mountCard();

      expect([wrapper.attributes('tabindex'), wrapper.classes('clickable')]).toStrictEqual([undefined, false]);
    });
  });

  it('should pass a test id through to the root element', () => {
    const wrapper = mountCard({ 'data-testid': 'my-card' } as Partial<StatusBreakdownCardProps>);

    expect(wrapper.attributes('data-testid')).toStrictEqual('my-card');
  });
});
