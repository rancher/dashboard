import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import ImportDialog from '@shell/dialog/ImportDialog.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

jest.mock('@shell/utils/error', () => ({ exceptionToErrorsArray: jest.fn(() => ['Import failed']) }));

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

const SelectStub = {
  name:     'Select',
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
} = {}) => mount(ImportDialog, {
  props:  { modal },
  global: {
    mocks: {
      $store: {
        getters:  { currentCluster: { doAction } },
        dispatch: jest.fn().mockResolvedValue(namespaces),
      },
    },
    stubs: {
      teleport:      true,
      YamlEditor:    YamlEditorStub,
      FileSelector:  FileSelectorStub,
      Select:        SelectStub,
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
    const labelId = wrapper.findComponent(SelectStub).attributes('aria-labelledby');

    expect(wrapper.find(`#${ labelId }`).text()).toBe('%import.defaultNamespace.label%');
  });

  it('should offer the namespaces sorted by name, starting on default', async() => {
    const wrapper = createWrapper({ namespaces: [{ name: 'zeta' }, { name: 'default' }, { name: 'alpha' }] });

    await loadNamespaces(wrapper);

    const select = wrapper.findComponent(SelectStub);

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

    expect(wrapper.findComponent(SelectStub).props('value')).toBe('zeta');
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

    await wrapper.findComponent(SelectStub).vm.$emit('update:value', 'team-a');
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

    expect(importButton(wrapper).attributes('aria-busy')).toBe('true');
    expect(onClose(wrapper)).not.toHaveBeenCalled();
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
    const wrapper = mount(ImportDialog, {
      props:  { modal: { show: true, onClose: jest.fn() } },
      attrs:  { resources: [], cluster: {} },
      global: {
        stubs: {
          teleport: true, YamlEditor: YamlEditorStub, FileSelector: FileSelectorStub, Select: SelectStub
        },
      },
    });
    const dialog = wrapper.find('[data-testid="import-yaml"]');

    expect(dialog.attributes('resources')).toBeUndefined();
    expect(dialog.attributes('cluster')).toBeUndefined();
  });
});
