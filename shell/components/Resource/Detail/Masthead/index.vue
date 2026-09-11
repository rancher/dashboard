<script lang="ts">
import TitleBar, { TitleBarProps } from '@shell/components/Resource/Detail/TitleBar/index.vue';
import Metadata, { MetadataProps } from '@shell/components/Resource/Detail/Metadata/index.vue';
import Cards from '@shell/components/Resource/Detail/Cards.vue';

export interface MastheadProps {
  titleBarProps?: TitleBarProps;
  metadataProps?: MetadataProps;
}
</script>

<script setup lang="ts">
const props = defineProps<MastheadProps>();

</script>
<template>
  <div class="masthead">
    <TitleBar
      v-if="props.titleBarProps"
      v-bind="props.titleBarProps"
    >
      <template
        v-if="$slots['additional-actions']"
        #additional-actions
      >
        <slot name="additional-actions" />
      </template>
    </TitleBar>
    <!--
      Optional banner between the title and the metadata - the slot a page uses to surface a state
      error the way the legacy masthead did. The new masthead has no banner of its own, so adopters
      pass one in here (see useResourceDetailBannerProps).
    -->
    <slot name="banner" />
    <Metadata
      v-if="props.metadataProps"
      class="metadata-section"
      v-bind="props.metadataProps"
    />
    <Cards
      v-if="props.titleBarProps"
      class="cards-section"
      :resource="props.titleBarProps.resource"
    />
  </div>
</template>

<style lang='scss' scoped>
.masthead {
  :deep() .metadata-section {
    margin-top: 16px;
    margin-bottom: 24px;
  }

  .cards-section {
    margin: 0;
    margin-bottom: 24px;
  }
}
</style>
