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
import { useSecretIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useStore } from 'vuex';

export interface Props {
  isProjectSecret?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isProjectSecret: false });
const store = useStore();

const { id, schema } = useResourceIdentifiers(SECRET);
const targetStore = props.isProjectSecret ? 'management' : 'cluster';
const secret = await useFetchResourceWithId(SECRET, id, targetStore);

if (props.isProjectSecret) {
  await store.dispatch('management/find', { id: secret.projectId, type: MANAGEMENT.PROJECT });
}

const titleBarProps = useDefaultTitleBarProps(secret);
const identifyingInformation = useSecretIdentifyingInformation(secret, props.isProjectSecret);
const metaDataProps = useBasicMetadata(secret);
const knownHostsTabProps = useGetKnownHostsTabProps(secret);
const secretDataTabProps = useSecretDataTabDefaultProps(secret);
</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar v-bind="titleBarProps" />
      <Metadata
        class="mmt-6"
        v-bind="metaDataProps"
        :identifyingInformation="identifyingInformation"
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
