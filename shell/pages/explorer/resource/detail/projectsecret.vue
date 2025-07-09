<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useBasicMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import SecretDataTab from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/index.vue';
import KnownHostsTab from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/index.vue';
import { useGetKnownHostsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/composables';
import { useSecretDataTabDefaultProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/composeables';
import { useProjectSecretIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useStore } from 'vuex';

const store = useStore();

const { id, schema } = useResourceIdentifiers(SECRET);
const secret = await useFetchResourceWithId(SECRET, id);

// We need to request the project associated with the secret to display the metadata for it.
// We probably shouldn't use findall but there appeared to be something odd going on with the model not finding the id when I used management/find.
await store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
const titleBarProps = useDefaultTitleBarProps(secret);
const identifyingInformation = useProjectSecretIdentifyingInformation(secret);
const metaDataProps = useBasicMetadata(secret);
const knownHostsTabProps = useGetKnownHostsTabProps(secret);
const secretDataTabProps = useSecretDataTabDefaultProps(secret);
</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar
        v-bind="titleBarProps"
      />
      <Metadata
        class="mmt-6"
        v-bind="metaDataProps"
        :identifying-information="identifyingInformation"
      />
    </template>
    <template #bottom-area>
      <ResourceTabs
        :value="secret"
        :schema="schema"
      >
        <SecretDataTab
          v-bind="secretDataTabProps"
          :weight="1"
        />
        <KnownHostsTab
          v-if="knownHostsTabProps"
          v-bind="knownHostsTabProps"
          :weight="0"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
