import { mount } from '@vue/test-utils';
import ConfigMapDataTab from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';

jest.mock('clipboard-polyfill', () => {});
jest.mock('vuex');
jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: '<div>DetailText</div>',
  props:    {
    value: { type: String }, label: { type: String }, binary: { type: Boolean }
  }
}));

describe('component: ConfigMapDataTab/index', () => {
  const global = {
    provide: {
      addTab: jest.fn(), removeTab: jest.fn(), sideTabs: false,
    },
    directives: { 'clean-tooltip': () => { } }
  };

  it('should render the now rows message', async() => {
    const wrapper = mount(ConfigMapDataTab, {
      props: { rows: [] },
      global
    });

    expect(wrapper.find('.no-rows').text()).toStrictEqual('sortableTable.noRows');
  });

  it('should render DetailText with the appropriate props from row', async() => {
    const row = {
      key:    'ROW',
      value:  'VALUE',
      binary: false
    };
    const wrapper = mount(ConfigMapDataTab, {
      props: { rows: [row] },
      global
    });

    const component = wrapper.getComponent({ name: 'DetailText' });

    expect(component.props('value')).toStrictEqual(row.value);
    expect(component.props('label')).toStrictEqual(row.key);
    expect(component.props('binary')).toStrictEqual(row.binary);
  });
});
