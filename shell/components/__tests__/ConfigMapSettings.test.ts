
import { mount } from '@vue/test-utils';
import ConfigMapSettings, { Setting } from '@shell/components/ConfigMapSettings/index.vue';
import { _EDIT } from '@shell/config/query-params';
import { CONFIG_MAP } from '@shell/config/types';
import jsyaml from 'js-yaml';

const mockedStore = () => {
  return {
    getters: {
      'cluster/schemaFor':    jest.fn(),
      'management/schemaFor': jest.fn(),
      'i18n/t':               (text: string, v = {}) => {
        return `${ text }${ Object.values(v) }`;
      },
    },
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      },
      stubs: { AsyncButton: true }
    }
  };
};

const settings = {
  garbageCollectionInterval: {
    weight:  0,
    type:    'string',
    path:    'garbageCollectionInterval',
    default: '15m',
  },
  garbageCollectionIntervalNumber: {
    weight:  0,
    type:    'number',
    handler: 'UnitInput',
    path:    'garbageCollectionIntervalNumber',
    default: '15m',
  },
  gitClientTimeout: {
    weight:  1,
    type:    'string',
    path:    'gitClientTimeout',
    default: '30s',
  },
  gitClientTimeoutNumber: {
    weight:  1,
    type:    'number',
    handler: 'UnitInput',
    path:    'gitClientTimeoutNumber',
    default: '30s',
  },
  gitjobReplicas: {
    weight:  1,
    type:    'number',
    path:    'gitjob.replicas',
    default: 1,
  },
  multiSelect: {
    weight:  4,
    type:    'array',
    path:    'multiSelect',
    default: 'foo',
    items:   [{
      type:  'string',
      value: 'foo'
    }, {
      type:  'string',
      value: 'bar'
    }],
  },
  singleSelect: {
    weight: 1,
    type:   'string',
    items:  [{
      type:  'string',
      value: 'strict'
    }, {
      type:  'string',
      value: 'system-store'
    }],
    path:    'agentTLSMode',
    default: 'system-store',
  },
  nodeSelector: {
    weight:  1,
    type:    'object',
    handler: 'Textarea',
    path:    'nodeSelector',
    default: {},
  },
  nodeSelectorKeyValue: {
    weight:  1,
    type:    'object',
    handler: 'KeyValue',
    path:    'nodeSelectorKeyValue',
    default: { foo: 'val' },
  },
  debug: {
    weight:  1,
    type:    'boolean',
    path:    'debug',
    default: false,
  },
  tolerationsTaints: {
    weight:  2,
    type:    'object',
    handler: 'Taints',
    path:    'tolerationsTaints',
    default: [{
      key:    'foo1',
      value:  'bar1',
      effect: 'PreferNoSchedule'
    }],
  },
} as Record<string, Setting>;

const groups = [{
  name:     'general',
  children: [
    'garbageCollectionInterval',
    'gitClientTimeout'
  ],
  expanded: true,
  weight:   0
}];

const configMap = {
  type:     CONFIG_MAP,
  metadata: {
    namespace: 'ns',
    name:      'name'
  },
  data: {
    fleet: jsyaml.dump({
      foo:                             'bar',
      garbageCollectionInterval:       '1h',
      gitjob:                          { replicas: 5 },
      debug:                           true,
      nodeSelector:                    { key: 'value1' },
      garbageCollectionIntervalNumber: '14m',
      gitClientTimeoutNumber:          '3m',
      nodeSelectorKeyValue:            { foo: 'bar' },
      tolerationsTaints:               [{
        key:    'foo',
        value:  'bar',
        effect: 'PreferNoSchedule'
      }]
    }),
    foo: { bar: 'value' }
  },
  save: () => {},
};

