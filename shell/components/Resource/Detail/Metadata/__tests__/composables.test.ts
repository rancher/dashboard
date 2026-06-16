import { useDefaultMetadataForLegacyPagesProps } from '@shell/components/Resource/Detail/Metadata/composables';
import * as IdentifyingFields from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields';
import { computed } from 'vue';

jest.mock('@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields');

describe('composables: Metadata/composables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useDefaultMetadataForLegacyPagesProps', () => {
    const useProjectSpy = jest.spyOn(IdentifyingFields, 'useProject');
    const useWorkspaceSpy = jest.spyOn(IdentifyingFields, 'useWorkspace');
    const useNamespaceSpy = jest.spyOn(IdentifyingFields, 'useNamespace');
    const useLiveDateSpy = jest.spyOn(IdentifyingFields, 'useLiveDate');
    const useResourceDetailsSpy = jest.spyOn(IdentifyingFields, 'useResourceDetails');

    it('should filter out undefined identifyingInformation', () => {
      const resource = {
        type:              'RESOURCE',
        annotations:       { annotation: 'ANNOTATION' },
        labels:            { label: 'LABEL' },
        showConfiguration: jest.fn()
      };
      const result = useDefaultMetadataForLegacyPagesProps(resource);

      result.value.onShowConfiguration();

      expect(result.value.annotations).toStrictEqual([{ key: 'annotation', value: resource.annotations.annotation }]);
      expect(result.value.labels).toStrictEqual([{ key: 'label', value: resource.labels.label }]);
      expect(result.value.identifyingInformation).toHaveLength(0);
      expect(resource.showConfiguration).toHaveBeenCalledTimes(1);
    });

    it('should fill identifyingInformation', () => {
      useProjectSpy.mockReturnValue(computed(() => ({ label: 'PROJECT' })));
      useWorkspaceSpy.mockReturnValue(computed(() => ({ label: 'WORKSPACE' })));
      useNamespaceSpy.mockReturnValue(computed(() => ({ label: 'NAMESPACE' })));
      useLiveDateSpy.mockReturnValue(computed(() => ({ label: 'LIVE_DATE' })));
      useResourceDetailsSpy.mockReturnValue(computed(() => [{ label: 'RESOURCE_DETAILS' }]));

      const resource = {
        type:              'RESOURCE',
        annotations:       { annotation: 'ANNOTATION' },
        labels:            { label: 'LABEL' },
        showConfiguration: jest.fn()
      };
      const result = useDefaultMetadataForLegacyPagesProps(resource);

      result.value.onShowConfiguration();

      expect(result.value.annotations).toStrictEqual([{ key: 'annotation', value: resource.annotations.annotation }]);
      expect(result.value.labels).toStrictEqual([{ key: 'label', value: resource.labels.label }]);
      expect(result.value.identifyingInformation).toStrictEqual([
        { label: 'PROJECT' },
        { label: 'WORKSPACE' },
        { label: 'NAMESPACE' },
        { label: 'LIVE_DATE' },
        { label: 'RESOURCE_DETAILS' }
      ]);
      expect(resource.showConfiguration).toHaveBeenCalledTimes(1);
    });
  });
});
