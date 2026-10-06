import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { foldable, foldedRanges, foldEffect, indentUnit } from '@codemirror/language';
import { diagnosticCount, forceLinting, type LintSource } from '@codemirror/lint';
import { foldByLineMatch, foldMatchingLines } from './extensions/fold';
import RcCodeMirror from './RcCodeMirror.vue';

type Wrapper = VueWrapper<InstanceType<typeof RcCodeMirror>>;

function getView(wrapper: Wrapper): EditorView {
  return (wrapper.vm as unknown as { view: EditorView }).view;
}

function replaceDoc(view: EditorView, insert: string) {
  view.dispatch({
    changes: {
      from: 0, to: view.state.doc.length, insert
    }
  });
}

describe('component: RcCodeMirror', () => {
  let wrapper: Wrapper;

  function mountEditor(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}): Wrapper {
    wrapper = shallowMount(RcCodeMirror, {
      props,
      attrs,
      attachTo: document.body,
      global:   { stubs: { RcButton: false } }
    }) as Wrapper;

    return wrapper;
  }

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('mounting', () => {
    it('should render the editor inside the container', () => {
      mountEditor();

      expect(wrapper.find('.rc-code-mirror .cm-editor').exists()).toBe(true);
    });

    it('should load modelValue as the initial document', () => {
      mountEditor({ modelValue: 'foo: bar' });

      expect(getView(wrapper).state.doc.toString()).toBe('foo: bar');
    });

    it('should emit ready with the EditorView', () => {
      mountEditor();

      expect(wrapper.emitted('ready')![0][0]).toBe(getView(wrapper));
    });

    it('should expose an EditorView instance as view', () => {
      mountEditor();

      expect(getView(wrapper)).toBeInstanceOf(EditorView);
    });
  });

  describe('keyboard focus', () => {
    it.each(['default', 'emacs', 'vim'])('should show the escape hint while focused in %s mode', async(keymap) => {
      mountEditor({ keymap });

      getView(wrapper).focus();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').isVisible()).toBe(true);
    });

    // Tab does not stay in a read-only editor, so there is nothing to escape
    it.each(['default', 'emacs', 'vim'])('should hide the escape hint in a read-only editor in %s mode', async(keymap) => {
      mountEditor({ keymap, readOnly: true });

      getView(wrapper).focus();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').isVisible()).toBe(false);
    });

    it('should announce the escape hint', () => {
      mountEditor();

      expect(wrapper.find('.rc-cm-escape-hint').attributes('role')).toStrictEqual('alert');
    });

    it('should hide the escape hint when the editor loses focus', async() => {
      mountEditor();
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.blur();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').isVisible()).toBe(false);
    });

    it('should hide the escape hint in the input variant', async() => {
      mountEditor({ variant: 'input' });

      getView(wrapper).focus();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').isVisible()).toBe(false);
    });

    it('should translate the escape hint through CodeMirror phrases', async() => {
      mountEditor({ extensions: [EditorState.phrases.of({ 'Press Escape, then Tab to leave the editor': 'Use Escape, then Tab' })] });

      getView(wrapper).focus();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').text()).toStrictEqual('Use Escape, then Tab');
    });

    describe('escape key', () => {
      function listenOnDocument(): jest.Mock {
        const listener = jest.fn();

        document.addEventListener('keydown', listener);

        return listener;
      }

      function pressEscape(target: EventTarget, shiftKey = false): KeyboardEvent {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape', code: 'Escape', keyCode: 27, shiftKey, bubbles: true, cancelable: true
        });

        target.dispatchEvent(event);

        return event;
      }

      let listener: jest.Mock;

      beforeEach(() => {
        listener = listenOnDocument();
      });

      afterEach(() => {
        document.removeEventListener('keydown', listener);
      });

      it.each([
        ['default', false],
        ['emacs', false],
        ['vim', false],
        ['default', true],
      ])('should keep Escape from reaching the page in %s mode (shift: %p)', (keymap, shiftKey) => {
        mountEditor({ keymap });
        const view = getView(wrapper);

        view.focus();
        pressEscape(view.contentDOM, shiftKey);

        expect(listener).toHaveBeenCalledTimes(0);
      });

      it('should still let Vim leave Insert mode on Escape', () => {
        mountEditor({ keymap: 'vim', modelValue: 'foo' });
        const view = getView(wrapper);

        view.focus();
        view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
        }));
        pressEscape(view.contentDOM);
        view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'x', code: 'KeyX', keyCode: 88, bubbles: true, cancelable: true
        }));

        // In Normal mode x deletes the character under the cursor rather than typing an x
        expect(view.state.doc.toString()).toStrictEqual('oo');
      });

      it('should let Escape reach the page when pressed outside the editor', () => {
        mountEditor();

        const event = pressEscape(wrapper.element);

        expect(listener).toHaveBeenCalledWith(event);
      });

      it('should let other keys reach the page', () => {
        mountEditor();
        const view = getView(wrapper);

        view.focus();
        const enter = new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true
        });

        view.contentDOM.dispatchEvent(enter);

        expect(listener).toHaveBeenCalledWith(enter);
      });
    });

    it.each(['default', 'emacs', 'vim'])('should let Tab leave after Escape in %s mode', (keymap) => {
      mountEditor({ keymap, modelValue: 'foo' });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
      }));
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      });

      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
      expect(view.state.doc.toString()).toStrictEqual('foo');
    });

    it.each([['Tab', false], ['Shift-Tab', true]])('should let %s leave after Escape in Vim insert mode', (_shortcut, shiftKey) => {
      mountEditor({ keymap: 'vim', modelValue: 'foo' });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
      }));
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey, bubbles: true, cancelable: true
      });

      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
    });

    it.each([
      ['default', 'Tab', false], ['default', 'Shift-Tab', true],
      ['emacs', 'Tab', false], ['emacs', 'Shift-Tab', true],
      ['vim', 'Tab', false], ['vim', 'Shift-Tab', true]
    ])('should let %s mode use %s for focus navigation in a read-only editor', (keymap, _shortcut, shiftKey) => {
      mountEditor({
        keymap, readOnly: true, modelValue: '  foo: bar'
      });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(tab);

      expect({ defaultPrevented: tab.defaultPrevented, doc: view.state.doc.toString() }).toStrictEqual({ defaultPrevented: false, doc: '  foo: bar' });
    });

    it.each(['default', 'emacs', 'vim'])('should keep Tab in the editor in %s mode once it is no longer read-only', async(keymap) => {
      mountEditor({
        keymap, readOnly: true, modelValue: 'foo: bar'
      });
      await wrapper.setProps({ readOnly: false });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(true);
    });

    it('should indent with Tab and unindent with Shift-Tab in default mode', () => {
      mountEditor({ modelValue: 'foo: bar' });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));
      expect(view.state.doc.toString()).toStrictEqual('  foo: bar');

      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true
      }));
      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it.each([
      ['inserts spaces at the cursor in the middle of a line', 'parent:\n  key2: value2', 16, 'parent:\n  key2:   value2'],
      ['fills to the next indent stop', 'parent:\n  key2: value2', 15, 'parent:\n  key2:  value2'],
      ['indents an empty line', '', 0, '  '],
    ])('should use Tab in default mode that %s', (_description, doc, cursor, expected) => {
      mountEditor({ modelValue: doc });
      const view = getView(wrapper);

      view.focus();
      view.dispatch({ selection: { anchor: cursor } });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual(expected);
    });

    it('should indent every selected line with Tab in default mode', () => {
      mountEditor({ modelValue: 'a: 1\nb: 2' });
      const view = getView(wrapper);

      view.focus();
      view.dispatch({ selection: { anchor: 1, head: 7 } });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('  a: 1\n  b: 2');
    });

    it('should not indent the line with Tab in Vim normal mode', () => {
      mountEditor({ keymap: 'vim', modelValue: 'foo: bar' });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(true);
      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it('should move forward through the Vim jump list with Tab', () => {
      mountEditor({ keymap: 'vim', modelValue: 'first\nsecond\nthird' });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'G', code: 'KeyG', shiftKey: true, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'o', code: 'KeyO', ctrlKey: true, bubbles: true, cancelable: true
      }));
      expect(view.state.selection.main.head).toStrictEqual(0);

      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.lineAt(view.state.selection.main.head).text).toStrictEqual('third');
    });

    it('should keep Shift-Tab in the editor in Vim normal mode', () => {
      mountEditor({ keymap: 'vim', modelValue: '  foo: bar' });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(true);
      expect(view.state.doc.toString()).toStrictEqual('  foo: bar');
    });

    it('should unindent with Shift-Tab in Vim insert mode', () => {
      mountEditor({ keymap: 'vim', modelValue: '  foo: bar' });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(true);
      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it('should let Shift-Tab leave after Escape in Vim normal mode', () => {
      mountEditor({ keymap: 'vim', modelValue: 'foo' });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
      }));
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true
      });

      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
    });

    it.each([
      ['default', 'Tab', false], ['default', 'Shift-Tab', true],
      ['vim', 'Tab', false], ['vim', 'Shift-Tab', true]
    ])('should let %s input mode use %s for focus navigation', (keymap, _shortcut, shiftKey) => {
      mountEditor({
        keymap, variant: 'input', modelValue: 'foo: bar'
      });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it.each([['Tab', false], ['Shift-Tab', true]])('should let Vim input mode use %s for focus navigation', (_shortcut, shiftKey) => {
      mountEditor({
        keymap: 'vim', variant: 'input', modelValue: 'foo: bar'
      });
      const view = getView(wrapper);
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, shiftKey, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it.each([
      ['foo: bar', 4, 'foo:   bar'],
      ['foo: bar', 3, 'foo : bar'],
      ['', 0, '  '],
      ['  ', 2, '    '],
    ])('should fill %j at %i to the next indent stop with spaces on Tab in Vim insert mode', (doc, cursor, expected) => {
      mountEditor({ keymap: 'vim', modelValue: doc });
      const view = getView(wrapper);

      view.focus();
      view.dispatch({ selection: { anchor: cursor } });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual(expected);
    });

    it('should use a configured tab indent unit on Tab in Vim insert mode', () => {
      mountEditor({
        keymap: 'vim', modelValue: 'foo', extensions: [indentUnit.of('\t')]
      });
      const view = getView(wrapper);

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('\tfoo');
    });

    it('should update Tab behavior when the variant changes', async() => {
      mountEditor({ variant: 'input', modelValue: 'foo: bar' });
      const view = getView(wrapper);

      await wrapper.setProps({ variant: 'editor' });
      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('  foo: bar');
    });
  });

  it.each([
    ['default', false, 'ArrowUp', 38],
    ['default', false, 'ArrowDown', 40],
    ['emacs', false, 'ArrowUp', 38],
    ['emacs', false, 'ArrowDown', 40],
    ['vim', false, 'ArrowUp', 38],
    ['vim', false, 'ArrowDown', 40],
    ['vim', true, 'ArrowUp', 38],
    ['vim', true, 'ArrowDown', 40]
  ])('should leave Alt arrow unbound in %s mode (insert: %s, key: %s)', (keymap, insertMode, arrow, keyCode) => {
    mountEditor({ keymap, modelValue: 'first\nsecond\nthird' });
    const view = getView(wrapper);

    view.focus();
    view.dispatch({ selection: { anchor: 9 } });
    if (insertMode) {
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
    }
    const original = {
      doc:  view.state.doc.toString(),
      head: view.state.selection.main.head
    };

    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: arrow, code: arrow, keyCode, altKey: true, bubbles: true, cancelable: true
    }));

    expect({
      doc:  view.state.doc.toString(),
      head: view.state.selection.main.head
    }).toStrictEqual(original);
  });

  it.each([false, true])('should ignore Ctrl-/ in Vim mode (insert: %s)', (insertMode) => {
    mountEditor({ keymap: 'vim', modelValue: 'first\nsecond' });
    const view = getView(wrapper);

    view.focus();
    view.dispatch({ selection: { anchor: 2 } });
    if (insertMode) {
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
      }));
    }
    const original = {
      doc:       view.state.doc.toString(),
      selection: view.state.selection.main.toJSON()
    };
    const event = new KeyboardEvent('keydown', {
      key: '/', code: 'Slash', keyCode: 191, ctrlKey: true, bubbles: true, cancelable: true
    });

    view.contentDOM.dispatchEvent(event);

    expect({
      doc:              view.state.doc.toString(),
      selection:        view.state.selection.main.toJSON(),
      defaultPrevented: event.defaultPrevented
    }).toStrictEqual({ ...original, defaultPrevented: true });
  });

  describe('linter prop', () => {
    const problem: LintSource = (view) => [{
      from: 0, to: Math.min(3, view.state.doc.length), severity: 'error', message: 'Broken'
    }];

    function gutterClasses(): string[] {
      return wrapper.findAll('.cm-gutter').map((gutter) => gutter.classes().find((name) => name !== 'cm-gutter') as string);
    }

    async function lint(): Promise<void> {
      forceLinting(getView(wrapper));
      await new Promise((resolve) => setTimeout(resolve));
    }

    it('should not show a lint gutter without a linter', () => {
      mountEditor({ modelValue: 'foo' });

      expect(gutterClasses()).toStrictEqual(['cm-lineNumbers', 'cm-foldGutter']);
    });

    it('should show the lint gutter between the line numbers and the fold gutter', () => {
      mountEditor({ modelValue: 'foo', linter: problem });

      expect(gutterClasses()).toStrictEqual(['cm-lineNumbers', 'cm-gutter-lint', 'cm-foldGutter']);
    });

    it('should mark the lines with problems in the gutter', async() => {
      mountEditor({ modelValue: 'foo', linter: problem });

      await lint();

      expect(wrapper.find('.cm-gutter-lint .cm-lint-marker-error').exists()).toStrictEqual(true);
    });

    it('should underline problems in the text', async() => {
      mountEditor({ modelValue: 'foo', linter: problem });

      await lint();

      expect(wrapper.find('.cm-lintRange-error').text()).toStrictEqual('foo');
    });

    it('should report the linter problems', async() => {
      mountEditor({ modelValue: 'foo', linter: problem });

      await lint();

      expect(diagnosticCount(getView(wrapper).state)).toStrictEqual(1);
    });

    it('should underline problems without a gutter in the input variant', async() => {
      mountEditor({
        modelValue: 'foo', linter: problem, variant: 'input'
      });

      await lint();

      expect(gutterClasses()).toStrictEqual([]);
      expect(wrapper.find('.cm-lintRange-error').exists()).toStrictEqual(true);
    });

    it('should add the linter after mount', async() => {
      mountEditor({ modelValue: 'foo' });

      await wrapper.setProps({ linter: problem });
      await lint();

      expect(gutterClasses()).toStrictEqual(['cm-lineNumbers', 'cm-gutter-lint', 'cm-foldGutter']);
      expect(diagnosticCount(getView(wrapper).state)).toStrictEqual(1);
    });

    it('should remove the gutter and problems when the linter is removed', async() => {
      mountEditor({ modelValue: 'foo', linter: problem });
      await lint();

      await wrapper.setProps({ linter: undefined });

      expect(gutterClasses()).toStrictEqual(['cm-lineNumbers', 'cm-foldGutter']);
      expect(wrapper.find('.cm-lintRange-error').exists()).toStrictEqual(false);
    });
  });

  describe('keymapIndicator prop', () => {
    const INDICATOR = '[data-testid="code-mirror-keymap"]';

    // The indicator renders once the view, which translates its text, exists
    async function mountRendered(props: Record<string, unknown>): Promise<Wrapper> {
      mountEditor(props);
      await wrapper.vm.$nextTick();

      return wrapper;
    }

    it('should not show the indicator by default', async() => {
      await mountRendered({ keymap: 'vim' });

      expect(wrapper.find(INDICATOR).exists()).toStrictEqual(false);
    });

    it.each([
      ['vim', 'Hide key mapping: Vim'],
      ['emacs', 'Hide key mapping: Emacs'],
    ])('should show a button naming the %s keymap', async(keymap, label) => {
      await mountRendered({ keymap, keymapIndicator: true });
      const indicator = wrapper.find(INDICATOR);

      expect(indicator.element.tagName).toStrictEqual('BUTTON');
      expect(indicator.classes()).toContain('variant-ghost');
      expect(indicator.attributes('type')).toStrictEqual('button');
      expect(indicator.attributes('aria-label')).toStrictEqual(label);
    });

    it.each([undefined, 'default'])('should not show the indicator for the %p keymap', async(keymap) => {
      await mountRendered({ keymap, keymapIndicator: true });

      expect(wrapper.find(INDICATOR).exists()).toStrictEqual(false);
    });

    it('should not show the indicator in the input variant', async() => {
      await mountRendered({
        keymap: 'vim', keymapIndicator: true, variant: 'input'
      });

      expect(wrapper.find(INDICATOR).exists()).toStrictEqual(false);
    });

    it('should show the indicator when the keymap changes to Vim', async() => {
      await mountRendered({ keymapIndicator: true });

      await wrapper.setProps({ keymap: 'vim' });

      expect(wrapper.find(INDICATOR).exists()).toStrictEqual(true);
    });

    it('should translate the label and keymap name through CodeMirror phrases', async() => {
      await mountRendered({
        keymap:          'vim',
        keymapIndicator: true,
        extensions:      [EditorState.phrases.of({ 'Hide key mapping: $': 'Masquer le clavier $', Vim: 'VIM' })]
      });

      expect(wrapper.find(INDICATOR).attributes('aria-label')).toStrictEqual('Masquer le clavier VIM');
    });

    it('should hide the indicator when it is selected', async() => {
      await mountRendered({ keymap: 'vim', keymapIndicator: true });

      await wrapper.find(INDICATOR).trigger('click');

      expect(wrapper.find(INDICATOR).exists()).toStrictEqual(false);
    });

    it('should move focus to the editor when the indicator is selected', async() => {
      await mountRendered({ keymap: 'vim', keymapIndicator: true });
      const indicator = wrapper.find(INDICATOR);

      (indicator.element as HTMLButtonElement).focus();
      await indicator.trigger('click');

      expect(document.activeElement).toStrictEqual(getView(wrapper).contentDOM);
    });

    it('should let Escape on the indicator reach the page', async() => {
      const listener = jest.fn();

      await mountRendered({ keymap: 'vim', keymapIndicator: true });
      document.addEventListener('keydown', listener);
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
      });

      wrapper.find(INDICATOR).element.dispatchEvent(escape);
      document.removeEventListener('keydown', listener);

      expect(listener).toHaveBeenCalledWith(escape);
    });
  });

  describe('v-model', () => {
    it('should emit update:modelValue when the document changes', () => {
      mountEditor({ modelValue: 'a' });

      replaceDoc(getView(wrapper), 'b');

      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['b']]);
    });

    it('should emit change when the document changes', () => {
      mountEditor({ modelValue: 'a' });

      replaceDoc(getView(wrapper), 'b');

      expect(wrapper.emitted('change')).toStrictEqual([['b']]);
    });

    it('should not emit update:modelValue for selection-only transactions', () => {
      mountEditor({ modelValue: 'abc' });

      getView(wrapper).dispatch({ selection: { anchor: 1 } });

      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('should replace the document when modelValue changes', async() => {
      mountEditor({ modelValue: 'a' });

      await wrapper.setProps({ modelValue: 'b' });

      expect(getView(wrapper).state.doc.toString()).toBe('b');
    });

    it('should not dispatch when modelValue matches the document', async() => {
      mountEditor({ modelValue: 'a' });
      const dispatch = jest.spyOn(getView(wrapper), 'dispatch');

      replaceDoc(getView(wrapper), 'b');
      dispatch.mockClear();
      await wrapper.setProps({ modelValue: 'b' });

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('readOnly prop', () => {
    it('should make the content editable by default', () => {
      mountEditor();

      expect(getView(wrapper).contentDOM.getAttribute('contenteditable')).toBe('true');
    });

    it('should make the content non-editable when readOnly is true', () => {
      mountEditor({ readOnly: true });

      expect(getView(wrapper).contentDOM.getAttribute('contenteditable')).toBe('false');
    });

    it('should keep the read-only textbox in the tab order', () => {
      mountEditor({ readOnly: true });

      expect(getView(wrapper).contentDOM.tabIndex).toStrictEqual(0);
    });

    it('should let the read-only textbox receive focus', () => {
      mountEditor({ readOnly: true });
      const view = getView(wrapper);

      view.contentDOM.focus();

      expect(document.activeElement).toBe(view.contentDOM);
    });

    it('should select read-only content from the keyboard', () => {
      mountEditor({ readOnly: true, modelValue: 'foo: bar' });
      const view = getView(wrapper);

      view.contentDOM.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'a', ctrlKey: true, bubbles: true, cancelable: true
      }));

      expect([view.state.selection.main.from, view.state.selection.main.to]).toStrictEqual([0, view.state.doc.length]);
    });

    it('should toggle editability when readOnly changes', async() => {
      mountEditor();

      await wrapper.setProps({ readOnly: true });

      expect(getView(wrapper).contentDOM.getAttribute('contenteditable')).toBe('false');
    });

    it('should add the tab stop when readOnly changes to true', async() => {
      mountEditor();

      await wrapper.setProps({ readOnly: true });

      expect(getView(wrapper).contentDOM.tabIndex).toStrictEqual(0);
    });

    it('should remove the explicit tab stop when readOnly changes to false', async() => {
      mountEditor({ readOnly: true });

      await wrapper.setProps({ readOnly: false });

      expect(getView(wrapper).contentDOM.hasAttribute('tabindex')).toBe(false);
    });

    it('should make the state read only when readOnly is true', () => {
      mountEditor({ readOnly: true });

      expect(getView(wrapper).state.readOnly).toStrictEqual(true);
    });

    it('should not insert a line break on Enter when readOnly is true', () => {
      mountEditor({ modelValue: 'foo: bar', readOnly: true });
      const view = getView(wrapper);

      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', keyCode: 13, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('foo: bar');
    });

    it('should insert a line break on Enter when editable', () => {
      mountEditor({ modelValue: 'foo: bar' });
      const view = getView(wrapper);

      view.dispatch({ selection: { anchor: view.state.doc.length } });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', keyCode: 13, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('foo: bar\n');
    });

    it('should make the state read only when readOnly changes', async() => {
      mountEditor();

      await wrapper.setProps({ readOnly: true });

      expect(getView(wrapper).state.readOnly).toStrictEqual(true);
    });
  });

  describe('lineNumbers prop', () => {
    it('should show line numbers by default', () => {
      mountEditor();

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(true);
    });

    it('should hide line numbers when lineNumbers is false', () => {
      mountEditor({ lineNumbers: false });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false);
    });

    it('should hide line numbers when lineNumbers changes to false', async() => {
      mountEditor();

      await wrapper.setProps({ lineNumbers: false });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false);
    });
  });

  describe('theme prop', () => {
    it.each([
      ['keys', '.cm-rancher-key', 'enabled'],
      ['quoted values', '.cm-rancher-string', '"platform"'],
      ['plain booleans', '.cm-rancher-keyword', 'true'],
      ['comments', '.cm-rancher-comment', '# a comment']
    ])('should highlight YAML %s with the Rancher theme by default', (_token, selector, expected) => {
      mountEditor({
        language:   'yaml',
        modelValue: 'enabled: true\nowner: "platform"\n# a comment'
      });

      expect(wrapper.find(selector).text()).toStrictEqual(expected);
    });

    it('should not highlight a YAML key or quoted boolean as a boolean value', () => {
      mountEditor({ language: 'yaml', modelValue: 'true: "false"' });

      expect(wrapper.find('.cm-rancher-keyword').exists()).toStrictEqual(false);
    });

    it.each([
      ['property names', '.cm-rancher-key', '"enabled"'],
      ['booleans', '.cm-rancher-keyword', 'true']
    ])('should highlight JSON %s', (_token, selector, expected) => {
      mountEditor({ language: 'json', modelValue: '{"enabled": true, "replicas": 3}' });

      expect(wrapper.find(selector).text()).toStrictEqual(expected);
    });

    it.each([
      ['property names', '.cm-rancher-key', 'name'],
      ['strings', '.cm-rancher-string', '"nginx"'],
      ['booleans', '.cm-rancher-keyword', 'true'],
      ['comments', '.cm-rancher-comment', '// a comment']
    ])('should highlight JavaScript %s', (_token, selector, expected) => {
      mountEditor({ language: 'javascript', modelValue: 'object.name == "nginx" && true // a comment' });

      expect(wrapper.find(selector).text()).toStrictEqual(expected);
    });

    it('should not complete JavaScript while typing', () => {
      mountEditor({ language: 'javascript', modelValue: '' });

      expect(getView(wrapper).state.languageDataAt('autocomplete', 0)).toStrictEqual([]);
    });

    it('should highlight YAML booleans when the language changes to YAML', async() => {
      mountEditor({ language: 'json', modelValue: 'enabled: true' });

      await wrapper.setProps({ language: 'yaml' });

      expect(wrapper.find('.cm-rancher-keyword').text()).toStrictEqual('true');
    });

    it('should remove Rancher highlighting when the theme changes to none', async() => {
      mountEditor({ language: 'yaml', modelValue: 'name: "nginx"' });

      await wrapper.setProps({ theme: 'none' });

      expect(wrapper.find('.cm-rancher-key').exists()).toStrictEqual(false);
    });
  });

  describe('variant prop', () => {
    it('should highlight YAML keys and comments in the input variant', () => {
      mountEditor({
        variant: 'input', language: 'yaml', modelValue: 'name: "nginx"\n# a comment'
      });

      expect(wrapper.find('.cm-rancher-key').text()).toStrictEqual('name');
      expect(wrapper.find('.cm-rancher-comment').text()).toStrictEqual('# a comment');
    });

    it('should render a wider cursor in the input variant', () => {
      mountEditor({ variant: 'input' });
      const cursor = document.createElement('span');

      cursor.className = 'cm-cursor';
      getView(wrapper).dom.append(cursor);

      expect(getComputedStyle(cursor).borderLeftWidth).toStrictEqual('2px');
    });

    it('should keep Rancher highlighting when the variant changes to editor', async() => {
      mountEditor({
        variant: 'input', language: 'yaml', modelValue: 'name: "nginx"'
      });

      await wrapper.setProps({ variant: 'editor' });

      expect(wrapper.find('.cm-rancher-key').text()).toStrictEqual('name');
    });

    it('should leave input syntax unthemed when theme is none', () => {
      mountEditor({
        variant: 'input', language: 'yaml', theme: 'none', modelValue: 'name: "nginx"'
      });

      expect(wrapper.find('.cm-rancher-key').exists()).toStrictEqual(false);
    });

    it('should be an editor by default', () => {
      mountEditor();

      expect(wrapper.classes()).toContain('rc-code-mirror--editor');
    });

    it('should apply the input variant class', () => {
      mountEditor({ variant: 'input' });

      expect(wrapper.classes()).toContain('rc-code-mirror--input');
    });

    it('should hide line numbers for the input variant', () => {
      mountEditor({ variant: 'input' });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false);
    });

    it('should hide line numbers for the input variant even when lineNumbers is true', () => {
      mountEditor({ variant: 'input', lineNumbers: true });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false);
    });

    it('should hide the fold gutter for the input variant', () => {
      mountEditor({ variant: 'input' });

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(false);
    });

    it('should wrap lines for the input variant even when lineWrapping is false', () => {
      mountEditor({ variant: 'input', lineWrapping: false });

      expect(getView(wrapper).contentDOM.classList).toContain('cm-lineWrapping');
    });

    it('should hide line numbers when the variant changes to input', async() => {
      mountEditor();

      await wrapper.setProps({ variant: 'input' });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false);
    });

    it('should hide the fold gutter when the variant changes to input', async() => {
      mountEditor();

      await wrapper.setProps({ variant: 'input' });

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(false);
    });

    it('should show the fold gutter when the variant changes to editor', async() => {
      mountEditor({ variant: 'input' });

      await wrapper.setProps({ variant: 'editor' });

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(true);
    });

    it('should show line numbers when the variant changes to editor', async() => {
      mountEditor({ variant: 'input' });

      await wrapper.setProps({ variant: 'editor' });

      expect(wrapper.find('.cm-lineNumbers').exists()).toBe(true);
    });
  });

  describe('lineWrapping prop', () => {
    it('should not wrap lines by default', () => {
      mountEditor();

      expect(getView(wrapper).contentDOM.classList).not.toContain('cm-lineWrapping');
    });

    it('should wrap lines when lineWrapping is true', () => {
      mountEditor({ lineWrapping: true });

      expect(getView(wrapper).contentDOM.classList).toContain('cm-lineWrapping');
    });

    it('should wrap lines when lineWrapping changes to true', async() => {
      mountEditor();

      await wrapper.setProps({ lineWrapping: true });

      expect(getView(wrapper).contentDOM.classList).toContain('cm-lineWrapping');
    });
  });

  describe('foldGutter prop', () => {
    it('should place the fold gutter after the line numbers', () => {
      mountEditor({ language: 'yaml', modelValue: 'metadata:\n  name: test' });

      expect(wrapper.findAll('.cm-gutters > .cm-gutter').map((gutter) => gutter.classes())).toStrictEqual([
        ['cm-gutter', 'cm-lineNumbers'], ['cm-gutter', 'cm-foldGutter']
      ]);
    });

    it('should show down and right triangle markers for expanded and collapsed lines', () => {
      mountEditor({ language: 'yaml', modelValue: 'metadata:\n  name: test\nkind: Pod' });
      const view = getView(wrapper);
      const open = wrapper.get('.cm-foldGutter .rc-cm-fold-marker[title="Fold line"]');

      expect(open.get('svg path').attributes('d')).toStrictEqual('M2.5 3 7.5 3 5 7.5z');

      const range = foldable(view.state, 0, view.state.doc.line(1).to);

      expect(range).not.toBeNull();
      view.dispatch({ effects: foldEffect.of(range!) });

      const closed = wrapper.findAll('.cm-foldGutter .rc-cm-fold-marker[title="Unfold line"]')
        .find((marker) => (marker.element.parentElement as HTMLElement).style.visibility !== 'hidden');

      expect(closed?.get('svg path').attributes('d')).toStrictEqual('M3 2.5 7.5 5 3 7.5z');
    });

    it('should use CodeMirror phrases for the fold marker titles', () => {
      mountEditor({
        language:   'yaml',
        modelValue: 'metadata:\n  name: test\nkind: Pod',
        extensions: [EditorState.phrases.of({
          'Fold line':   'Zeile einklappen',
          'Unfold line': 'Zeile ausklappen'
        })]
      });
      const view = getView(wrapper);

      const open = wrapper.findAll('.cm-foldGutter .rc-cm-fold-marker[title="Zeile einklappen"]')
        .find((marker) => (marker.element.parentElement as HTMLElement).style.visibility !== 'hidden');

      expect(open?.attributes('title')).toStrictEqual('Zeile einklappen');

      const range = foldable(view.state, 0, view.state.doc.line(1).to);

      expect(range).not.toBeNull();
      view.dispatch({ effects: foldEffect.of(range!) });

      const closed = wrapper.findAll('.cm-foldGutter .rc-cm-fold-marker[title="Zeile ausklappen"]')
        .find((marker) => (marker.element.parentElement as HTMLElement).style.visibility !== 'hidden');

      expect(closed?.attributes('title')).toStrictEqual('Zeile ausklappen');
    });

    it('should fold when the gutter cell around a marker is clicked', () => {
      mountEditor({ language: 'yaml', modelValue: 'metadata:\n  name: test\nkind: Pod' });
      const view = getView(wrapper);
      const marker = wrapper.get('.cm-foldGutter .rc-cm-fold-marker[title="Fold line"]');

      marker.element.parentElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(foldedRanges(view.state).size).toStrictEqual(1);
    });

    it('should show the design marker on folded content and unfold when clicked', () => {
      mountEditor({ language: 'yaml', modelValue: 'metadata:\n  name: test\nkind: Pod' });
      const view = getView(wrapper);
      const range = foldable(view.state, 0, view.state.doc.line(1).to);

      expect(range).not.toBeNull();
      view.dispatch({ effects: foldEffect.of(range!) });
      const marker = wrapper.get('.cm-foldPlaceholder');

      expect(marker.text()).toStrictEqual('↔️');
      expect(marker.attributes('aria-label')).toStrictEqual('folded code');
      marker.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(foldedRanges(view.state).size).toStrictEqual(0);
    });

    it('should show the fold gutter by default', () => {
      mountEditor();

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(true);
    });

    it('should hide the fold gutter when foldGutter is false', () => {
      mountEditor({ foldGutter: false });

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(false);
    });

    it('should hide the fold gutter when foldGutter changes to false', async() => {
      mountEditor();

      await wrapper.setProps({ foldGutter: false });

      expect(wrapper.find('.cm-foldGutter').exists()).toBe(false);
    });

    it('should still fold programmatically when foldGutter is false', () => {
      mountEditor({
        modelValue: 'spec:\n  a: 1', foldGutter: false, foldOptions: { strategy: 'indent' }
      });
      const view = getView(wrapper);

      foldMatchingLines(view, /^spec:/);

      expect(foldedRanges(view.state).size).toStrictEqual(1);
    });
  });

  describe('extensions prop', () => {
    it('should register the given extensions with the editor', () => {
      mountEditor({ modelValue: 'spec:\n  a: 1', extensions: [foldByLineMatch(/^spec:/)] });
      const { state } = getView(wrapper);
      const line = state.doc.line(1);

      expect(foldable(state, line.from, line.to)).toStrictEqual({ from: 5, to: 12 });
    });
  });

  describe('aria attributes', () => {
    it.each([
      ['aria-label', 'YAML'],
      ['aria-labelledby', 'label-id'],
      ['aria-describedby', 'description-id'],
    ])('should forward %s to the textbox', (name, value) => {
      mountEditor({}, { [name]: value });

      expect(getView(wrapper).contentDOM.getAttribute(name)).toStrictEqual(value);
    });

    it('should not put aria-label on the container', () => {
      mountEditor({}, { 'aria-label': 'YAML' });

      expect(wrapper.attributes('aria-label')).toBeUndefined();
    });

    it('should forward a custom tabindex to the textbox', () => {
      mountEditor({ readOnly: true }, { tabindex: -1 });

      expect(getView(wrapper).contentDOM.tabIndex).toStrictEqual(-1);
    });

    it('should not put a custom tabindex on the container', () => {
      mountEditor({ readOnly: true }, { tabindex: -1 });

      expect(wrapper.attributes('tabindex')).toBeUndefined();
    });

    it('should keep other attributes on the container', () => {
      mountEditor({}, { 'data-testid': 'editor' });

      expect(wrapper.attributes('data-testid')).toStrictEqual('editor');
    });

    it('should update the textbox when aria-label changes', async() => {
      mountEditor({}, { 'aria-label': 'YAML' });

      await wrapper.setProps({ 'aria-label': 'JSON' } as Record<string, unknown>);

      expect(getView(wrapper).contentDOM.getAttribute('aria-label')).toStrictEqual('JSON');
    });
  });

  describe('fold key bindings', () => {
    const doc = 'spec:\n  a: 1';

    function pressFoldKey(view: EditorView, key: '[' | ']') {
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key:        key === '[' ? '{' : '}',
        keyCode:    key === '[' ? 219 : 221,
        ctrlKey:    true,
        shiftKey:   true,
        bubbles:    true,
        cancelable: true
      }));
    }

    function foldCount(view: EditorView): number {
      return foldedRanges(view.state).size;
    }

    it.each(['default', 'emacs', 'vim'])('should fold the line at the cursor with the %s keymap', (keymap) => {
      mountEditor({
        modelValue: doc, keymap, foldOptions: { strategy: 'indent' }
      });
      const view = getView(wrapper);

      pressFoldKey(view, '[');

      expect(foldCount(view)).toStrictEqual(1);
    });

    it('should fold read-only content from the keyboard', () => {
      mountEditor({
        modelValue: doc, readOnly: true, foldOptions: { strategy: 'indent' }
      });
      const view = getView(wrapper);

      view.contentDOM.focus();
      pressFoldKey(view, '[');

      expect(foldCount(view)).toStrictEqual(1);
    });

    it.each(['default', 'emacs', 'vim'])('should unfold the line at the cursor with the %s keymap', (keymap) => {
      mountEditor({
        modelValue: doc, keymap, foldOptions: { strategy: 'indent' }
      });
      const view = getView(wrapper);

      view.dispatch({ effects: foldEffect.of({ from: 5, to: 12 }) });
      pressFoldKey(view, ']');

      expect(foldCount(view)).toStrictEqual(0);
    });
  });

  describe('emacs key bindings', () => {
    function pressKey(view: EditorView, key: string, code: string, ctrlKey = true): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key,
        code,
        ctrlKey,
        bubbles:    true,
        cancelable: true
      });

      view.contentDOM.dispatchEvent(event);

      return event;
    }

    it('should move to the start of the line with Ctrl-A', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'first\nsecond' });
      const view = getView(wrapper);

      view.dispatch({ selection: { anchor: 9 } });
      pressKey(view, 'a', 'KeyA');

      expect(view.state.selection.main.head).toStrictEqual(6);
    });

    it.each([
      ['/', 'Slash'],
      ['z', 'KeyZ']
    ])('should undo with Ctrl-%s as in CodeMirror 5', (key, code) => {
      mountEditor({ keymap: 'emacs', modelValue: 'old' });
      const view = getView(wrapper);

      view.dispatch({ changes: { from: 3, insert: '!' } });
      pressKey(view, key, code);

      expect(view.state.doc.toString()).toStrictEqual('old');
    });

    it('should open search with Ctrl-S when the Emacs keymap is active', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'search me' });
      const view = getView(wrapper);

      pressKey(view, 's', 'KeyS');

      expect(wrapper.find('.cm-search').exists()).toBe(true);
    });

    it('should kill and yank text with Ctrl-K and Ctrl-Y', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'first second' });
      const view = getView(wrapper);

      view.dispatch({ selection: { anchor: 6 } });
      pressKey(view, 'k', 'KeyK');
      expect(view.state.doc.toString()).toStrictEqual('first ');

      pressKey(view, 'y', 'KeyY');
      expect(view.state.doc.toString()).toStrictEqual('first second');
    });

    it('should select the document with Ctrl-X H', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'first\nsecond' });
      const view = getView(wrapper);

      pressKey(view, 'x', 'KeyX');
      pressKey(view, 'h', 'KeyH', false);

      expect(view.state.selection.main).toMatchObject({ from: 0, to: view.state.doc.length });
    });

    it('should handle Ctrl-N when the browser delivers it to the editor', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'first\nsecond' });
      const view = getView(wrapper);

      view.dispatch({ selection: { anchor: 2 } });
      const rect = {
        left: 0, right: 8, top: 0, bottom: 16, width: 8, height: 16
      } as DOMRect;
      const getClientRects = Range.prototype.getClientRects;

      Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList;
      let event: KeyboardEvent;

      try {
        event = pressKey(view, 'n', 'KeyN');
      } finally {
        Range.prototype.getClientRects = getClientRects;
      }

      expect(event.defaultPrevented).toBe(true);
    });

    it('should restore the default keymap after switching from emacs', async() => {
      mountEditor({ keymap: 'emacs', modelValue: 'first\nsecond' });
      const view = getView(wrapper);

      await wrapper.setProps({ keymap: 'default' });
      pressKey(view, 'a', 'KeyA');

      expect(view.state.selection.main).toMatchObject({ from: 0, to: view.state.doc.length });
    });

    // The Emacs handler looks keys up by physical key code, so punctuation codes have to map to the
    // characters its bindings are written with.
    describe('bindings on punctuation keys', () => {
      function pressAltKey(view: EditorView, key: string, code: string, shiftKey = false): KeyboardEvent {
        const event = new KeyboardEvent('keydown', {
          key,
          code,
          altKey:     true,
          shiftKey,
          bubbles:    true,
          cancelable: true
        });

        view.contentDOM.dispatchEvent(event);

        return event;
      }

      it('should toggle a YAML line comment with Alt-;', () => {
        mountEditor({
          keymap: 'emacs', language: 'yaml', modelValue: 'foo: bar'
        });
        const view = getView(wrapper);

        pressAltKey(view, ';', 'Semicolon');

        expect(view.state.doc.toString()).toStrictEqual('# foo: bar');
      });

      it.each([
        ['<', 'Comma', 9, 0],
        ['>', 'Period', 0, 12]
      ])('should move the cursor with Alt-%s', (key, code, from, to) => {
        mountEditor({ keymap: 'emacs', modelValue: 'first\nsecond' });
        const view = getView(wrapper);

        view.dispatch({ selection: { anchor: from } });
        pressAltKey(view, key, code, true);

        expect(view.state.selection.main.head).toStrictEqual(to);
      });

      it('should type punctuation without a modifier as text', () => {
        mountEditor({ keymap: 'emacs', modelValue: 'a' });
        const view = getView(wrapper);
        const event = new KeyboardEvent('keydown', {
          key: ',', code: 'Comma', bubbles: true, cancelable: true
        });

        view.contentDOM.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
      });
    });

    it('should delete the character before the cursor with Ctrl-H', () => {
      mountEditor({ keymap: 'emacs', modelValue: 'first' });
      const view = getView(wrapper);

      view.dispatch({ selection: { anchor: 5 } });
      const event = pressKey(view, 'h', 'KeyH');

      expect(view.state.doc.toString()).toStrictEqual('firs');
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('search panel', () => {
    function openSearch(view: EditorView): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key: 'f', code: 'KeyF', keyCode: 70, ctrlKey: true, bubbles: true, cancelable: true
      });

      view.focus();
      view.contentDOM.dispatchEvent(event);

      return event;
    }

    function searchFor(text: string): HTMLInputElement {
      const field = wrapper.find<HTMLInputElement>('.cm-search input[name=search]').element;

      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true }));

      return field;
    }

    function pressInPanel(field: HTMLElement, key: string, keyCode: number): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key, code: key, keyCode, bubbles: true, cancelable: true
      });

      field.dispatchEvent(event);

      return event;
    }

    it('should open with Ctrl-F and keep the browser from opening its own find', () => {
      mountEditor({ modelValue: 'foo: bar' });
      const event = openSearch(getView(wrapper));

      expect({ open: wrapper.find('.cm-search').exists(), defaultPrevented: event.defaultPrevented }).toStrictEqual({ open: true, defaultPrevented: true });
    });

    // Pages such as Edit YAML stick a footer over the bottom of the editor
    it('should open at the top of the editor', () => {
      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));

      expect(wrapper.find('.cm-panels-top .cm-search').exists()).toBe(true);
    });

    it('should find text on a line far outside the rendered lines', () => {
      const lines = Array.from({ length: 500 }, (_, i) => `key${ i }: value`);

      mountEditor({ modelValue: [...lines, 'updatedReplicas: 1'].join('\n') });
      const view = getView(wrapper);

      openSearch(view);
      pressInPanel(searchFor('updatedReplicas'), 'Enter', 13);

      const { from, to } = view.state.selection.main;

      expect(view.state.sliceDoc(from, to)).toStrictEqual('updatedReplicas');
      expect(view.state.doc.lineAt(from).number).toStrictEqual(501);
    });

    it('should open in a read-only editor without the replace field', () => {
      mountEditor({ modelValue: 'foo: bar', readOnly: true });
      openSearch(getView(wrapper));

      expect({
        search:  wrapper.find('.cm-search input[name=search]').exists(),
        replace: wrapper.find('.cm-search input[name=replace]').exists()
      }).toStrictEqual({ search: true, replace: false });
    });

    it('should show the search prompt until there is a query, then clear the query without closing', () => {
      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));

      expect(getComputedStyle(wrapper.find('.cm-search-icon').element).display).not.toStrictEqual('none');
      expect(getComputedStyle(wrapper.find('.cm-search button[name=clear]').element).display).toStrictEqual('none');

      searchFor('foo');
      expect(getComputedStyle(wrapper.find('.cm-search button[name=clear]').element).display).toStrictEqual('inline-flex');
      expect(getComputedStyle(wrapper.find('.cm-search-icon').element).display).toStrictEqual('none');
      expect(wrapper.find('.cm-search button[name=clear] .icon-close').exists()).toBe(true);
      wrapper.find('.cm-search button[name=clear]').trigger('click');

      expect({
        value: wrapper.find<HTMLInputElement>('.cm-search input[name=search]').element.value,
        open:  wrapper.find('.cm-search').exists(),
        icon:  getComputedStyle(wrapper.find('.cm-search-icon').element).display === 'none',
        clear: getComputedStyle(wrapper.find('.cm-search button[name=clear]').element).display
      }).toStrictEqual({
        value: '', open: true, icon: false, clear: 'none'
      });
    });

    it('should keep the match count aligned with next and previous navigation', () => {
      mountEditor({ modelValue: 'foo: 1\nfoo: 2\nfoo: 3' });
      const view = getView(wrapper);

      openSearch(view);
      searchFor('foo');
      expect(wrapper.find('.cm-search-count').text()).toStrictEqual('1 of 3');

      wrapper.find('.cm-search button[name=next]').trigger('click');
      expect(wrapper.find('.cm-search-count').text()).toStrictEqual('2 of 3');

      wrapper.find('.cm-search button[name=prev]').trigger('click');
      expect(wrapper.find('.cm-search-count').text()).toStrictEqual('1 of 3');
    });

    it('should show zero matches and disable navigation for a query with no results', () => {
      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));
      searchFor('missing');

      expect({
        count: wrapper.find('.cm-search-count').text(),
        next:  wrapper.find('.cm-search button[name=next]').attributes('disabled'),
        prev:  wrapper.find('.cm-search button[name=prev]').attributes('disabled')
      }).toStrictEqual({
        count: '0 of 0', next: '', prev: ''
      });
    });

    it('should update the count when the editor document changes', () => {
      mountEditor({ modelValue: 'foo: 1\nfoo: 2' });
      const view = getView(wrapper);

      openSearch(view);
      searchFor('foo');
      view.dispatch({ changes: { from: view.state.doc.length, insert: '\nfoo: 3' } });

      expect(wrapper.find('.cm-search-count').text()).toStrictEqual('1 of 3');
    });

    it('should have no separate close button', () => {
      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));
      searchFor('foo');

      expect(wrapper.find('.cm-search button[name=close]').exists()).toBe(false);
    });

    it('should leave Ctrl-F to the browser in the input variant', () => {
      mountEditor({ variant: 'input', modelValue: 'foo: bar' });
      const event = openSearch(getView(wrapper));

      expect({ open: wrapper.find('.cm-search').exists(), defaultPrevented: event.defaultPrevented }).toStrictEqual({ open: false, defaultPrevented: false });
    });

    it('should close on Escape without the key reaching the page', () => {
      const listener = jest.fn();

      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));
      const field = searchFor('foo');

      document.addEventListener('keydown', listener);
      pressInPanel(field, 'Escape', 27);
      document.removeEventListener('keydown', listener);

      expect({ open: wrapper.find('.cm-search').exists(), calls: listener.mock.calls.length }).toStrictEqual({ open: false, calls: 0 });
    });

    it('should hide the escape hint while the search field has focus', async() => {
      mountEditor({ modelValue: 'foo: bar' });
      openSearch(getView(wrapper));
      wrapper.find<HTMLInputElement>('.cm-search input[name=search]').element.focus();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.rc-cm-escape-hint').isVisible()).toBe(false);
    });

    it('should translate the panel through CodeMirror phrases', () => {
      mountEditor({
        modelValue: 'foo: bar',
        extensions: [EditorState.phrases.of({
          Find: 'Rechercher', next: 'Suivant', 'Clear search': 'Effacer la recherche'
        })]
      });
      openSearch(getView(wrapper));
      searchFor('foo');

      expect({
        placeholder: wrapper.find('.cm-search input[name=search]').attributes('placeholder'),
        next:        wrapper.find('.cm-search button[name=next]').attributes('aria-label'),
        clearLabel:  wrapper.find('.cm-search button[name=clear]').attributes('aria-label')
      }).toStrictEqual({
        placeholder: 'Rechercher', next: 'Suivant', clearLabel: 'Effacer la recherche'
      });
    });
  });

  describe('vim command line', () => {
    function pressSlash(view: EditorView): void {
      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: '/', code: 'Slash', keyCode: 191, bubbles: true, cancelable: true
      }));
    }

    // Pages such as Edit YAML stick a footer over the bottom of the editor
    it('should open the / prompt above the editor rather than in it', () => {
      mountEditor({ keymap: 'vim', modelValue: 'foo: bar' });
      pressSlash(getView(wrapper));

      expect({
        strip:  wrapper.find('.rc-cm-bottom-panels .cm-vim-panel input').exists(),
        editor: wrapper.find('.cm-editor .cm-vim-panel').exists()
      }).toStrictEqual({ strip: true, editor: false });
    });

    it('should empty the strip once the prompt closes', () => {
      mountEditor({ keymap: 'vim', modelValue: 'foo: bar' });
      pressSlash(getView(wrapper));
      wrapper.find('.rc-cm-bottom-panels input').element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
      }));

      expect(wrapper.find('.rc-cm-bottom-panels .cm-panels').exists()).toBe(false);
    });
  });

  describe('vim enter', () => {
    function pressKeys(view: EditorView, keys: { key: string; code: string; keyCode: number }[]): void {
      keys.forEach((init) => view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, ...init
      })));
    }

    const insert = {
      key: 'i', code: 'KeyI', keyCode: 73
    };
    const enter = {
      key: 'Enter', code: 'Enter', keyCode: 13
    };

    it.each([
      ['keeps the indentation of the line', "metadata:\n  name: ''", 20, "metadata:\n  name: ''\n  "],
      ['puts the cursor on an indented line between braces', 'metadata:\n  test: {}', 19, 'metadata:\n  test: {\n    \n  }'],
      ['puts the cursor on an indented line between brackets', 'metadata:\n  test: []', 19, 'metadata:\n  test: [\n    \n  ]'],
    ])('should indent the new line in Insert mode: %s', (_description, doc, cursor, expected) => {
      mountEditor({
        keymap: 'vim', language: 'yaml', modelValue: doc
      });
      const view = getView(wrapper);

      view.focus();
      view.dispatch({ selection: { anchor: cursor } });
      pressKeys(view, [insert, enter]);

      expect(view.state.doc.toString()).toStrictEqual(expected);
    });

    // Vim moves the cursor down on Normal mode Enter, which needs layout that jsdom does not have
    it('should not insert a line in Normal mode', () => {
      mountEditor({
        keymap: 'vim', language: 'yaml', modelValue: 'first: 1\n  second: 2'
      });
      const view = getView(wrapper);

      view.focus();
      pressKeys(view, [enter]);

      expect(view.state.doc.toString()).toStrictEqual('first: 1\n  second: 2');
    });
  });

  describe('bracket pairs', () => {
    function pressBackspace(keymap: string | undefined, doc: string, cursor: number): string {
      mountEditor({ keymap, modelValue: doc });
      const view = getView(wrapper);

      view.focus();
      view.dispatch({ selection: { anchor: cursor } });

      if (keymap === 'vim') {
        view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'i', code: 'KeyI', keyCode: 73, bubbles: true, cancelable: true
        }));
      }
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Backspace', code: 'Backspace', keyCode: 8, bubbles: true, cancelable: true
      }));

      return view.state.doc.toString();
    }

    it.each([
      [undefined, '[]', 1, ''],
      [undefined, '{}', 1, ''],
      [undefined, 'a: ""', 4, 'a: '],
      [undefined, '[a]', 2, '[]'],
      [undefined, '[ ]', 2, '[]'],
      ['vim', '[]', 1, ''],
      ['emacs', '{}', 1, ''],
      ['emacs', '[a]', 2, '[]'],
    ])('should delete with Backspace in the %s keymap from %j at %i to %j', (keymap, doc, cursor, expected) => {
      expect(pressBackspace(keymap, doc, cursor)).toStrictEqual(expected);
    });
  });

  describe('unmounting', () => {
    it('should destroy the EditorView', () => {
      mountEditor();
      const destroy = jest.spyOn(getView(wrapper), 'destroy');

      wrapper.unmount();

      expect(destroy).toHaveBeenCalledWith();
    });
  });
});
