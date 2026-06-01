<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { AUTH_TYPE, FLEET_APPCO_AUTH_GENERATE_NAME, SECRET } from '@shell/config/types';
import { CATALOG } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading';
import { RcButton } from '@components/RcButton';
import AppCoPageHeader from '@shell/components/fleet/AppCoPageHeader.vue';
import {
  createAppCoAuthSecret,
  ensureAppCoImagePullSecret,
  ensureAppCoClusterRepo,
} from '@shell/utils/fleet-appco';

const ADD_NEW_TOKEN = '__add_new__';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);

const loading = ref(true);
const saving = ref(false);
const createErrors = ref<string[]>([]);
const selectedSecret = ref('');
const username = ref('');
const accessToken = ref('');

const namespace = computed(() => store.getters.workspace);

const existingSecrets = computed(() => {
  const ns = namespace.value;
  const allSecrets = store.getters[`${ CATALOG._MANAGEMENT }/all`](SECRET) || [];

  return allSecrets.filter((s: any) => {
    return s.metadata?.namespace === ns &&
      s.metadata?.name?.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME) &&
      s._type === SECRET_TYPES.BASIC;
  });
});

const secretOptions = computed(() => {
  const existing = existingSecrets.value.map((s: any) => {
    const name = s.metadata.name;
    const user = s.decodedData?.username || '';
    const label = user ? `${ name } (HTTP Basic Auth: ${ user })` : `${ name } (HTTP Basic Auth)`;

    return { label, value: name };
  });

  const out: any[] = [
    {
      label: t('fleet.appCo.credentials.addNewToken'),
      value: ADD_NEW_TOKEN,
      kind:  'highlighted',
    },
  ];

  if (existing.length) {
    out.push({
      label:    'divider',
      disabled: true,
      kind:     'divider',
    });
    out.push({
      label:    t('fleet.appCo.credentials.chooseExisting'),
      disabled: true,
      kind:     'title',
    });
    out.push(...existing);
  }

  return out;
});

const isAddNew = computed(() => selectedSecret.value === ADD_NEW_TOKEN);
const hasNoSecrets = computed(() => !loading.value && existingSecrets.value.length === 0 && !route.query.secret);

const canSave = computed(() => {
  if (isAddNew.value) {
    return !!username.value && !!accessToken.value;
  }

  return !!selectedSecret.value;
});

const originalSecret = (route.query.secret as string) || '';

const cancel = () => {
  if (originalSecret) {
    router.push({
      name:   'c-cluster-fleet-application-appco-charts',
      params: { cluster: route.params.cluster as string },
      query:  { secret: originalSecret },
    });
  } else {
    router.push({
      name:   'c-cluster-fleet-application-create',
      params: { cluster: route.params.cluster as string },
    });
  }
};

const save = async() => {
  createErrors.value = [];
  saving.value = true;

  try {
    let secretName = selectedSecret.value;

    if (isAddNew.value) {
      const credentials = {
        selected:   AUTH_TYPE._BASIC,
        publicKey:  username.value,
        privateKey: accessToken.value,
      };

      const secret = await createAppCoAuthSecret(store, credentials, namespace.value);

      secretName = secret.metadata.name;
    }

    await Promise.all([
      ensureAppCoImagePullSecret(store, secretName, namespace.value),
      ensureAppCoClusterRepo(store, secretName, namespace.value, store.getters['i18n/t']),
    ]);

    router.push({
      name:   'c-cluster-fleet-application-appco-charts',
      params: { cluster: route.params.cluster as string },
      query:  { secret: secretName },
    });
  } catch (e: any) {
    const msg = e?.message || String(e);

    createErrors.value = [msg];
  } finally {
    saving.value = false;
  }
};

onMounted(async() => {
  try {
    if (store.getters[`${ CATALOG._MANAGEMENT }/schemaFor`](SECRET)) {
      await store.dispatch(`${ CATALOG._MANAGEMENT }/findAll`, { type: SECRET });
    }
  } finally {
    loading.value = false;
  }

  const querySecret = route.query.secret as string;

  if (querySecret && existingSecrets.value.find((s: any) => s.metadata.name === querySecret)) {
    selectedSecret.value = querySecret;
  } else if (existingSecrets.value.length && !querySecret) {
    router.replace({
      name:   'c-cluster-fleet-application-appco-charts',
      params: { cluster: route.params.cluster as string },
      query:  { secret: existingSecrets.value[0].metadata.name },
    });
  } else if (!existingSecrets.value.length) {
    selectedSecret.value = ADD_NEW_TOKEN;
  }
});
</script>

<template>
  <Loading v-if="loading" />

  <div
    v-else
    class="appco-credentials-page"
  >
    <div class="appco-credentials-page-content">
      <AppCoPageHeader :subtitle="true" />

      <div class="credentials-content">
        <h2 class="subtitle">
          {{ t('fleet.appCo.credentials.subtitle') }}
        </h2>

        <Banner
          v-for="(err, i) in createErrors"
          :key="i"
          color="error"
          :label="err"
        />

        <p
          v-if="hasNoSecrets"
          class="no-secrets-message"
        >
          {{ t('fleet.appCo.credentials.noTokensYet', {}, true) }}
        </p>

        <div
          v-else
          class="row"
        >
          <div class="col span-6">
            <LabeledSelect
              v-model:value="selectedSecret"
              :label="t('fleet.appCo.credentials.accessTokenLabel')"
              :options="secretOptions"
              :required="true"
              :selectable="(option: any) => !option.disabled"
              data-testid="appco-credentials-select"
            />
          </div>
        </div>

        <template v-if="isAddNew || hasNoSecrets">
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value="username"
                :label="t('fleet.appCo.credentials.username')"
                :required="true"
                :placeholder="t('fleet.appCo.credentials.usernamePlaceholder')"
                data-testid="appco-credentials-username"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value="accessToken"
                class="access-token-input"
                :label="t('fleet.appCo.credentials.accessTokenField')"
                :required="true"
                type="multiline"
                :placeholder="t('fleet.appCo.credentials.accessTokenPlaceholder')"
                data-testid="appco-credentials-token"
              />
            </div>
          </div>
          <Banner
            color="info"
            :label="t('fleet.helmOp.add.steps.selection.authBanner')"
          />
        </template>
      </div>
    </div>

    <div class="appco-credentials-page-footer">
      <hr class="footer-divider">
      <div class="footer">
        <RcButton
          variant="secondary"
          data-testid="appco-credentials-cancel"
          size="large"
          @click="cancel"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <RcButton
          :disabled="!canSave || saving"
          :loading="saving"
          data-testid="appco-credentials-save"
          size="large"
          @click="save"
        >
          {{ t('generic.save') }}
        </RcButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-credentials-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  justify-content: space-between;

}

.credentials-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.subtitle {
  margin: 0;
}

.info-text {
  color: var(--input-label);
  margin: 0;
}

.footer-divider {
  border: none;
  border-top: 1px solid var(--border);
}

.appco-credentials-page-footer {
  margin: (-$space-m);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 10px 24px;
}
</style>
