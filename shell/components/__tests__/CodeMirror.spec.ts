import { shallowMount, Wrapper } from '@vue/test-utils';
import CodeMirror from '@shell/components/CodeMirror.vue';
import { _EDIT, _YAML } from '@shell/config/query-params';

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
  };

  describe('keyMap info', () => {
    (window as any).__codeMirrorLoader = () => new Promise((resolve) => {
      resolve(true);
    });

    wrapper = shallowMount(
      CodeMirror,
      mountOptions,
    );

    it(`should show keyMap preference`, async() => {
      await wrapper.vm.$nextTick();

      const keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');
      const closeIcon = keyMapBox.find('.icon');

      expect(keyMapBox.element.textContent).toContain('Vim');
      expect(closeIcon.element).toBeUndefined();
    });

    it(`should show keyMap close icon on mouse over`, async() => {
      await wrapper.vm.$nextTick();

      const keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      keyMapBox.trigger('mouseover');
      await wrapper.vm.$nextTick();

      const closeIcon = keyMapBox.find('.icon');

      expect(closeIcon.element).toBeDefined();
    });

    it(`should remove keyMap box`, async() => {
      await wrapper.vm.$nextTick();

      let keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      keyMapBox.trigger('mouseover');
      await wrapper.vm.$nextTick();

      const closeIcon = keyMapBox.find('.icon');

      closeIcon.element.click();
      await wrapper.vm.$nextTick();

      keyMapBox = wrapper.find('[data-testid="code-mirror-keymap"]');

      expect(keyMapBox.element).toBeUndefined();
    });
  });
});
