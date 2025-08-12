import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const mockStore = {
  getters: {
    'type-map/labelFor': jest.fn(),
    currentStore:        jest.fn(),
    'cluster/schemaFor': jest.fn()
  }
};
const mockRoute = { params: { cluster: 'CLUSTER' } };

jest.mock('vuex', () => ({ useStore: () => mockStore }));
jest.mock('vue-router', () => ({ useRoute: () => mockRoute }));

describe('composables: TitleBar', () => {
  const resource = {
    nameDisplay:       'RESOURCE_NAME',
    namespace:         'RESOURCE_NAMESPACE',
    type:              'RESOURCE_TYPE',
    stateBackground:   'RESOURCE_STATE_BACKGROUND',
    stateDisplay:      'RESOURCE_STATE_DISPLAY',
    description:       'RESOURCE_DESCRIPTION',
    showConfiguration: jest.fn(),
  };
  const labelFor = 'LABEL_FOR';
  const schema = { type: 'SCHEMA' };

  it('should return the appropriate values based on input', async() => {
    const route = useRoute();

    mockStore.getters['currentStore'].mockImplementation(() => 'cluster');
    mockStore.getters['cluster/schemaFor'].mockImplementation(() => schema);
    mockStore.getters['type-map/labelFor'].mockImplementation(() => labelFor);

    const props = useDefaultTitleBarProps(resource, ref(undefined));

    expect(props.value.resourceTypeLabel).toStrictEqual(labelFor);
    expect(mockStore.getters['type-map/labelFor']).toHaveBeenLastCalledWith(schema);
    expect(mockStore.getters['currentStore']).toHaveBeenLastCalledWith(resource.type);
    expect(mockStore.getters['cluster/schemaFor']).toHaveBeenLastCalledWith(resource.type);
    expect(props.value.resourceTo?.params.product).toStrictEqual('explorer');
    expect(props.value.resourceTo?.params.cluster).toStrictEqual(route.params.cluster);
    expect(props.value.resourceTo?.params.namespace).toStrictEqual(resource.namespace);
    expect(props.value.resourceTo?.params.resource).toStrictEqual(resource.type);
    expect(props.value.resourceName).toStrictEqual(resource.nameDisplay);

    expect(props.value.actionMenuResource).toStrictEqual(resource);
    expect(props.value.badge?.color).toStrictEqual(resource.stateBackground);
    expect(props.value.badge?.label).toStrictEqual(resource.stateDisplay);
    expect(props.value.description).toStrictEqual(resource.description);

    props.value.onShowConfiguration?.('callback');
    expect(resource.showConfiguration).toHaveBeenCalledTimes(1);
  });
});
