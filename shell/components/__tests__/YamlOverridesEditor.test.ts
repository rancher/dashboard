import { defineComponent, markRaw } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import { closeSearchPanel, searchPanelOpen } from '@codemirror/search';
import { getKeymapExtension } from '@components/RcCodeMirror/extensions/keymaps';
import YamlOverridesEditor from '@shell/components/YamlOverridesEditor.vue';
import { mergeOverridesRawText, overridesFromValues } from '@shell/utils/chart-values';

describe('component: YamlOverridesEditor', () => {
  // Stub YamlEditor with a real CodeMirror view, so the search and the tint run for
  // real. Like YamlEditor, it doesn't react to its `value` prop after mount: text is
  // pushed in with `updateValue`, and every change is emitted as update:value. The
  // view isn't attached to the page, since jsdom can't measure it. It has YamlEditor's
  // key bindings and search panel.
  const YamlEditorStub = defineComponent({
    name:  'YamlEditor',
    props: {
      value: String, componentTestid: String, editorMode: String
    },
    emits:    ['update:value', 'onReady'],
    data:     () => ({ view: null as EditorView | null }),
    template: '<div class="yaml-editor-stub" />',
    mounted() {
      this.view = markRaw(new EditorView({
        doc:        this.value || '',
        extensions: [getKeymapExtension(), EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.$emit('update:value', update.state.doc.toString());
          }
        })],
      }));
      this.$emit('onReady', this.view);
    },
    beforeUnmount() {
      this.view?.destroy();
    },
    methods: {
      updateValue(value: string) {
        const view = this.view as EditorView;

        if (view.state.doc.toString() !== value) {
          view.dispatch({
            changes: {
              from: 0, to: view.state.doc.length, insert: value
            }
          });
        }
      },
    },
  });

  const defaults = { replicas: 2, sachet: { enabled: true } };

  const mountEditor = (props: Record<string, any> = {}) => shallowMount(YamlOverridesEditor, {
    props: {
      value: 'replicas: 5\n',
      defaults,
      ...props,
    },
    global: {
      mocks: { t: (key: string, args?: object) => (args ? `${ key } ${ JSON.stringify(args) }` : key) },
      stubs: { YamlEditor: YamlEditorStub },
    },
  });

  const editors = (wrapper: any) => ({
    left:  wrapper.findComponent({ ref: 'defaultsEditor' }).vm,
    right: wrapper.findComponent({ ref: 'overridesEditor' }).vm,
  });

  // The text of an editor, and the text of its lines or marks with a class
  const docOf = (editor: any): string => editor.view.state.doc.toString();
  const textsOf = (editor: any, selector: string) => Array.from(editor.view.contentDOM.querySelectorAll(selector)).map((el: any) => el.textContent);
  const tintedLines = (editor: any) => textsOf(editor, '.cm-line.line-override-highlight');

  // Let the watchers run, then the debounced syncs
  const settle = async(wrapper: any) => {
    await wrapper.vm.$nextTick();
    jest.runAllTimers();
    await wrapper.vm.$nextTick();
  };

  beforeEach(() => {
    // The cross-pane sync is debounced, so drive it with fake timers. Animation
    // frames stay real, so CodeMirror doesn't measure its layout, which jsdom can't do.
    jest.useFakeTimers({ doNotFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders a chart-defaults pane and an overrides pane', () => {
    const wrapper = mountEditor({ testidPrefix: 'chart-values' });

    expect(wrapper.find('[data-testid="chart-values-defaults-pane"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chart-values-overrides-pane"]').exists()).toBe(true);
  });

  it('shows the supplied labels and hints', () => {
    const wrapper = mountEditor({
      chartDefaultsLabel: 'Chart defaults',
      chartDefaultsHint:  'Every setting the chart ships with',
      overridesLabel:     'Your overrides',
      overridesHint:      'Only the values that differ',
    });

    expect(wrapper.text()).toContain('Chart defaults');
    expect(wrapper.text()).toContain('Every setting the chart ships with');
    expect(wrapper.text()).toContain('Your overrides');
    expect(wrapper.text()).toContain('Only the values that differ');
  });

  describe('editing the overrides (right) pane', () => {
    it('emits update:value with the edited overrides', () => {
      const wrapper = mountEditor();

      editors(wrapper).right.$emit('update:value', 'replicas: 9\n');

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 9\n']]);
    });

    it('pushes the merged final document into the chart-defaults editor', async() => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const overrides = 'replicas: 9\nsachet:\n  enabled: false\n';

      editors(wrapper).right.$emit('update:value', overrides);
      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, overrides));
    });

    it('debounces the sync so rapid edits push only once', async() => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');

      right.$emit('update:value', 'replicas: 6\n');
      right.$emit('update:value', 'replicas: 7\n');
      right.$emit('update:value', 'replicas: 8\n');

      expect(leftUpdate).not.toHaveBeenCalled();

      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      expect(leftUpdate).toHaveBeenCalledTimes(1);
      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 8\n'));
    });

    it('does not take the text pushed into the chart-defaults editor as an edit', async() => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);

      right.$emit('update:value', 'replicas: 9\n');
      await settle(wrapper);

      expect(docOf(left)).toStrictEqual(mergeOverridesRawText(defaults, 'replicas: 9\n'));
      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 9\n']]);
    });
  });

  describe('editing the chart-defaults (left) pane', () => {
    it('derives the overrides from the edited full document and emits them', async() => {
      const wrapper = mountEditor({ value: '' });
      // The user changes a shipped default (replicas 2 -> 5) in the full document.
      const edited = 'replicas: 5\nsachet:\n  enabled: true\n';

      editors(wrapper).left.$emit('update:value', edited);
      await settle(wrapper);

      const expected = overridesFromValues(defaults, { replicas: 5, sachet: { enabled: true } });

      expect(wrapper.emitted('update:value')).toStrictEqual([[expected]]);
    });

    it('waits for the user to stop typing before deriving the overrides', async() => {
      const wrapper = mountEditor({ value: '' });
      const { left } = editors(wrapper);

      left.$emit('update:value', 'replicas: 3\n');
      left.$emit('update:value', 'replicas: 4\n');

      expect(wrapper.emitted('update:value')).toBeUndefined();

      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 4\n']]);
    });

    it('does not emit when an edit keeps the same overrides', async() => {
      const wrapper = mountEditor();

      // A comment changes the text, but not the values
      editors(wrapper).left.$emit('update:value', `# note\n${ mergeOverridesRawText(defaults, 'replicas: 5\n') }`);
      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('emits a waiting edit when it is unmounted', () => {
      const wrapper = mountEditor({ value: '' });

      editors(wrapper).left.$emit('update:value', 'replicas: 5\n');
      wrapper.unmount();

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 5\n']]);
    });

    it('pushes the derived overrides into the overrides editor', async() => {
      const wrapper = mountEditor({ value: '' });
      const { right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');
      const edited = 'replicas: 5\nsachet:\n  enabled: true\n';

      editors(wrapper).left.$emit('update:value', edited);
      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      const expected = overridesFromValues(defaults, { replicas: 5, sachet: { enabled: true } });

      expect(rightUpdate).toHaveBeenCalledWith(expected);
    });

    it('does not take the text pushed into the overrides editor as an edit', async() => {
      const wrapper = mountEditor({ value: '' });
      const { left, right } = editors(wrapper);

      left.$emit('update:value', 'replicas: 5\nsachet:\n  enabled: true\n');
      await settle(wrapper);

      expect(docOf(right)).toStrictEqual('replicas: 5\n');
      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 5\n']]);
    });

    it('does not save a deleted default key as null', async() => {
      const wrapper = mountEditor({ value: '' });

      // The user deletes the whole `sachet` block and changes replicas
      editors(wrapper).left.$emit('update:value', 'replicas: 5\n');
      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 5\n']]);
    });

    it('does not emit while the edited YAML is mid-edit/invalid', async() => {
      const wrapper = mountEditor({ value: '' });

      editors(wrapper).left.$emit('update:value', 'replicas: 5\n  bad: :indent');
      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('does not derive overrides from a bare scalar', async() => {
      const wrapper = mountEditor({ value: '' });

      editors(wrapper).left.$emit('update:value', 'just a string');
      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });

  describe('leaving a pane before the sync runs', () => {
    it('emits a chart-defaults edit and updates the overrides editor as soon as focus leaves the pane', () => {
      const wrapper = mountEditor({ value: '' });
      const { left, right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');

      left.$emit('update:value', 'replicas: 5\nsachet:\n  enabled: true\n');
      // Focus leaves the chart-defaults pane (e.g. for the other pane or a button) before the debounce fires
      wrapper.find('[data-testid="values-defaults-pane"]').trigger('focusout');

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 5\n']]);
      expect(rightUpdate).toHaveBeenCalledWith('replicas: 5\n');
    });

    it('updates the chart-defaults editor as soon as focus leaves the overrides pane', () => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');

      right.$emit('update:value', 'replicas: 9\n');
      // Focus leaves the overrides pane before the debounce fires
      wrapper.find('[data-testid="values-overrides-pane"]').trigger('focusout');

      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 9\n'));
    });

    it('does not push into either editor when focus leaves with no pending edit', () => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const rightUpdate = jest.spyOn(right, 'updateValue');

      wrapper.find('[data-testid="values-defaults-pane"]').trigger('focusout');
      wrapper.find('[data-testid="values-overrides-pane"]').trigger('focusout');

      expect(leftUpdate).not.toHaveBeenCalled();
      expect(rightUpdate).not.toHaveBeenCalled();
    });
  });

  describe('redrawing the chart-defaults pane when focus leaves it', () => {
    // Type into the chart-defaults editor, which emits the new text like the real one
    const type = (editor: any, text: string) => editor.updateValue(text);
    const leaveDefaultsPane = (wrapper: any) => wrapper.find('[data-testid="values-defaults-pane"]').trigger('focusout');

    it('shows a deleted default again', () => {
      const wrapper = mountEditor({ value: '' });
      const { left } = editors(wrapper);

      type(left, 'replicas: 2\n');
      leaveDefaultsPane(wrapper);

      expect(docOf(left)).toStrictEqual(mergeOverridesRawText(defaults, ''));
    });

    it('keeps the overrides empty when a default is deleted', () => {
      const wrapper = mountEditor({ value: '' });

      type(editors(wrapper).left, 'replicas: 2\n');
      leaveDefaultsPane(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('keeps the user\'s change next to the deleted default it shows again', () => {
      const wrapper = mountEditor({ value: '' });
      const { left } = editors(wrapper);

      type(left, 'replicas: 7\n');
      leaveDefaultsPane(wrapper);

      expect(docOf(left)).toStrictEqual(mergeOverridesRawText(defaults, 'replicas: 7\n'));
    });

    it('tints the changed line where it is after the redraw', () => {
      const wrapper = mountEditor({ value: '' });
      const { left } = editors(wrapper);

      // The deleted default comes back above the changed line, which moves it down
      type(left, 'sachet:\n  enabled: false\n');
      leaveDefaultsPane(wrapper);

      expect(tintedLines(left)).toStrictEqual(['  enabled: false']);
    });

    it.each([
      ['invalid YAML', 'replicas: 5\nsachet: ['],
      ['a value that is not a mapping', 'just text'],
    ])('keeps mid-edit text with %s', (_, text) => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);

      type(left, text);
      leaveDefaultsPane(wrapper);

      expect(docOf(left)).toStrictEqual(text);
    });
  });

  describe('line decorations', () => {
    it('tints a changed default line', () => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });

      expect(tintedLines(editors(wrapper).left)).toStrictEqual(['replicas: 5']);
    });

    it('tints a key that is not in the defaults', () => {
      const wrapper = mountEditor({ defaults: {}, value: 'foo: bar\n' });

      expect(tintedLines(editors(wrapper).left)).toStrictEqual(['foo: bar']);
    });

    it('tints the lines again after an overrides edit', async() => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);

      right.$emit('update:value', 'sachet:\n  enabled: false\n');
      await settle(wrapper);

      expect(tintedLines(left)).toStrictEqual(['  enabled: false']);
    });

    it('does not tint the lines of the overrides pane', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\nsachet:\n  enabled: false\n' });
      const { right } = editors(wrapper);

      right.$emit('update:value', 'replicas: 6\n');
      await settle(wrapper);

      expect(tintedLines(right)).toStrictEqual([]);
    });

    it('marks the overrides pane, so its whole editor is tinted', () => {
      const wrapper = mountEditor();

      expect(wrapper.find('[data-testid="values-overrides-pane"]').classes()).toContain('values-pane--overrides');
    });
  });

  describe('external prop changes', () => {
    it('reseeds both panes when the value prop changes from outside', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const rightUpdate = jest.spyOn(right, 'updateValue');

      await wrapper.setProps({ value: 'replicas: 7\n' });

      expect(rightUpdate).toHaveBeenCalledWith('replicas: 7\n');
      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 7\n'));
    });

    it('does not emit the value it was given back to the parent', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });

      await wrapper.setProps({ value: 'replicas: 7\n' });
      await settle(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('ignores a value prop change that matches the current overrides', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });
      const { right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');

      // Same content, only a trailing-whitespace difference - our own echo.
      await wrapper.setProps({ value: 'replicas: 5' });

      expect(rightUpdate).not.toHaveBeenCalled();
    });
  });

  describe('searching the chart defaults', () => {
    it('opens CodeMirror\'s search panel in the chart-defaults editor', () => {
      const wrapper = mountEditor();

      expect(searchPanelOpen(editors(wrapper).left.view.state)).toBe(true);
    });

    it('puts the search panel above the chart-defaults editor', () => {
      const wrapper = mountEditor();

      expect(wrapper.find('[data-testid="values-defaults-pane"] .values-pane__search .cm-search').exists()).toBe(true);
    });

    it('uses the search placeholder', () => {
      const wrapper = mountEditor({ searchPlaceholder: 'Search values...' });
      const field = wrapper.find('.cm-search [main-field]').element;

      expect(field.getAttribute('placeholder')).toStrictEqual('Search values...');
    });

    it('keeps the search panel open', () => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);

      closeSearchPanel(left.view);

      expect(searchPanelOpen(left.view.state)).toBe(true);
    });

    it('leaves the overrides editor\'s search panel closed', () => {
      const wrapper = mountEditor();

      expect(searchPanelOpen(editors(wrapper).right.view.state)).toBe(false);
    });
  });
});
