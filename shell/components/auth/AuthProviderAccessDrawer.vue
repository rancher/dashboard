<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import AsyncButton, { AsyncButtonCallback } from '@shell/components/AsyncButton.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import Loading from '@shell/components/Loading.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals.vue';
import AuthProviderDetails from '@shell/components/auth/AuthProviderDetails.vue';
import AuthProviderLogo from '@shell/components/auth/AuthProviderLogo.vue';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useI18n } from '@shell/composables/useI18n';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { configTypeForProvider } from '@shell/models/management.cattle.io.authconfig';
import { exceptionToErrorsArray } from '@shell/utils/error';

export interface AuthProviderResource {
  id: string;
  nameDisplay: string;
  icon?: string;
  canUpdate?: boolean;
}

const props = defineProps<{ resource: AuthProviderResource }>();
const emit = defineEmits(['close']);

const store = useStore();
const i18n = useI18n(store);

const fetch = useFetch(async() => {
  await store.dispatch('rancher/findAll', {
    type: NORMAN.PRINCIPAL,
    opt:  { url: '/v3/principals', force: true },
  }).catch(() => undefined);

  const norman = await store.dispatch('rancher/find', {
    type: NORMAN.AUTH_CONFIG,
    id:   props.resource.id,
    opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ props.resource.id }`, force: true },
  });

  return await store.dispatch('rancher/clone', { resource: norman });
});

const saveErrors = ref<string[]>([]);

const model = computed(() => fetch.value.data);
const title = computed(() => i18n.t('authConfig.access.title', { provider: props.resource.nameDisplay }));
const mode = computed(() => (props.resource.canUpdate === false ? _VIEW : _EDIT));
const errors = computed(() => [
  ...(fetch.value.error ? exceptionToErrorsArray(fetch.value.error) : []),
  ...saveErrors.value,
]);

const save = async(btnCb: AsyncButtonCallback) => {
  saveErrors.value = [];

  try {
    if (configTypeForProvider(props.resource.id) === 'oauth') {
      await model.value.save({ ignoreFields: ['oauthCredential', 'serviceAccountCredential'] });
    } else {
      await model.value.save();
    }

    btnCb(true);
    emit('close');
  } catch (e) {
    saveErrors.value = exceptionToErrorsArray(e);
    btnCb(false);
  }
};
</script>

<template>
  <Drawer
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      <AuthProviderLogo
        :icon="resource.icon"
        size="small"
        class="title-logo"
      />
      {{ title }}
    </template>
    <template #body>
      <AuthProviderDetails
        v-if="model"
        :config="model"
        :name="resource.nameDisplay"
      />
      <DrawerCard data-testid="auth-provider-access-form">
        <Loading
          v-if="fetch.loading"
          mode="relative"
        />
        <Banner
          v-for="(error, i) in errors"
          :key="i"
          color="error"
          :label="error"
        />
        <AllowedPrincipals
          v-if="model"
          :provider="resource.id"
          :auth-config="model"
          :mode="mode"
          :stacked="true"
          :append-search-to-body="false"
          data-testid="auth-provider-access-principals"
        />
      </DrawerCard>
    </template>
    <template #additional-actions>
      <AsyncButton
        v-if="model && mode === 'edit'"
        mode="edit"
        data-testid="auth-provider-access-save"
        @click="save"
      />
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
.title-logo {
  margin-right: 8px;
}
</style>
