import { nextTick } from 'vue';
import { shallowMount, Wrapper } from '@vue/test-utils';
import CodeMirror from '@shell/components/CodeMirror.vue';
import { _EDIT, _VIEW, _YAML } from '@shell/config/query-params';

// eslint-disable-next-line jest/no-disabled-tests
describe('component: CodeMirror.vue', () => {
  let wrapper: Wrapper<InstanceType<typeof CodeMirror>>;

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
    propsData: {
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

      closeIcon.element.click();
      await nextTick();

      keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      expect(keyMapBox.exists()).toBe(false);
    });
  });

  describe('keyboard tab navigation', () => {
    const mountWithMode = (mode: string) => shallowMount(CodeMirror, {
      ...mountOptions,
      propsData: { ...mountOptions.propsData, mode },
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

  describe('highlight timing', () => {
    it('sums the fade-in, hold and fade-out phases into the removal duration', () => {
      const timedWrapper = shallowMount(CodeMirror, {
        ...mountOptions,
        propsData: {
          ...mountOptions.propsData,
          highlightTiming: {
            fadeIn: 200, hold: 500, fadeOut: 300
          },
        },
      });

      expect(timedWrapper.vm.highlightDuration).toBe(1000);
    });

    it('exposes each phase as a CSS custom property, delaying fade-out until fade-in and hold have elapsed', () => {
      const timedWrapper = shallowMount(CodeMirror, {
        ...mountOptions,
        propsData: {
          ...mountOptions.propsData,
          highlightTiming: {
            fadeIn: 200, hold: 500, fadeOut: 300
          },
        },
      });

      expect(timedWrapper.vm.highlightStyle).toStrictEqual({
        '--highlight-fade-in':        '200ms',
        '--highlight-fade-out':       '300ms',
        '--highlight-fade-out-delay': '700ms',
      });
    });

    it('defaults missing phases to zero so a partial timing object is safe', () => {
      const timedWrapper = shallowMount(CodeMirror, {
        ...mountOptions,
        propsData: { ...mountOptions.propsData, highlightTiming: { hold: 500 } },
      });

      expect(timedWrapper.vm.highlightDuration).toBe(500);
      expect(timedWrapper.vm.highlightStyle).toStrictEqual({
        '--highlight-fade-in':        '0ms',
        '--highlight-fade-out':       '0ms',
        '--highlight-fade-out-delay': '500ms',
      });
    });
  });

  describe('highlightLines', () => {
    // `highlightLines` only touches `this.$refs.codeMirrorRef.cminstance` and
    // `this.highlightTimer`, so drive it with a controlled `this` rather than
    // fighting Vue's managed template refs.
    const { highlightLines } = (CodeMirror as any).methods;

    const mockInstance = (lineCount = 3) => ({
      lineCount:       () => lineCount,
      addLineClass:    jest.fn(),
      removeLineClass: jest.fn(),
    });

    const context = (cminstance: any) => ({
      $refs:             { codeMirrorRef: cminstance ? { cminstance } : null },
      highlightTimer:    null,
      highlightDuration: 1500,
      highlightEnabled:  true,
    });

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('adds the highlight class to each given line', () => {
      const cminstance = mockInstance();

      highlightLines.call(context(cminstance), [0, 2]);

      expect(cminstance.addLineClass).toHaveBeenCalledTimes(2);
      expect(cminstance.addLineClass).toHaveBeenCalledWith(0, 'background', 'line-changed-highlight');
      expect(cminstance.addLineClass).toHaveBeenCalledWith(2, 'background', 'line-changed-highlight');
    });

    it('ignores line numbers outside the document bounds', () => {
      const cminstance = mockInstance(3);

      highlightLines.call(context(cminstance), [-1, 1, 3, 99]);

      expect(cminstance.addLineClass).toHaveBeenCalledTimes(1);
      expect(cminstance.addLineClass).toHaveBeenCalledWith(1, 'background', 'line-changed-highlight');
    });

    it('removes the highlight class once the duration has elapsed', () => {
      const cminstance = mockInstance();

      highlightLines.call(context(cminstance), [1]);
      expect(cminstance.removeLineClass).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1500);

      expect(cminstance.removeLineClass).toHaveBeenCalledWith(1, 'background', 'line-changed-highlight');
    });

    it('waits for the configured highlightDuration before removing the class', () => {
      const cminstance = mockInstance();

      highlightLines.call({ ...context(cminstance), highlightDuration: 4000 }, [1]);

      jest.advanceTimersByTime(1500);
      expect(cminstance.removeLineClass).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2500);
      expect(cminstance.removeLineClass).toHaveBeenCalledWith(1, 'background', 'line-changed-highlight');
    });

    it('cancels a pending removal when highlighting again so the earlier lines are not cleared', () => {
      const cminstance = mockInstance();
      const ctx = context(cminstance);

      highlightLines.call(ctx, [0]);
      highlightLines.call(ctx, [2]);

      jest.advanceTimersByTime(1500);

      // only the most recent highlight's removal timer should fire
      expect(cminstance.removeLineClass).toHaveBeenCalledTimes(1);
      expect(cminstance.removeLineClass).toHaveBeenCalledWith(2, 'background', 'line-changed-highlight');
    });

    it('does not schedule a removal when no lines are in range', () => {
      const cminstance = mockInstance(2);

      highlightLines.call(context(cminstance), [5, 6]);
      jest.advanceTimersByTime(1500);

      expect(cminstance.addLineClass).not.toHaveBeenCalled();
      expect(cminstance.removeLineClass).not.toHaveBeenCalled();
    });

    it('is a no-op when the editor instance is not ready', () => {
      expect(() => highlightLines.call(context(null), [0])).not.toThrow();
    });

    it('is a no-op when highlighting is not enabled', () => {
      const cminstance = mockInstance();

      highlightLines.call({ ...context(cminstance), highlightEnabled: false }, [0, 1]);
      jest.advanceTimersByTime(1500);

      expect(cminstance.addLineClass).not.toHaveBeenCalled();
      expect(cminstance.removeLineClass).not.toHaveBeenCalled();
    });
  });
});
