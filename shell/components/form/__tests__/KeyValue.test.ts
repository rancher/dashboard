import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import KeyValue from '@shell/components/form/KeyValue.vue';

describe('component: KeyValue', () => {
  it.skip('(Vue3 Skip) should display a not encoded value', () => {
    const value = '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';
    const wrapper = mount(KeyValue, {
      props: { value: { value } },

      global: {
        mocks: { $store: { getters: { 'i18n/t': jest.fn() } } },
        stubs: { CodeMirror: true },
      },
    });

    const inputValue = wrapper.find('textarea').element as HTMLInputElement;

    expect(inputValue.value).toBe(value);
  });

  it.skip('(Vue3 Skip) should display a markdown-multiline field with new lines visible', () => {
    const wrapper = mount(KeyValue, {
      props: {
        value:
            { value: 'test' },
        valueMarkdownMultiline: true,
      },

      global: {
        mocks: { $store: { getters: { 'i18n/t': jest.fn() } } },
        stubs: { CodeMirror: true },
      },
    });

    const inputFieldTextArea = wrapper.find('textarea').element;
    const inputFieldMultiline = wrapper.find('[data-testid="code-mirror-multiline-field"]').element;

    expect(inputFieldTextArea).toBeUndefined();
    expect(inputFieldMultiline).toBeDefined();
  });

  it('should have new lines in textarea', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        value:                  { foo: 'bar' },
        valueMarkdownMultiline: false,
      },

      global: {
        mocks: { $store: { getters: { 'i18n/t': jest.fn() } } },
        stubs: { CodeMirror: true },
      },
    });

    const inputFieldTextArea = wrapper.find('[data-testid="value-multiline"]');

    inputFieldTextArea.setValue('bar\n');

    await inputFieldTextArea.trigger('keydown.enter');

    const textArea = inputFieldTextArea.element as HTMLTextAreaElement;

    expect(textArea.value).toBe('bar\n');
  });

  it.each([
    [[{ key: 'testkey', value: 'testvalue' }], [{ key: 'testkey', value: 'testvalue' }, { key: 'testkey1', value: 'testvalue1' }], false],
    [{ testkey: 'testvalue' }, { testkey: 'testvalue', testkey1: 'testvalue1' }, true]
  ])('should update when the parent component passes a new value', async(initialValueProp, newValueProp, asMap) => {
    const wrapper = mount(KeyValue, {
      props: {
        value:          initialValueProp,
        mode:           'edit',
        asMap,
        mocks:          { $store: { getters: { 'i18n/t': jest.fn() } } },
        valueMultiline: false,
      }
    });

    const firstKeyInput = wrapper.find('[data-testid="input-kv-item-key-0"]');

    const firstValueInput = wrapper.find('[data-testid="input-kv-item-value-0"]');

    expect(firstKeyInput.element.value).toBe('testkey');
    expect(firstValueInput.element.value).toBe('testvalue');

    let secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');

    let secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(false);
    expect(secondValueInput.exists()).toBe(false);

    wrapper.vm.valuePropChanged(newValueProp);
    await nextTick();
    await nextTick();

    secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');

    secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(true);

    expect(secondKeyInput.element.value).toBe('testkey1');
    expect(secondValueInput.element.value).toBe('testvalue1');
  });

  it.each([
    [{ testkey: 'testvalue' }, true],
    [[{ key: 'testkey', value: 'testvalue' }], false]
  ])('should display a new row of empty inputs when the add button is pressed', async(valueProp, asMap) => {
    const wrapper = mount(KeyValue, {
      props: {
        value:          valueProp,
        mode:           'edit',
        mocks:          { $store: { getters: { 'i18n/t': jest.fn() } } },
        valueMultiline: false,
        asMap
      }
    });

    let secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');

    let secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(false);
    expect(secondValueInput.exists()).toBe(false);

    const addButton = wrapper.find('[data-testid="add_row_item_button"]');

    addButton.trigger('click');
    await nextTick();
    secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');

    secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(true);
  });

  it.each([
    [{ testkey: 'testvalue', testkey1: 'testvalue1' }, true],
    [[{ key: 'testkey', value: 'testvalue' }, { key: 'testkey1', value: 'testvalue1' }], false]
  ])('should remove a row when the remove button is pressed', async(valueProp, asMap) => {
    const wrapper = mount(KeyValue, {
      props: {
        value:          valueProp,
        mode:           'edit',
        mocks:          { $store: { getters: { 'i18n/t': jest.fn() } } },
        valueMultiline: false,
        asMap
      }
    });

    let secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');
    let secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(true);
    expect(secondValueInput.exists()).toBe(true);

    const removeFirstRow = wrapper.find('[data-testid="remove-column-0"] button');

    removeFirstRow.trigger('click');
    await nextTick();
    secondKeyInput = wrapper.find('[data-testid="input-kv-item-key-1"]');

    secondValueInput = wrapper.find('[data-testid="input-kv-item-value-1"]');

    expect(secondKeyInput.exists()).toBe(false);
    expect(secondValueInput.exists()).toBe(false);

    const firstKeyInput = wrapper.find('[data-testid="input-kv-item-key-0"]');

    const firstValueInput = wrapper.find('[data-testid="input-kv-item-value-0"]');

    expect(firstKeyInput.element.value).toBe('testkey1');
    expect(firstValueInput.element.value).toBe('testvalue1');
  });
});
