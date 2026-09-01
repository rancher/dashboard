import { mount } from '@vue/test-utils';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { createStore } from 'vuex';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));

describe('component: Metadata/index', () => {
  const store = createStore({});
  const stubs = ['IdentifyingInformation', 'KeyValue', 'Labels', 'Annotations'];

  const identifyingInformation = [{ label: 'zero' }];
  const keyValue = [{ key: 'key', value: 'value' }];

  it('should render the container with metadata class', async() => {
    const wrapper = mount(Metadata, {
      props: {
        identifyingInformation,
        labels:      [],
        annotations: [],
        resource:    {}
      },
      global: { provide: { store }, stubs }
    });

    expect(wrapper.find('.spaced-row.metadata').exists()).toBeTruthy();
  });

  it('should render identifying information with the appropriate class and rows', async() => {
    const wrapper = mount(Metadata, {
      props: {
        identifyingInformation,
        labels:      [],
        annotations: [],
        resource:    {}
      },
      global: { provide: { store }, stubs }
    });

    const identingInformationComponent = wrapper.find('.identifying-info').getComponent<any>('identifying-information-stub');

    expect(identingInformationComponent.props('rows')).toStrictEqual(identifyingInformation);
  });

  it('should render both empty message if labels and annotations are empty and labels/annotations are hidden', async() => {
    const wrapper = mount(Metadata, {
      props: {
        identifyingInformation,
        labels:      [],
        annotations: [],
        resource:    {}
      },
      global: { provide: { store }, stubs }
    });

    expect(wrapper.find('.labels').exists()).toBeFalsy();
    expect(wrapper.find('.annotations').exists()).toBeFalsy();
    const keyValueComponent = wrapper.find('.labels-and-annotations-empty').getComponent<any>('key-value-stub');

    expect(keyValueComponent.props('rows')).toStrictEqual([]);
    expect(keyValueComponent.props('propertyName')).toStrictEqual('component.resource.detail.metadata.labelsAndAnnotations');
  });

  it('should render labels and pass appropriate props and not render the empty message', async() => {
    const wrapper = mount(Metadata, {
      props: {
        identifyingInformation,
        labels:      keyValue,
        annotations: [],
        resource:    {}
      },
      global: { provide: { store }, stubs }
    });

    expect(wrapper.find('.labels-and-annotations-empty').exists()).toBeFalsy();

    const labelsComponent = wrapper.find('.labels').getComponent<any>('labels-stub');

    expect(labelsComponent.props('labels')).toStrictEqual(keyValue);
  });

  it('should render annotations and pass appropriate props and not render the empty message', async() => {
    const wrapper = mount(Metadata, {
      props: {
        identifyingInformation,
        labels:      [],
        annotations: keyValue,
        resource:    {}
      },
      global: { provide: { store }, stubs }
    });

    expect(wrapper.find('.labels-and-annotations-empty').exists()).toBeFalsy();

    const labelsComponent = wrapper.find('.annotations').getComponent<any>('annotations-stub');

    expect(labelsComponent.props('annotations')).toStrictEqual(keyValue);
  });
});
