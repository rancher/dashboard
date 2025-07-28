import { mount } from '@vue/test-utils';
import Registry from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Registry.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label-key']
}));

describe('component: SecretDataTab/Registry', () => {
  const registryUrl = 'url';

  it('should render container with class secret-data-registry', async() => {
    const wrapper = mount(Registry, { props: { registryUrl } });

    expect(wrapper.find('.secret-data-registry').exists()).toBeTruthy();
  });

  it('should render DetailText with crt and token props passed correctly', async() => {
    const wrapper = mount(Registry, { props: { registryUrl } });

    const registryUrlDetailTextComponent = wrapper.find('.registry-url').findComponent({ name: 'DetailText' });

    expect(registryUrlDetailTextComponent.props('value')).toStrictEqual(registryUrl);
    expect(registryUrlDetailTextComponent.props('labelKey')).toStrictEqual('secret.registry.domainName');
  });
});
