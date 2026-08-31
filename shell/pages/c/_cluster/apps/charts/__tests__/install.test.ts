
import { mount } from '@vue/test-utils';
import jsyaml from 'js-yaml';
import Install from '@shell/pages/c/_cluster/apps/charts/install.vue';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { diff } from '@shell/utils/object';
import { mergeOverrides } from '@shell/utils/chart-values';

const defaultStubs = {
  Loading:             true,
  Wizard:              true,
  Banner:              true,
  Checkbox:            true,
  LabeledInput:        true,
  LabeledSelect:       true,
  NameNsDescription:   true,
  Tabbed:              true,
  Questions:           true,
  YamlEditor:          true,
  ResourceCancelModal: true,
  UnitInput:           true,
  TypeDescription:     true,
  LazyImage:           true,
  ChartReadme:         true,
  ButtonGroup:         true,
  PrivateRegistry:     true,
};

const defaultGetters = {
  'catalog/inStore':         'cluster',
  'catalog/repo':            () => ({ metadata: { name: 'test-repo' } }),
  'features/get':            () => false,
  defaultNamespace:          'default',
  'i18n/withFallback':       (key: string) => key,
  'type-map/hasCustomChart': () => false,
  'cluster/all':             () => [],
  'cluster/byId':            () => null,
  'management/all':          () => [],
  'prefs/get':               () => {},
  'catalog/charts':          [],
  'wm/byId':                 () => null,
  'i18n/t':                  (key: string) => key,
};

const mountInstall = (options: {
  data?: () => Record<string, any>;
  getters?: Record<string, any>;
  mocks?: Record<string, any>;
  stubs?: Record<string, any>;
} = {}) => {
  const mockStore = {
    dispatch: jest.fn((action) => {
      if (action === 'cluster/create') {
        return Promise.resolve({ metadata: { namespace: '', name: '' } });
      }

      return Promise.resolve();
    }),
    getters: {
      ...defaultGetters,
      ...options.getters
    }
  };

  return mount(Install, {
    global: {
      mocks: {
        $store:      mockStore,
        $route:      { query: {} },
        $fetchState: { pending: false },
        t:           (key: string) => key,
        ...options.mocks
      },
      stubs: { ...defaultStubs, ...options.stubs }
    },
    data: options.data
  });
};

