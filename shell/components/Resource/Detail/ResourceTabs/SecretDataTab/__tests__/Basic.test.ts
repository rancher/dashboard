import { mount } from '@vue/test-utils';
import Basic from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Basic.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label', 'conceal']
}));

jest.mock('vuex', () => ({ useStore: jest.fn() }));

describe('component: SecretDataTab/Basic', () => {
  const rows = [
    {
      key:   'KEY',
      value: 'VALUE'
    }
  ];

  it('should render container with class secret-data-tab-basic', async() => {
    const wrapper = mount(Basic, { props: { rows: [] } });

    expect(wrapper.find('.secret-data-tab-basic').exists()).toBeTruthy();
  });

  it('should render no rows message if empty rows are passed', async() => {
    const wrapper = mount(Basic, { props: { rows: [] } });

    expect(wrapper.find('.no-rows').text()).toStrictEqual('sortableTable.noRows');
  });

  it('should render row of DetailText with appropriate props', async() => {
    const wrapper = mount(Basic, { props: { rows } });

    const detailTextComponent = wrapper.findComponent({ name: 'DetailText' });

    expect(detailTextComponent.props('label')).toStrictEqual(rows[0].key);
    expect(detailTextComponent.props('value')).toStrictEqual(rows[0].value);
  });
});
