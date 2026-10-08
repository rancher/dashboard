import { mount } from '@vue/test-utils';
import StatusSummaryCardSection from '@shell/components/Resource/Detail/Card/StatusSummaryCard/StatusSummaryCardSection.vue';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';

const cards: StatusSummaryCardItem[] = [
  {
    key:      'deployments',
    title:    'Deployments',
    total:    2,
    segments: [{ color: 'success', percent: 100 }],
    rows:     [{
      key: 'running', label: 'Running', color: 'success', count: 2
    }],
    to: { name: 'deployments' },
  },
  {
    key:      'jobs',
    title:    'Jobs',
    total:    0,
    segments: [],
    rows:     [],
  },
];

describe('component: StatusSummaryCardSection', () => {
  const mountSection = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => {
    return mount(StatusSummaryCardSection, {
      props:  { cards, ...props },
      slots,
      global: {
        stubs: {
          StatusSummaryCard: {
            props:    ['title', 'total', 'segments', 'rows', 'to'],
            template: '<div class="card-stub"><slot v-if="!rows.length" name="empty" /></div>',
          },
        },
      },
    });
  };

  describe('title', () => {
    it('should render the title when one is given', () => {
      const wrapper = mountSection({ title: 'By Type' });

      expect(wrapper.find('h4').text()).toStrictEqual('By Type');
    });

    it('should not render a title when none is given', () => {
      const wrapper = mountSection();

      expect(wrapper.find('h4').exists()).toStrictEqual(false);
    });
  });

  describe('cards', () => {
    it('should render one card per item', () => {
      const wrapper = mountSection();

      expect(wrapper.findAllComponents(StatusSummaryCard)).toHaveLength(2);
    });

    it('should pass each item to its card', () => {
      const wrapper = mountSection();
      const { key, ...props } = cards[0];

      expect(wrapper.findAllComponents(StatusSummaryCard)[0].props()).toStrictEqual(props);
    });

    it('should render nothing in the grid when there are no cards', () => {
      const wrapper = mountSection({ cards: [] });

      expect(wrapper.find('.card-grid').element.children).toHaveLength(0);
    });
  });

  describe('columns', () => {
    it('should default to three columns', () => {
      const wrapper = mountSection();

      expect(wrapper.find('.card-grid').attributes('style')).toContain('grid-template-columns: repeat(3, 1fr)');
    });

    it('should use the given number of columns', () => {
      const wrapper = mountSection({ columns: 2 });

      expect(wrapper.find('.card-grid').attributes('style')).toContain('grid-template-columns: repeat(2, 1fr)');
    });
  });

  describe('empty slot', () => {
    it('should forward the empty slot with the card it belongs to', () => {
      const wrapper = mountSection({}, { empty: '<template #empty="{ card }"><span class="custom-empty">No {{ card.title }}</span></template>' });

      expect(wrapper.findAll('.custom-empty').map((e) => e.text())).toStrictEqual(['No Jobs']);
    });

    it('should not forward an empty slot when none is given', () => {
      const wrapper = mountSection();
      const emptyCard = wrapper.findAllComponents(StatusSummaryCard)[1];

      expect(emptyCard.vm.$slots.empty).toBeUndefined();
    });
  });

  it('should pass a test id through to the root element', () => {
    const wrapper = mountSection({ 'data-testid': 'my-section' });

    expect(wrapper.attributes('data-testid')).toStrictEqual('my-section');
  });
});
