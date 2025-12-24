<script lang="ts">
/* eslint-disable */
import { Banner } from '@components/Banner';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadataForLegacyPagesProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { useResourceDetailBannerProps } from '@shell/components/Resource/Detail/composables';
import { computed } from 'vue';

// We are disabling eslint for this script to allow the use of the Props interface
export interface Props {
  value?: Object;
  resourceSubtype?: string;
}

</script>

<script lang="ts" setup>
import { useStore } from 'vuex';

const props = withDefaults(defineProps<Props>(), { value: () => ({}), resourceSubtype: undefined });

const uiCtxResource = computed(() => {
  const {
    name, metadata, kind, state
  } = (props.value || {}) as any;

  return {
    name,
    namespace: metadata?.namespace,
    kind,
    state,
  };
});
const resourceSubtype = computed(() => props.resourceSubtype);
const titleBarProps = useDefaultTitleBarProps(props.value, resourceSubtype);
const metadataProps = useDefaultMetadataForLegacyPagesProps(props.value);
const bannerProps = useResourceDetailBannerProps(props.value);

const store = useStore();
</script>

<template>
  <div>
    <TitleBar v-bind="titleBarProps" />
    <Banner
      v-if="bannerProps"
      v-ui-context="{
        store: store,
        icon: 'icon-info',
        hookable: true,
        value: {
          bannerProps,
          resource: uiCtxResource
        },
        tag: '__details-state-banner',
        description: 'Status Message'
      }"
      class="new state-banner"
      v-bind="bannerProps"
    />
    <Metadata
      v-bind="metadataProps"
      class="mmt-4"
    />
  </div>
</template>

<style lang="scss" scoped>
.new.state-banner {
  margin: 0;
  margin-top: 16px;
}
</style>
