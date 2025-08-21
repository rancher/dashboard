import { mount } from '@vue/test-utils';
import Certificate from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Certificate.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label-key', 'conceal']
}));

describe('component: SecretDataTab/Certificate', () => {
  const crt = 'CRT';
  const token = 'TOKEN';

  it('should render container with class secret-data-basic-auth', async() => {
    const wrapper = mount(Certificate, { props: { crt, token } });

    expect(wrapper.find('.secret-data-certificate').exists()).toBeTruthy();
  });

  it('should render DetailText with crt and token props passed correctly', async() => {
    const wrapper = mount(Certificate, { props: { crt, token } });

    const crtDetailTextComponent = wrapper.find('.crt').findComponent({ name: 'DetailText' });
    const tokenDetailTextComponent = wrapper.find('.token').findComponent({ name: 'DetailText' });

    expect(crtDetailTextComponent.props('value')).toStrictEqual(crt);
    expect(crtDetailTextComponent.props('labelKey')).toStrictEqual('secret.certificate.certificate');

    expect(tokenDetailTextComponent.props('value')).toStrictEqual(token);
    expect(tokenDetailTextComponent.props('labelKey')).toStrictEqual('secret.certificate.privateKey');
    expect(tokenDetailTextComponent.props('conceal')).toStrictEqual(true);
  });
});
