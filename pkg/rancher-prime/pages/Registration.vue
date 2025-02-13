<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AsyncButton from '@shell/components/AsyncButton';

const store = useStore();
const { t } = useI18n(store);

// Globals
// const isRegistered = computed(() => false);
const isRegistered = ref(false);
const patchRegistration = (value: boolean, callback: () => void) => {
  setTimeout(() => {
    console.log('Patching registration', value);
    isRegistered.value = value;
    callback();
  }, 2000);
};

// Online
const registrationCode = ref('');
const isRegisteringOnline = computed(() => false);
const registerOnline = (callback: () => void) => {
  patchRegistration(true, callback);
};

// Offline
const downloadOfflineRequest = () => { };
const offlineRegistrationCertificate = ref('');
const isRegisteringOffline = computed(() => false);
const registerOffline = (callback: () => void) => {
  patchRegistration(true, callback);
};

// Deregistration
const deregister = (callback: () => void) => {
  patchRegistration(false, callback);
};
</script>

<template>
  <h1>{{ t('registration.title') }}</h1>
  <p>{{ t('registration.description') }}</p>

  <!-- Not registered -->
  <div
    v-if="isRegistered"
    class="row"
  >
    <div class="col span-6">
      <Card :showActions="false">
        <template #title>
          <h2>{{ t('registration.registered.title') }}</h2>
        </template>

        <template #body>
          <p class="mt-20">
            <i class="icon icon-user-check" />
            <span>{{ t('registration.registered.description') }}</span>
          </p>
          <div class="mt-20">
            <AsyncButton
              currentPhase="error"
              :waitingLabel="t('registration.registered.button-cta.progress')"
              data-testid="registration-deregister-cta"
              :disabled="isRegisteringOnline"
              :error-label="isRegisteringOnline ? t('generic.save') : t('registration.online.button-cta.label')"
              @click="deregister"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>

  <!-- Registered -->
  <div
    v-else
    class="row"
  >
    <!-- Online registration -->
    <div class="col span-6">
      <Card :showActions="false">
        <template #title>
          <h2>{{ t('registration.online.title') }}</h2>
        </template>

        <template #body>
          <p class="mt-20">
            {{ t('registration.online.description') }}
          </p>

          <div class="row mt-20">
            <div class="col span-8">
              <LabeledInput
                v-model:value="registrationCode"
                label-key="registration.online.input.label"
                placeholder-key="registration.online.input.placeholder"
                data-testid="registration-code"
              />
            </div>

            <div class="col span-3">
              <AsyncButton
                :waitingLabel="t('registration.online.button-cta.progress')"
                data-testid="registration-online-cta"
                :disabled="isRegisteringOnline || !registrationCode"
                :action-label="isRegisteringOnline ? t('generic.save') : t('registration.online.button-cta.label')"
                @click="registerOnline"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Offline registration -->
    <div class="col span-6">
      <Card
        :showHighlightBorder="false"
        :showActions="false"
      >
        <template #title>
          <h2>{{ t('registration.offline.title') }}</h2>
        </template>

        <template #body>
          <p class="mt-20">
            {{ t('registration.offline.description') }}
          </p>

          <div>
            <button
              class="btn role-secondary mt-20"
              @click="downloadOfflineRequest()"
            >
              {{ t('registration.online.button-request.label') }}
            </button>
          </div>

          <div class="row mt-20">
            <div class="col span-8">
              <LabeledInput
                v-model:value="offlineRegistrationCertificate"
                label-key="registration.offline.input.label"
                placeholder-key="registration.offline.input.placeholder"
                data-testid="offline-registration-certificate"
              />
            </div>

            <div class="col span-3">
              <AsyncButton
                :waitingLabel="t('registration.offline.button-cta.progress')"
                data-testid="registration-offline-cta"
                :disabled="isRegisteringOffline || !offlineRegistrationCertificate"
                :action-label="isRegisteringOffline ? t('generic.save') : t('registration.offline.button-cta.label')"
                @click="registerOffline"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
