import { shallowMount } from '@vue/test-utils';
import HelmOpValuesTab from '@shell/components/fleet/HelmOpValuesTab.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpValuesTab', () => {
  const defaultProps = {
    value: {
      metadata: { namespace: 'fleet-default' },
      spec:     { helm: { valuesFrom: [] } },
    },
    mode:                _EDIT,
    realMode:            _EDIT,
    chartValues:         '',
    chartValuesInit:     '',
    yamlForm:            'yaml',
    yamlFormOptions:     [],
    yamlDiffModeOptions: [],
    isYamlDiff:          false,
    editorMode:          'edit',
    diffMode:            'diff',
    isRealModeEdit:      true,
  };

  it('should update value.spec.helm.valuesFrom when FleetValuesFrom emits update:value', () => {
    const wrapper = shallowMount(HelmOpValuesTab, { props: defaultProps });

    const newValuesFrom = [
      {
        configMapKeyRef: {
          key: 'foo', name: 'cm-1', namespace: 'fleet-default'
        }
      },
    ];

    wrapper.findComponent({ name: 'FleetValuesFrom' }).vm.$emit('update:value', newValuesFrom);

    expect(defaultProps.value.spec.helm.valuesFrom).toStrictEqual(newValuesFrom);
  });
});