describe('page: Install', () => {
  it('should use version annotations for target namespace and name', async() => {
    const wrapper = mountInstall({
      data: () => ({
        version: {
          annotations: {
            [CATALOG_ANNOTATIONS.NAMESPACE]:    'custom-ns',
            [CATALOG_ANNOTATIONS.RELEASE_NAME]: 'custom-name',
          }
        },
        chart: {
          targetNamespace: 'wrong-ns',
          targetName:      'wrong-name',
          versions:        []
        },
        query:       { versionName: '1.0.0' },
        chartValues: { global: { imagePullSecrets: [] } },
        repo:        { spec: { clientSecret: { name: 'test-secret' } } }
      })
    });

    // Mock methods from mixins
    jest.spyOn((wrapper.vm as any), 'fetchChart').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'fetchAutoInstallInfo').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'getClusterRegistry').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'getGlobalRegistry').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'loadValuesComponent').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'updateStepOneReady').mockImplementation();

    // Trigger fetch
    await Install.fetch.call(wrapper.vm);

    expect(wrapper.vm.forceNamespace).toBe('custom-ns');
    expect(wrapper.vm.value.metadata.name).toBe('custom-name');
  });

  describe('cancel()', () => {
    it('should route to appLocation if chart is not defined and specific query flags are absent', () => {
      const mockReplace = jest.fn();
      const expectedLocation = { name: 'app-location' };

      const wrapper = mountInstall({
        data: () => ({
          existing: false,
          chart:    null,
        }),
        mocks: { $router: { replace: mockReplace } }
      });

      jest.spyOn((wrapper.vm as any), 'appLocation').mockReturnValue(expectedLocation);

      (wrapper.vm as any).cancel();

      expect(mockReplace).toHaveBeenCalledWith(expectedLocation);
    });
  });

  describe('showRegistryPullSecrets', () => {
    it('should return true when repo has defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: { defaultImagePullSecrets: [{ name: 'my-secret' }] } } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(true);
    });

    it('should return false when repo has no defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: {} } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(false);
    });

    it('should return false when defaultImagePullSecrets is empty', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: { defaultImagePullSecrets: [] } } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(false);
    });
  });

  describe('repoDefaultPullSecretNames', () => {
    it('should map defaultImagePullSecrets to names', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: [
                { name: 'secret-a' },
                { name: 'secret-b' }
              ]
            }
          }
        })
      });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual(['secret-a', 'secret-b']);
    });

    it('should filter out entries without a name', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: [
                { name: 'valid' },
                { name: '' },
                {}
              ]
            }
          }
        })
      });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual(['valid']);
    });

    it('should return empty array when no defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: {} } }) });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual([]);
    });
  });

  describe('existingValuesPullSecrets', () => {
    it('should return empty array on fresh install', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    false,
          chartValues: { global: { imagePullSecrets: ['secret-1', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });

    it('should return imagePullSecrets from chart values on upgrade', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: ['secret-1', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual(['secret-1', 'secret-2']);
    });

    it('should filter out falsy entries', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: ['secret-1', null, '', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual(['secret-1', 'secret-2']);
    });

    it('should return empty array when imagePullSecrets is not an array', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: 'not-an-array' } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });

    it('should return empty array when global has no imagePullSecrets', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: {} }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });
  });

  describe('addGlobalValuesTo', () => {
    it('should set imagePullSecrets when registryPullSecret is selected', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: { defaultImagePullSecrets: [{ name: 'default-secret' }] } },
          registryPullSecret:    'my-selected-secret',
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: {} };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toStrictEqual(['my-selected-secret']);
    });

    it('should delete imagePullSecrets when showRegistryPullSecrets is true but no pullSecret selected', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: { defaultImagePullSecrets: [{ name: 'default-secret' }] } },
          registryPullSecret:    null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: { imagePullSecrets: ['old-secret'] } };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toBeUndefined();
    });

    it('should not modify imagePullSecrets when showRegistryPullSecrets is false', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: {} },
          registryPullSecret:    null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: { imagePullSecrets: ['existing-secret'] } };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toStrictEqual(['existing-secret']);
    });
  });

  describe('YAML values editor (overrides only)', () => {
    const versionInfoValues = {
      image: {
        repository: 'my/repo', tag: '1.0.0', pullPolicy: 'IfNotPresent'
      },
      service: {
        port: 80, targetPort: 8086, type: 'ClusterIP'
      },
      persistence: { enabled: true, size: '8Gi' },
    };

    const mountWithYaml = (valuesYaml: string) => mountInstall({
      data: () => ({
        repo:             { spec: {} },
        currentCluster:   null,
        serverUrlSetting: { value: '' },
        versionInfo:      { values: versionInfoValues },
        chartValues:      {},
        valuesYaml,
      })
    });

    it('applyYamlToValues merges the edited overrides onto the chart defaults', () => {
      const wrapper = mountWithYaml('image:\n  pullSecrets:\n    - application-collection\n');

      wrapper.vm.applyYamlToValues();

      expect(wrapper.vm.chartValues).toStrictEqual({
        image: {
          repository: 'my/repo', tag: '1.0.0', pullPolicy: 'IfNotPresent', pullSecrets: ['application-collection']
        },
        service: {
          port: 80, targetPort: 8086, type: 'ClusterIP'
        },
        persistence: { enabled: true, size: '8Gi' },
      });
    });

    it('sends only the overrides with no null values for keys absent from the editor', () => {
      const wrapper = mountWithYaml('image:\n  pullSecrets:\n    - application-collection\n');

      wrapper.vm.applyYamlToValues();

      const sent = diff(versionInfoValues, wrapper.vm.chartValues);

      expect(sent).toStrictEqual({ image: { pullSecrets: ['application-collection'] } });
      // regression guard: removed keys must not be nulled out (the InfluxDB service.port: 0 bug)
      expect(JSON.stringify(sent)).not.toContain('null');
    });

    it('feeds the chart defaults to the overrides editor so it can compute the final values preview', async() => {
      const wrapper = mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          valuesYaml:       'image:\n  pullSecrets:\n    - application-collection\n',
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: {
            template: '<div/>', props: ['defaults'], methods: { updateOverrides() {} }
          },
        },
      });

      wrapper.vm.formYamlOption = 'YAML';
      await wrapper.vm.$nextTick();

      // The preview (defaults merged with overrides) is now computed inside
      // YamlOverridesEditor's smart mode - install.vue just supplies the defaults.
      expect(wrapper.findComponent({ ref: 'valuesEditor' }).props('defaults')).toStrictEqual(versionInfoValues);
    });

    it('preserves an explicit null the user deliberately sets in their overrides', () => {
      const wrapper = mountWithYaml('service:\n  type: null\n');

      wrapper.vm.applyYamlToValues();

      const sent = diff(versionInfoValues, wrapper.vm.chartValues);

      expect(sent).toStrictEqual({ service: { type: null } });
    });

    it('Compare Changes toggles the diff view without rewriting the overrides-only editor', async() => {
      const wrapper = mountWithYaml('image:\n  pullSecrets:\n    - application-collection\n');
      const overrides = wrapper.vm.valuesYaml;

      // switching in from the YAML view enables the diff and keeps overrides-only content
      wrapper.vm.formYamlOption = 'DIFF';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiff).toBe(true);
      expect(wrapper.vm.valuesYaml).toBe(overrides);

      // switching back to the YAML editor disables the diff view
      wrapper.vm.formYamlOption = 'YAML';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiff).toBe(false);
      expect(wrapper.vm.valuesYaml).toBe(overrides);
    });

    it('Compare Changes diffs the full values document so both the old and new values show (as on master)', async() => {
      // Render the wizard's helmValues slot so the diff editor is in the tree.
      // Stub YamlOverridesEditor to a no-op so switching to DIFF (which pushes the
      // overrides via its ref) doesn't error on the stubbed inner editors.
      const wrapper = mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          valuesYaml:       '',
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: { template: '<div/>', methods: { updateOverrides() {} } },
        },
      });

      // fresh install (no saved overrides) that changes an existing default value
      wrapper.setData({ originalYamlValues: '' });
      wrapper.setData({ valuesYaml: 'service:\n  port: 9090\n' });
      wrapper.vm.formYamlOption = 'DIFF';
      await wrapper.vm.$nextTick();

      const diffEditor = wrapper.findComponent({ ref: 'diffEditor' });

      // the diff compares the full original document (chart defaults) against the
      // full merged document, so both old and new values show with context
      expect(diffEditor.props('value')).toBe(mergeOverrides(versionInfoValues, 'service:\n  port: 9090\n'));
      expect(diffEditor.props('initialYamlValues')).toBe(mergeOverrides(versionInfoValues, ''));

      const oldSide = jsyaml.load(diffEditor.props('initialYamlValues')) as any;
      const newSide = jsyaml.load(diffEditor.props('value')) as any;

      expect(oldSide.service.port).toBe(80);
      expect(newSide.service.port).toBe(9090);
      // untouched keys are present on both sides so the diff has context
      expect(oldSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });
      expect(newSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });
    });

    it('diffs against the previously-saved overrides when editing an existing release', async() => {
      const wrapper = mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          valuesYaml:       '',
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: { template: '<div/>', methods: { updateOverrides() {} } },
        },
      });

      // an existing release already overrides service.port; the user now bumps it
      wrapper.setData({ originalYamlValues: 'service:\n  port: 8080\n' });
      wrapper.setData({ valuesYaml: 'service:\n  port: 9090\n' });
      wrapper.vm.formYamlOption = 'DIFF';
      await wrapper.vm.$nextTick();

      const diffEditor = wrapper.findComponent({ ref: 'diffEditor' });

      // baseline is defaults + saved overrides, not the bare defaults
      expect(diffEditor.props('initialYamlValues')).toBe(mergeOverrides(versionInfoValues, 'service:\n  port: 8080\n'));
      expect((jsyaml.load(diffEditor.props('initialYamlValues')) as any).service.port).toBe(8080);
      expect((jsyaml.load(diffEditor.props('value')) as any).service.port).toBe(9090);
    });

    it('shows the full old+new diff with the raw mid-edit lines kept, as on master', async() => {
      // The document as a whole doesn't parse (the last line is incomplete), but
      // the valid overrides above it still merge (keeping sibling context) and the
      // raw line the user is typing is kept in the document rather than dropped.
      const wrapper = mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          valuesYaml:       '',
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: { template: '<div/>', methods: { updateOverrides() {} } },
        },
      });

      // fresh install; a valid `service.port` override with an incomplete last line
      wrapper.setData({ originalYamlValues: '' });
      wrapper.setData({ valuesYaml: 'service:\n  port: 9090\nimagePullSecre' });
      wrapper.vm.formYamlOption = 'DIFF';
      await wrapper.vm.$nextTick();

      const diffEditor = wrapper.findComponent({ ref: 'diffEditor' });
      const newSide = diffEditor.props('value');

      // baseline is the full original document, so old values show with context
      const oldSide = jsyaml.load(diffEditor.props('initialYamlValues')) as any;

      expect(oldSide.service.port).toBe(80);
      expect(oldSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });

      // the new side merges the valid override (keeping untouched siblings) and
      // keeps the raw mid-edit line the user typed, rather than hiding it
      expect(newSide).toContain('port: 9090');
      expect(newSide).toContain('targetPort: 8086');
      expect(newSide.endsWith('imagePullSecre\n')).toBe(true);
    });

    it('keeps the raw overrides in the full document when nothing parses', async() => {
      // Even when no part of the overrides parses to a mapping, the diff keeps the
      // full defaults for context and shows the raw text - never an empty state.
      const wrapper = mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          valuesYaml:       '',
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: { template: '<div/>', methods: { updateOverrides() {} } },
        },
      });

      // fresh install; the overrides are a bare scalar that can never merge
      wrapper.setData({ originalYamlValues: '' });
      wrapper.setData({ valuesYaml: 'broken' });
      wrapper.vm.formYamlOption = 'DIFF';
      await wrapper.vm.$nextTick();

      const diffEditor = wrapper.findComponent({ ref: 'diffEditor' });

      // baseline is the full original document; the new side is that document with
      // the raw line the user typed appended (no empty "no changes" state)
      expect((jsyaml.load(diffEditor.props('initialYamlValues')) as any).service.port).toBe(80);
      expect(diffEditor.props('value')).toContain('port: 80');
      expect(diffEditor.props('value').endsWith('broken\n')).toBe(true);
    });

    it('disables Compare Changes once an override is typed then removed', () => {
      const wrapper = mountWithYaml('');
      const diffOption = () => wrapper.vm.formYamlOptions.find((o: { value: string }) => o.value === 'DIFF');

      // No overrides yet - nothing to compare
      expect(diffOption()?.disabled).toBe(true);

      // Typing an override enables the diff
      wrapper.setData({ valuesYaml: 'e2eTestOverride: hello\n' });
      expect(diffOption()?.disabled).toBe(false);

      // Removing it leaves a residual newline, but there is no real change so it is disabled again
      wrapper.setData({ valuesYaml: '\n' });
      expect(diffOption()?.disabled).toBe(true);
    });

    // The tests above stub YamlEditor, so they only verify the props install passes.
    // These render the real YamlEditor and capture what FileDiff actually receives -
    // the render path where "only the new value showed" regressions live. FileDiff is
    // stubbed because its diff2html draw() needs a real DOM element jsdom lacks.
    describe('rendered diff (real YamlEditor)', () => {
      const FileDiffStub = {
        name:     'FileDiff',
        props:    ['orig', 'neu'],
        template: '<div class="file-diff-stub"/>',
      };

      const mountDiff = (data: Record<string, any>) => mountInstall({
        data: () => ({
          value:            { metadata: { name: '', namespace: '' } },
          chart:            {},
          repo:             { spec: {} },
          currentCluster:   null,
          serverUrlSetting: { value: '' },
          versionInfo:      { values: versionInfoValues },
          chartValues:      {},
          showDiff:         true,
          formYamlOption:   'DIFF',
          ...data,
        }),
        stubs: {
          Wizard:              { template: '<div><slot name="helmValues"/></div>' },
          YamlOverridesEditor: { template: '<div/>', methods: { updateOverrides() {} } },
          YamlEditor:          false,
          FileDiff:            FileDiffStub,
        },
      });

      it('renders both the old and new values with context when the overrides are valid', async() => {
        const wrapper = mountDiff({ originalYamlValues: '', valuesYaml: 'service:\n  port: 9090\n' });

        await wrapper.vm.$nextTick();

        const fileDiff = wrapper.findComponent(FileDiffStub);

        expect(fileDiff.exists()).toBe(true);

        const oldSide = jsyaml.load(fileDiff.props('orig')) as any;
        const newSide = jsyaml.load(fileDiff.props('neu')) as any;

        // old value present on the left, new value on the right - not just the change
        expect(oldSide.service.port).toBe(80);
        expect(newSide.service.port).toBe(9090);
        // untouched keys give the diff surrounding context on both sides
        expect(oldSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });
        expect(newSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });
      });

      it('renders the old values with context and keeps the raw mid-edit line', async() => {
        // Matches the "typing a new line" case: the document doesn't parse yet, but
        // the valid override above still shows old + new values with context, and the
        // raw line the user is typing is kept in the diff rather than hidden.
        const wrapper = mountDiff({ originalYamlValues: '', valuesYaml: 'service:\n  port: 9090\nimagePullSecre' });

        await wrapper.vm.$nextTick();

        const fileDiff = wrapper.findComponent(FileDiffStub);

        expect(fileDiff.exists()).toBe(true);

        // old values on the left with surrounding context
        const oldSide = jsyaml.load(fileDiff.props('orig')) as any;

        expect(oldSide.service.port).toBe(80);
        expect(oldSide.persistence).toStrictEqual({ enabled: true, size: '8Gi' });

        // new side merges the valid override (keeping siblings) and keeps the raw line
        const newSide = fileDiff.props('neu');

        expect(newSide).toContain('port: 9090');
        expect(newSide).toContain('targetPort: 8086');
        expect(newSide.endsWith('imagePullSecre\n')).toBe(true);
      });

      it('renders an honest, non-empty diff keeping the raw text when nothing parses', async() => {
        const wrapper = mountDiff({ originalYamlValues: '', valuesYaml: 'broken' });

        await wrapper.vm.$nextTick();

        const fileDiff = wrapper.findComponent(FileDiffStub);

        expect(fileDiff.exists()).toBe(true);
        // full defaults kept for context (no "file without changes"/empty state) ...
        expect((jsyaml.load(fileDiff.props('orig')) as any).service.port).toBe(80);
        // ... with the raw line the user typed shown at the end
        expect(fileDiff.props('neu')).toContain('port: 80');
        expect(fileDiff.props('neu').endsWith('broken\n')).toBe(true);
      });
    });
  });

  describe('chart info drawer accessibility', () => {
    it('is inert while closed so keyboard navigation skips its off-screen content', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: false }) });

      // inert removes the closed (off-screen) drawer from the tab order / a11y tree
      expect(wrapper.find('.slideIn').attributes('inert')).toBeDefined();

      await wrapper.setData({ showSlideIn: true });

      // once open it must be interactive again
      expect(wrapper.find('.slideIn').attributes('inert')).toBeUndefined();
    });

    it('opening the drawer moves keyboard focus into the panel', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: false }) });
      const focus = jest.spyOn(wrapper.find('.slideIn').element as HTMLElement, 'focus');

      await wrapper.setData({ showSlideIn: true });
      await wrapper.vm.$nextTick();

      // preventScroll stops the browser yanking the off-screen panel into view
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('closes the drawer when Escape is pressed inside it', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: true }) });

      await wrapper.find('.slideIn').trigger('keydown.esc');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showSlideIn).toBe(false);
    });

    it('closing the drawer returns focus to the element that opened it', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: false }) });
      const trigger = { focus: jest.fn() };

      wrapper.vm.toggleSlideIn({ currentTarget: trigger });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showSlideIn).toBe(true);

      wrapper.vm.closeSlideIn();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showSlideIn).toBe(false);
      expect(trigger.focus).toHaveBeenCalledTimes(1);
    });
  });

  describe('finish()', () => {
    const createFinishWrapper = (overrides: Record<string, any> = {}) => {
      const mockDoAction = jest.fn().mockResolvedValue({
        operationNamespace: 'ns',
        operationName:      'op'
      });
      const mockActionLinkFor = jest.fn().mockReturnValue('https://rancher/v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install');

      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec:             { defaultImagePullSecrets: overrides.defaultImagePullSecrets || [] },
            doAction:         mockDoAction,
            actionLinkFor:    mockActionLinkFor,
            waitForOperation: jest.fn().mockResolvedValue(undefined),
          },
          existing:              overrides.existing || null,
          skipPullSecrets:       overrides.skipPullSecrets ?? false,
          registryPullSecret:    overrides.registryPullSecret ?? null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
          errors:                [],
          chart:                 { versions: [] },
          version:               { annotations: {} },
          chartValues:           overrides.chartValues || { global: {} },
          value:                 { metadata: { namespace: 'default', name: 'test' } },
          ...overrides
        })
      });

      // Mock mixin methods
      jest.spyOn(wrapper.vm as any, 'createNamespaceIfNeeded').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'applyHooks').mockResolvedValue(overrides.hookResults || {});
      jest.spyOn(wrapper.vm as any, 'actionInput').mockReturnValue({ errors: [], input: {} });
      jest.spyOn(wrapper.vm as any, 'done').mockImplementation();

      // Mock store dispatch for operation find
      const store = (wrapper.vm as any).$store;

      store.dispatch = jest.fn().mockResolvedValue({
        waitForLink: jest.fn().mockResolvedValue(undefined),
        openLogs:    jest.fn(),
      });

      return {
        wrapper, mockDoAction, mockActionLinkFor
      };
    };

    it('should read created secret name from hookResults when registryPullSecret is null', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBe('hook-created-secret');
    });

    it('should not overwrite registryPullSecret from hookResults when already set', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        registryPullSecret:      'already-selected',
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBe('already-selected');
    });

    it('should not read hookResults when skipPullSecrets is true', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        skipPullSecrets:         true,
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should add skipPullSecrets query param when skipPullSecrets is true', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({ skipPullSecrets: true });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'install',
        expect.anything(),
        expect.objectContaining({ url: expect.stringContaining('skipPullSecrets=true') })
      );
    });

    it('should not add skipPullSecrets query param when skipPullSecrets is false', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({ skipPullSecrets: false });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'install',
        expect.anything(),
        {}
      );
    });

    it('should use upgrade action name when existing release is present', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({
        existing:        { metadata: { name: 'existing-release' } },
        skipPullSecrets: true,
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'upgrade',
        expect.anything(),
        expect.objectContaining({ url: expect.stringContaining('skipPullSecrets=true') })
      );
    });
  });

  describe('fetch() pull secret pre-selection', () => {
    const createFetchWrapper = (overrides: Record<string, any> = {}) => {
      const existingMock = overrides.existing ? {
        metadata:    overrides.existing.metadata || { namespace: 'default', name: 'release' },
        fetchValues: jest.fn().mockResolvedValue(undefined),
        values:      overrides.chartValues?.global ? overrides.chartValues : {},
      } : null;

      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: overrides.defaultImagePullSecrets || [],
              clientSecret:            { name: 'test-secret' }
            }
          },
          existing:    existingMock,
          chartValues: overrides.chartValues || { global: {} },
          chart:       { versions: [] },
          version:     { annotations: {} },
          query:       { versionName: '1.0.0' },
        })
      });

      // Mock mixin methods used during fetch
      jest.spyOn(wrapper.vm as any, 'fetchChart').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'fetchAutoInstallInfo').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'getClusterRegistry').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'getGlobalRegistry').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'loadValuesComponent').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'updateStepOneReady').mockImplementation();

      return wrapper;
    };

    it('should pre-select single existing pull secret on upgrade', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['existing-secret'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBe('existing-secret');
    });

    it('should not pre-select when multiple existing pull secrets exist', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['secret-1', 'secret-2'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should not pre-select on fresh install', async() => {
      const wrapper = createFetchWrapper({
        existing:                null,
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['existing-secret'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should not pre-select when no imagePullSecrets in chart values', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: {} },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });
  });

  describe('computed properties: monitoring banners', () => {
    const setupComponent = (existing: any, releaseName: string, componentName: string, chartName: string, installedApps: any[] = [], certified = 'rancher') => {
      const mockStore = {
        getters: {
          'i18n/withFallback':       () => '',
          'catalog/inStore':         'cluster',
          'features/get':            () => false,
          'type-map/hasCustomChart': () => false,
          'wm/byId':                 () => null,
          'i18n/t':                  (k: string) => k,
          'prefs/get':               () => {},
          'management/all':          () => [],
          'cluster/all':             () => [],
          'cluster/byId':            (type: string, id: string) => {
            if (type === 'catalog.cattle.io.app') {
              return installedApps.find((app) => app.id === id);
            }

            return null;
          },
          'catalog/charts': [],
        }
      };

      return mount(Install as any, {
        global: {
          mocks: {
            $store:      mockStore,
            $route:      { query: {} },
            $fetchState: { pending: false },
            t:           (k: string) => k,
          },
          stubs: {
            Loading:             true,
            Wizard:              true,
            Banner:              true,
            Checkbox:            true,
            LabeledInput:        true,
            LabeledSelect:       true,
            NameNsDescription:   true,
            Tabbed:              true,
            Questions:           true,
            YamlEditor:          true,
            ResourceCancelModal: true,
            UnitInput:           true,
            TypeDescription:     true,
            LazyImage:           true,
            ChartReadme:         true,
            ButtonGroup:         true,
          }
        },
        data() {
          return {
            existing,
            version: {
              annotations: {
                [CATALOG_ANNOTATIONS.RELEASE_NAME]: releaseName,
                [CATALOG_ANNOTATIONS.COMPONENT]:    componentName,
                [CATALOG_ANNOTATIONS.CERTIFIED]:    certified,
              }
            },
            chart: {
              chartName,
              versions: []
            },
            query: { versionName: '1.0.0' }
          };
        }
      });
    };

    it('monitoringChartWarning should return translation key if releaseName matches rancher-monitoring (install or edit)', () => {
      const wrapper1 = setupComponent(true, 'rancher-monitoring', '', '');

      expect((wrapper1.vm as any).monitoringChartWarning).toBe('catalog.install.steps.basics.oldMonitoringChartWarning');

      const wrapper2 = setupComponent(true, '', 'rancher-monitoring', 'rancher-monitoring');

      expect((wrapper2.vm as any).monitoringChartWarning).toBeNull();

      const wrapper3 = setupComponent(false, 'rancher-monitoring', '', '');

      expect((wrapper3.vm as any).monitoringChartWarning).toBe('catalog.install.steps.basics.oldMonitoringChartWarning');
    });

    it('monitoringChartWarning should return translation key if existing is false and releaseName matches rancher-monitoring-dashboards', () => {
      const wrapper1 = setupComponent(false, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper1.vm as any).monitoringChartWarning).toBe('catalog.install.steps.basics.newMonitoringChartWarning');

      const wrapper2 = setupComponent(false, '', 'rancher-monitoring-dashboards', 'rancher-monitoring-dashboards');

      expect((wrapper2.vm as any).monitoringChartWarning).toBeNull();

      const wrapper3 = setupComponent(true, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper3.vm as any).monitoringChartWarning).toBeNull();
    });

    it('monitoringChartWarning should return null when the chart is not Rancher-certified, even if the release name matches', () => {
      const oldChartThirdParty = setupComponent(false, 'rancher-monitoring', '', '', [], 'partner');

      expect((oldChartThirdParty.vm as any).monitoringChartWarning).toBeNull();

      const newChartThirdParty = setupComponent(false, 'rancher-monitoring-dashboards', '', '', [], '');

      expect((newChartThirdParty.vm as any).monitoringChartWarning).toBeNull();
    });
  });

  describe('chart info slide in', () => {
    // The slide in is always rendered and parked off screen. Its contents are only made visible to
    // the browser (and so to find-in-page) via the `slideIn__show` class, so that class must track
    // `showSlideIn` exactly.
    it('should not mark the slide in as shown while it is closed', () => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: false }) });

      expect(wrapper.find('.slideIn').classes()).not.toContain('slideIn__show');
    });

    it('should mark the slide in as shown once it is opened', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: false }) });

      await wrapper.setData({ showSlideIn: true });

      expect(wrapper.find('.slideIn').classes()).toContain('slideIn__show');
    });

    it('should stop marking the slide in as shown once it is closed again', async() => {
      const wrapper = mountInstall({ data: () => ({ showSlideIn: true }) });

      await wrapper.setData({ showSlideIn: false });

      expect(wrapper.find('.slideIn').classes()).not.toContain('slideIn__show');
    });
  });
});
