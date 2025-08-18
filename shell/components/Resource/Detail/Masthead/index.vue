<script lang="ts">
import TitleBar, { TitleBarProps } from '@shell/components/Resource/Detail/TitleBar/index.vue';
import Metadata, { MetadataProps } from '@shell/components/Resource/Detail/Metadata/index.vue';

export interface MastheadProps {
  titleBarProps: TitleBarProps;
  metadataProps: MetadataProps;
}
</script>

<script setup lang="ts">
const props = defineProps<MastheadProps>();

</script>
<template>
  <div class="masthead">
    <TitleBar v-bind="props.titleBarProps">
      <template
        v-if="$slots['additional-actions']"
        #additional-actions
      >
        <slot name="additional-actions" />
      </template>
    </TitleBar>
    <Metadata
      v-bind="props.metadataProps"
    />
  </div>
</template>

<style lang='scss' scoped>
.masthead {
    :deep().metadata {
        margin-top: 24px;
    }
}
</style>
