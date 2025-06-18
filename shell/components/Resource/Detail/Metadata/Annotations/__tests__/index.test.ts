import { mount } from '@vue/test-utils';
import Annotations from '@shell/components/Resource/Detail/Metadata/Annotations/index.vue';
import { createStore } from 'vuex';

describe('component: Metadata/Annotations', () => {
  it('shoulder render KeyValue with the appropriate props', async() => {
    const annotations = [{ key: 'key', value: 'value' }];
    const wrapper = mount(Annotations, {
      props:  { annotations },
      global: { provide: { store: createStore({}) }, stubs: { KeyValue: true } }
    });

    const keyValue = wrapper.getComponent<any>('key-value-stub');

    expect(keyValue.props('propertyName')).toStrictEqual('component.resource.detail.metadata.annotations.title');
    expect(keyValue.props('rows')).toStrictEqual(annotations);
    expect(keyValue.props('outline')).toStrictEqual(true);
  });
});
