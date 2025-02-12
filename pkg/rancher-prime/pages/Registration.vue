<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const t = (text: string) => { };

const registrationCode = ref('');
const isRegisteringOnline = computed(() => false);
const registerOnline = () => { };

const downloadOfflineRequest = () => { };
const offlineRegistrationCertificate = ref('');
const isRegisteringOffline = computed(() => false);
const registerOffline = () => { };

const hasCertificate = computed(() => false);
</script>

<template>
  <h1>{{ t('registration.title') }}</h1>
  <p>{{ t('registration.description') }}</p>

  <Card
    :title="t('registration.online.title')"
    :description="t('registration.online.description')"
  >
    <LabeledInput
      v-model:value="registrationCode"
      label-key="registration.online.input.label"
      placeholder-key="registration.online.input.placeholder"
      data-testid="registration-code"
    />

    <AsyncButton
      data-testid="registration-online-cta"
      :disabled="isRegisteringOnline"
      :action-label="isRegisteringOnline ? t('generic.save') : t('registration.online.button-cta.label')"
      @click="registerOnline()"
    />
  </Card>

  <Card
    showHighlightBorder="true"
    :title="t('registration.offline.title')"
    :description="t('registration.offline.description')"
  >
    <button
      class="btn role-secondary"
      @click="downloadOfflineRequest()"
    >
      {{ t('registration.online.button-request.label') }}
    </button>

    <LabeledInput
      v-model:value="offlineRegistrationCertificate"
      label-key="registration.offline.input.label"
      placeholder-key="registration.offline.input.placeholder"
      data-testid="offline-registration-certificate"
    />

    <AsyncButton
      data-testid="registration-offline-cta"
      :disabled="isRegisteringOffline"
      :action-label="isRegisteringOffline ? t('generic.save') : t('registration.offline.button-cta.label')"
      @click="registerOffline()"
    />
  </Card>
</template>
