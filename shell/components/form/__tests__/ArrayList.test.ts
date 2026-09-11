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

  describe('disabledList', () => {
    it('does not disable any row by default', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value: ['string 0', 'string 1'],
          mode:  _EDIT,
        },
      });

      expect(wrapper.vm.disabledIndexList).toBeUndefined();
      expect((wrapper.find('[data-testid="array-list-input-0"]').element as HTMLInputElement).disabled).toBe(false);
      expect((wrapper.find('[data-testid="array-list-input-1"]').element as HTMLInputElement).disabled).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-list-remove-item-1"]').exists()).toBe(true);
    });

    it('computes the row index for each value in disabledList', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile', 'email', 'custom'],
          mode:         _EDIT,
          disabledList: ['email', 'openid'],
        },
      });

      // Maps each disabled value to the index of its matching row, in disabledList order
      expect(wrapper.vm.disabledIndexList).toStrictEqual([2, 0]);
    });

    it('disables the input of rows in disabledList and leaves the others editable', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile', 'email', 'custom'],
          mode:         _EDIT,
          disabledList: ['openid', 'email'],
        },
      });

      expect((wrapper.find('[data-testid="array-list-input-0"]').element as HTMLInputElement).disabled).toBe(true);
      expect((wrapper.find('[data-testid="array-list-input-1"]').element as HTMLInputElement).disabled).toBe(false);
      expect((wrapper.find('[data-testid="array-list-input-2"]').element as HTMLInputElement).disabled).toBe(true);
      expect((wrapper.find('[data-testid="array-list-input-3"]').element as HTMLInputElement).disabled).toBe(false);
    });

    it('hides the remove button of rows in disabledList and keeps it for the others', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile', 'email', 'custom'],
          mode:         _EDIT,
          disabledList: ['openid', 'email'],
        },
      });

      expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-list-remove-item-2"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-3"]').exists()).toBe(true);
    });

    it('only disables the first occurrence when a disabled value is duplicated', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile', 'openid'],
          mode:         _EDIT,
          disabledList: ['openid'],
        },
      });

      expect(wrapper.vm.disabledIndexList).toStrictEqual([0]);
      expect((wrapper.find('[data-testid="array-list-input-0"]').element as HTMLInputElement).disabled).toBe(true);
      expect((wrapper.find('[data-testid="array-list-input-2"]').element as HTMLInputElement).disabled).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-2"]').exists()).toBe(true);
    });

    it('disables nothing when a disabled value is not present in the rows', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile'],
          mode:         _EDIT,
          disabledList: ['not-a-scope'],
        },
      });

      // findIndex returns -1 for a missing value, which never matches a real row index
      expect(wrapper.vm.disabledIndexList).toStrictEqual([-1]);
      expect((wrapper.find('[data-testid="array-list-input-0"]').element as HTMLInputElement).disabled).toBe(false);
      expect((wrapper.find('[data-testid="array-list-input-1"]').element as HTMLInputElement).disabled).toBe(false);
      expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-list-remove-item-1"]').exists()).toBe(true);
    });

    it('returns an empty index list when disabledList is empty', () => {
      const wrapper = mount(ArrayList, {
        props: {
          value:        ['openid', 'profile'],
          mode:         _EDIT,
          disabledList: [],
        },
      });

      expect(wrapper.vm.disabledIndexList).toStrictEqual([]);
      expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-list-remove-item-1"]').exists()).toBe(true);
    });
  });

  describe('addBtnAriaLabel', () => {
    const mountArrayList = (props: Record<string, unknown> = {}) => mount(ArrayList, {
      props: {
        value: ['string 0'],
        mode:  _EDIT,
        ...props,
      } as any,
    });

    const addButton = (wrapper: ReturnType<typeof mountArrayList>) => wrapper.find('[data-testid="array-list-button"]');

    it('should label the add button with addBtnAriaLabel when one is given', () => {
      const wrapper = mountArrayList({ addLabel: 'Add Path', addBtnAriaLabel: 'Add Path for Git Repo' });

      expect(addButton(wrapper).attributes('aria-label')).toStrictEqual('Add Path for Git Repo');
    });

    it('should keep the visible add button text as addLabel, independent of the aria-label', () => {
      const wrapper = mountArrayList({ addLabel: 'Add Path', addBtnAriaLabel: 'Add Path for Git Repo' });

      expect(addButton(wrapper).text()).toStrictEqual('Add Path');
      expect(addButton(wrapper).attributes('aria-label')).toStrictEqual('Add Path for Git Repo');
    });

    it.each([
      ['no addBtnAriaLabel and an addLabel', { addLabel: 'Add Path' }, 'Add Path'],
      ['an empty addBtnAriaLabel', { addLabel: 'Add Path', addBtnAriaLabel: '' }, 'Add Path'],
      ['neither label', {}, '%generic.ariaLabel.genericAddRow%'],
      ['no addLabel but an addBtnAriaLabel', { addBtnAriaLabel: 'Add Path for Git Repo' }, 'Add Path for Git Repo'],
    ])('should fall back to the add label with %s', (_: string, props: Record<string, unknown>, expected: string) => {
      const wrapper = mountArrayList(props);

      expect(addButton(wrapper).attributes('aria-label')).toStrictEqual(expected);
    });

    it('should give two lists on the same page distinct add button labels', () => {
      const paths = mountArrayList({ addLabel: 'Add', addBtnAriaLabel: 'Add Path for Git Repo' });
      const other = mountArrayList({ addLabel: 'Add', addBtnAriaLabel: 'Add a new resource' });

      const pathsAdd = addButton(paths).attributes('aria-label');
      const otherAdd = addButton(other).attributes('aria-label');

      expect(pathsAdd).toStrictEqual('Add Path for Git Repo');
      expect(otherAdd).toStrictEqual('Add a new resource');
      expect(pathsAdd).not.toStrictEqual(otherAdd);
    });
  });
});
