import cookieStore from '../cookies';

// Mock cookie-universal
const mockCookie = {
  get:                  jest.fn(),
  set:                  jest.fn(),
  remove:               jest.fn(),
  getAll:               jest.fn(),
  addChangeListener:    jest.fn(),
  removeChangeListener: jest.fn()
};

jest.mock('cookie-universal', () => {
  return jest.fn(() => mockCookie);
});

describe('store: cookies', () => {
  let state: any;

  beforeEach(() => {
    state = cookieStore.state();
    // Reset mocks before each test
    mockCookie.get.mockClear();
    mockCookie.set.mockClear();
    mockCookie.remove.mockClear();
  });

  describe('getters', () => {
    it('get should call cookies.get with the correct parameters', () => {
      const { getters } = cookieStore;
      const key = 'test-key';
      const options = { from: 'server' };

      getters.get(state, {}, {}, {})({ key, options });
      expect(mockCookie.get).toHaveBeenCalledWith(key, options);
    });
  });

  describe('mutations', () => {
    it('set should call cookies.set with the correct parameters', () => {
      const { mutations } = cookieStore;
      const key = 'test-key';
      const value = { data: 'test-value' };
      const options = { path: '/' };

      mutations.set(state, {
        key, value, options
      });
      expect(mockCookie.set).toHaveBeenCalledWith(key, value, options);
    });

    it('remove should call cookies.remove with the correct key', () => {
      const { mutations } = cookieStore;
      const key = 'test-key';

      mutations.remove(state, { key });
      expect(mockCookie.remove).toHaveBeenCalledWith(key);
    });
  });

  describe('state', () => {
    it('should return a cookies object', () => {
      expect(state.cookies).toBeDefined();
    });
  });

  describe('namespaced', () => {
    it('should be namespaced', () => {
      expect(cookieStore.namespaced).toBe(true);
    });
  });
});
