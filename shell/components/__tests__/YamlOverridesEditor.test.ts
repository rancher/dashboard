import { defineComponent, markRaw } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import { getSearchQuery } from '@codemirror/search';
import YamlOverridesEditor from '@shell/components/YamlOverridesEditor.vue';
import { mergeOverridesRawText, overridesFromValues } from '@shell/utils/chart-values';

describe('component: YamlOverridesEditor', () => {
  // Stub YamlEditor with a real CodeMirror view, so the search and the tint run for
  // real. Like YamlEditor, it doesn't react to its `value` prop after mount: text is
  // pushed in with `updateValue`, and every change is emitted as update:value. The
  // view isn't attached to the page, since jsdom can't measure it.
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
        extensions: [EditorView.updateListener.of((update) => {
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
  const searchMarks = (editor: any) => textsOf(editor, '.cm-searchMatch');
  const selectedText = (editor: any) => {
    const { from, to } = editor.view.state.selection.main;

    return editor.view.state.sliceDoc(from, to);
  };

  // Let the watchers run, then the debounced syncs and search
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
    // With the default props the chart-defaults pane holds
    // "replicas: 5\nsachet:\n  enabled: true\n".
    const searchInput = (wrapper: any) => wrapper.find('[data-testid="values-defaults-search"]');
    const countLabel = (wrapper: any) => wrapper.find('[data-testid="values-defaults-search-count"]');
    const clearButton = (wrapper: any) => wrapper.find('[data-testid="values-defaults-search-clear"]');
    const nextButton = (wrapper: any) => wrapper.find('[data-testid="values-defaults-search-next"]');
    const previousButton = (wrapper: any) => wrapper.find('[data-testid="values-defaults-search-previous"]');
    const searchIcon = (wrapper: any) => wrapper.find('.values-search__icon');

    const search = async(wrapper: any, query: string) => {
      await searchInput(wrapper).setValue(query);
      jest.runAllTimers();
      await wrapper.vm.$nextTick();
    };

    // A document with three matches of "replicas"
    const THREE_MATCHES = 'replicas: 5\nreplicasA: 1\nreplicasB: 1\n';
    const queryOf = (editor: any) => getSearchQuery(editor.view.state).search;

    it('does not search before the third character', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'en');

      expect(queryOf(editors(wrapper).left)).toStrictEqual('');
      expect(countLabel(wrapper).text()).toStrictEqual('');
    });

    it('waits for the user to stop typing before searching', async() => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);

      await searchInput(wrapper).setValue('ena');
      await searchInput(wrapper).setValue('enab');

      expect(queryOf(left)).toStrictEqual('');

      jest.runAllTimers();

      expect(queryOf(left)).toStrictEqual('enab');
    });

    it('highlights the matches in the chart-defaults editor, ignoring case', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'ENAbled');

      expect(searchMarks(editors(wrapper).left)).toStrictEqual(['enabled']);
    });

    it('counts every match', async() => {
      const wrapper = mountEditor({ value: THREE_MATCHES });

      await search(wrapper, 'replicas');

      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.position {"current":1,"total":3}');
    });

    it('ignores spaces around the query', async() => {
      const wrapper = mountEditor();

      await search(wrapper, '  sachet  ');

      expect(queryOf(editors(wrapper).left)).toStrictEqual('sachet');
    });

    it('shows the search icon and no clear button before anything is typed', () => {
      const wrapper = mountEditor();

      expect(searchIcon(wrapper).exists()).toBe(true);
      expect(clearButton(wrapper).exists()).toBe(false);
    });

    it.each([
      ['a short query', 'en'],
      ['a query with matches', 'sachet'],
      ['a query with no matches', 'nothing-here'],
    ])('swaps the search icon for a clear button after typing %s', async(_, query) => {
      const wrapper = mountEditor();

      await search(wrapper, query);

      expect(clearButton(wrapper).exists()).toBe(true);
      expect(searchIcon(wrapper).exists()).toBe(false);
    });

    it('shows the search icon again after the search is cleared', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'sachet');
      await clearButton(wrapper).trigger('click');

      expect(searchIcon(wrapper).exists()).toBe(true);
    });

    it.each([
      ['next', nextButton],
      ['previous', previousButton],
    ])('shows the %p button when there are matches', async(_, button) => {
      const wrapper = mountEditor();

      await search(wrapper, 'sachet');

      expect(button(wrapper).exists()).toBe(true);
    });

    it.each([
      ['next', nextButton],
      ['previous', previousButton],
    ])('hides the %p button when nothing matches', async(_, button) => {
      const wrapper = mountEditor();

      await search(wrapper, 'nothing-here');

      expect(button(wrapper).exists()).toBe(false);
    });

    it('selects the first match of a new query', async() => {
      const wrapper = mountEditor({ value: THREE_MATCHES });
      const { left } = editors(wrapper);

      await search(wrapper, 'replicas');

      expect(left.view.state.selection.main.from).toStrictEqual(0);
      expect(selectedText(left)).toStrictEqual('replicas');
    });

    it('shows the position of the selected match', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'sachet');

      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.position {"current":1,"total":1}');
    });

    it.each([
      ['next', nextButton, 2],
      ['previous', previousButton, 3],
    ])('selects the %p match when its button is clicked', async(_, button, current) => {
      const wrapper = mountEditor({ value: THREE_MATCHES });

      await search(wrapper, 'replicas');
      await button(wrapper).trigger('click');

      expect(countLabel(wrapper).text()).toStrictEqual(`yamlOverridesEditor.search.position {"current":${ current },"total":3}`);
    });

    it.each([
      ['next', {}, 2],
      ['previous', { shiftKey: true }, 3],
    ])('selects the %p match when Enter is pressed with %p', async(_, modifiers, current) => {
      const wrapper = mountEditor({ value: THREE_MATCHES });

      await search(wrapper, 'replicas');
      await searchInput(wrapper).trigger('keydown', { key: 'Enter', ...modifiers });

      expect(countLabel(wrapper).text()).toStrictEqual(`yamlOverridesEditor.search.position {"current":${ current },"total":3}`);
    });

    it('runs a waiting search on Enter instead of moving past its first match', async() => {
      const wrapper = mountEditor({ value: THREE_MATCHES });

      await searchInput(wrapper).setValue('replicas');
      await searchInput(wrapper).trigger('keydown', { key: 'Enter' });

      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.position {"current":1,"total":3}');
    });

    it('keeps the selection when the chart-defaults document is edited', async() => {
      const wrapper = mountEditor({ value: THREE_MATCHES });
      const { left } = editors(wrapper);

      await search(wrapper, 'replicas');
      await nextButton(wrapper).trigger('click');
      left.view.dispatch({ changes: { from: left.view.state.doc.length, insert: 'other: replicas\n' } });
      await settle(wrapper);

      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.position {"current":2,"total":4}');
    });

    it('shows no matches and no highlight when nothing matches', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'nothing-here');

      expect(searchMarks(editors(wrapper).left)).toStrictEqual([]);
      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.matches {"count":0}');
    });

    it('clears the search when the clear button is clicked', async() => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);

      await search(wrapper, 'sachet');
      await clearButton(wrapper).trigger('click');

      expect((searchInput(wrapper).element as HTMLInputElement).value).toStrictEqual('');
      expect(searchMarks(left)).toStrictEqual([]);
      expect(countLabel(wrapper).text()).toStrictEqual('');
    });

    it('clears the search when Escape is pressed', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'sachet');
      await searchInput(wrapper).trigger('keydown', { key: 'Escape' });

      expect((searchInput(wrapper).element as HTMLInputElement).value).toStrictEqual('');
      expect(searchMarks(editors(wrapper).left)).toStrictEqual([]);
    });

    it('clears the highlight right away when the query gets too short', async() => {
      const wrapper = mountEditor();

      await search(wrapper, 'sachet');
      await searchInput(wrapper).setValue('sa');

      expect(searchMarks(editors(wrapper).left)).toStrictEqual([]);
    });

    it('recounts the matches when the chart-defaults document changes', async() => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);

      await search(wrapper, 'sachet');
      right.$emit('update:value', 'replicas: 5\nsachetExtra: 1\n');
      await settle(wrapper);
      await settle(wrapper);

      expect(searchMarks(left)).toStrictEqual(['sachet', 'sachet']);
      expect(countLabel(wrapper).text()).toStrictEqual('yamlOverridesEditor.search.matches {"count":2}');
    });
  });
});
