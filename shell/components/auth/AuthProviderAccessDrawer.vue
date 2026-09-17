<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import AsyncButton, { AsyncButtonCallback } from '@shell/components/AsyncButton.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import Loading from '@shell/components/Loading.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals.vue';
import { useI18n } from '@shell/composables/useI18n';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { configTypeForProvider } from '@shell/models/management.cattle.io.authconfig';
import { exceptionToErrorsArray } from '@shell/utils/error';

export interface AuthProviderResource {
  id: string;
  nameDisplay: string;
  canUpdate?: boolean;
}

const props = defineProps<{ resource: AuthProviderResource }>();
const emit = defineEmits(['close']);

const store = useStore();
const i18n = useI18n(store);

const model = ref<any>(null);
const errors = ref<string[]>([]);

const title = computed(() => i18n.t('authConfig.access.title', { provider: props.resource.nameDisplay }));
const mode = computed(() => (props.resource.canUpdate === false ? _VIEW : _EDIT));
const loading = computed(() => !model.value && !errors.value.length);

const save = async(btnCb: AsyncButtonCallback) => {
  errors.value = [];

  try {
    if (configTypeForProvider(props.resource.id) === 'oauth') {
      await model.value.save({ ignoreFields: ['oauthCredential', 'serviceAccountCredential'] });
    } else {
      await model.value.save();
    }

    btnCb(true);
    emit('close');
  } catch (e) {
    errors.value = exceptionToErrorsArray(e);
    btnCb(false);
  }
};

const load = async() => {
  try {
    const norman = await store.dispatch('rancher/find', {
      type: NORMAN.AUTH_CONFIG,
      id:   props.resource.id,
      opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ props.resource.id }`, force: true },
    });

    // Edited in place by the form, so it is a clone rather than the cached resource
    model.value = await store.dispatch('rancher/clone', { resource: norman });
  } catch (e) {
    errors.value = exceptionToErrorsArray(e);
  }
};

load();
</script>

<template>
  <Drawer
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      {{ title }}
    </template>
    <template #body>
      <DrawerCard>
        <Loading
          v-if="loading"
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
