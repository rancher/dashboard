import { mount } from '@vue/test-utils';
import ServiceAccountToken from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/ServiceAccountToken.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label-key', 'conceal']
}));

describe('component: SecretDataTab/ServiceAccountToken', () => {
  const crt = 'CRT';
  const token = 'TOKEN';

  it('should render container with class secret-data-service-account-token', async() => {
    const wrapper = mount(ServiceAccountToken, { props: { crt, token } });

    expect(wrapper.find('.secret-data-service-account-token').exists()).toBeTruthy();
  });

  it('should render DetailText with ca and token props passed correctly', async() => {
    const wrapper = mount(ServiceAccountToken, { props: { crt, token } });

    const caDetailTextComponent = wrapper.find('.crt').findComponent({ name: 'DetailText' });
    const tokenDetailTextComponent = wrapper.find('.token').findComponent({ name: 'DetailText' });

    expect(caDetailTextComponent.props('value')).toStrictEqual(crt);
    expect(caDetailTextComponent.props('labelKey')).toStrictEqual('secret.serviceAcct.ca');

    expect(tokenDetailTextComponent.props('value')).toStrictEqual(token);
    expect(tokenDetailTextComponent.props('labelKey')).toStrictEqual('secret.serviceAcct.token');
    expect(tokenDetailTextComponent.props('conceal')).toStrictEqual(true);
  });
});
