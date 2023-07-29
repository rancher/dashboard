export const addEventListener = jest.fn();
export const connect = jest.fn();
export const disconnect = jest.fn();
export const send = jest.fn();

export const EVENT_CONNECTED = 'connected';
export const EVENT_CONNECTING = 'connecting';
export const EVENT_DISCONNECTED = 'disconnected';
export const EVENT_MESSAGE = 'message';
export const EVENT_CONNECT_ERROR = 'connect_error';

const mock = jest.fn().mockImplementation(() => {
  return {
    addEventListener,
    connect,
    disconnect,
    send
  };
});

export default mock;
