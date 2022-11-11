import { mount } from '@vue/test-utils';
import { Card } from './index';

describe('component: Card', () => {
  const title = 'Card title';
  const body = 'Card body';


    const wrapper = mount(Card, {
        propsData: { title, body },
        slots: { 
          title: '<div>Card title</div>',
          body: '<div>Card body</div>',
        }
    });

  it('should have a card title', () => {
    const element = wrapper.find('[data-testid="card-title-slot"]')
    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(title)
  });

  it('should have a card body', () => {
    const element = wrapper.find('[data-testid="card-body-slot"]')
    expect(element.exists()).toBe(true);
    expect(element.text()).toBe(body)
  });

  it('should have a card actions', () => {
    const element = wrapper.find('[data-testid="card-actions-slot"]')
    expect(element.exists()).toBe(true);
  });
});

