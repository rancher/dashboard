import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { Card } from './index';
import { provideModalTitleId } from '@components/utils/modalTitle';

describe('component: Card', () => {
  const title = 'Card title';
  const body = 'Card body';

  it('should have a card title', () => {
    const wrapper = mount(Card, {
      props: { title },
      slots: { title: '<div>Card title</div>' }
    });

    const element = wrapper.find('[data-testid="card-title-slot"]');

    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(title);
  });

  it('should have a card body', () => {
    const wrapper = mount(Card, { slots: { body: '<div>Card body</div>' } });

    const element = wrapper.find('[data-testid="card-body-slot"]');

    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(body);
  });

  it('should display the default card actions', () => {
    const wrapper = mount(Card);
    const element = wrapper.find('[data-testid="card-actions-slot"]');

    expect(element.exists()).toBe(true);
  });

  it('should not give the card title an id when rendered outside of a modal', () => {
    const wrapper = mount(Card, { slots: { title: '<div>Card title</div>' } });

    expect(wrapper.find('[data-testid="card-title-slot"]').attributes('id')).toBeUndefined();
  });

  it('should claim the enclosing modal title id for the card title', () => {
    let titleId = '';

    const modal = defineComponent({
      setup() {
        titleId = provideModalTitleId();

        return () => h(Card, null, { title: () => h('h4', title) });
      }
    });

    const wrapper = mount(modal);

    expect(titleId).not.toBe('');
    expect(wrapper.find('[data-testid="card-title-slot"]').attributes('id')).toBe(titleId);
  });

  it('should only let the first card in a modal claim the title id', () => {
    let titleId = '';

    const modal = defineComponent({
      setup() {
        titleId = provideModalTitleId();

        return () => h('div', [
          h(Card, null, { title: () => h('h4', title) }),
          h(Card, null, { title: () => h('h4', body) }),
        ]);
      }
    });

    const wrapper = mount(modal);
    const ids = wrapper.findAll('[data-testid="card-title-slot"]').map((el) => el.attributes('id'));

    expect(ids).toStrictEqual([titleId, undefined]);
  });
});
