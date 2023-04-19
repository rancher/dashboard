import ChangePassword from '@shell/components/form/ChangePassword.vue';
import PasswordStrength from '@shell/components/PasswordStrength.vue';
import AESEncrypt from '@shell/utils/aes-encrypt';
import { shallowMount } from '@vue/test-utils';

jest.mock('@shell/utils/aes-encrypt', () => {
  return {
    __esModule: true,
    default:    jest.fn()
  };
});

describe('component: form/ChangePassword', () => {
  it('shold not encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'true' } };

    ChangePassword.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledTimes(0);
  });
  it('shold encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'false' } };

    ChangePassword.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });

  it('should call encryptPassword method when set password', async() => {
    const encryptPasswordMock = jest.fn();

    const localThis = {
      disabledEncryption: { value: 'false' },
      $store:             { dispatch: jest.fn() },
      form:               {
        genP: 'test',
        newP: 'test',
      },
      encryptPassword: encryptPasswordMock
    };

    const btnCbMock = jest.fn();

    await ChangePassword.methods.setPassword.call(localThis, btnCbMock);

    expect(encryptPasswordMock).toHaveBeenCalledTimes(1);
  });

  it('should call encryptPassword method when change password', async() => {
    const encryptPasswordMock = jest.fn();

    const localThis = {
      disabledEncryption: { value: 'false' },
      $store:             { dispatch: jest.fn() },
      form:               {
        genP:     'test',
        newP:     'test',
        currentP: 'test'
      },
      encryptPassword: encryptPasswordMock
    };

    const btnCbMock = jest.fn();

    await ChangePassword.methods.changePassword.call(localThis, btnCbMock);

    expect(encryptPasswordMock).toHaveBeenCalledTimes(2);
  });

  it('should contian PasswordStrength component', () => {
    const wrapper = shallowMount(ChangePassword, { computed: { 'i18n/t': jest.fn() } });

    expect(wrapper.findComponent(PasswordStrength).exists()).toBe(true);
  });
});
