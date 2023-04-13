import User from '@shell/edit/management.cattle.io.user.vue';
import AESEncrypt from '@shell/utils/aes-encrypt';

jest.mock('@shell/utils/aes-encrypt', () => {
  return {
    __esModule: true,
    default:    jest.fn()
  };
});

describe('edit: management.cattle.io.user', () => {
  it('shold not encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'true' } };

    User.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledTimes(0);
  });
  it('shold encrypt password', () => {
    const localThis = { disabledEncryption: { value: 'false' } };

    User.methods.encryptPassword.call(localThis, 'test');
    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });

  it('should call encryptPassword method', async() => {
    const encryptPasswordMock = jest.fn();
    const testUser = {
      username: 'test',
      save:     jest.fn(() => ({ id: 'test' }))
    };
    const dispatchMock = jest.fn().mockImplementationOnce(() => [])
      .mockImplementationOnce(() => testUser);

    const localThis = {
      disabledEncryption: { value: 'false' },
      $store:             { dispatch: dispatchMock },
      passwordStrength:   3,
      form:               { password: { userChangeOnLogin: true } },
      encryptPassword:    encryptPasswordMock
    };

    await User.methods.createUser.call(localThis);

    expect(encryptPasswordMock).toHaveBeenCalledTimes(1);
  });
});
