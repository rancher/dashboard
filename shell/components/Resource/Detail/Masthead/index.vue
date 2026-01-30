<script lang="ts">
import TitleBar, { TitleBarProps } from '@shell/components/Resource/Detail/TitleBar/index.vue';
import Metadata, { MetadataProps } from '@shell/components/Resource/Detail/Metadata/index.vue';
import Cards from '@shell/components/Resource/Detail/Cards.vue';

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
    <Cards
      class="mb-20"
      :resource="props.titleBarProps.resource"
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
