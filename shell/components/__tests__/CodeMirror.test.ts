import { nextTick } from 'vue';
import { shallowMount, Wrapper } from '@vue/test-utils';
import CodeMirror from '@shell/components/CodeMirror.vue';
import { _EDIT, _YAML } from '@shell/config/query-params';

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
});
