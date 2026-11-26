import path from 'path';
import vueConfig from '@shell/vue.config';

const ROOT = path.resolve(__dirname, '../..');

describe('vue.config dev server', () => {
  const originalWsPort = process.env.DEV_WS_PORT;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {}); // eslint-disable-line no-console
    delete process.env.DEV_WS_PORT;
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalWsPort === undefined) {
      delete process.env.DEV_WS_PORT;
    } else {
      process.env.DEV_WS_PORT = originalWsPort;
    }
  });

  describe('hot reload websocket', () => {
    it('uses the page\'s own port when DEV_WS_PORT is not set', () => {
      const { devServer } = vueConfig(ROOT);

      expect(devServer.client.webSocketURL.port).toStrictEqual(0);
    });

    it('uses DEV_WS_PORT when it is set', () => {
      process.env.DEV_WS_PORT = '8005';

      const { devServer } = vueConfig(ROOT);

      expect(devServer.client.webSocketURL.port).toStrictEqual('8005');
    });

    it('uses the page\'s hostname', () => {
      const { devServer } = vueConfig(ROOT);

      expect(devServer.client.webSocketURL.hostname).toStrictEqual('0.0.0.0');
    });
  });
});
