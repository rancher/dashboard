import { tryInitialSetup, encryptPassword } from '@shell/middleware/authenticated.js';
import AESEncrypt from '@shell/utils/aes-encrypt';

jest.mock('@shell/utils/aes-encrypt', () => {
  return {
    __esModule: true,
    default:    jest.fn()
  };
});

describe('middleware: authenticated', () => {
  it('shold not encrypt password', () => {
    const store = {
      getters: {
        'management/byId'() {
          return { value: 'true' };
        }
      }
    };

    encryptPassword(store, 'test');
    expect(AESEncrypt).toHaveBeenCalledTimes(0);
  });
  it('shold encrypt password', () => {
    const store = {
      getters: {
        'management/byId'() {
          return { disabledEncryption: { value: 'false' } };
        }
      }
    };

    encryptPassword(store, 'test');
    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });

  it('should call encryptPassword method', async() => {
    const dispatchMock = jest.fn(() => ({ _status: 200 }));
    const gettersModck = jest.fn(() => {
      return {
        'management/byId'() {
          return { value: 'false' };
        }
      };
    });
    const store = {
      dispatch: dispatchMock,
      getters:  gettersModck
    };

    await tryInitialSetup(store, 'test');

    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });
  it('should not call encryptPassword method', async() => {
    const dispatchMock = jest.fn(() => ({ _status: 200 }));
    const gettersModck = jest.fn(() => {
      return {
        'management/byId'() {
          return { value: 'true' };
        }
      };
    });
    const store = {
      dispatch: dispatchMock,
      getters:  gettersModck
    };

    await tryInitialSetup(store, 'test');

    expect(AESEncrypt).toHaveBeenCalledWith('test');
  });
});
