import { mount, Wrapper } from '@vue/test-utils';
import ContainerShell from '@shell/components/nav/WindowManager/ContainerShell.vue';
import Socket, {
  addEventListener, EVENT_CONNECTED, EVENT_CONNECTING, EVENT_DISCONNECTED, EVENT_MESSAGE, EVENT_CONNECT_ERROR
} from '@shell/utils/socket';

jest.mock('@shell/utils/socket');
jest.mock('@shell/utils/crypto', () => {
  const originalModule = jest.requireActual('@shell/utils/crypto');

  return {
    __esModule:   true,
    ...originalModule,
    base64Decode: jest.fn().mockImplementation((str:String) => str)
  };
});

describe('component: ContainerShell', () => {
  const action = jest.fn();
  const translate = jest.fn();
  const schemaFor = jest.fn();
  const onData = jest.fn();
  const loadAddon = jest.fn();
  const open = jest.fn();
  const focus = jest.fn();
  const fit = jest.fn();
  const proposeDimensions = jest.fn().mockImplementation(() => {
    return { rows: 1 };
  });
  const write = jest.fn();
  const reset = jest.fn();

  jest.mock(/* webpackChunkName: "xterm" */ 'xterm', () => {
    return {
      Terminal: class {
        onData = onData;
        loadAddon = loadAddon;
        open = open;
        focus = focus;
        write = write;
        reset = reset
      }
    };
  });
  jest.mock(/* webpackChunkName: "xterm" */ 'xterm-addon-fit', () => {
    return {
      FitAddon: class {
        fit = fit
        proposeDimensions = proposeDimensions
      }
    };
  });

  const defaultContainerShellParams = {
    propsData: {
      tab:    {},
      active: true,
      height: 1000,
      pod:    {
        spec:  { nodeName: 'nodeId' },
        links: { view: 'url' },
        os:    'linux'
      },
      initialContainer: 'containerId'
    },
    stubs: ['resize-observer'],
    mocks: {
      $store: {
        dispatch: action,
        getters:  {
          'i18n/t':            translate,
          'cluster/schemaFor': schemaFor
        }
      }
    }
  };

  const resetMocks = () => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
    defaultContainerShellParams.propsData.pod.os = 'linux';
  };

  const wrapperPostMounted = async(params: Object) => {
    const wrapper = await mount(ContainerShell, params);

    // these awaits are all associated with the various async dyamic imports on xterm
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    return wrapper;
  };

  it.todo('test that we are calling the xterm terminal and fitAddon class method mocks correctly');

  it('creates a window on the page', async() => {
    resetMocks();
    const wrapper: Wrapper<InstanceType<typeof ContainerShell> & { [key: string]: any }> = await wrapperPostMounted(defaultContainerShellParams);
    const windowElement = wrapper.find('div.window');

    expect(windowElement.exists()).toBe(true);
  });

  it('the find action for the node is called if schemaFor finds a schema for NODE', async() => {
    resetMocks();
    const testSchemaFindsSchemaParams = {
      ...defaultContainerShellParams,
      mocks: {
        ...defaultContainerShellParams.mocks,
        $store: {
          ...defaultContainerShellParams.mocks.$store,
          getters: {
            ...defaultContainerShellParams.mocks.$store.getters,
            'cluster/schemaFor': jest.fn().mockImplementation(() => true)
          }
        }
      }
    };

    await wrapperPostMounted(testSchemaFindsSchemaParams);

    const actionParams = action.mock.calls[0];

    expect(action.mock.calls).toHaveLength(1);
    expect(actionParams[0]).toBe('cluster/find');
    expect(actionParams[1]).toStrictEqual({
      id:   'nodeId',
      type: 'node'
    });
  });

  it('the translate getter for the ...', async() => {
    resetMocks();
    await wrapperPostMounted(defaultContainerShellParams);
    const firstTranslate = translate.mock.calls[0];
    const secondTranslate = translate.mock.calls[1];

    expect(translate.mock.calls).toHaveLength(2);
    expect(firstTranslate[0]).toBe('wm.containerShell.clear');
    expect(firstTranslate[1]).toStrictEqual({});
    expect(secondTranslate[0]).toBe('wm.connection.disconnected');
    expect(secondTranslate[1]).toStrictEqual({});
  });

  it('the socket is instantiated', async() => {
    resetMocks();
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);

    const socketParams = Socket.mock.calls[0][0]
      .split('?')[1]
      .split('&')
      .reduce((paramMap: Object, param: [String, String]) => {
        const [key, value] = param.split('=');

        return {
          ...paramMap,
          [key]: decodeURIComponent(value)
        };
      }, {});

    expect(Socket.mock.calls).toHaveLength(1);
    expect(socketParams.command).toBe('TERM=xterm-256color; export TERM; [ -x /bin/bash ] && ([ -x /usr/bin/script ] && /usr/bin/script -q -c "/bin/bash" /dev/null || exec /bin/bash) || exec /bin/sh');
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the sockets events are bound', async() => {
    resetMocks();
    await wrapperPostMounted(defaultContainerShellParams);

    const addEventListenerCalls = addEventListener.mock.calls;

    expect(addEventListenerCalls).toHaveLength(5);
    expect(addEventListenerCalls[0][0]).toBe(EVENT_CONNECTING);
    expect(addEventListenerCalls[1][0]).toBe(EVENT_CONNECT_ERROR);
    expect(addEventListenerCalls[2][0]).toBe(EVENT_CONNECTED);
    expect(addEventListenerCalls[3][0]).toBe(EVENT_DISCONNECTED);
    expect(addEventListenerCalls[4][0]).toBe(EVENT_MESSAGE);
  });

  it('the socket connecting event sets data props correctly', async() => {
    resetMocks();
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];

    eventConnecting();

    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(true);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the socket connect error event sets data props correctly and calls the console', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);
    const errorMessage = 'eventConnectError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnectError = addEventListenerCalls[1][1];

    eventConnecting();
    eventConnectError(errorMessage);

    expect(consoleError.mock.calls[0][0]).toBe('Connect Error');
    expect(consoleError.mock.calls[0][1]).toBe(errorMessage);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the socket connected event sets data props correctly', async() => {
    resetMocks();
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];

    eventConnecting();
    eventConnected();

    expect(wrapper.vm.isOpen).toBe(true);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBe('linux');
  });

  it.todo('test that fit and flush are operating properly');
  it.todo('test that we are properly feeding the terminal the commandOnFirstConnect prop correctly on connected');

  it('the socket message event sets data props correctly', async() => {
    resetMocks();
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: '1noError' } });

    expect(wrapper.vm.isOpen).toBe(true);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the socket message event sets data props correctly and call the console on error', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);
    const errorMessage = 'eventMessageError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ errorMessage }` } });

    expect(consoleError.mock.calls[0][0]).toBe(errorMessage);
    expect(wrapper.vm.isOpen).toBe(true);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe(errorMessage);
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the socket disconnect event without an error sets data props correctly', async() => {
    resetMocks();
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    eventConnecting();
    eventConnected();
    eventDisconnected();

    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBe('linux');
  });

  it('the socket disconnect event with an error sets data props correctly and attempts a second connect', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const connect = jest.spyOn(ContainerShell.methods, 'connect');
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);
    const errorMessage = 'eventMessageError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    eventConnecting();
    eventConnected(); // for whatever reason, when this is called the mock on addEventListener doesn't clear it's calls...
    eventMessage({ detail: { data: `3${ errorMessage }` } });

    // we start with 2 backup shells but remove whichever one we already used
    expect(wrapper.vm.backupShells).toHaveLength(1);

    eventDisconnected();

    expect(consoleError.mock.calls[0][0]).toBe(errorMessage);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('eventMessageError');
    // the backup shell that was leftover was windows so it became the new os in dataprops
    expect(wrapper.vm.os).toBeUndefined();
    // but we still didn't write it to the pod itself since we don't know if it worked
    expect(defaultContainerShellParams.propsData.pod.os).toBeUndefined();
    // we can see here that we removed that last backup shell because we're attempting to use it now
    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(connect.mock.calls).toHaveLength(2);
  });

  it('the socket disconnect event fires twice, sets data props correctly, and only attempts two connects if the pod os is linux', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const connect = jest.spyOn(ContainerShell.methods, 'connect');
    const wrapper = await wrapperPostMounted(defaultContainerShellParams);
    const linuxErrorMessage = 'eventLinuxMessageError';
    const windowsErrorMessage = 'eventWindowsMessageError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    expect(wrapper.vm.backupShells).toHaveLength(1);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.os).toBeUndefined();
    // the pod os was 'linux' but we cleared it out since that didn't work
    expect(defaultContainerShellParams.propsData.pod.os).toBeUndefined();
    expect(connect.mock.calls).toHaveLength(2);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ windowsErrorMessage }` } });
    eventDisconnected();

    expect(consoleError.mock.calls[0][0]).toBe(linuxErrorMessage);
    expect(consoleError.mock.calls[1][0]).toBe(windowsErrorMessage);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe(windowsErrorMessage);
    expect(wrapper.vm.os).toBeUndefined();
    // we never found a shell that worked so we're going to leave the pod os as undefined
    expect(defaultContainerShellParams.propsData.pod.os).toBeUndefined();
    // we're out of backupShells now so we're not going to retry after that second disconnect
    expect(connect.mock.calls).toHaveLength(3);

    resetMocks();
  });

  it('the socket disconnect event fires twice, sets data props correctly, and only attempts two connects if the pod os is undefined', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const connect = jest.spyOn(ContainerShell.methods, 'connect');
    const testUndefinedOsParams = {
      ...defaultContainerShellParams,
      propsData: {
        ...defaultContainerShellParams.propsData,
        pod: {
          ...defaultContainerShellParams.propsData.pod,
          os: undefined
        }
      }
    };
    const wrapper = await wrapperPostMounted(testUndefinedOsParams);
    const linuxErrorMessage = 'eventLinuxMessageError';
    const windowsErrorMessage = 'eventWindowsMessageError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.os).toBe('linux');
    expect(testUndefinedOsParams.propsData.pod.os).toBeUndefined();

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.os).toBeUndefined();
    expect(testUndefinedOsParams.propsData.pod.os).toBeUndefined();

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ windowsErrorMessage }` } });
    eventDisconnected();

    expect(consoleError.mock.calls[0][0]).toBe(linuxErrorMessage);
    expect(consoleError.mock.calls[1][0]).toBe(windowsErrorMessage);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe(windowsErrorMessage);
    expect(wrapper.vm.os).toBeUndefined();
    expect(testUndefinedOsParams.propsData.pod.os).toBeUndefined();
    expect(connect.mock.calls).toHaveLength(3);

    resetMocks();
  });

  it('the socket disconnect event fires twice, sets data props correctly, and only attempts two connects, and sets the pod os if the pod os is initially undefined and connects on the second attempt', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const connect = jest.spyOn(ContainerShell.methods, 'connect');
    const testUndefinedOsParams = {
      ...defaultContainerShellParams,
      propsData: {
        ...defaultContainerShellParams.propsData,
        pod: {
          ...defaultContainerShellParams.propsData.pod,
          os: undefined
        }
      }
    };
    const wrapper = await wrapperPostMounted(testUndefinedOsParams);
    const linuxErrorMessage = 'eventLinuxMessageError';
    const windowsShellMessage = 'eventWindowsMessageShell';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    expect(wrapper.vm.backupShells).toHaveLength(1);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.os).toBeUndefined();
    expect(testUndefinedOsParams.propsData.pod.os).toBeUndefined();
    expect(wrapper.vm.errorMsg).toBe(linuxErrorMessage);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `1${ windowsShellMessage }` } });

    expect(consoleError.mock.calls[0][0]).toBe(linuxErrorMessage);
    expect(consoleError.mock.calls[1]).toBeUndefined();
    expect(wrapper.vm.isOpen).toBe(true);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe('');
    expect(wrapper.vm.os).toBeUndefined();
    // the second shell worked so we're going to set it on the pod itself so if we need to connect again we'll just use the correct shell on the first attempt
    expect(testUndefinedOsParams.propsData.pod.os).toBeUndefined();
    expect(connect.mock.calls).toHaveLength(2);

    resetMocks();
  });

  it('the socket disconnect event fires 3 times, sets data props correctly, and only attempts 3 connects if the pod os is defined at the pods parent node', async() => {
    resetMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const connect = jest.spyOn(ContainerShell.methods, 'connect');
    const testNodeDefinedOsParams = {
      ...defaultContainerShellParams,
      propsData: {
        ...defaultContainerShellParams.propsData,
        pod: {
          ...defaultContainerShellParams.propsData.pod,
          _os: 'linux',
          get os(): string {
            return 'linux';
          },
          set os(os: string) {
            this._os = os;
          }
        }
      }
    };

    const wrapper = await wrapperPostMounted(testNodeDefinedOsParams);
    const linuxErrorMessage = 'eventLinuxMessageError';

    const addEventListenerCalls = addEventListener.mock.calls;
    const eventConnecting = addEventListenerCalls[0][1];
    const eventConnected = addEventListenerCalls[2][1];
    const eventMessage = addEventListenerCalls[4][1];
    const eventDisconnected = addEventListenerCalls[3][1];

    expect(wrapper.vm.backupShells).toHaveLength(1);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    // the parent node's os overrides the _os field in the pod so it didn't change on the previous failure and we know it is correct, thus we're not burning down our backup shells and just retrying the same shell
    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.os).toBe('linux');
    expect(testNodeDefinedOsParams.propsData.pod.os).toBe('linux');
    expect(wrapper.vm.errorMsg).toBe(linuxErrorMessage);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe(linuxErrorMessage);
    expect(wrapper.vm.os).toBe('linux');
    expect(testNodeDefinedOsParams.propsData.pod.os).toBe('linux');
    expect(connect.mock.calls).toHaveLength(3);

    eventConnecting();
    eventConnected();
    eventMessage({ detail: { data: `3${ linuxErrorMessage }` } });
    eventDisconnected();

    expect(consoleError.mock.calls[0][0]).toBe(linuxErrorMessage);
    expect(consoleError.mock.calls[1][0]).toBe(linuxErrorMessage);
    expect(consoleError.mock.calls[2][0]).toBe(linuxErrorMessage);
    expect(wrapper.vm.backupShells).toHaveLength(1);
    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.vm.isOpening).toBe(false);
    expect(wrapper.vm.errorMsg).toBe(linuxErrorMessage);
    expect(wrapper.vm.os).toBe('linux');
    expect(testNodeDefinedOsParams.propsData.pod.os).toBe('linux');
    // at some point we have to stop retying and if we're not burning through backup shells, there's a retry limit of 2 for a total of 3 attempts
    expect(connect.mock.calls).toHaveLength(3);

    resetMocks();
  });
});
