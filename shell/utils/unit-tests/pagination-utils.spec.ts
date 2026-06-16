import { STEVE_CACHE } from '@shell/store/features';
import { SETTING } from '@shell/config/settings';
import { EXT_IDS } from '@shell/core/plugin';
import { PaginationResourceContext } from '@shell/types/store/pagination.types';
import { PaginationSettings, PaginationSettingsStore } from '@shell/types/resources/settings';
import paginationUtils from '@shell/utils/pagination-utils';

describe('pagination-utils', () => {
  describe('isEnabledInStore', () => {
    const mockRootGetters = {
      'type-map/configuredHeaders':           jest.fn(),
      'type-map/configuredPaginationHeaders': jest.fn(),
      'type-map/hasCustomList':               jest.fn(),
    };

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return false if no store settings are provided', () => {
      const result = paginationUtils.isEnabledInStore({
        ctx:           { rootGetters: mockRootGetters },
        storeSettings: undefined as unknown as PaginationSettingsStore,
        enabledFor:    { store: 'cluster' }
      });

      expect(result).toBe(false);
    });

    it('should return true if no specific resource is being checked', () => {
      const storeSettings: PaginationSettingsStore = { resources: {} };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster' }
      });

      expect(result).toBe(true);
    });

    it('should return true if enableAll is true for the store', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableAll: true } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(true);
    });

    it('should return false if a resource is checked but has no id', () => {
      const storeSettings: PaginationSettingsStore = { resources: {} };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: undefined as unknown as string } }
      });

      expect(result).toBe(false);
    });

    it('should return true for a generic resource when generic is enabled', () => {
      mockRootGetters['type-map/configuredHeaders'].mockReturnValue(false);
      mockRootGetters['type-map/configuredPaginationHeaders'].mockReturnValue(false);
      mockRootGetters['type-map/hasCustomList'].mockReturnValue(false);

      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { generic: true } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(true);
    });

    it('should return false for a non-generic resource when only generic is enabled', () => {
      mockRootGetters['type-map/hasCustomList'].mockReturnValue(true);

      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { generic: true } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(false);
    });

    it('should return true if resource id is in enabled list as a string', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { enabled: ['pod'] } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(true);
    });

    it('should return true if resource id is in enabled list as an object without context', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { enabled: [{ resource: 'pod' }] } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(true);
    });

    it('should return false if resource id is in enabled list as an object with empty context', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { enabled: [{ resource: 'pod', context: [] }] } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod' } }
      });

      expect(result).toBe(false);
    });

    it('should return true if resource id and context match an enabled setting', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { enabled: [{ resource: 'pod', context: ['list'] }] } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod', context: 'list' } }
      });

      expect(result).toBe(true);
    });

    it('should return false if resource context does not match enabled setting', () => {
      const storeSettings: PaginationSettingsStore = { resources: { enableSome: { enabled: [{ resource: 'pod', context: ['detail'] }] } } };
      const result = paginationUtils.isEnabledInStore({
        ctx:        { rootGetters: mockRootGetters },
        storeSettings,
        enabledFor: { store: 'cluster', resource: { id: 'pod', context: 'list' } }
      });

      expect(result).toBe(false);
    });
  });

  describe('isEnabled', () => {
    let mockRootGetters: any;
    let mockPlugin: any;
    let enabledFor: PaginationResourceContext;

    beforeEach(() => {
      enabledFor = { store: 'cluster', resource: { id: 'pod' } };
      mockPlugin = { getAll: jest.fn().mockReturnValue({}) };
      mockRootGetters = {
        'features/get':                         jest.fn(),
        'management/byId':                      jest.fn(),
        'type-map/configuredHeaders':           jest.fn().mockReturnValue(false),
        'type-map/configuredPaginationHeaders': jest.fn().mockReturnValue(false),
        'type-map/hasCustomList':               jest.fn().mockReturnValue(false),
      };
    });

    it('should return false if steve cache is disabled', () => {
      mockRootGetters['features/get'].mockImplementation((feature: string) => feature === STEVE_CACHE ? false : undefined);
      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(false);
    });

    it('should return false if pagination settings are not defined', () => {
      jest.spyOn(paginationUtils, 'getSettings').mockReturnValue(undefined);
      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(false);

      jest.clearAllMocks();
    });

    it('should return false if enabledFor is not provided', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const settings: PaginationSettings = { useDefaultStores: true };

      mockRootGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (type === 'management.cattle.io.setting' && id === SETTING.UI_PERFORMANCE) {
          return { value: JSON.stringify({ serverPagination: settings }) };
        }

        return null;
      });

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, undefined as unknown as PaginationResourceContext);

      expect(result).toBe(false);
    });

    it('should return true if an extension enables the resource', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const extensionSettings = { cluster: { resources: { enableAll: true } } };

      mockPlugin.getAll.mockReturnValue({ [EXT_IDS.SERVER_SIDE_PAGINATION_RESOURCES]: { 'my-ext': () => extensionSettings } });

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(true);
    });

    it('should still return true if an extension enables the resource but core store does not', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const extensionSettings = { cluster: { resources: { enableAll: true } } };
      const defaultSettings = { cluster: { resources: { enableAll: false, enableSome: { enabled: [] } } } };

      mockPlugin.getAll.mockReturnValue({ [EXT_IDS.SERVER_SIDE_PAGINATION_RESOURCES]: { 'my-ext': () => extensionSettings } });

      // Mocking PAGINATION_SETTINGS_STORE_DEFAULTS behavior
      jest.spyOn(paginationUtils, 'getStoreDefault').mockReturnValue(defaultSettings);

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(true);
    });

    it('should use default store settings and enable the resource', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const settings: PaginationSettings = { useDefaultStores: true };

      mockRootGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (type === 'management.cattle.io.setting' && id === SETTING.UI_PERFORMANCE) {
          return { value: JSON.stringify({ serverPagination: settings }) };
        }

        return null;
      });

      // Mocking PAGINATION_SETTINGS_STORE_DEFAULTS behavior
      jest.spyOn(paginationUtils, 'getStoreDefault').mockReturnValue({ cluster: { resources: { enableAll: true } } });

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(true);
    });

    it('should use custom store settings and enable the resource', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const settings: PaginationSettings = {
        useDefaultStores: false,
        stores:           { cluster: { resources: { enableSome: { enabled: ['pod'] } } } }
      };

      mockRootGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (type === 'management.cattle.io.setting' && id === SETTING.UI_PERFORMANCE) {
          return { value: JSON.stringify({ serverPagination: settings }) };
        }

        return null;
      });

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(true);
    });

    it('should return false if neither extension nor main settings enable the resource', () => {
      mockRootGetters['features/get'].mockReturnValue(true);
      const settings: PaginationSettings = {
        useDefaultStores: false,
        stores:           { cluster: { resources: { enableSome: { enabled: ['service'] } } } }
      };

      mockRootGetters['management/byId'].mockImplementation((type: string, id: string) => {
        if (type === 'management.cattle.io.setting' && id === SETTING.UI_PERFORMANCE) {
          return { value: JSON.stringify({ serverPagination: settings }) };
        }

        return null;
      });

      const result = paginationUtils.isEnabled({ rootGetters: mockRootGetters, $extension: mockPlugin }, enabledFor);

      expect(result).toBe(false);
    });
  });
});
