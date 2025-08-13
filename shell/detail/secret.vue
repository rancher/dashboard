<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import SecretDataTab from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/index.vue';
import KnownHostsTab from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/index.vue';
import { useGetKnownHostsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/composables';
import { useSecretDataTabDefaultProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/composeables';
import { useStore } from 'vuex';
import { computed } from 'vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';

const store = useStore();

export interface Props {
  value: any;
}
const props = defineProps<Props>();
const schema = computed(() => store.getters['cluster/schemaFor'](SECRET));
const secret = props.value;

if (secret.isProjectScoped) {
  store.dispatch('management/find', { id: secret.projectId, type: MANAGEMENT.PROJECT });
}

const defaultMastheadProps = useDefaultMastheadProps(secret);
const knownHostsTabProps = useGetKnownHostsTabProps(secret);
const secretDataTabProps = useSecretDataTabDefaultProps(secret);

</script>
<template>
  <DetailPage>
    <template #top-area>
      <Masthead v-bind="defaultMastheadProps" />
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
