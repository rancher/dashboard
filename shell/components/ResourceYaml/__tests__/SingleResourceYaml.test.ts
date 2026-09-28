import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import SingleResourceYaml from '@shell/components/ResourceYaml/SingleResourceYaml.vue';
import {
  _CREATE, _EDIT, _VIEW, _FLAGGED, _UNFLAG, PREVIEW
} from '@shell/config/query-params';
import { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';

const mockUpdateValue = jest.fn();

jest.mock('@shell/components/YamlEditor.vue', () => ({
  __esModule:   true,
  EDITOR_MODES: {
    EDIT_CODE: 'EDIT_CODE', VIEW_CODE: 'VIEW_CODE', DIFF_CODE: 'DIFF_CODE'
  },
  default: {
    name:     'YamlEditorStub',
    props:    ['value', 'mode', 'initialYamlValues', 'editorMode'],
    emits:    ['update:value', 'onReady'],
    methods:  { updateValue: (v: string) => mockUpdateValue(v), refresh: () => {} },
    template: '<div />',
  },
}));

jest.mock('@shell/components/form/Footer.vue', () => ({
  __esModule: true,
  default:    {
    name:     'FooterStub',
    props:    ['mode', 'errors'],
    emits:    ['save', 'done', 'close-error'],
    template: '<div class="footer-stub"><slot name="left" /><slot name="middle" /></div>',
  },
}));

jest.mock('@shell/components/form/FileSelector.vue', () => ({
  __esModule: true,
  default:    {
    name: 'FileSelectorStub', emits: ['selected'], template: '<div class="file-selector-stub" />'
  },
}));

// a codemirror instance, recording the fold mode that `foldAll` ran with
const makeCm = () => {
  const mode = { fold: 'indent' };
  const foldAllModes: string[] = [];

  return {
    foldAllModes,
    mode,
    foldLinesMatching: jest.fn(),
    foldYaml:          jest.fn(),
    getMode:           () => mode,
    execCommand:       jest.fn((cmd: string) => {
      if (cmd === 'foldAll') {
        foldAllModes.push(mode.fold);
      }
    }),
  };
};

describe('component: SingleResourceYaml', () => {
  let router: { applyQuery: jest.Mock, replace: jest.Mock };
  let value: any;

  beforeEach(() => {
    mockUpdateValue.mockClear();
    router = { applyQuery: jest.fn(), replace: jest.fn() };
    value = {
      type:        'pod',
      yamlForSave: jest.fn(() => undefined),
      saveYaml:    jest.fn(() => Promise.resolve()),
      cleanYaml:   jest.fn(() => 'cleaned: yaml\n'),
    };
  });

  const mountComponent = (props: any = {}, { query = {}, slots = {} } = {}) => mount(SingleResourceYaml, {
    props: {
      mode: _EDIT, value, yaml: 'current: yaml\n', ...props
    },
    slots,
    global: {
      mocks: {
        t:       (key: string) => key,
        $router: router,
        $route:  { query },
        $store:  { getters: { currentStore: () => 'cluster', 'cluster/schemaFor': () => ({}) } },
      },
    },
  });

  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const footer = (wrapper: any) => wrapper.findComponent({ name: 'FooterStub' });
  // the diff and continue buttons are the only buttons in the middle of the footer
  const middleButton = (wrapper: any) => wrapper.find('.footer-stub button');

  const edit = async(wrapper: any, yaml: string) => {
    editor(wrapper).vm.$emit('update:value', yaml);
    await nextTick();
  };

  describe('initial state', () => {
    it('should unflag the preview query param when created', () => {
      mountComponent();

      expect(router.applyQuery).toHaveBeenCalledWith({ [PREVIEW]: _UNFLAG });
    });

    it('should show `yaml` in the editor', () => {
      const wrapper = mountComponent();

      expect(editor(wrapper).props('value')).toBe('current: yaml\n');
    });

    it('should use `initialYamlForDiff` as the diff baseline when given, otherwise `yaml`', () => {
      expect(editor(mountComponent({ initialYamlForDiff: 'initial: yaml\n' })).props('initialYamlValues')).toBe('initial: yaml\n');
      expect(editor(mountComponent()).props('initialYamlValues')).toBe('current: yaml\n');
    });
  });

  describe('editor mode', () => {
    it('should use the view mode of the yaml editor in view mode', () => {
      const wrapper = mountComponent({ mode: _VIEW });

      expect(editor(wrapper).props('editorMode')).toBe('VIEW_CODE');
    });

    it('should use the view mode of the yaml editor when the route query mode is view', () => {
      const wrapper = mountComponent({ mode: _EDIT }, { query: { mode: _VIEW } });

      expect(editor(wrapper).props('editorMode')).toBe('VIEW_CODE');
    });

    it('should use the diff mode of the yaml editor while the preview is shown', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'changed: yaml\n');
      await middleButton(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('DIFF_CODE');
    });

    it.each([_EDIT, _CREATE])('should use the edit mode of the yaml editor in %s mode', (mode) => {
      const wrapper = mountComponent({ mode });

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });
  });

  describe('props', () => {
    it('should show the new `yaml` in the editor when it changes in view mode', async() => {
      const wrapper = mountComponent({ mode: _VIEW });

      await wrapper.setProps({ yaml: 'new: yaml\n' });

      expect(editor(wrapper).props('value')).toBe('new: yaml\n');
    });

    it('should keep the yaml in the editor when `yaml` changes in edit mode', async() => {
      const wrapper = mountComponent({ mode: _EDIT });

      await wrapper.setProps({ yaml: 'new: yaml\n' });

      expect(editor(wrapper).props('value')).toBe('current: yaml\n');
    });

    it('should clean the yaml with `cleanYaml` of the model when the mode changes from view to create', async() => {
      const wrapper = mountComponent({ mode: _VIEW });

      await wrapper.setProps({ mode: _CREATE });

      expect(value.cleanYaml).toHaveBeenCalledWith('current: yaml\n', _CREATE);
      expect(editor(wrapper).props('value')).toBe('cleaned: yaml\n');
    });
  });

  describe('folding', () => {
    const STATUS = /^status:\s*$/;
    const ANNOTATIONS = /^\s+annotations:\s*$/;

    it.each([
      [_EDIT, true],
      [_CREATE, false],
      [_VIEW, false],
    ])('should fold the status section in %s mode: %s', (mode, folded) => {
      const wrapper = mountComponent({ mode });
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldLinesMatching.mock.calls.some(([re]) => re.source === STATUS.source)).toBe(folded);
    });

    it('should fold the annotations when any annotation matches `ANNOTATIONS_TO_FOLD`', () => {
      const wrapper = mountComponent({ yaml: 'metadata:\n  annotations:\n    other: a\n    kubectl.kubernetes.io/last-applied-configuration: b\n' });
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldLinesMatching).toHaveBeenCalledWith(ANNOTATIONS);
    });

    it('should not fold the annotations when none matches `ANNOTATIONS_TO_FOLD`', () => {
      const wrapper = mountComponent({ yaml: 'metadata:\n  annotations:\n    other: a\n' });
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldLinesMatching.mock.calls.some(([re]) => re.source === ANNOTATIONS.source)).toBe(false);
    });

    it('should fold managedFields', () => {
      const wrapper = mountComponent();
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldLinesMatching).toHaveBeenCalledWith(/managedFields/);
    });

    it('should fold each path in `yamlFolding` of the model', () => {
      value.yamlFolding = ['spec.a', 'spec.b'];

      const wrapper = mountComponent();
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldYaml.mock.calls).toStrictEqual([['spec.a'], ['spec.b']]);
    });

    it('should fold all comments, then restore the fold mode of the editor', () => {
      const wrapper = mountComponent();
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      expect(cm.foldAllModes).toStrictEqual(['yamlcomments']);
      expect(cm.mode.fold).toBe('indent');
    });

    it('should fold only on the first `onReady` or `onInput`', () => {
      const wrapper = mountComponent();
      const cm = makeCm();

      wrapper.vm.onReady(cm);

      const calls = cm.foldLinesMatching.mock.calls.length;

      wrapper.vm.onInput('changed: yaml\n');
      wrapper.vm.onReady(cm);

      expect(cm.foldLinesMatching.mock.calls).toHaveLength(calls);
      expect(cm.execCommand).toHaveBeenCalledTimes(1);
    });

    it('should not throw when the yaml cannot be parsed', () => {
      const wrapper = mountComponent({ yaml: 'a: [\n' });
      const cm = makeCm();

      expect(() => wrapper.vm.onReady(cm)).not.toThrow();
      expect(cm.foldLinesMatching).toHaveBeenCalledWith(/managedFields/);
    });
  });

  describe('preview', () => {
    it('should disable the diff button while the yaml in the editor equals the initial yaml', async() => {
      const wrapper = mountComponent();

      expect(middleButton(wrapper).element.disabled).toBe(true);

      await edit(wrapper, 'changed: yaml\n');

      expect(middleButton(wrapper).element.disabled).toBe(false);
    });

    it('should show the diff and flag the preview query param on preview', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'changed: yaml\n');
      await middleButton(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('DIFF_CODE');
      expect(mockUpdateValue).toHaveBeenCalledWith('changed: yaml\n');
      expect(router.applyQuery).toHaveBeenLastCalledWith({ [PREVIEW]: _FLAGGED });
    });

    it('should hide the diff and unflag the preview query param on continue', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'changed: yaml\n');
      await middleButton(wrapper).trigger('click');
      await middleButton(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
      expect(router.applyQuery).toHaveBeenLastCalledWith({ [PREVIEW]: _UNFLAG });
    });

    it('should not offer the diff button when `offerPreview` is false', () => {
      const wrapper = mountComponent({ offerPreview: false });

      expect(middleButton(wrapper).exists()).toBe(false);
    });

    it('should show neither the file selector nor the diff button in view mode', () => {
      const wrapper = mountComponent({ mode: _VIEW });

      expect(wrapper.find('.file-selector-stub').exists()).toBe(false);
      expect(middleButton(wrapper).exists()).toBe(false);
    });
  });

  describe('save', () => {
    it('should save the yaml returned by `yamlForSave` of the model, falling back to the yaml in the editor', async() => {
      const wrapper = mountComponent();

      await wrapper.vm.save(jest.fn());

      expect(value.saveYaml).toHaveBeenLastCalledWith('current: yaml\n', 'current: yaml\n');

      value.yamlForSave.mockReturnValue('for: save\n');
      await wrapper.vm.save(jest.fn());

      expect(value.yamlForSave).toHaveBeenLastCalledWith('current: yaml\n');
      expect(value.saveYaml).toHaveBeenLastCalledWith('for: save\n', 'current: yaml\n');
    });

    it('should pass the initial yaml to `saveYaml` of the model', async() => {
      const wrapper = mountComponent({ initialYamlForDiff: 'initial: yaml\n' });

      await wrapper.vm.save(jest.fn());

      expect(value.saveYaml).toHaveBeenCalledWith('current: yaml\n', 'initial: yaml\n');
    });

    it('should run the before save hooks, then `saveYaml`, then the after save hooks when `applyHooks` is given', async() => {
      const order: string[] = [];
      const applyHooks = jest.fn((hooks: string) => {
        order.push(hooks);
      });

      value.saveYaml.mockImplementation(() => {
        order.push('saveYaml');
      });

      const wrapper = mountComponent({ applyHooks });

      await wrapper.vm.save(jest.fn());

      expect(order).toStrictEqual([BEFORE_SAVE_HOOKS, 'saveYaml', AFTER_SAVE_HOOKS]);
    });

    it('should call the button callback with true, then `done`, when the save resolves', async() => {
      const order: string[] = [];
      const buttonDone = jest.fn(() => order.push('buttonDone'));
      const doneOverride = jest.fn(() => order.push('done'));
      const wrapper = mountComponent({ doneOverride });

      await wrapper.vm.save(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(true);
      expect(order).toStrictEqual(['buttonDone', 'done']);
    });

    it('should show the `message` of the response body as the error when the save rejects with one', async() => {
      value.saveYaml.mockRejectedValue({ response: { data: { message: 'bad request' } } });

      const wrapper = mountComponent();

      await wrapper.vm.save(jest.fn());
      await nextTick();

      expect(footer(wrapper).props('errors')).toStrictEqual(['bad request']);
    });

    it('should show the error itself when it has no response body message', async() => {
      const err = new Error('save failed');

      value.saveYaml.mockRejectedValue(err);

      const wrapper = mountComponent();

      await wrapper.vm.save(jest.fn());
      await nextTick();

      expect(footer(wrapper).props('errors')).toStrictEqual([err]);
    });

    it('should call the button callback with false and emit `error` when `saveYaml` rejects', async() => {
      const err = new Error('save failed');
      const buttonDone = jest.fn();

      value.saveYaml.mockRejectedValue(err);

      const wrapper = mountComponent();

      await wrapper.vm.save(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect(wrapper.emitted('error')).toStrictEqual([[[err]]]);
    });

    it('should call the button callback with false and emit `error` when a save hook rejects', async() => {
      const err = new Error('hook failed');
      const buttonDone = jest.fn();
      const applyHooks = jest.fn(() => Promise.reject(err));
      const wrapper = mountComponent({ applyHooks });

      await wrapper.vm.save(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect(wrapper.emitted('error')).toStrictEqual([[[err]]]);
      expect(value.saveYaml).not.toHaveBeenCalled();
    });

    it('should not run the after save hooks when `saveYaml` rejects', async() => {
      const applyHooks = jest.fn();

      value.saveYaml.mockRejectedValue(new Error('save failed'));

      const wrapper = mountComponent({ applyHooks });

      await wrapper.vm.save(jest.fn());

      expect(applyHooks).toHaveBeenCalledTimes(1);
      expect(applyHooks).toHaveBeenCalledWith(BEFORE_SAVE_HOOKS);
    });
  });

  describe('done', () => {
    it('should call `doneOverride` when it is a function', () => {
      const doneOverride = jest.fn();
      const wrapper = mountComponent({ doneOverride, doneRoute: 'ignored' });

      footer(wrapper).vm.$emit('done');

      expect(doneOverride).toHaveBeenCalledWith();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should replace the route with `doneOverride` when it is an object', () => {
      const doneOverride = { name: 'override' };
      const wrapper = mountComponent({ doneOverride });

      footer(wrapper).vm.$emit('done');

      expect(router.replace).toHaveBeenCalledWith(doneOverride);
    });

    it('should replace the route with `doneRoute` when it is an object', () => {
      const doneRoute = { name: 'done-route', params: { a: 'b' } };
      const wrapper = mountComponent({ doneRoute });

      footer(wrapper).vm.$emit('done');

      expect(router.replace).toHaveBeenCalledWith(doneRoute);
    });

    it('should replace the route with the route named `doneRoute`, with the resource type as a param, when it is a string', () => {
      const wrapper = mountComponent({ doneRoute: 'done-route' });

      footer(wrapper).vm.$emit('done');

      expect(router.replace).toHaveBeenCalledWith({ name: 'done-route', params: { resource: 'pod' } });
    });

    it('should not navigate without `doneRoute` or `doneOverride`', () => {
      const wrapper = mountComponent();

      footer(wrapper).vm.$emit('done');

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('footer', () => {
    it('should not show the footer when `showFooter` is false', () => {
      const wrapper = mountComponent({ showFooter: false });

      expect(footer(wrapper).exists()).toBe(false);
    });

    it('should pass no errors to the footer when `showErrors` is false', async() => {
      value.saveYaml.mockRejectedValue(new Error('save failed'));

      const wrapper = mountComponent({ showErrors: false });

      await wrapper.vm.save(jest.fn());
      await nextTick();

      expect(footer(wrapper).props('errors')).toStrictEqual([]);
    });

    it('should remove an error when the footer emits `close-error`', async() => {
      const wrapper = mountComponent();

      (wrapper.vm as any).errors = ['a', 'b', 'c'];
      await nextTick();
      footer(wrapper).vm.$emit('close-error', 1);
      await nextTick();

      expect(footer(wrapper).props('errors')).toStrictEqual(['a', 'c']);
    });

    it('should show the content of a selected file in the editor', () => {
      const wrapper = mountComponent();

      wrapper.findComponent({ name: 'FileSelectorStub' }).vm.$emit('selected', 'from: file\n');

      expect(mockUpdateValue).toHaveBeenCalledWith('from: file\n');
    });

    it('should render the `yamlFooter` slot in place of the footer, with the yaml, the preview state and the actions as slot props', async() => {
      let slotProps: any;
      const wrapper = mountComponent({}, {
        slots: {
          yamlFooter: (props: any) => {
            slotProps = props;

            return 'custom footer';
          }
        }
      });

      await flushPromises();

      expect(footer(wrapper).exists()).toBe(false);
      expect(wrapper.text()).toContain('custom footer');
      expect(slotProps.currentYaml).toBe('current: yaml\n');
      expect(slotProps.showPreview).toBe(false);
      expect(slotProps.canDiff).toBe(false);
      expect(slotProps.yamlPreview).toBe(wrapper.vm.preview);
      expect(slotProps.yamlSave).toBe(wrapper.vm.save);
      expect(slotProps.yamlUnpreview).toBe(wrapper.vm.unpreview);
    });
  });
});
