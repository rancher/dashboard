import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import { foldable, foldEffect, foldedRanges } from '@codemirror/language';
import { foldByLineMatch } from './extensions/fold';
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
      props, attrs, attachTo: document.body
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
    it('should center the expanded caret while leaving the collapsed caret in place', () => {
      mountEditor({ language: 'yaml', modelValue: 'metadata:\n  name: test\nkind: Pod' });
      const view = getView(wrapper);
      const open = wrapper.get('.cm-foldGutter span[title="Fold line"]');

      expect((open.element as HTMLElement).style.transform).toStrictEqual('translateY(-0.25em)');

      const range = foldable(view.state, 0, view.state.doc.line(1).to);

      expect(range).not.toBeNull();
      view.dispatch({ effects: foldEffect.of(range!) });

      const closed = wrapper.findAll('.cm-foldGutter span[title="Unfold line"]')
        .find((marker) => (marker.element.parentElement as HTMLElement).style.visibility !== 'hidden');

      expect((closed?.element as HTMLElement).style.transform).toStrictEqual('');
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

  describe('unmounting', () => {
    it('should destroy the EditorView', () => {
      mountEditor();
      const destroy = jest.spyOn(getView(wrapper), 'destroy');

      wrapper.unmount();

      expect(destroy).toHaveBeenCalledWith();
    });
  });
});
