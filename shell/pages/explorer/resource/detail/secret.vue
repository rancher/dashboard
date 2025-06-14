<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { SECRET } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import { computed } from 'vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import SecretDataTab from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/index.vue';
import KnownHostsTab from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/index.vue';
import { SECRET_TYPES } from '@shell/config/secret';

const { id, schema } = useResourceIdentifiers(SECRET);
const secret = await useFetchResourceWithId(SECRET, id);
const titleBarProps = useDefaultTitleBarData(secret);

const relatedResources = await useFetchRelatedResourcesTab(secret);

const { labels, annotations, identifyingInformation } = useDefaultMetadata(secret);

const isSsh = computed(() => {
  return secret.value._type === SECRET_TYPES.SSH;
});

const showKnownHosts = computed(() => {
  return isSsh.value && secret.value.supportsSshKnownHosts;
});

// const knownHostsTab = await useFetchDefaultKnownHostsTabProps(secret);
</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar v-bind="titleBarProps" />
      <Metadata
        class="mmt-6"
        :identifying-information="identifyingInformation"
        :labels="labels"
        :annotations="annotations"
      />
    </template>
    <template #bottom-area>
      <ResourceTabs
        :value="secret"
        :schema="schema"
        :related-resources="relatedResources"
      >
        <SecretDataTab
          :secret="secret"
          :weight="1"
        />
        <KnownHostsTab
          v-if="showKnownHosts"
          :secret="secret"
          :weight="0"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
