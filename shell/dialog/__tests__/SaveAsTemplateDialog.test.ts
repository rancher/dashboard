import { mount, flushPromises } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import SaveAsTemplateDialog from '@shell/dialog/SaveAsTemplateDialog.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import AsyncButton from '@shell/components/AsyncButton';
import YamlEditor from '@shell/components/YamlEditor';
import ResourceTemplateUtils from '@shell/utils/resource-template';
import { CATTLE_UI_RESOURCE_TEMPLATE } from '@shell/config/labels-annotations';
import { CONFIG_MAP, NAMESPACE } from '@shell/config/types';
import { _CLONE } from '@shell/config/query-params';

jest.mock('@shell/components/YamlEditor', () => {
  const EDITOR_MODES = {
    EDIT_CODE: 'EDIT_CODE', VIEW_CODE: 'VIEW_CODE', DIFF_CODE: 'DIFF_CODE'
  };
  const YamlEditorStub = {
    name:     'YamlEditor',
    template: '<div class="yaml-editor-stub" />',
    props:    ['value', 'mode', 'editorMode'],
    methods:  { updateValue: jest.fn() },
  };

  return {
    __esModule: true, default: YamlEditorStub, EDITOR_MODES
  };
});

const mockDispatch = jest.fn();
const mockGetters = { currentStore: jest.fn().mockReturnValue('cluster') };

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({ dispatch: mockDispatch, getters: mockGetters }),
}));