describe('component: ConfigMapSettings', () => {
  it('should init values from settings descriptor default values, having ConfigMap === null', async() => {
    const wrapper = mount(ConfigMapSettings, {
      ...requiredSetup(),
      props: {
        settings,
        groups,
        name:      'cm-name',
        namespace: 'cm-namespace',
        dataKey:   'fleet'
      },
      computed: {
        mode:       () => _EDIT,
        canEdit:    () => true,
        fetchState: () => ({ $fetchState: false }),
      },
    });

    wrapper.vm.initValues();

    await wrapper.vm.$nextTick();

    const generalGroup = wrapper.find('[data-testid="cm-settings-group-body-general"]');

    const garbageCollectionInterval = wrapper.find('[data-testid="cm-settings-field-string-garbageCollectionInterval"]').element as HTMLInputElement;
    const garbageCollectionIntervalNumber = wrapper.find('[data-testid="cm-settings-field-number-UnitInput-garbageCollectionIntervalNumber"]').element as HTMLInputElement;
    const gitClientTimeout = wrapper.find('[data-testid="cm-settings-field-string-gitClientTimeout"]').element as HTMLInputElement;
    const gitClientTimeoutNumber = wrapper.find('[data-testid="cm-settings-field-number-UnitInput-gitClientTimeoutNumber"]').element as HTMLInputElement;
    const gitjobReplicas = wrapper.find('[data-testid="cm-settings-field-number-gitjobReplicas"]').element as HTMLInputElement;
    const multiSelect = wrapper.find('[data-testid="cm-settings-field-array-multiSelect"]').element as HTMLInputElement;
    const nodeSelector = wrapper.find('[data-testid="cm-settings-field-object-Textarea-nodeSelector"]').element as HTMLInputElement;
    const nodeSelectorKeyValue = wrapper.find('[data-testid="cm-settings-field-object-KeyValue-nodeSelectorKeyValue"]').find('[data-testid="input-kv-item-key-0"]').element as HTMLInputElement;
    const tolerationsTaints = wrapper.find('[data-testid="cm-settings-field-object-Taints-tolerationsTaints"]').find('[data-testid="input-kv-item-key-0"]').element as HTMLInputElement;
    const singleSelect = wrapper.find('[data-testid="cm-settings-field-string-singleSelect"]').element as HTMLInputElement;
    const debug = wrapper.find('[data-testid="cm-settings-field-boolean-debug"]').find('input[type="checkbox"]').element as HTMLInputElement;

    expect(generalGroup.exists()).toBe(true);
    expect(garbageCollectionInterval.value).toBe('15m');
    expect(garbageCollectionIntervalNumber.value).toBe('900');
    expect(gitClientTimeout.value).toBe('30s');
    expect(gitClientTimeoutNumber.value).toBe('30');
    expect(multiSelect.textContent).toContain('foo');
    expect(singleSelect.textContent).toContain('system-store');
    expect(nodeSelector.value).toBe('{}');
    expect(nodeSelectorKeyValue.value).toBe('foo');
    expect(tolerationsTaints.value).toBe('foo1');
    expect(gitjobReplicas.value).toBe('1');
    expect(debug.checked).toBe(false);
  });

  it('should display error when parsing malformed values', async() => {
    const wrapper = mount(ConfigMapSettings, {
      ...requiredSetup(),
      props: {
        settings,
        groups,
        name:      'cm-name',
        namespace: 'cm-namespace',
        dataKey:   'fleet'
      },
      computed: {
        mode:       () => _EDIT,
        canEdit:    () => true,
        fetchState: () => ({ $fetchState: false }),
      },
    });

    wrapper.setData({
      configMap: {
        type:     CONFIG_MAP,
        metadata: {
          namespace: 'ns',
          name:      'name'
        },
        data: {
          fleet: { foo: 'bar' },
          foo:   { bar: 'value' }
        }
      }
    });

    wrapper.vm.initValues();

    await wrapper.vm.$nextTick();

    const error = wrapper.find('[data-testid="cm-settings-error"]');

    expect(error.text()).toContain('parseError');
  });

  it('should merge settings descriptor default values with ConfigMap values', async() => {
    const wrapper = mount(ConfigMapSettings, {
      ...requiredSetup(),
      props: {
        settings,
        groups,
        name:      'cm-name',
        namespace: 'cm-namespace',
        dataKey:   'fleet'
      },
      computed: {
        mode:       () => _EDIT,
        canEdit:    () => true,
        fetchState: () => ({ $fetchState: false }),
      },
    });

    wrapper.setData({ configMap });

    wrapper.vm.initValues();

    await wrapper.vm.$nextTick();

    const garbageCollectionInterval = wrapper.find('[data-testid="cm-settings-field-string-garbageCollectionInterval"]').element as HTMLInputElement;
    const gitClientTimeout = wrapper.find('[data-testid="cm-settings-field-string-gitClientTimeout"]').element as HTMLInputElement;
    const gitjobReplicas = wrapper.find('[data-testid="cm-settings-field-number-gitjobReplicas"]').element as HTMLInputElement;
    const multiSelect = wrapper.find('[data-testid="cm-settings-field-array-multiSelect"]').element as HTMLInputElement;
    const nodeSelector = wrapper.find('[data-testid="cm-settings-field-object-Textarea-nodeSelector"]').element as HTMLInputElement;
    const singleSelect = wrapper.find('[data-testid="cm-settings-field-string-singleSelect"]').element as HTMLInputElement;
    const debug = wrapper.find('[data-testid="cm-settings-field-boolean-debug"]').find('input[type="checkbox"]').element as HTMLInputElement;
    const garbageCollectionIntervalNumber = wrapper.find('[data-testid="cm-settings-field-number-UnitInput-garbageCollectionIntervalNumber"]').element as HTMLInputElement;
    const gitClientTimeoutNumber = wrapper.find('[data-testid="cm-settings-field-number-UnitInput-gitClientTimeoutNumber"]').element as HTMLInputElement;
    const nodeSelectorKeyValue = wrapper.find('[data-testid="cm-settings-field-object-KeyValue-nodeSelectorKeyValue"]').find('[data-testid="input-kv-item-key-0"]').element as HTMLInputElement;
    const tolerationsTaints = wrapper.find('[data-testid="cm-settings-field-object-Taints-tolerationsTaints"]').find('[data-testid="input-kv-item-key-0"]').element as HTMLInputElement;

    expect(garbageCollectionInterval.value).toBe('1h');
    expect(gitClientTimeout.value).toBe('30s');
    expect(multiSelect.textContent).toContain('foo');
    expect(singleSelect.textContent).toContain('system-store');
    expect(nodeSelector.value).toBe('{\"key\":\"value1\"}');
    expect(gitjobReplicas.value).toBe('5');
    expect(debug.checked).toBe(true);
    expect(garbageCollectionIntervalNumber.value).toBe('840');
    expect(gitClientTimeoutNumber.value).toBe('180');
    expect(nodeSelectorKeyValue.value).toBe('foo');
    expect(tolerationsTaints.value).toBe('foo');
  });

  it('should save ConfigMap values preserving extraneous values', async() => {
    const wrapper = mount(ConfigMapSettings, {
      ...requiredSetup(),
      props: {
        settings,
        groups,
        name:      'cm-name',
        namespace: 'cm-namespace',
        dataKey:   'fleet'
      },
      computed: {
        mode:       () => _EDIT,
        canEdit:    () => true,
        fetchState: () => ({ $fetchState: false }),
      },
    });

    wrapper.setData({ configMap });

    wrapper.vm.initValues();

    await wrapper.vm.$nextTick();

    await wrapper.vm.save(() => {});

    const cm = wrapper.vm.configMap as any;

    expect(cm.data).toStrictEqual({
      fleet: 'foo: bar\ngarbageCollectionInterval: 1h\ngitjob:\n  replicas: 5\ndebug: true\nnodeSelector:\n  key: value1\ngarbageCollectionIntervalNumber: 840s\ngitClientTimeoutNumber: 180s\nnodeSelectorKeyValue:\n  foo: bar\ntolerationsTaints:\n  - key: foo\n    value: bar\n    effect: PreferNoSchedule\ngitClientTimeout: 30s\nmultiSelect: foo\nagentTLSMode: system-store\n',
      foo:   { bar: 'value' },
    });
  });

  it('should show groups titles and hide body if group is collapsed', async() => {
    const wrapper = mount(ConfigMapSettings, {
      ...requiredSetup(),
      props: {
        settings,
        groups: [{
          name:     'general',
          children: [
            'garbageCollectionInterval',
            'gitClientTimeout'
          ],
          expanded: false,
          weight:   0
        }],
        name:      'cm-name',
        namespace: 'cm-namespace',
        dataKey:   'fleet'
      },
      computed: {
        mode:       () => _EDIT,
        canEdit:    () => true,
        fetchState: () => ({ $fetchState: false }),
      },
    });

    wrapper.vm.initValues();

    await wrapper.vm.$nextTick();

    const generalGroupRow = wrapper.find('[data-testid="cm-settings-row-general"]');
    const generalGroupBody = wrapper.find('[data-testid="cm-settings-group-body-general"]');

    const garbageCollectionInterval = wrapper.find('[data-testid="cm-settings-field-string-garbageCollectionInterval"]');
    const gitClientTimeout = wrapper.find('[data-testid="cm-settings-field-string-gitClientTimeout"]');

    expect(generalGroupRow.exists()).toBe(true);
    expect(generalGroupBody.exists()).toBe(false);

    expect(garbageCollectionInterval.exists()).toBe(false);
    expect(gitClientTimeout.exists()).toBe(false);
  });
});
