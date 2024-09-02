import { handleKubeApiHeaderWarnings } from '@shell/plugins/steve/header-warnings';
import { DEFAULT_PERF_SETTING } from '@shell/config/settings';

describe('steve: header-warnings', () => {
  // eslint-disable-next-line jest/no-hooks

  function setupMocks(settings = {
    separator:             '299 - ',
    notificationBlockList: ['299 - unknown field']
  }) {
    return {
      dispatch:     jest.fn(),
      consoleWarn:  jest.spyOn(console, 'warn').mockImplementation(),
      consoleDebug: jest.spyOn(console, 'debug').mockImplementation(),
      rootGetter:   {
        'management/byId': (resource: string, id: string): { value: string} => {
          return {
            value: JSON.stringify({
              ...DEFAULT_PERF_SETTING,
              kubeAPI: { warningHeader: settings }
            })
          };
        },
        'i18n/t': (key: string, { resourceType }: any) => {
          return `${ key }_${ resourceType }`;
        }
      }
    };
  }

  function createMockRes( headers = {}, data = { type: inputResourceType }) {
    return {
      headers, config: { url: 'unit/test' }, data
    };
  }

  function createGrowlResponse(message: string, action = updateKey) {
    return [
      'growl/warning',
      {
        message, timeout: 0, title: `${ action }_${ inputResourceType }`
      },
      { root: true }
    ];
  }

  function createConsoleResponse(warnings: string) {
    return `Validation Warnings for unit/test\n\n${ warnings }`;
  }

  const inputResourceType = 'abc';
  const updateKey = 'growl.kubeApiHeaderWarning.titleUpdate';
  const createKey = 'growl.kubeApiHeaderWarning.titleCreate';
  const podSecurity = '299 - would violate PodSecurity "restricted:latest": unrestricted capabilities (container "container-0" must set securityContext.capabilities.drop=["ALL"]), runAsNonRoot != true (container "container-0" must not set securityContext.runAsNonRoot=false), seccompProfile (pod or container "container-0" must set securityContext.seccompProfile.type to "RuntimeDefault" or "Localhost")';
  const deprecated = "299 - i'm deprecated";
  const validation = '299 - unknown field "spec.containers[0].__active"';

  describe('no warnings', () => {
    it('put, no header warning', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(createMockRes(),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true,
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).not.toHaveBeenCalled();
    });

    it('post, no header warning', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(createMockRes(),
        mocks.dispatch,
        mocks.rootGetter,
        'post',
        true,
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).not.toHaveBeenCalled();
    });

    it('patch, no header warning', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(createMockRes(),
        mocks.dispatch,
        mocks.rootGetter,
        'patch',
        true,
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).not.toHaveBeenCalled();
    });

    it('get, no header warning', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(createMockRes(),
        mocks.dispatch,
        mocks.rootGetter,
        'get',
        true,
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).not.toHaveBeenCalled();
    });

    it('get, warnings', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(createMockRes( { warnings: ['erg'] }),
        mocks.dispatch,
        mocks.rootGetter,
        'get',
        true,
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).not.toHaveBeenCalled();
    });

    it('blocked (via default config)', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: validation }),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(validation));
    });

    it('blocked (via custom config)', () => {
      const mocks = setupMocks({
        separator:             '299 - ',
        notificationBlockList: [deprecated]
      });

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: deprecated }),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(deprecated));
    });

    it('multi blocked (via custom config)', () => {
      const mocks = setupMocks({
        separator:             '299 - ',
        notificationBlockList: [deprecated, podSecurity]
      });

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: `${ deprecated },${ podSecurity }` }),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true
      );

      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(`${ deprecated }\n${ podSecurity }`));
    });
  });

  describe('warnings', () => {
    it('deprecated', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: deprecated }),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true,
      );

      expect(mocks.dispatch).toHaveBeenCalledWith(...createGrowlResponse(deprecated));
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(deprecated));
    });

    it('pod security', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: podSecurity }),
        mocks.dispatch,
        mocks.rootGetter,
        'post',
        true,
      );

      expect(mocks.dispatch).toHaveBeenCalledWith(...createGrowlResponse(podSecurity, createKey));
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(podSecurity));
    });

    it('deprecated & pod security', () => {
      const mocks = setupMocks();

      handleKubeApiHeaderWarnings(
        createMockRes({ warning: `${ deprecated },${ podSecurity }` }),
        mocks.dispatch,
        mocks.rootGetter,
        'put',
        true,
      );

      expect(mocks.dispatch).toHaveBeenCalledWith(...createGrowlResponse(`${ deprecated }, ${ podSecurity }` ));
      expect(mocks.consoleWarn).not.toHaveBeenCalled();
      expect(mocks.consoleDebug).toHaveBeenCalledWith(createConsoleResponse(`${ deprecated }\n${ podSecurity }`));
    });
  });
});
