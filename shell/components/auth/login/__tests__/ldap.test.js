import ldap from '@shell/components/auth/login/ldap.vue';
import AESEncrypt from '@shell/utils/aes-encrypt';

jest.mock('@shell/utils/aes-encrypt', () => {
  return {
    __esModule: true,
    default:    jest.fn()
  };
});

describe('component: auth/login/ldap', () => {
  it('shold not encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'true' } };

    ldap.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledTimes(0);
  });
  it('shold encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'false' } };

    ldap.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });

  it('should call encryptPassword method', async() => {
    const encryptPasswordMock = jest.fn();

    const localThis = {
      disabledEncryption: { value: 'false' },
      $store:             { dispatch: jest.fn() },
      $router:            {
        push:    jest.fn(),
        replace: jest.fn()
      },
      $cookies: {
        set:    jest.fn(),
        remove: jest.fn()
      },
      encryptPassword: encryptPasswordMock
    };

    const btnCbMock = jest.fn();

    await ldap.methods.login.call(localThis, btnCbMock);

    expect(encryptPasswordMock).toHaveBeenCalledTimes(1);
  });
});
