import { mount, shallowMount } from '@vue/test-utils';
import { StringList } from './index';

describe('StringList.vue', () => {

  it('is empty', () => {
    const wrapper = mount(StringList, { 
      propsData: { items: [] },
    });
    const box = wrapper.find('.string-list-box').element as HTMLElement;

    expect(box.children.length).toBe(0);
  });

  it('is showing one element', () => {
    const wrapper = mount(StringList, { 
      propsData: { items: ['test'] },
    });
    const box = wrapper.find('.string-list-box').element as HTMLElement;
    const actionButtons = wrapper.find('.action-buttons').element as HTMLElement;

    expect(box.children.length).toBe(1);
    expect(actionButtons).not.toBe(undefined);
  });

  it('action-buttons are hidden when is view-only mode', () => {
    const wrapper = mount(StringList, { 
      propsData: {
        items: ['test'],
        readonly: true,
      },
    });
    const actionButtons = wrapper.find('.action-buttons').element as HTMLElement;

    expect(actionButtons).toBe(undefined);
  });

  it('show new item when "items" property change', async () => {
    const items = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k'];

    const wrapper = mount(StringList, { 
      propsData: {
        items,
      },
    });
    const elements = wrapper.findAll('.item');
    expect(elements.length).toBe(10);

    await wrapper.setProps({ items: [ ...items, 'new' ] });

    const newElements = wrapper.findAll('.item');
    expect(newElements.length).toBe(11);
  });

  it('remove item when "items" property change', async () => {
    const items = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k'];

    const wrapper = mount(StringList, { 
      propsData: {
        items,
      },
    });
    const elements = wrapper.findAll('.item');
    expect(elements.length).toBe(10);

    await wrapper.setProps({ items: [ ...items.filter(f => f !== 'a') ] });

    const newElements = wrapper.findAll('.item');
    expect(newElements.length).toBe(9);
  });

});