describe('component: SaveAsTemplateDialog', () => {
  const mockNamespaces = [
    { name: 'zeta' },
    { name: 'default' },
    { name: 'alpha' },
  ];

  const createMockResource = (overrides = {}) => ({
    type:             'apps.deployment',
    metadata:         { namespace: 'my-ns' },
    followLink:       jest.fn().mockResolvedValue({ data: 'kind: Deployment' }),
    cleanForDownload: jest.fn().mockResolvedValue('kind: Deployment\nmetadata:\n  name: test'),
    ...overrides,
  });

  const createMockClone = (cleanYamlReturn = 'kind: Deployment\nmetadata:\n  name: \'\'') => ({
    cleanForNew: jest.fn(),
    cleanYaml:   jest.fn().mockReturnValue(cleanYamlReturn),
  });

  const createMockConfigMap = () => ({
    setLabel: jest.fn(),
    save:     jest.fn().mockResolvedValue({}),
  });

  // Routes dispatch calls by action name, with sensible defaults for findAll/clone so
  // every test doesn't need to stub the full onMounted dependency chain itself.
  const routeDispatch = (overrides: Record<string, (payload?: any) => any> = {}, clone = createMockClone()) => {
    mockDispatch.mockImplementation((action: string, payload?: any) => {
      if (overrides[action]) {
        return Promise.resolve(overrides[action](payload));
      }
      if (action === 'cluster/findAll') {
        return Promise.resolve(mockNamespaces);
      }
      if (action === 'cluster/clone') {
        return Promise.resolve(clone);
      }

      return Promise.resolve();
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mountComponent = async(resources = [createMockResource()]) => {
    const wrapper = mount(SaveAsTemplateDialog, {
      props:  { resources },
      global: {
        mocks: {
          // Options API children (AsyncButton, LabeledSelect, etc.) read `this.$store`
          // directly - separate from this component's own useStore() mock above.
          $store: {
            getters: { 'i18n/t': jest.fn(), 'i18n/exists': jest.fn() }, dispatch: jest.fn(), commit: jest.fn()
          },
        },
      },
    });

    await flushPromises();

    return wrapper;
  };

  describe('on mount', () => {
    it('should fetch namespaces, clone+clean the resource, and run the raw yaml through cleanYaml', async() => {
      const resource = createMockResource();
      const clone = createMockClone('kind: Deployment\nmetadata:\n  name: \'\'');

      routeDispatch({}, clone);

      await mountComponent([resource]);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } });
      expect(resource.followLink).toHaveBeenCalledWith('view', { headers: { accept: 'application/yaml' } });
      expect(resource.cleanForDownload).toHaveBeenCalledWith('kind: Deployment');
      expect(mockDispatch).toHaveBeenCalledWith('cluster/clone', { resource });
      expect(clone.cleanForNew).toHaveBeenCalledWith();
      expect(clone.cleanYaml).toHaveBeenCalledWith('kind: Deployment\nmetadata:\n  name: test', _CLONE);
    });

    it('should not mutate the live resource passed in', async() => {
      const resource = createMockResource();

      await mountComponent([resource]);

      expect((resource as any).cleanForNew).toBeUndefined();
    });

    it('should render the dialog title', async() => {
      const wrapper = await mountComponent();

      expect(wrapper.find('h4').text()).toContain('saveAsTemplateModal.title');
    });

    it('should push the cleaned yaml into the editor, since YamlEditor does not react to value prop changes on its own', async() => {
      const clone = createMockClone('kind: Deployment\nmetadata:\n  name: \'\'');

      routeDispatch({}, clone);

      await mountComponent();

      expect((YamlEditor as any).methods.updateValue).toHaveBeenCalledWith('kind: Deployment\nmetadata:\n  name: \'\'');
    });

    it('should default the namespace select to the resource namespace and offer sorted options', async() => {
      const wrapper = await mountComponent([createMockResource({ metadata: { namespace: 'my-ns' } })]);

      const select = wrapper.findComponent(LabeledSelect);

      expect(select.props('value')).toBe('my-ns');
      expect(select.props('options')).toStrictEqual([
        { label: 'alpha', value: 'alpha' },
        { label: 'default', value: 'default' },
        { label: 'zeta', value: 'zeta' },
      ]);
    });

    it('should default to "default" namespace when the resource has no namespace and "default" is accessible', async() => {
      const wrapper = await mountComponent([createMockResource({ metadata: {} })]);

      expect(wrapper.findComponent(LabeledSelect).props('value')).toBe('default');
    });
  });

  describe('save', () => {
    it('should create a labeled ConfigMap from the current name/namespace/yaml and close', async() => {
      const cm = createMockConfigMap();
      const clone = createMockClone('kind: Deployment\nmetadata:\n  name: \'\'');

      routeDispatch({ 'cluster/create': () => cm }, clone);

      const wrapper = await mountComponent();

      await wrapper.findComponent(LabeledInput).vm.$emit('update:value', 'my-template');
      await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'default');

      const buttonDone = jest.fn();

      await wrapper.findComponent(AsyncButton).vm.$emit('click', buttonDone);
      await flushPromises();

      expect(mockDispatch).toHaveBeenCalledWith('cluster/create', {
        type:     CONFIG_MAP,
        metadata: { name: 'my-template', namespace: 'default' },
        data:     { [ResourceTemplateUtils.dataKey]: 'kind: Deployment\nmetadata:\n  name: \'\'' },
      });
      expect(cm.setLabel).toHaveBeenCalledWith(CATTLE_UI_RESOURCE_TEMPLATE, 'apps.deployment');
      expect(cm.save).toHaveBeenCalledWith();
      expect(buttonDone).toHaveBeenCalledWith(true);
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should surface errors and not close when the create call fails', async() => {
      routeDispatch({ 'cluster/create': () => Promise.reject(new Error('nope')) });

      const wrapper = await mountComponent();

      await wrapper.findComponent(LabeledInput).vm.$emit('update:value', 'my-template');
      await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'default');

      const buttonDone = jest.fn();

      await wrapper.findComponent(AsyncButton).vm.$emit('click', buttonDone);
      await flushPromises();

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect(wrapper.emitted('close')).toBeFalsy();
      expect(wrapper.findComponent(Banner).exists()).toBe(true);
    });
  });

  describe('close', () => {
    it('should emit close when Cancel is clicked', async() => {
      const wrapper = await mountComponent();

      await wrapper.findComponent(RcButton).trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
