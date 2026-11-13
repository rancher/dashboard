import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import AsyncButton from '@shell/components/AsyncButton.vue';
import ImportDialog from '@shell/dialog/ImportDialog.vue';
import { announce } from '@shell/utils/aria-announce';
import { exceptionToErrorsArray } from '@shell/utils/error';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

jest.mock('@shell/utils/aria-announce', () => ({ announce: jest.fn() }));
jest.mock('@shell/utils/error', () => ({ exceptionToErrorsArray: jest.fn(() => ['Import failed']) }));

// The AsyncButton strings that exist for `mode="import"`
const STRINGS = ['asyncButton.import.action', 'asyncButton.import.waiting', 'asyncButton.import.success', 'asyncButton.default.error'];

const updateValue = jest.fn();

const YamlEditorStub = {
  name:     'YamlEditor',
  emits:    ['update:value', 'onReady'],
  template: '<div />',
  methods:  { updateValue },
};

const FileSelectorStub = {
  name:     'FileSelector',
  emits:    ['selected'],
  template: '<div />',
};

const LabeledSelectStub = {
  name:     'LabeledSelect',
  props:    ['value', 'options'],
  template: '<div />',
};

const SortableTableStub = {
  name:     'SortableTable',
  props:    ['rows'],
  emits:    ['rowClick'],
  template: '<div />',
};

interface Modal {
  show: boolean;
  onClose: jest.Mock;
}

const createWrapper = ({
  modal = { show: true, onClose: jest.fn() } as Modal,
  doAction = jest.fn(),
  namespaces = [] as { name: string }[],
  attrs = {},
  attachTo = undefined as HTMLElement | undefined,
  // The teleport stub remounts the slots on every render, which resets AsyncButton's phase
  stubTeleport = true,
} = {}) => mount(ImportDialog, {
  props:  { modal },
  attrs,
  attachTo,
  global: {
    mocks: {
      $store: {
        getters: {
          currentCluster: { doAction },
          'i18n/exists':  (key: string) => STRINGS.includes(key),
          'i18n/t':       (key: string) => `%${ key }%`,
        },
        dispatch: jest.fn().mockResolvedValue(namespaces),
      },
    },
    stubs: {
      teleport:      stubTeleport,
      YamlEditor:    YamlEditorStub,
      FileSelector:  FileSelectorStub,
      LabeledSelect: LabeledSelectStub,
      SortableTable: SortableTableStub,
    },
  },
});

type Wrapper = ReturnType<typeof createWrapper>;

const title = (wrapper: VueWrapper) => wrapper.find('[data-testid="rc-modal-title"]');
const importButton = (wrapper: VueWrapper) => wrapper.find('[data-testid="import-yaml-import-action"]');
const cancelButton = (wrapper: VueWrapper) => wrapper.find('[data-testid="rc-modal-cancel"]');
const closeButton = (wrapper: VueWrapper) => wrapper.find('[data-testid="import-yaml-close"]');
const onClose = (wrapper: Wrapper) => wrapper.props('modal').onClose;

const loadNamespaces = async(wrapper: Wrapper) => {
  await wrapper.vm.$options.fetch.call(wrapper.vm);
  await flushPromises();
};

const enterYaml = async(wrapper: VueWrapper, yaml = 'kind: Pod') => {
  await wrapper.findComponent(YamlEditorStub).vm.$emit('update:value', yaml);
};

