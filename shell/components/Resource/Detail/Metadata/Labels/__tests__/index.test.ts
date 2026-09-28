import { mount } from '@vue/test-utils';
import Labels from '@shell/components/Resource/Detail/Metadata/Labels/index.vue';
import { createStore } from 'vuex';
jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));

describe('component: Metadata/Labels', () => {
  it('should render KeyValue with the appropriate props', async() => {
    const labels = [{ key: 'key', value: 'value' }];
    const wrapper = mount(Labels, {
      props:  { labels },
      global: { provide: { store: createStore({}) }, stubs: { KeyValue: true } }
    });

    const keyValue = wrapper.getComponent<any>('key-value-stub');

    expect(keyValue.props('propertyName')).toStrictEqual('component.resource.detail.metadata.labels.title');
    expect(keyValue.props('rows')).toStrictEqual(labels);
  });
});
