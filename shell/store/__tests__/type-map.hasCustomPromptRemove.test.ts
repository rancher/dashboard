import { getters } from '@shell/store/type-map';

const mockResolveCustomPromptRemove = jest.fn();

// type-map resolves every "does @shell have a custom component for this type?" question through
// dynamic-importer, so that an extension library build can swap the whole module for a stub and
// keep @shell's components out of the extension bundle. Mocked here to drive both outcomes.
jest.mock('@shell/utils/dynamic-importer', () => ({
  importChart:                     jest.fn(),
  importCloudCredential:           jest.fn(),
  importCustomPromptRemove:        jest.fn(),
  importDetail:                    jest.fn(),
  importDialog:                    jest.fn(),
  importEdit:                      jest.fn(),
  importList:                      jest.fn(),
  importLogin:                     jest.fn(),
  importMachineConfig:             jest.fn(),
  importWindowComponent:           jest.fn(),
  listProducts:                    jest.fn(() => []),
  loadProduct:                     jest.fn(),
  resolveChart:                    jest.fn(),
  resolveCloudCredentialComponent: jest.fn(),
  resolveCustomPromptRemove:       (key: string) => mockResolveCustomPromptRemove(key),
  resolveDetail:                   jest.fn(),
  resolveEdit:                     jest.fn(),
  resolveList:                     jest.fn(),
  resolveMachineConfigComponent:   jest.fn(),
  resolveWindowComponent:          jest.fn(),
}));

describe('getter: hasCustomPromptRemove', () => {
  const TYPE = 'some.resource.type';

  function hasCustomPromptRemove({ resolver, extensionComponent }: { resolver?: () => unknown, extensionComponent?: unknown } = {}) {
    if (resolver) {
      mockResolveCustomPromptRemove.mockImplementation(resolver);
    }

    const state = { cache: { promptRemove: {} } } as any;
    const typeMapGetters = { componentFor: () => TYPE } as any;
    const rootState = { $extension: { getDynamic: () => extensionComponent } } as any;

    return getters.hasCustomPromptRemove(state, typeMapGetters, rootState)(TYPE);
  }

  beforeEach(() => {
    mockResolveCustomPromptRemove.mockReset();
  });

  it('should report a custom prompt when @shell provides a component for the type', () => {
    const result = hasCustomPromptRemove({ resolver: () => '/resolved/module/id' });

    expect(result).toBe(true);
    expect(mockResolveCustomPromptRemove).toHaveBeenCalledWith(TYPE);
  });

  it('should report no custom prompt when the component cannot be resolved', () => {
    const result = hasCustomPromptRemove({
      resolver: () => {
        throw new Error('Cannot find module');
      }
    });

    expect(result).toBe(false);
    expect(mockResolveCustomPromptRemove).toHaveBeenCalledWith(TYPE);
  });

  it('should report a custom prompt provided by an extension without consulting @shell', () => {
    const result = hasCustomPromptRemove({ extensionComponent: { name: 'ExtensionPromptRemove' } });

    expect(result).toBe(true);
    expect(mockResolveCustomPromptRemove.mock.calls).toStrictEqual([]);
  });
});
