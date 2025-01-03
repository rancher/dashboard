/* eslint-disable jest/no-hooks */
import { mount, VueWrapper } from '@vue/test-utils';
import { StringList } from './index';

describe('stringList.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof StringList>>;

  beforeEach(() => {
    wrapper = mount(StringList, { propsData: { items: [] } });
  });

  describe('list box', () => {
    it('is empty', () => {
      const box = wrapper.find('[data-testid="div-string-list-box"]').element as HTMLElement;

      expect(box.children).toHaveLength(0);
    });

    it('show multiple items', async() => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k'];

      await wrapper.setProps({ items });

      const elements = wrapper.findAll('[data-testid^="div-item"]');

      expect(elements).toHaveLength(10);
    });

    it('double click triggers inline edit mode', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      const item = wrapper.find('[data-testid="div-item-test"]');

      await item.trigger('dblclick');

      const inputField = wrapper.find('[data-testid^="item-edit"]');

      expect(inputField.element).toBeDefined();
    });

    it('double click on empty space triggers create mode', async() => {
      await wrapper.setProps({ items: [] });

      // double click on empty space
      const box = wrapper.find('[data-testid="div-string-list-box"]');

      await box.trigger('dblclick');

      const inputField = wrapper.find('[data-testid="item-create"]');

      expect(inputField.element).toBeDefined();
    });

    it('select item when click on it', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // select item
      const item = wrapper.find('[data-testid^="div-item"]');

      await item.trigger('mousedown');

      expect(item.element.className).toContain('selected');
    });

    it('double click to edit item not allowed when readonly', async() => {
      const items = ['test'];

      await wrapper.setProps({
        items,
        readonly: true,
      });

      const item = wrapper.find('[data-testid="div-item-test"]');

      await item.trigger('dblclick');

      const inputField = wrapper.find('[data-testid^="item-edit"]');

      expect(inputField.exists()).toBe(false);
    });

    it('double click on empty space to create item not allowed when readonly', async() => {
      await wrapper.setProps({
        items:    [],
        readonly: true,
      });

      // double click on empty space
      const box = wrapper.find('[data-testid="div-string-list-box"]');

      await box.trigger('dblclick');

      const inputField = wrapper.find('[data-testid="item-create"]');

      expect(inputField.exists()).toBe(false);
    });

    it('select item not allowed when readonly', async() => {
      const items = ['test'];

      await wrapper.setProps({
        items,
        readonly: true,
      });

      // select item
      const item = wrapper.find('[data-testid^="div-item"]');

      await item.trigger('mousedown');

      expect(item.element.className).not.toContain('selected');
    });

    it('emit type:item event', async() => {
      // activate create mode
      await wrapper.setData({ isCreateItem: true });

      const inputField = wrapper.find('[data-testid="item-create"]');

      // set input value to 'F'
      await inputField.setValue('F');
      await wrapper.vm.$nextTick();

      const emitted = (wrapper.emitted('type:item') || [])[0][0][0];

      expect(emitted).toBe('F');
    });
  });

  describe('buttons', () => {
    it('are visible by default', () => {
      const actionButtons = wrapper.find('[data-testid="div-action-buttons"]');

      expect(actionButtons.element).toBeDefined();
    });

    it('are hidden when is view-only mode', async() => {
      await wrapper.setProps({ readonly: true });
      const actionButtons = wrapper.find('[data-testid="div-action-buttons"]');

      expect(actionButtons.exists()).toBe(false);
    });

    describe('add button', () => {
      it('is enabled by default', () => {
        const addButton = wrapper.find('[data-testid="button-add"]')?.element as HTMLButtonElement;

        expect(addButton.disabled).toBe(false);
      });

      it('show the input field when is clicked', async() => {
        // click add button
        const addButton = wrapper.find('[data-testid="button-add"]');

        await addButton.trigger('click');

        const inputField = wrapper.find('[data-testid="item-create"]');

        expect(inputField.element).toBeDefined();
      });

      it('is disabled when create mode is active', async() => {
        // click add button
        const addButton = wrapper.find('[data-testid="button-add"]');

        await addButton.trigger('click');

        wrapper.find('[data-testid="item-create"]');

        const buttonElem = addButton.element as HTMLButtonElement;

        expect(buttonElem.disabled).toBe(true);
      });
    });

    describe('remove button', () => {
      it('is disabled by default', () => {
        const removeButton = wrapper.find('[data-testid="button-remove"]');
        const buttonElem = removeButton.element as HTMLButtonElement;

        expect(buttonElem.disabled).toBe(true);
      });

      it('is enabled when create mode is active', async() => {
        // click add button
        const addButton = wrapper.find('[data-testid="button-add"]');

        await addButton.trigger('click');

        const removeButton = wrapper.find('[data-testid="button-remove"]');
        const buttonElem = removeButton.element as HTMLButtonElement;

        expect(buttonElem.disabled).toBe(false);
      });

      it('is enabled when edit mode is active', async() => {
        const items = ['test'];

        await wrapper.setProps({ items });

        // activate edit mode
        await wrapper.setData({ editedItem: 'test' });

        const removeButton = wrapper.find('[data-testid="button-remove"]');
        const buttonElem = removeButton.element as HTMLButtonElement;

        expect(buttonElem.disabled).toBe(false);
      });

      it('is enabled when an item is selected', async() => {
        const items = ['test'];

        await wrapper.setProps({ items });

        // select item
        await wrapper.setData({ selected: 'test' });

        // click remove button
        const removeButton = wrapper.find('[data-testid="button-remove"]');
        const buttonElem = removeButton.element as HTMLButtonElement;

        expect(buttonElem.disabled).toBe(false);
      });

      it('removes items when an item is selected', async() => {
        const items = ['a'];

        await wrapper.setProps({ items });

        // select item
        await wrapper.setData({ selected: 'a' });

        // click remove button
        const removeButton = wrapper.find('[data-testid="button-remove"]');

        await removeButton.trigger('mousedown');

        await wrapper.vm.$nextTick();

        const itemsCount = (wrapper.emitted('change') || [])[0][0].length;

        expect(itemsCount).toBe(0);
      });

      it('deactivates create mode', async() => {
        // activate create mode
        await wrapper.setData({ isCreateItem: true });

        // click remove button
        const removeButton = wrapper.find('[data-testid="button-remove"]');

        await removeButton.trigger('mousedown');

        const inputField = await wrapper.find('[data-testid="item-create"]');

        expect(inputField.exists()).toBe(false);
      });

      it('deactivates edit mode', async() => {
        const items = ['test'];

        await wrapper.setProps({ items });

        // activate edit mode
        await wrapper.setData({ editedItem: 'test' });

        // click remove button
        const removeButton = wrapper.find('[data-testid="button-remove"]');

        await removeButton.trigger('mousedown');

        const inputField = wrapper.find('[data-testid^="item-edit"]');

        expect(inputField.exists()).toBe(false);
      });
    });
  });

  describe('list edit', () => {
    const validItem = '    item name   ';
    const emptyItem = '  ';

    it('save a new item in create mode by pressing Enter key', async() => {
      // activate create mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue(validItem);

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      const emitted = (wrapper.emitted('change') || [])[0][0][0];

      expect(emitted).toBe(validItem.trim());
    });

    it('save item in edit mode by pressing Enter key', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // activate edit mode
      await wrapper.setData({ editedItem: 'test' });
      const inputField = wrapper.find('[data-testid^="item-edit"]');

      // edit item name
      await inputField.setValue(validItem);

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      const emitted = (wrapper.emitted('change') || [])[0][0][0];

      expect(emitted).toBe(validItem.trim());
    });

    it('reject a new item in create mode when item name is empty', async() => {
      // activate create mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue(emptyItem);

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('reject a new item in create mode when item name is duplicate', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // activate create mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue('test');

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('reject an item in edit mode when item name is empty', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // activate edit mode
      await wrapper.setData({ editedItem: 'test' });
      const inputField = wrapper.find('[data-testid^="item-edit"]');

      // edit item name
      await inputField.setValue(emptyItem);

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('reject an item in edit mode when item name is duplicate', async() => {
      const items = ['test', 'test-1'];

      await wrapper.setProps({ items });

      // activate edit mode
      await wrapper.setData({ editedItem: 'test' });
      const inputField = wrapper.find('[data-testid^="item-edit"]');

      // edit item name
      await inputField.setValue('test-1');

      // press enter
      await inputField.trigger('keydown.enter');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('change')).toBeFalsy();
    });
  });

  describe('bulk delimiter', () => {
    const delimiter = /;/;

    describe('add', () => {
      const items: string[] = [];

      beforeEach(() => {
        wrapper = mount(StringList, {
          propsData: {
            items,
            bulkAdditionDelimiter: delimiter,
            errorMessages:         { duplicate: 'error, item is duplicate.' },
          }
        });
      });

      it('should split values if delimiter set', async() => {
        const value = 'test;test1;test2';
        const result = ['test', 'test1', 'test2'];

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should show warning if one of the values is a duplicate', async() => {
        const value = 'test;test1;test2';

        await wrapper.setProps({ items: ['test1'] });

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

        expect(isDuplicate).toBe(true);
      });

      it('should show a warning if the new values are all duplicates', async() => {
        const value = 'test;test';

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

        expect(isDuplicate).toBe(true);
      });

      it('should not consider empty strings at the beginning', async() => {
        const value = ';test;test1;test2';
        const result = ['test', 'test1', 'test2'];

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should not consider empty strings in the middle', async() => {
        const value = 'test;test1;;test2';
        const result = ['test', 'test1', 'test2'];

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should not consider empty strings at the end', async() => {
        const value = 'test;test1;test2;';
        const result = ['test', 'test1', 'test2'];

        // activate create mode
        await wrapper.setData({ isCreateItem: true });
        const inputField = wrapper.find('[data-testid="item-create"]');

        await inputField.setValue(value);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });
    });

    describe('edit', () => {
      const items = ['test1', 'test2'];

      beforeEach(() => {
        wrapper = mount(StringList, {
          propsData: {
            items,
            bulkAdditionDelimiter: delimiter,
            errorMessages:         { duplicate: 'error, item is duplicate.' },
          }
        });
      });

      it('should split values if delimiter set', async() => {
        const newValue = 'test1;new;values';
        const result = ['test1', 'new', 'values', 'test2'];

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should show warning if one of the values is a duplicate', async() => {
        const newValue = 'test1;test2';

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

        expect(isDuplicate).toBe(true);
      });

      it('should show a warning if the new values are all duplicates', async() => {
        const newValue = 'test;test';

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

        expect(isDuplicate).toBe(true);
      });

      it('should not consider empty strings at the beginning', async() => {
        const newValue = ';test1;new;value';
        const result = ['test1', 'new', 'value', 'test2'];

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should not consider empty strings in the middle 1', async() => {
        const newValue = 'test1; ;new;value';
        const result = ['test1', 'new', 'value', 'test2'];

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should not consider empty strings in the middle 2', async() => {
        const newValue = 'test1;;new;value';
        const result = ['test1', 'new', 'value', 'test2'];

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });

      it('should not consider empty strings at the end', async() => {
        const newValue = 'test1;new;value;';
        const result = ['test1', 'new', 'value', 'test2'];

        await wrapper.setData({ editedItem: items[0] });
        const inputField = wrapper.find('[data-testid^="item-edit"]');

        await inputField.setValue(newValue);

        // press enter
        await inputField.trigger('keydown.enter');
        await wrapper.vm.$nextTick();

        const itemsResult = (wrapper.emitted('change') || [])[0][0];

        expect(JSON.stringify(itemsResult)).toBe(JSON.stringify(result));
      });
    });
  });

  describe('errors handling', () => {
    it('show duplicate warning icon when errorMessages is defined', async() => {
      const items = ['test'];

      await wrapper.setProps({
        items,
        errorMessages: { duplicate: 'error, item is duplicate.' },
      });

      // activate edit mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue('test');

      const icon = wrapper.find('[data-testid="i-warning-icon"]');

      expect(icon.element).toBeDefined();
    });

    it('show duplicate warning message when errorMessages is defined', async() => {
      const items = ['test'];

      await wrapper.setProps({
        items,
        errorMessages: { duplicate: 'error, item is duplicate.' },
      });

      // activate edit mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue('test');

      const message = wrapper.find('[data-testid^="span-error-message"]');

      expect(message.element).toBeDefined();
    });

    it('emit duplicate errors', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // activate edit mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      await inputField.setValue('test');

      const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

      expect(isDuplicate).toBe(true);
    });

    it('emit duplicate errors, reset error', async() => {
      const items = ['test'];

      await wrapper.setProps({ items });

      // activate edit mode
      await wrapper.setData({ isCreateItem: true });

      // type item name
      const inputField = wrapper.find('[data-testid="item-create"]');

      // emit duplicate errors
      await inputField.setValue('test');

      // it is not duplicate, reset duplicate error -> emit false
      await inputField.setValue('test-1');

      const isDuplicate = (wrapper.emitted('errors') || [])[0][0].duplicate;

      expect(isDuplicate).toBe(false);
    });
  });
});
