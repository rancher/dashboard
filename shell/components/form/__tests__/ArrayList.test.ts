import { mount } from '@vue/test-utils';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

describe('the ArrayList', () => {
  it('is empty', () => {
    const wrapper = mount(ArrayList, {
      propsData: {
        value: [],
        mode:  _EDIT
      },
    });
    const elements = wrapper.findAll('[data-testid^="array-list-box"]');

    expect(elements).toHaveLength(0);
  });

  it('shows an initial empty row', () => {
    const wrapper = mount(ArrayList, {
      propsData: {
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
      propsData: {
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

  it('contracts when a delete button is clicked', async() => {
    const wrapper = mount(ArrayList, {
      propsData: {
        value: ['string 1', 'string 2'],
        mode:  _EDIT,
      },
    });
    const deleteButton = wrapper.get('[data-testid^="remove-item"]').element as HTMLElement;

    await deleteButton.click();
    const arrayListBoxes = wrapper.findAll('[data-testid^="array-list-box"]');

    expect(arrayListBoxes).toHaveLength(1);
  });

  it('add button is hidden in read-only mode', () => {
    const wrapper = mount(ArrayList, {
      propsData: {
        value: ['read-only example'],
        mode:  _VIEW,
      },
    });
    const arrayListButtons = wrapper.findAll('[data-testid="array-list-button"]');

    expect(arrayListButtons).toHaveLength(0);
  });

  describe('onPaste', () => {
    it('should emit value with updated row text', () => {
      const text = 'test';
      const expectation = [text];
      const wrapper = mount(ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { value: [''] } });
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted().input?.[0][0]).toStrictEqual(expectation);
    });

    it('should emit value with multiple rows', () => {
      const wrapper = mount(ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { value: [''] } });
      const text = `multiline
      rows`;
      const expectation = ['multiline', 'rows'];
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted().input?.[0][0]).toStrictEqual(expectation);
    });

    it('should allow emit multiline pasted values if enabled', () => {
      const wrapper = mount(ArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
        propsData: {
          value:          [''],
          valueMultiline: true,
        }
      });
      const text = `multiline
      text`;
      const expectation = [text];
      const event = { preventDefault: jest.fn(), clipboardData: { getData: jest.fn().mockReturnValue(text) } } as any;

      wrapper.vm.onPaste(0, event);

      expect(wrapper.emitted().input?.[0][0]).toStrictEqual(expectation);
    });
  });
});
