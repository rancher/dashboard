import { useDefaultConfigTabProps, useDefaultYamlTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/composables';
import * as helpers from '@shell/components/Drawer/ResourceDetailDrawer/helpers';
import * as vuex from 'vuex';

jest.mock('@shell/components/Drawer/ResourceDetailDrawer/helpers');
jest.mock('vuex');
jest.mock('@shell/composables/drawer');
jest.mock('@shell/components/Drawer/ResourceDetailDrawer/index.vue', () => ({ name: 'ResourceDetailDrawer' } as any));

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
});
