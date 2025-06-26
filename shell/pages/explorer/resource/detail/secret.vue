<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadataProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { SECRET } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import SecretDataTab from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/index.vue';
import KnownHostsTab from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/index.vue';
import { useGetKnownHostsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/composables';
import { useSecretDataTabDefaultProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/composeables';
import { useSecretIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';

const { id, schema } = useResourceIdentifiers(SECRET);
const secret = await useFetchResourceWithId(SECRET, id);
const titleBarProps = useDefaultTitleBarProps(secret);
const additionalIdentifyingInformation = useSecretIdentifyingInformation(secret);
const metaDataProps = useDefaultMetadataProps(secret, additionalIdentifyingInformation);
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
