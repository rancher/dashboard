import { nextTick } from 'vue';
import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { LintSource } from '@codemirror/lint';
import jsyaml from 'js-yaml';
import { RcCodeMirror } from '@components/RcCodeMirror';
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

  describe('keymap indicator', () => {
    it.each([
      [true, true],
      [false, false],
    ])('should pass showKeyMapBox %p to RcCodeMirror keymapIndicator', (showKeyMapBox, keymapIndicator) => {
      wrapper = shallowMount(CodeMirror, { ...mountOptions, props: { ...mountOptions.props, showKeyMapBox } });

      expect(wrapper.findComponent(RcCodeMirror).props('keymapIndicator')).toStrictEqual(keymapIndicator);
    });

    it.each([
      ['Key mapping: $', '%codeMirror.keymap.indicatorToolip%'],
      ['Hide key mapping: $', '%codeMirror.keymap.hideIndicator%'],
      ['Vim', '%prefs.keymap.vim%'],
      ['Emacs', '%prefs.keymap.emacs%'],
    ])('should translate the RcCodeMirror phrase %p', (phrase, translation) => {
      wrapper = shallowMount(CodeMirror, mountOptions);
      const extensions = wrapper.findComponent(RcCodeMirror).props('extensions') as Extension[];

      expect(EditorState.create({ extensions }).phrase(phrase)).toStrictEqual(translation);
    });
  });

  describe('rcCodeMirror props', () => {
    const createWrapper = (props = {}, getters = {}) => shallowMount(CodeMirror, {
      ...mountOptions,
      props:  { ...mountOptions.props, ...props },
      global: {
        mocks: {
          ...mountOptions.global.mocks,
          $store: {
            getters: {
              ...mountOptions.global.mocks.$store.getters,
              'prefs/get':   () => 'sublime',
              'prefs/theme': 'light',
              ...getters
            }
          }
        }
      }
    });

    it.each([
      [undefined, 'yaml'],
      ['yaml', 'yaml'],
      ['json', 'json'],
      [{ name: 'javascript', json: true }, 'json'],
      [null, undefined],
      ['text/x-properties', undefined],
    ])('should map mode %p to language %p', (mode, language) => {
      const options = mode === undefined ? {} : { mode };
      const rc = createWrapper({ options }).findComponent(RcCodeMirror);

      expect(rc.props('language')).toStrictEqual(language);
    });

    it.each([
      ['sublime', 'default'],
      ['vim', 'vim'],
      ['emacs', 'emacs'],
    ])('should map keymap preference %p to keymap %p', (pref, keymap) => {
      const rc = createWrapper({}, { 'prefs/get': () => pref }).findComponent(RcCodeMirror);

      expect(rc.props('keymap')).toStrictEqual(keymap);
    });

    it.each([
      ['dark', 'rancher'],
      ['light', 'rancher'],
    ])('should use the Rancher theme with %p preference', (pref, theme) => {
      const rc = createWrapper({}, { 'prefs/theme': pref }).findComponent(RcCodeMirror);

      expect(rc.props('theme')).toStrictEqual(theme);
    });

    it.each([
      [_EDIT, {}, false],
      [_VIEW, {}, true],
      [_EDIT, { readOnly: true }, true],
    ])('should set read only for mode %p and options %p to %p', (mode, options, readOnly) => {
      const rc = createWrapper({ mode, options }).findComponent(RcCodeMirror);

      expect(rc.props('readOnly')).toStrictEqual(readOnly);
    });

    it.each([
      [true, 'input'],
      [false, 'editor'],
    ])('should map asTextArea %p to variant %p', (asTextArea, variant) => {
      const rc = createWrapper({ asTextArea }).findComponent(RcCodeMirror);

      expect(rc.props('variant')).toStrictEqual(variant);
    });

    it.each([
      ['Fold line', '%codeMirror.foldLine%'],
      ['Unfold line', '%codeMirror.unfoldLine%'],
      ['Press Escape, then Tab to leave the editor', '%codeMirror.escapeText%'],
    ])('should translate the RcCodeMirror phrase %p', (phrase, translation) => {
      const extensions = createWrapper().findComponent(RcCodeMirror).props('extensions') as Extension[];
      const state = EditorState.create({ extensions });

      expect(state.phrase(phrase)).toStrictEqual(translation);
    });

    it('should pass the screen reader label to the editor as its aria-label', () => {
      const rc = createWrapper({ options: { screenReaderLabel: 'Values' } }).findComponent(RcCodeMirror);

      expect(rc.attributes('aria-label')).toStrictEqual('Values');
    });

    it('should not render an escape hint of its own', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.escape-text').exists()).toStrictEqual(false);
    });

    it('should show line numbers and fold gutter by default', () => {
      const rc = createWrapper().findComponent(RcCodeMirror);

      expect(rc.props('lineNumbers')).toStrictEqual(true);
      expect(rc.props('foldGutter')).toStrictEqual(true);
    });

    it('should pass through additional extensions', () => {
      const extension = EditorView.lineWrapping;
      const rc = createWrapper({ extensions: [extension] }).findComponent(RcCodeMirror);

      expect(rc.props('extensions')).toContain(extension);
    });
  });

  describe('events', () => {
    const createWrapper = (props = {}) => shallowMount(CodeMirror, {
      ...mountOptions,
      props: { ...mountOptions.props, ...props },
    });

    it('should emit onInput when the editor content changes', () => {
      const wrapper = createWrapper();

      wrapper.findComponent(RcCodeMirror).vm.$emit('update:modelValue', 'foo: bar');

      expect(wrapper.emitted('onInput')).toStrictEqual([['foo: bar']]);
    });

    it('should emit onFocus with the focus state', () => {
      const wrapper = createWrapper();
      const rc = wrapper.findComponent(RcCodeMirror);

      rc.vm.$emit('focus');
      rc.vm.$emit('blur');

      expect(wrapper.emitted('onFocus')).toStrictEqual([[true], [false]]);
    });

    it('should emit onReady with the editor view', () => {
      const wrapper = createWrapper();
      const view = new EditorView({ doc: '' });

      wrapper.findComponent(RcCodeMirror).vm.$emit('ready', view);

      expect(wrapper.emitted('onReady')).toStrictEqual([[view]]);
    });
  });

  describe('yaml lint', () => {
    const createWrapper = (props = {}) => shallowMount(CodeMirror, {
      ...mountOptions,
      props: { ...mountOptions.props, ...props },
    });

    it('should emit valid when the editor is ready with valid yaml', () => {
      const wrapper = createWrapper({ value: 'foo: bar' });

      wrapper.findComponent(RcCodeMirror).vm.$emit('ready', new EditorView({ doc: 'foo: bar' }));

      expect(wrapper.emitted('validationChanged')).toStrictEqual([[true]]);
    });

    it('should emit invalid when the content becomes invalid yaml', async() => {
      const wrapper = createWrapper({ value: 'foo: bar' });

      wrapper.findComponent(RcCodeMirror).vm.$emit('update:modelValue', 'foo: [');
      await nextTick();

      expect(wrapper.emitted('validationChanged')).toStrictEqual([[false]]);
    });

    it('should emit valid when invalid content is corrected', async() => {
      const wrapper = createWrapper({ value: 'foo: [' });
      const rc = wrapper.findComponent(RcCodeMirror);

      rc.vm.$emit('update:modelValue', 'foo: [');
      await nextTick();
      rc.vm.$emit('update:modelValue', 'foo: []');
      await nextTick();

      expect(wrapper.emitted('validationChanged')).toStrictEqual([[false], [true]]);
    });

    it('should accept multiple yaml documents', async() => {
      const wrapper = createWrapper();

      wrapper.findComponent(RcCodeMirror).vm.$emit('update:modelValue', 'foo: bar\n---\nbaz: qux');
      await nextTick();

      expect(wrapper.emitted('validationChanged')).toBeUndefined();
    });

    it('should not lint when lint is disabled', async() => {
      const wrapper = createWrapper({ options: { lint: false } });

      wrapper.findComponent(RcCodeMirror).vm.$emit('update:modelValue', 'foo: [');
      await nextTick();

      expect(wrapper.emitted('validationChanged')).toBeUndefined();
    });
  });

  describe('yaml lint markers', () => {
    const createWrapper = (props = {}) => shallowMount(CodeMirror, {
      ...mountOptions,
      props: { ...mountOptions.props, ...props },
    });

    function lintSource(wrapper: ReturnType<typeof createWrapper>): LintSource {
      return wrapper.findComponent(RcCodeMirror).props('linter') as LintSource;
    }

    function lintDoc(doc: string, props = {}) {
      return lintSource(createWrapper(props))(new EditorView({ doc }));
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ['lint is disabled', { options: { ...options, lint: false } }],
      ['the editor is in view mode', { mode: _VIEW }],
      ['the editor is read only', { options: { ...options, readOnly: true } }],
      ['the content is json', { options: { ...options, mode: 'json' } }],
    ])('should not pass RcCodeMirror a linter when %s', (_case, props) => {
      expect(lintSource(createWrapper(props))).toBeUndefined();
    });

    it('should report no problems for valid yaml', () => {
      expect(lintDoc('foo: bar\n---\nbaz: qux')).toStrictEqual([]);
    });

    it.each([
      ['a: 1\nb:\n  - x\n c: 2', 15, 'bad indentation of a mapping entry (4:2)'],
      // js-yaml reports the end of the stream one past the end of the document
      ['foo: [', 6, 'unexpected end of the stream within a flow collection (2:1)'],
    ])('should mark where parsing %p failed', (doc, position, message) => {
      expect(lintDoc(doc)).toStrictEqual([{
        from: position, to: position, severity: 'error', message
      }]);
    });

    it('should reuse the parse from validating the same content', () => {
      const wrapper = createWrapper();
      const loadAll = jest.spyOn(jsyaml, 'loadAll');

      wrapper.findComponent(RcCodeMirror).vm.$emit('update:modelValue', 'foo: [');
      lintSource(wrapper)(new EditorView({ doc: 'foo: [' }));

      expect(loadAll).toHaveBeenCalledTimes(1);
    });

    it('should validate content the markers see first', () => {
      const wrapper = createWrapper();

      lintSource(wrapper)(new EditorView({ doc: 'foo: [' }));

      expect(wrapper.vm.hasLintErrors).toStrictEqual(true);
    });
  });

  describe('updateValue', () => {
    it('should replace the editor content', () => {
      const wrapper = shallowMount(CodeMirror, mountOptions);
      const view = new EditorView({ doc: 'foo: bar' });

      wrapper.findComponent(RcCodeMirror).vm.$emit('ready', view);
      (wrapper.vm as any).updateValue('baz: qux');

      expect(view.state.doc.toString()).toStrictEqual('baz: qux');
    });
  });
});
