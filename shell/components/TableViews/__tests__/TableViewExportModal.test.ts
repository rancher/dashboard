import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewExportModal from '@shell/components/TableViews/TableViewExportModal.vue';

/**
 * The modal has one sentence with four forms: a whole view or a selection, each with and without
 * the warning that the export might take a while. Which of the four it asks for is the logic
 * here - the translation getter hands back the key and what was put into it, so the key is what
 * these assert on.
 */
describe('TableViewExportModal', () => {
  function mountWith(props: Record<string, unknown>) {
    const store = createStore({
      getters: {
        'type-map/headersFor': () => () => [],
        'i18n/t':              () => (key: string, args?: Record<string, unknown>) => `${ key }-${ JSON.stringify(args || {}) } <b>emphasis</b>`,
      }
    });

    return mount(TableViewExportModal, {
      props:   { viewName: 'Imported Unavailable', ...props },
      // The sentences are drawn by RichTranslation, so it has to render rather than be stubbed
      global:  { plugins: [store], stubs: { RichTranslation: false } },
      shallow: true,
    });
  }

  const introFor = (props: Record<string, unknown>) => mountWith(props).find('.export-intro').text();

  it.each([
    ['a whole view', { count: 2 }, 'tableViews.export.intro'],
    ['a whole view of more than a page', { count: 1200 }, 'tableViews.export.introSlow'],
    ['a selection', { count: 1, isSelection: true }, 'tableViews.export.selectionIntro'],
    ['a selection of more than a page', { count: 1200, isSelection: true }, 'tableViews.export.selectionIntroSlow'],
  ])('should use the sentence written for %s', (_name, props, key) => {
    // The trailing `-` is where the mocked `t` starts its arguments, so `intro` cannot match
    // `introSlow`
    expect(introFor(props)).toContain(`${ key }-`);
  });

  it('should say nothing about how many when the count is not known', () => {
    // A view the api could not count is exported all the same, but a number would be a guess
    expect(introFor({ count: null })).toContain('tableViews.export.introUncounted-');
  });

  it('should draw the translation\'s emphasis as an element of its own', () => {
    // Its weight is this component's scoped rule; that part is checked in a browser, since the
    // test transform does not scope styles
    const b = mountWith({ count: 2 }).find('.export-intro b');

    expect(b.exists()).toBe(true);
    expect(b.text()).toBe('emphasis');
  });

  it('should not warn about the wait at exactly a page of rows', () => {
    // The warning is for the second round trip, and a thousand is still the first
    expect(introFor({ count: 1000 })).toContain('tableViews.export.intro-');
  });

  describe('exporting a selection', () => {
    const notifications = () => {
      const calls: { action: string, payload: Record<string, unknown> }[] = [];
      const record = (action: string) => (_ctx: unknown, payload: Record<string, unknown>) => {
        calls.push({ action, payload });

        return action === 'add' ? 'n1' : undefined;
      };

      return {
        calls,
        store: createStore({
          getters: {
            'type-map/headersFor': () => () => [],
            'i18n/t':              () => (key: string) => key,
          },
          modules: { notifications: { namespaced: true, actions: { add: record('add'), update: record('update') } } },
        }),
      };
    };

    const mountSelection = (resource: object) => {
      const { calls, store } = notifications();
      const wrapper = mount(TableViewExportModal, {
        props: {
          count:       1,
          isSelection: true,
          resources:   [{
            type: 'pod', nameDisplay: 'web', downloadYaml: jest.fn(), downloadYamlBulk: jest.fn(), ...resource
          }]
        },
        global:  { plugins: [store] },
        shallow: true,
      });

      return { wrapper, calls };
    };

    const flush = () => new Promise((resolve) => setTimeout(resolve));

    it('should close at once, and follow the export as a notification', async() => {
      let finish: () => void = () => undefined;
      const downloadYaml = jest.fn(() => new Promise<void>((resolve) => {
        finish = resolve;
      }));
      const { wrapper, calls } = mountSelection({ downloadYaml });

      await wrapper.find('[data-testid="table-views-export-download"]').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
      await flush();
      expect(downloadYaml).toHaveBeenCalledTimes(1);
      expect(calls.map((c) => c.action)).toStrictEqual(['add']);
      expect(calls[0].payload.message).toContain('tableViews.export.notification.selectionMessage');
      expect(calls[0].payload.message).toContain('"format":"YAML"');

      finish();
      await flush();

      expect(calls[1]).toMatchObject({
        action:  'update',
        payload: {
          id: 'n1', title: 'tableViews.export.notification.doneTitle', progress: 100
        }
      });
    });

    it('should say so when the export fails', async() => {
      const { wrapper, calls } = mountSelection({ downloadYaml: jest.fn(() => Promise.reject(new Error('nope'))) });
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await wrapper.find('[data-testid="table-views-export-download"]').trigger('click');
      await flush();
      await flush();

      expect(calls[calls.length - 1]).toMatchObject({ action: 'update', payload: { id: 'n1', title: 'tableViews.export.notification.failedTitle' } });
      error.mockRestore();
    });
  });
});
