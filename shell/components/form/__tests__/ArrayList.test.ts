import { mount } from '@vue/test-utils';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('the ArrayList', () => {
  it('is empty', () => {
    const wrapper = mount(ArrayList, {
      props: {
        value: [],
        mode:  _EDIT
      },
    });
    const elements = wrapper.findAll('[data-testid^="array-list-box"]');

    expect(elements).toHaveLength(0);
  });

  it('shows an initial empty row', () => {
    const wrapper = mount(ArrayList, {
      props: {
        value:           [],
        mode:            _EDIT,
        initialEmptyRow: true
      },
    });
    const arrayListBoxes = wrapper.findAll('[data-testid^="array-list-box"]');

    expect(arrayListBoxes).toHaveLength(1);
  });

  it('expands when the add button is clicked', async() => {
    const wrapper = mount(ArrayList, {
      props: {
        value: [],
        mode:  _EDIT,
      },
    });

    const arrayListButton = wrapper.find('[data-testid="array-list-button"]').element as HTMLElement;

    await arrayListButton.click();
    await arrayListButton.click();
    const arrayListBoxes = wrapper.findAll('[data-testid^="array-list-box"]');

    expect(arrayListBoxes).toHaveLength(2);
  });

  it('should remove the correct item, emit the removed item and the updated values', async() => {
    const wrapper = mount(ArrayList, {
      props: {
        value: ['string 0', 'string 1', 'string 2'],
        mode:  _EDIT,
      },
    });

    jest.useFakeTimers();
    await (wrapper.get('[data-testid="array-list-remove-item-1"]').element as HTMLElement).click();
    jest.advanceTimersByTime(50);
    jest.useRealTimers();

    expect(wrapper.find('[data-testid="array-list-remove-item-2"]').exists()).toBe(false);
    expect((wrapper.emitted('remove')![0][0] as any).row.value).toStrictEqual('string 1');
    expect(wrapper.vm.rows).toStrictEqual([{ value: 'string 0' }, { value: 'string 2' }]);
    expect(wrapper.emitted('update:value')![0][0]).toStrictEqual(['string 0', 'string 2']);
  });

  it('add button is hidden in read-only mode', () => {
    const wrapper = mount(ArrayList, {
      props: {
        value: ['read-only example'],
        mode:  _VIEW,
      },
    });
    const arrayListButtons = wrapper.findAll('[data-testid="array-list-button"]');

    expect(arrayListButtons).toHaveLength(0);
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const value = ['string 0', 'string 1', 'string 2'];

    const wrapper = mount(ArrayList, {
      props: {
        value:      ['string 0', 'string 1', 'string 2'],
        mode:       _EDIT,
        showHeader: true,
        a11yLabel:  'some-a11y-label',
        title:      'some-title'
      },
    });

    const mainContainer = wrapper.find('.array-list-main-container');
    const colHeaderGroup = wrapper.find('.array-list-header-group');
    const valueGroup = wrapper.find('[data-testid="array-list-box0"]');
    const firstValueInput = wrapper.find('[data-testid="array-list-input-0"]');
    const rowRemove = wrapper.find('[data-testid="array-list-remove-item-0"]');
    const rowAdd = wrapper.find('[data-testid="array-list-button"]');

    expect(wrapper.vm.rows[0]).toStrictEqual({ value: value[0] });

    expect(mainContainer.attributes('role')).toBe('group');
    expect(mainContainer.attributes('aria-label')).toBe('some-title');
    expect(colHeaderGroup.attributes('role')).toBe('group');
    expect(colHeaderGroup.find('label').text()).toBe('Value');
    expect(valueGroup.attributes('role')).toBe('group');
    expect(firstValueInput.attributes('aria-label')).toBe('some-a11y-label %generic.ariaLabel.genericRow%');
    expect(rowRemove.attributes('aria-label')).toBe('%generic.ariaLabel.remove%');
    expect(rowAdd.attributes('aria-label')).toBe('%generic.ariaLabel.genericAddRow%');
  });

  describe('onPaste', () => {
    it('should emit value with updated row text', () => {
      const text = 'test';
      const expectation = [text];
      const wrapper = mount(
        ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
        { props: { value: [''] } }
      );
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual(expectation);
    });

    it('should emit value with multiple rows', () => {
      const wrapper = mount(ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { props: { value: [''] } });
      const text = `multiline
      rows`;
      const expectation = ['multiline', 'rows'];
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual(expectation);
    });

    it('should allow emit multiline pasted values if enabled', () => {
      const wrapper = mount(ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
        props: {
          value:          [''],
          valueMultiline: true,
        }
      });
      const text = `multiline
      text`;
      const expectation = [text];
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual(expectation);
    });
  });
});
