import { useDefaultMetadataForLegacyPagesProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import { MastheadProps } from '@shell/components/Resource/Detail/Masthead/index.vue';
import { computed, Ref } from 'vue';

export const useDefaultMastheadProps = (resource: any): Ref<MastheadProps> => {
  const titleBarProps = useDefaultTitleBarProps(resource);
  const metadataProps = useDefaultMetadataForLegacyPagesProps(resource);

  return computed(() => {
    return {
      titleBarProps: titleBarProps.value,
      metadataProps: metadataProps.value,
    };
  });
};
