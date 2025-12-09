import { mount, RouterLinkStub } from '@vue/test-utils';
import KeyValue from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import { createStore } from 'vuex';
jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));

describe('component: Metadata/IdentifyingInformation', () => {
  const propertyName = 'PROPERTY_NAME';
  const store = createStore({});
  const cleanTooltip = jest.fn();
  const directives = { 'clean-tooltip': cleanTooltip };
  const rows = [{ key: 'KEY', value: 'VALUE' }];

  afterEach(() => {
    cleanTooltip.mockClear();
  });

  it('should render container with identifying information', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        propertyName, rows, type: 'active'
      },
      global: {
        stubs: {
          'router-link': RouterLinkStub, 'clean-tooltip': true, KeyValueRow: true
        },
        provide: { store },
        directives
      }
    });

    expect(wrapper.find('.key-value').exists()).toBeTruthy();
  });

  it('should render property name and count', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        propertyName, rows, type: 'active'
      },
      global: {
        stubs: {
          'router-link': RouterLinkStub, 'clean-tooltip': true, KeyValueRow: true
        },
        provide: { store },
        directives
      }
    });

    expect(wrapper.find('.heading .title').element.innerHTML.trim()).toStrictEqual(propertyName);
    expect(wrapper.find('.heading .count').element.innerHTML.trim()).toStrictEqual(rows.length.toString());
  });

  it('should render no rows messaging', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        propertyName, rows: [], type: 'active'
      },
      global: {
        stubs: {
          'router-link': RouterLinkStub, 'clean-tooltip': true, KeyValueRow: true
        },
        provide: { store },
        directives
      }
    });

    expect(wrapper.find('.empty .no-rows').element.innerHTML.trim()).toStrictEqual(`component.resource.detail.metadata.keyValue.noRows-{"propertyName":"${ propertyName.toLowerCase() }"}`);
    expect(wrapper.find('.empty .show-configuration a').text()).toStrictEqual('component.resource.detail.metadata.keyValue.showConfiguration');
  });

  it('should render show all button if rows length exceeds max', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        propertyName, rows: [...rows, ...rows], maxRows: 1, type: 'active'
      },
      global: {
        stubs: {
          'router-link': RouterLinkStub, 'clean-tooltip': true, KeyValueRow: true
        },
        provide: { store },
        directives
      }
    });

    expect(wrapper.find('.show-all').exists()).toBeTruthy();
  });

  it('should pass type down to KeyValueRow', async() => {
    const wrapper = mount(KeyValue, {
      props: {
        propertyName, rows, type: 'active'
      },
      global: {
        stubs: {
          'router-link': RouterLinkStub, 'clean-tooltip': true, KeyValueRow: true
        },
        provide: { store },
        directives
      }
    });

    const keyValueRowComponent: any = wrapper.findComponent('key-value-row-stub');

    expect(keyValueRowComponent.props('type')).toStrictEqual('active');
  });
});
