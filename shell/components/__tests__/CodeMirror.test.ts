import { nextTick } from 'vue';
import { shallowMount, VueWrapper } from '@vue/test-utils';
import CodeMirror from '@shell/components/CodeMirror.vue';
import { _EDIT, _VIEW, _YAML } from '@shell/config/query-params';

// eslint-disable-next-line jest/no-disabled-tests
describe('component: CodeMirror.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof CodeMirror>>;

  const options = {
    readOnly: false,
    gutters:  [
      'CodeMirror-lint-markers',
      'CodeMirror-foldgutter'
    ],
    mode:            'yaml',
    lint:            true,
    lineNumbers:     true,
    styleActiveLine: true,
    tabSize:         2,
    indentWithTabs:  false,
    cursorBlinkRate: 530,
    extraKeys:       { 'Ctrl-Space': 'autocomplete' }
  };

  const mountOptions = {
    props: {
      value:         '',
      mode:          _EDIT,
      options,
      asTextArea:    false,
      showKeyMapBox: true,
    },
    global: {
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  () => 'Vim',
            'prefs/get':               () => 'Vim',
            'prefs/theme':             jest.fn(),
          }
        },
        $route:  { query: { AS: _YAML } },
        $router: { applyQuery: jest.fn() },
      },
    }

  };

  // eslint-disable-next-line jest/no-disabled-tests
  describe('keyMap info', () => {
    (window as any).__codeMirrorLoader = () => new Promise((resolve) => {
      resolve(true);
    });

    wrapper = shallowMount(
      CodeMirror,
      mountOptions,
    );

    it(`should show keyMap preference`, async() => {
      await nextTick();

      const keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"] .keymap-indicator');

      const closeIcon = wrapper.find('[data-testid="code-mirror-keymap"] .icon-close');

      expect(keyMapBox).toBeDefined();
      expect(closeIcon).toBeDefined();
    });

    it(`should remove keyMap box`, async() => {
      await nextTick();

      let keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      keyMapBox.trigger('mouseenter');
      await nextTick();

      const closeIcon = keyMapBox.find('.icon-close');

      (closeIcon.element as HTMLElement).click();
      await nextTick();

      keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      expect(keyMapBox.exists()).toBe(false);
    });
  });

  describe('keyboard tab navigation', () => {
    const mountWithMode = (mode: string) => shallowMount(CodeMirror, {
      ...mountOptions,
      props: { ...mountOptions.props, mode },
    });

    it('takes a read-only editor out of the tab order once ready', async() => {
      const readOnlyWrapper = mountWithMode(_VIEW);
      const inputField = { tabIndex: 0 };
      const codeMirrorRef = { refresh: jest.fn(), getInputField: () => inputField };

      readOnlyWrapper.vm.onReady(codeMirrorRef);
      await nextTick();

      expect(inputField.tabIndex).toBe(-1);
    });

    it('keeps an editable editor in the tab order', async() => {
      const editWrapper = mountWithMode(_EDIT);
      const inputField = { tabIndex: 0 };
      const codeMirrorRef = { refresh: jest.fn(), getInputField: () => inputField };

      editWrapper.vm.onReady(codeMirrorRef);
      await nextTick();

      expect(inputField.tabIndex).toBe(0);
    });

    it('sets container tabindex to 0 for a read-only editor so it can be focused', () => {
      const readOnlyWrapper = mountWithMode(_VIEW);

      expect(readOnlyWrapper.vm.codeMirrorContainerTabIndex).toBe(0);
    });

    it('sets container tabindex to -1 for an unfocused editable editor', () => {
      const editWrapper = mountWithMode(_EDIT);

      expect(editWrapper.vm.codeMirrorContainerTabIndex).toBe(-1);
    });

    it('sets container tabindex to 0 for a focused editable editor', async() => {
      const editWrapper = mountWithMode(_EDIT);

      editWrapper.vm.onFocus();
      await nextTick();

      expect(editWrapper.vm.codeMirrorContainerTabIndex).toBe(0);
    });
  });

  describe('setLineDecorations', () => {
    // The decoration methods only touch `this.$refs` and the tracking arrays, so
    // drive them with a controlled `this` rather than fighting Vue's template refs.
    const methods = (CodeMirror as any).methods;

    const mockInstance = (lineCount = 5) => ({
      lineCount:       () => lineCount,
      addLineClass:    jest.fn(),
      removeLineClass: jest.fn(),
    });

    const makeCtx = (cminstance: any) => {
      const ctx: any = {
        $refs:              { codeMirrorRef: cminstance ? { cminstance } : null },
        appliedLineClasses: [],
      };

      ['setLineDecorations', 'clearLineDecorations'].forEach((m) => {
        ctx[m] = methods[m];
      });

      return ctx;
    };

    it('tints the code area and the gutter of each in-range line and tracks both', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setLineDecorations([{ line: 0 }, { line: 2 }]);

      // Two lines x two wheres ('background' + 'gutter').
      expect(cminstance.addLineClass).toHaveBeenCalledTimes(4);
      expect(cminstance.addLineClass).toHaveBeenCalledWith(0, 'background', 'line-override-highlight');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(0, 'gutter', 'line-override-highlight');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(2, 'background', 'line-override-highlight');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(2, 'gutter', 'line-override-highlight');
      expect(ctx.appliedLineClasses).toHaveLength(4);
    });

    it('honours a custom className', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setLineDecorations([{ line: 1, className: 'my-class' }]);

      expect(cminstance.addLineClass).toHaveBeenCalledWith(1, 'background', 'my-class');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(1, 'gutter', 'my-class');
    });

    it('ignores line numbers outside the document bounds', () => {
      const cminstance = mockInstance(3);
      const ctx = makeCtx(cminstance);

      ctx.setLineDecorations([{ line: -1 }, { line: 1 }, { line: 3 }, { line: 99 }]);

      // Only line 1 is in range: 'background' + 'gutter'.
      expect(cminstance.addLineClass).toHaveBeenCalledTimes(2);
      expect(cminstance.addLineClass).toHaveBeenCalledWith(1, 'background', 'line-override-highlight');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(1, 'gutter', 'line-override-highlight');
      expect(ctx.appliedLineClasses).toHaveLength(2);
    });

    it('clears the previous decorations before applying new ones', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setLineDecorations([{ line: 0 }]);
      ctx.setLineDecorations([{ line: 2 }]);

      expect(cminstance.removeLineClass).toHaveBeenCalledWith(0, 'background', 'line-override-highlight');
      expect(cminstance.removeLineClass).toHaveBeenCalledWith(0, 'gutter', 'line-override-highlight');
      expect(ctx.appliedLineClasses).toStrictEqual([
        {
          line: 2, where: 'background', className: 'line-override-highlight'
        },
        {
          line: 2, where: 'gutter', className: 'line-override-highlight'
        },
      ]);
    });

    it('clearLineDecorations removes the classes previously applied', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setLineDecorations([{ line: 1 }]);
      ctx.clearLineDecorations();

      expect(cminstance.removeLineClass).toHaveBeenCalledWith(1, 'background', 'line-override-highlight');
      expect(cminstance.removeLineClass).toHaveBeenCalledWith(1, 'gutter', 'line-override-highlight');
      expect(ctx.appliedLineClasses).toStrictEqual([]);
    });

    it('is a no-op when the editor instance is not ready', () => {
      const ctx = makeCtx(null);

      expect(() => ctx.setLineDecorations([{ line: 0 }])).not.toThrow();
      expect(ctx.appliedLineClasses).toStrictEqual([]);
    });
  });

  describe('setSearchHighlight', () => {
    // Same approach as the decorations: a controlled `this` with a mock instance.
    const methods = (CodeMirror as any).methods;

    const mockInstance = () => ({
      addOverlay:    jest.fn(),
      removeOverlay: jest.fn(),
    });

    const makeCtx = (cminstance: any) => ({
      $refs:                { codeMirrorRef: cminstance ? { cminstance } : null },
      searchHighlightQuery: '',
      setSearchHighlight:   methods.setSearchHighlight,
    });

    it('adds the search overlay and remembers the query', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setSearchHighlight('bar');

      expect(cminstance.addOverlay).toHaveBeenCalledWith(expect.objectContaining({ name: 'yaml-search' }));
      expect(ctx.searchHighlightQuery).toStrictEqual('bar');
    });

    it('replaces the overlay when the query changes', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setSearchHighlight('bar');
      ctx.setSearchHighlight('baz');

      expect(cminstance.removeOverlay).toHaveBeenLastCalledWith('yaml-search');
      expect(cminstance.addOverlay).toHaveBeenCalledTimes(2);
      expect(ctx.searchHighlightQuery).toStrictEqual('baz');
    });

    it('does nothing when the query has not changed', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setSearchHighlight('bar');
      ctx.setSearchHighlight('bar');

      expect(cminstance.addOverlay).toHaveBeenCalledTimes(1);
      expect(cminstance.removeOverlay).toHaveBeenCalledTimes(1);
    });

    it('removes the overlay without adding a new one for an empty query', () => {
      const cminstance = mockInstance();
      const ctx = makeCtx(cminstance);

      ctx.setSearchHighlight('bar');
      ctx.setSearchHighlight('');

      expect(cminstance.removeOverlay).toHaveBeenLastCalledWith('yaml-search');
      expect(cminstance.addOverlay).toHaveBeenCalledTimes(1);
      expect(ctx.searchHighlightQuery).toStrictEqual('');
    });

    it('is a no-op when the editor instance is not ready', () => {
      const ctx = makeCtx(null);

      expect(() => ctx.setSearchHighlight('bar')).not.toThrow();
      expect(ctx.searchHighlightQuery).toStrictEqual('');
    });
  });
});
