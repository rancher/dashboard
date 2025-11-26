import { mount } from '@vue/test-utils';
import { Card } from './index';

describe('component: Card', () => {
  const title = 'Card title';
  const body = 'Card body';

  it('should have a card title', () => {
    const wrapper = mount(Card, {
      propsData: { title },
      slots:     { title: '<div>Card title</div>' }
    });

    const element = wrapper.find('[data-testid="card-title-slot"]');

    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(title);
  });

  it('should have a card body', () => {
    const wrapper = mount(Card, {
      propsData: { body },
      slots:     { body: '<div>Card body</div>' }
    });
    const element = wrapper.find('[data-testid="card-body-slot"]');

    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(body);
  });

  it('should display the default card actions', () => {
    const wrapper = mount(Card);
    const element = wrapper.find('[data-testid="card-actions-slot"]');

    expect(element.exists()).toBe(true);
  });
});
