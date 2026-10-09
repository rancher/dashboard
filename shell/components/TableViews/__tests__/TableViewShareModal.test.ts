import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewShareModal from '@shell/components/TableViews/TableViewShareModal.vue';
import { readTextFromClipboard } from '@shell/utils/clipboard';
import { shareTableView } from '@shell/utils/table-views/share';
import type { SharedTableView } from '@shell/utils/table-views/share';

jest.mock('@shell/utils/clipboard', () => ({ readTextFromClipboard: jest.fn(), copyTextToClipboard: jest.fn() }));

const running: SharedTableView = {
  name: 'Running', query: 'state:running', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
};

function mountModal(props: { mode: 'share' | 'import', value?: string, tableKey?: string }) {
  const store = createStore({
    getters: {
      'type-map/labelFor': () => (schema: { id: string }) => `${ schema.id } list`,
      'i18n/exists':       () => () => false,
      'i18n/t':            () => (key: string) => key,
    }
  });

  return mount(TableViewShareModal, {
    props,
    global: {
      plugins: [store],
      stubs:   { RichTranslation: true },
      // What the Copy and Paste buttons read their labels and announcements from
      mocks:   { $store: { getters: { 'i18n/exists': () => false, 'i18n/t': (key: string) => key } } },
    },
  });
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('TableViewShareModal', () => {
  describe('sharing', () => {
    it('should show the view as text to copy, which can\'t be edited, and only a close button', () => {
      const wrapper = mountModal({ mode: 'share', value: 'abc123' });
      const field = wrapper.find('[data-testid="table-views-share-text"]');

      expect(field.find('[data-testid="detail-top_html"]').text()).toBe('abc123');
      expect(field.find('textarea').exists()).toBe(false);
      expect(field.find('.action-group button').text()).toContain('Copy');
      expect(field.find('[data-testid="detail-text-paste"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="table-views-import-confirm"]').exists()).toBe(false);
    });

    it('should close', async() => {
      const wrapper = mountModal({ mode: 'share', value: 'abc123' });

      await wrapper.find('[data-testid="table-views-share-close"]').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('importing', () => {
    const importInto = (tableKey = 'pod') => mountModal({ mode: 'import', tableKey });
    const problemOf = (wrapper: ReturnType<typeof importInto>) => wrapper.find('[data-testid="table-views-import-problem"]');
    const importButton = (wrapper: ReturnType<typeof importInto>) => wrapper.find('[data-testid="table-views-import-confirm"]');

    it('should say nothing, and import nothing, while the box is empty', () => {
      const wrapper = importInto();

      expect(problemOf(wrapper).exists()).toBe(false);
      expect(importButton(wrapper).attributes('disabled')).toBeDefined();
    });

    it('should import the view pasted in, and close', async() => {
      const wrapper = importInto();

      await wrapper.find('[data-testid="table-views-import-text"] textarea').setValue(shareTableView('pod', running));
      expect(problemOf(wrapper).exists()).toBe(false);

      await importButton(wrapper).trigger('click');

      expect(wrapper.emitted('import')?.[0]).toStrictEqual([running]);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it.each([
      ['text that isn\'t a view', 'hello', 'tableViews.import.invalid'],
      ['a view shared from another list', shareTableView('apps.deployment', running), 'tableViews.import.otherTable-{"list":"apps.deployment list"}'],
      ['a view shared from the same list on another page', shareTableView('pod@home', running), 'tableViews.import.otherPage-{"list":"pod list"}'],
    ])('should say what is wrong with %s, and not import it', async(_, text, problem) => {
      const wrapper = importInto();

      await wrapper.find('[data-testid="table-views-import-text"] textarea').setValue(text);

      expect(problemOf(wrapper).text()).toBe(problem);
      expect(wrapper.find('[data-testid="table-views-import-text"] textarea').attributes('aria-invalid')).toBe('true');
      expect(importButton(wrapper).attributes('disabled')).toBeDefined();
    });

    it('should paste the clipboard into the box', async() => {
      jest.mocked(readTextFromClipboard).mockResolvedValueOnce(shareTableView('pod', running));
      const wrapper = importInto();

      await wrapper.find('[data-testid="detail-text-paste"]').trigger('click');
      await flush();

      expect((wrapper.find('[data-testid="table-views-import-text"] textarea').element as HTMLTextAreaElement).value).toBe(shareTableView('pod', running));
      expect(wrapper.find('[data-testid="detail-text-paste"]').text()).toContain('detailText.paste.success');
      expect(importButton(wrapper).attributes('disabled')).toBeUndefined();
    });

    it('should say nothing was pasted from an empty clipboard, leaving the box as it was', async() => {
      jest.mocked(readTextFromClipboard).mockResolvedValueOnce('');
      const wrapper = importInto();

      await wrapper.find('[data-testid="table-views-import-text"] textarea').setValue('typed');
      await wrapper.find('[data-testid="detail-text-paste"]').trigger('click');
      await flush();

      expect(wrapper.find('[data-testid="detail-text-paste"]').text()).toContain('detailText.paste.error');
      expect((wrapper.find('[data-testid="table-views-import-text"] textarea').element as HTMLTextAreaElement).value).toBe('typed');
    });

    it('should say the paste failed when the clipboard can\'t be read, leaving the box as it was', async() => {
      jest.mocked(readTextFromClipboard).mockRejectedValueOnce(new Error('denied'));
      const wrapper = importInto();

      await wrapper.find('[data-testid="table-views-import-text"] textarea').setValue('typed');
      await wrapper.find('[data-testid="detail-text-paste"]').trigger('click');
      await flush();

      expect(wrapper.find('[data-testid="detail-text-paste"]').text()).toContain('detailText.paste.error');
      expect((wrapper.find('[data-testid="table-views-import-text"] textarea').element as HTMLTextAreaElement).value).toBe('typed');
    });
  });
});
