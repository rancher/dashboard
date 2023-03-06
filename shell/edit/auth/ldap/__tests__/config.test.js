import Config from '@shell/edit/auth/ldap/config.vue';
import { shallowMount, mount } from '@vue/test-utils';
import { LabeledInput } from '@components/Form/LabeledInput';

describe('component: shell/edit/auth/ldap/config', () => {
  it('should hide user/group unique id attribute config if type shibboleth', () => {
    const tMock = jest.fn(t => t);

    shallowMount(Config, {
      propsData: {
        value: {},
        type:  'shibboleth'
      },
      mocks: { t: tMock }
    });

    expect(tMock).not.toHaveBeenCalledWith('authConfig.ldap.groupUniqueIdAttribute.label');
    expect(tMock).not.toHaveBeenCalledWith('authConfig.ldap.userUniqueIdAttribute.label');
  });

  it('should show user/group unique id attribute config if type is not shibboleth', () => {
    const tMock = jest.fn(t => t);

    shallowMount(Config, {
      propsData: {
        value: {},
        type:  'test'
      },
      mocks: { t: tMock }
    });

    expect(tMock).toHaveBeenCalledWith('authConfig.ldap.groupUniqueIdAttribute.label');
    expect(tMock).toHaveBeenCalledWith('authConfig.ldap.userUniqueIdAttribute.label');
  });
  it('should update user/group unique id attribute config if them changed', async() => {
    const tMock = jest.fn(t => t);
    const wrapper = mount(Config, {
      propsData: {
        value: {
          userUniqueIdAttribute:  'userUniqueId',
          groupUniqueIdAttribute: 'groupUniqueId'
        },
        type: 'test'
      },
      mocks: { t: tMock }
    });
    const allComponents = wrapper.findAllComponents(LabeledInput);
    const userUniqueIdComponent = allComponents.filter(c => c.props('label') === 'authConfig.ldap.userUniqueIdAttribute.label');
    const groupUniqueIdComponent = allComponents.filter(c => c.props('label') === 'authConfig.ldap.groupUniqueIdAttribute.label');

    expect(userUniqueIdComponent.exists()).toBe(true);
    expect(groupUniqueIdComponent.exists()).toBe(true);

    await userUniqueIdComponent.at(0).find('input').setValue('userUniqueId-test');
    expect(wrapper.props('value').userUniqueIdAttribute).toStrictEqual('userUniqueId-test');

    await groupUniqueIdComponent.at(0).find('input').setValue('groupUniqueId-test');
    expect(wrapper.props('value').groupUniqueIdAttribute).toStrictEqual('groupUniqueId-test');
  });
});
