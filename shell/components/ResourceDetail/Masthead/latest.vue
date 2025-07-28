<script lang="ts">
import { Banner } from '@components/Banner';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadataForLegacyPagesProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { useResourceDetailBannerProps } from '@shell/components/Resource/Detail/composables';
import { computed } from 'vue';

export interface Props {
  value?: Object;
  resourceSubtype?: string;
}

</script>

<script lang="ts" setup>
const props = withDefaults(defineProps<Props>(), { value: () => ({}), resourceSubtype: undefined });

const resourceSubtype = computed(() => props.resourceSubtype);
const titleBarProps = useDefaultTitleBarProps(props.value, resourceSubtype);
const metadataProps = useDefaultMetadataForLegacyPagesProps(props.value);
const bannerProps = useResourceDetailBannerProps(props.value);
</script>

<template>
  <TitleBar v-bind="titleBarProps" />
  <Banner
    v-if="bannerProps"
    class="new state-banner"
    v-bind="bannerProps"
  />
  <Metadata
    v-bind="metadataProps"
    class="mmt-4"
  />
</template>

<style lang="scss" scoped>
.new.state-banner {
  margin: 0;
  margin-top: 16px;
}
</style>
