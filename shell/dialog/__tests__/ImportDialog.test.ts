import { shallowMount } from '@vue/test-utils';
import ImportDialog from '@shell/dialog/ImportDialog.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';

jest.mock('@shell/utils/error', () => ({ exceptionToErrorsArray: jest.fn(() => ['Import failed']) }));

const mockUpdateValue = jest.fn();
const mockExceptionToErrorsArray = exceptionToErrorsArray as jest.Mock;

const YamlEditorStub = {
  name:     'YamlEditor',
  template: '<div />',
  methods:  { updateValue: mockUpdateValue },
};

const RcModalStub = {
  name:     'RcModal',
  props:    ['show', 'size'],
  template: '<div><slot name="title" /><slot /><slot name="actions" /></div>',
};

const createWrapper = (options: {
  modal?: { show: boolean, onClose: jest.Mock },
  currentCluster?: { doAction: jest.Mock },
  props?: Record<string, unknown>,
} = {}) => {
  const modal = options.modal || { show: true, onClose: jest.fn() };
  const currentCluster = options.currentCluster || { doAction: jest.fn() };
  const wrapper = shallowMount(ImportDialog, {
    props: {
      modal,
      ...options.props,
    },
    global: {
      mocks: {
        $store: { getters: { currentCluster } },
        t:      (key: string) => key,
      },
      stubs: {
        RcModal:    RcModalStub,
        YamlEditor: YamlEditorStub,
      },
    },
  });

  return {
    wrapper, modal, currentCluster
  };
};

describe('component: ImportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExceptionToErrorsArray.mockReturnValue(['Import failed']);
  });

  it('should pass modal visibility and size to RcModal', () => {
    const { wrapper } = createWrapper();
    const modal = wrapper.findComponent(RcModalStub);

    expect(modal.props('show')).toStrictEqual(true);
    expect(modal.props('size')).toStrictEqual('large');
  });

  it('should derive the resource label and sort namespace options', () => {
    const { wrapper } = createWrapper({ props: { resourceName: 'Workloads' } });

    (wrapper.vm as any).allNamespaces = [{ name: 'zeta' }, { name: 'alpha' }];

    expect((wrapper.vm as any).resourceNameLabel).toStrictEqual('Workloads');
    expect((wrapper.vm as any).namespaceOptions).toStrictEqual([
      { label: 'alpha', value: 'alpha' },
      { label: 'zeta', value: 'zeta' },
    ]);
  });

  it('should update the YAML editor and clear existing errors when a file is selected', () => {
    const { wrapper } = createWrapper();

    (wrapper.vm as any).errors = ['Previous error'];
    (wrapper.vm as any).onFileSelected('kind: Pod');

    expect(mockUpdateValue).toHaveBeenCalledWith('kind: Pod');
    expect((wrapper.vm as any).errors).toBeNull();
  });

  it('should apply YAML in the selected namespace and show the results on success', async() => {
    const rows = [{ _key: 'pod-1' }];
    const currentCluster = { doAction: jest.fn().mockResolvedValue(rows) };
    const { wrapper } = createWrapper({ currentCluster });
    const buttonCallback = jest.fn();

    (wrapper.vm as any).currentYaml = 'kind: Pod';
    (wrapper.vm as any).selectedNamespace = 'team-a';
    await (wrapper.vm as any).importYaml(buttonCallback);

    expect(currentCluster.doAction).toHaveBeenCalledWith('apply', {
      yaml:             'kind: Pod',
      defaultNamespace: 'team-a',
    });
    expect(buttonCallback).toHaveBeenCalledWith(true);
    expect((wrapper.vm as any).rows).toStrictEqual(rows);
    expect((wrapper.vm as any).done).toBe(true);
  });

  it('should report errors and keep the result view closed when the import fails', async() => {
    const error = new Error('Import failed');
    const currentCluster = { doAction: jest.fn().mockRejectedValue(error) };
    const { wrapper } = createWrapper({ currentCluster });
    const buttonCallback = jest.fn();

    await (wrapper.vm as any).importYaml(buttonCallback);

    expect(mockExceptionToErrorsArray).toHaveBeenCalledWith(error);
    expect(buttonCallback).toHaveBeenCalledWith(false);
    expect((wrapper.vm as any).errors).toStrictEqual(['Import failed']);
    expect((wrapper.vm as any).done).toBe(false);
  });

  it('should close the modal when the close method is called', () => {
    const { wrapper, modal } = createWrapper();

    (wrapper.vm as any).close();

    expect(modal.onClose).toHaveBeenCalledWith();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should close after a link is clicked but not after other content is clicked', () => {
    const { wrapper, modal } = createWrapper();

    (wrapper.vm as any).rowClick({ target: { tagName: 'DIV' } });
    expect(modal.onClose).not.toHaveBeenCalled();

    (wrapper.vm as any).rowClick({ target: { tagName: 'A' } });
    expect(modal.onClose).toHaveBeenCalledWith();
  });

  it('should forward the YAML editor ready event', () => {
    const { wrapper } = createWrapper();
    const editor = { focus: jest.fn() };

    (wrapper.vm as any).onReadyYamlEditor(editor);

    expect(wrapper.emitted('onReadyYamlEditor')).toStrictEqual([[editor]]);
  });
});
