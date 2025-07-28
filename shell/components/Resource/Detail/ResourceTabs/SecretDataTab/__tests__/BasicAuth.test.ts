import { mount } from '@vue/test-utils';
import BasicAuth from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/BasicAuth.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label-key', 'conceal']
}));

describe('component: SecretDataTab/BasicAuth', () => {
  const username = 'USERNAME';
  const password = 'PASSWORD';

  it('should render container with class secret-data-basic-auth', async() => {
    const wrapper = mount(BasicAuth, { props: { username, password } });

    expect(wrapper.find('.secret-data-basic-auth').exists()).toBeTruthy();
  });

  it('should render DetailText with username and password props passed correctly', async() => {
    const wrapper = mount(BasicAuth, { props: { username, password } });

    const usernameDetailTextComponent = wrapper.find('.username').findComponent({ name: 'DetailText' });
    const passwordDetailTextComponent = wrapper.find('.password').findComponent({ name: 'DetailText' });

    expect(usernameDetailTextComponent.props('value')).toStrictEqual(username);
    expect(usernameDetailTextComponent.props('labelKey')).toStrictEqual('secret.registry.username');

    expect(passwordDetailTextComponent.props('value')).toStrictEqual(password);
    expect(passwordDetailTextComponent.props('labelKey')).toStrictEqual('secret.registry.password');
    expect(passwordDetailTextComponent.props('conceal')).toStrictEqual(true);
  });
});