describe('component: ImportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing until it is told to show', () => {
    const wrapper = createWrapper({ modal: { show: false, onClose: jest.fn() } });

    expect(title(wrapper).exists()).toBe(false);
  });

  it('should show the title and how to import several resources at once', () => {
    const wrapper = createWrapper();

    expect(title(wrapper).text()).toBe('%import.title%');
    expect(wrapper.find('[data-testid="banner-content"]').text()).toBe('%import.instructions%');
  });

  it('should name the namespace select with its visible label', () => {
    const wrapper = createWrapper();
    const labelId = wrapper.findComponent(LabeledSelectStub).attributes('aria-labelledby');

    expect(wrapper.find(`#${ labelId }`).text()).toBe('%import.namespace%');
  });

  it('should offer the namespaces sorted by name, starting on default', async() => {
    const wrapper = createWrapper({ namespaces: [{ name: 'zeta' }, { name: 'default' }, { name: 'alpha' }] });

    await loadNamespaces(wrapper);

    const select = wrapper.findComponent(LabeledSelectStub);

    expect(select.props('options')).toStrictEqual([
      { label: 'alpha', value: 'alpha' },
      { label: 'default', value: 'default' },
      { label: 'zeta', value: 'zeta' },
    ]);
    expect(select.props('value')).toBe('default');
  });

  it('should start on the first namespace when default is not available', async() => {
    const wrapper = createWrapper({ namespaces: [{ name: 'zeta' }, { name: 'alpha' }] });

    await loadNamespaces(wrapper);

    expect(wrapper.findComponent(LabeledSelectStub).props('value')).toBe('zeta');
  });

  it('should hold the import button until there is YAML to import', async() => {
    const wrapper = createWrapper();

    expect(importButton(wrapper).attributes('disabled')).toBeDefined();

    await enterYaml(wrapper);

    expect(importButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should load a selected file into the editor', async() => {
    const wrapper = createWrapper();

    await wrapper.findComponent(FileSelectorStub).vm.$emit('selected', 'kind: Pod');

    expect(updateValue).toHaveBeenCalledWith('kind: Pod');
  });

  it('should apply the YAML in the selected namespace and list what was applied', async() => {
    const rows = [{ _key: 'pod-1' }];
    const doAction = jest.fn().mockResolvedValue(rows);
    const wrapper = createWrapper({ doAction });

    await wrapper.findComponent(LabeledSelectStub).vm.$emit('update:value', 'team-a');
    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await flushPromises();

    expect(doAction).toHaveBeenCalledWith('apply', { yaml: 'kind: Pod', defaultNamespace: 'team-a' });
    expect(wrapper.find('[data-testid="import-yaml-success"]').text()).toBe('%import.success%');
    expect(wrapper.findComponent(SortableTableStub).props('rows')).toStrictEqual(rows);
  });

  it('should show the errors and stay on the form when the import fails', async() => {
    const error = new Error('Import failed');
    const doAction = jest.fn().mockRejectedValue(error);
    const wrapper = createWrapper({ doAction });

    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await flushPromises();

    expect(exceptionToErrorsArray).toHaveBeenCalledWith(error);
    expect(wrapper.find('[role="alert"]').text()).toBe('Import failed');
    expect(importButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should close when cancelled', async() => {
    const wrapper = createWrapper();

    await cancelButton(wrapper).trigger('click');

    expect(onClose(wrapper)).toHaveBeenCalledTimes(1);
  });

  // Closing mid-import would hide whether the resources were applied
  it('should stay open while the import is in flight', async() => {
    const doAction = jest.fn(() => new Promise(() => {}));
    const wrapper = createWrapper({ doAction });

    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await cancelButton(wrapper).trigger('click');

    expect(onClose(wrapper)).not.toHaveBeenCalled();
  });

  // A disabled button loses focus, and with it Esc
  it('should keep Import focusable and announce the import and its failure', async() => {
    let fail = (_err: Error) => {};
    const doAction = jest.fn(() => new Promise((_resolve, reject) => {
      fail = reject;
    }));
    const wrapper = createWrapper({
      doAction, stubTeleport: false, attachTo: document.body
    });
    const button = () => wrapper.findComponent(AsyncButton);

    await enterYaml(wrapper);
    await button().trigger('click');

    expect(button().attributes('aria-disabled')).toBe('true');
    expect(button().attributes('disabled')).toBeUndefined();
    expect(announce).toHaveBeenLastCalledWith('%asyncButton.import.waiting%');

    fail(new Error('Import failed'));
    await flushPromises();

    expect(button().attributes('aria-disabled')).toBe('false');
    expect(announce).toHaveBeenLastCalledWith('%asyncButton.default.error%');

    wrapper.unmount();
  });

  it('should announce a successful import before the results replace Import', async() => {
    const wrapper = createWrapper({
      doAction: jest.fn().mockResolvedValue([]), stubTeleport: false, attachTo: document.body
    });

    await enterYaml(wrapper);
    await wrapper.findComponent(AsyncButton).trigger('click');
    await flushPromises();

    expect(announce).toHaveBeenLastCalledWith('%asyncButton.import.success%');
    expect(wrapper.findComponent(SortableTableStub).exists()).toBe(true);

    wrapper.unmount();
  });

  it('should move focus to Close once the results replace Import', async() => {
    const wrapper = createWrapper({ doAction: jest.fn().mockResolvedValue([]), attachTo: document.body });

    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(closeButton(wrapper).element);

    wrapper.unmount();
  });

  it('should close from the results', async() => {
    const wrapper = createWrapper({ doAction: jest.fn().mockResolvedValue([]) });

    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await flushPromises();
    await closeButton(wrapper).trigger('click');

    expect(onClose(wrapper)).toHaveBeenCalledTimes(1);
  });

  it('should close when a link in the results is followed, but not on other clicks', async() => {
    const wrapper = createWrapper({ doAction: jest.fn().mockResolvedValue([]) });

    await enterYaml(wrapper);
    await importButton(wrapper).trigger('click');
    await flushPromises();

    const table = wrapper.findComponent(SortableTableStub);

    await table.vm.$emit('rowClick', { target: { tagName: 'DIV' } });
    expect(onClose(wrapper)).not.toHaveBeenCalled();

    await table.vm.$emit('rowClick', { target: { tagName: 'A' } });
    expect(onClose(wrapper)).toHaveBeenCalledTimes(1);
  });

  it('should pass on the editor once it is ready', async() => {
    const wrapper = createWrapper();
    const editor = { focus: jest.fn() };

    await wrapper.findComponent(YamlEditorStub).vm.$emit('onReady', editor);

    expect(wrapper.emitted('onReadyYamlEditor')).toStrictEqual([[editor]]);
  });

  it('should keep the props it was not given off the dialog element', () => {
    const wrapper = createWrapper({ attrs: { resources: [], cluster: {} } });
    const dialog = wrapper.find('[data-testid="import-yaml"]');

    expect(dialog.attributes('resources')).toBeUndefined();
    expect(dialog.attributes('cluster')).toBeUndefined();
  });
});
