import { provide, inject } from 'vue';
import {
  useDefaultConfigTabProps, useDefaultYamlTabProps, useResourceDetailDrawer, useResourceDetailDrawerProvider, useIsInResourceDetailDrawer
} from '@shell/components/Drawer/ResourceDetailDrawer/composables';
import * as helpers from '@shell/components/Drawer/ResourceDetailDrawer/helpers';
import * as vuex from 'vuex';
import * as drawer from '@shell/composables/drawer';

jest.mock('@shell/components/Drawer/ResourceDetailDrawer/helpers');
jest.mock('vuex');
jest.mock('@shell/composables/drawer');
jest.mock('@shell/components/Drawer/ResourceDetailDrawer/index.vue', () => ({ name: 'ResourceDetailDrawer' } as any));
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  provide: jest.fn(),
  inject:  jest.fn()
}));

describe('composables: ResourceDetailDrawer', () => {
  const resource = { type: 'RESOURCE' };
  const yaml = 'YAML';

  describe('useDefaultYamlTabProps', () => {
    it('should return the appropriate values based on input', async() => {
      const getYamlSpy = jest.spyOn(helpers, 'getYaml').mockImplementation(() => Promise.resolve(yaml));
      const props = await useDefaultYamlTabProps(resource);

      expect(getYamlSpy).toHaveBeenCalledWith(resource);
      expect(props.yaml).toStrictEqual(yaml);
      expect(props.resource).toStrictEqual(resource);
    });
  });

  describe('useDefaultConfigTabProps', () => {
    const hasCustomEdit = jest.fn();
    const importEdit = jest.fn();
    const hasCustomDetail = jest.fn();
    const editComponent = { component: 'EDIT_COMPONENT' };
    const store: any = {
      getters: {
        'type-map/hasCustomEdit':   hasCustomEdit,
        'type-map/importEdit':      importEdit,
        'type-map/hasCustomDetail': hasCustomDetail,
      }
    };

    it('should return undefined if it does not have a customEdit', async() => {
      jest.spyOn(vuex, 'useStore').mockImplementation(() => store);
      const hasCustomEditSpy = hasCustomEdit.mockImplementation(() => false);
      const props = useDefaultConfigTabProps(resource);

      expect(hasCustomEditSpy).toHaveBeenCalledWith(resource.type);
      expect(props).toBeUndefined();
    });

    it('should return undefined if it does not have a customDetail', async() => {
      jest.spyOn(vuex, 'useStore').mockImplementation(() => store);
      const hasCustomEditSpy = hasCustomEdit.mockImplementation(() => true);
      const hasCustomDetailSpy = hasCustomDetail.mockImplementation(() => false);
      const props = useDefaultConfigTabProps(resource);

      expect(hasCustomEditSpy).toHaveBeenCalledWith(resource.type);
      expect(hasCustomDetailSpy).toHaveBeenCalledWith(resource.type);
      expect(props).toBeUndefined();
    });

    describe('useResourceDetailDrawerProvider', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should call provide with the correct key and value', () => {
        useResourceDetailDrawerProvider();

        expect(provide).toHaveBeenCalledWith('isInResourceDetailDrawerKey', true);
      });
    });

    describe('useIsInResourceDetailDrawer', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should call inject with the correct key and default value', () => {
        (inject as jest.Mock).mockReturnValue(false);

        const result = useIsInResourceDetailDrawer();

        expect(inject).toHaveBeenCalledWith('isInResourceDetailDrawerKey', false);
        expect(result).toBe(false);
      });

      it('should return true when inside a ResourceDetailDrawer', () => {
        (inject as jest.Mock).mockReturnValue(true);

        const result = useIsInResourceDetailDrawer();

        expect(result).toBe(true);
      });

      it('should return false when not inside a ResourceDetailDrawer', () => {
        (inject as jest.Mock).mockReturnValue(false);

        const result = useIsInResourceDetailDrawer();

        expect(result).toBe(false);
      });
    });

    it('should return undefined if resource disableResourceDetailDrawerConfigTab is true', async() => {
      jest.spyOn(vuex, 'useStore').mockImplementation(() => store);
      const hasCustomDetailSpy = hasCustomDetail.mockImplementation(() => false);
      const props = useDefaultConfigTabProps({ ...resource, disableResourceDetailDrawerConfigTab: true });

      expect(hasCustomDetailSpy).toHaveBeenCalledWith(resource.type);
      expect(props).toBeUndefined();
    });

    it('should return props if it has a customEdit', async() => {
      jest.spyOn(vuex, 'useStore').mockImplementation(() => store);
      const hasCustomEditSpy = hasCustomEdit.mockImplementation(() => true);
      const hasCustomDetailSpy = hasCustomDetail.mockImplementation(() => true);
      const importEditSpy = importEdit.mockImplementation(() => editComponent);
      const props = useDefaultConfigTabProps(resource);

      expect(hasCustomEditSpy).toHaveBeenCalledWith(resource.type);
      expect(hasCustomDetailSpy).toHaveBeenCalledWith(resource.type);
      expect(importEditSpy).toHaveBeenCalledWith(resource.type);
      expect(props?.component).toStrictEqual(editComponent);
      expect(props?.resource).toStrictEqual(resource);
    });
  });

  describe('useResourceDetailDrawer', () => {
    it('should create a wrapper that passes that appropriate properties to the drawer methods', () => {
      const openSpy = jest.fn();
      const closeSpy = jest.fn();
      const selector = '.selector';
      const useDrawerSpy = jest.spyOn(drawer, 'useDrawer').mockImplementation(() => ({ open: openSpy, close: closeSpy }));
      const resourceDetailDrawer = useResourceDetailDrawer();

      resourceDetailDrawer.openResourceDetailDrawer(resource, selector);

      expect(useDrawerSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith({ name: 'ResourceDetailDrawer' }, selector, {
        resource,
        onClose:            closeSpy,
        width:              '73%',
        // We want this to be full viewport height top to bottom
        height:             '100vh',
        top:                '0',
        'z-index':          101, // We want this to be above the main side menu
        closeOnRouteChange: ['name', 'params', 'query']
      });
    });
  });
});
