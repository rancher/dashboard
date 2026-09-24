import { nextTick } from 'vue';
import { shallowMount, VueWrapper } from '@vue/test-utils';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
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

  // eslint-disable-next-line jest/no-disabled-tests
  describe('keyMap info', () => {
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

    it('should not bind Tab to indent when displayed as a text area', () => {
      const extensions = createWrapper({ asTextArea: true }).findComponent(RcCodeMirror).props('extensions') as Extension[];
      const editor = createWrapper({ asTextArea: false }).findComponent(RcCodeMirror).props('extensions') as Extension[];

      expect(extensions).toHaveLength(editor.length - 1);
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
