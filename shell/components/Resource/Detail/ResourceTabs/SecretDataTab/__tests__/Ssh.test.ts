import { mount } from '@vue/test-utils';
import Ssh from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Ssh.vue';

jest.mock('@shell/components/DetailText.vue', () => ({
  name:     'DetailText',
  template: `<div class="detail-text">DetailText</div>`,
  props:    ['value', 'label-key', 'conceal']
}));

describe('component: SecretDataTab/BasicAuth', () => {
  const username = 'USERNAME';
  const password = 'PASSWORD';

  it('should render container with class secret-data-ssh', async() => {
    const wrapper = mount(Ssh, { props: { username, password } });

    expect(wrapper.find('.secret-data-ssh').exists()).toBeTruthy();
  });

  it('should render DetailText with username and password props passed correctly', async() => {
    const wrapper = mount(Ssh, { props: { username, password } });

    const usernameDetailTextComponent = wrapper.find('.username').findComponent({ name: 'DetailText' });
    const passwordDetailTextComponent = wrapper.find('.password').findComponent({ name: 'DetailText' });

    expect(usernameDetailTextComponent.props('value')).toStrictEqual(username);
    expect(usernameDetailTextComponent.props('labelKey')).toStrictEqual('secret.ssh.public');

    expect(passwordDetailTextComponent.props('value')).toStrictEqual(password);
    expect(passwordDetailTextComponent.props('labelKey')).toStrictEqual('secret.ssh.private');
    expect(passwordDetailTextComponent.props('conceal')).toStrictEqual(true);
  });
});
