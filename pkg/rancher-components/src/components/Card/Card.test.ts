import { mount } from '@vue/test-utils';
import { Card } from './index';

describe('component: Card', () => {
  it('should display text based on card title', () => {
    const title = 'Card title';
    const wrapper = mount(Card, {
        propsData: { title },
        slots: { 
          title: '<div>Card title</div>',
        }
    });

    const element = wrapper.find('.card-title');

    expect(element.text()).toBe(title)
  });
});

describe('component: Card', () => {
  it('should display text based on body content', () => {
    const body = 'Body content';
    const wrapper = mount(Card, {
        propsData: { body },
        slots: { 
          body: '<div>Body content</div>' 
        }
    });

    const element = wrapper.find('.card-body');

    expect(element.text()).toBe(body)
  });
});
