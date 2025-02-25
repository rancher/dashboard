<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import FileSelector from '@shell/components/form/FileSelector';
import { downloadFile } from '@shell/utils/download';

const EXPIRATION_STATUS = {
  success: {
    color: 'success',
    icon:  'icon-checkmark'
  },
  warning: {
    color: 'warning',
    icon:  'icon-warning'
  },
  info: {
    color: 'info',
    icon:  'icon-info'
  },
  error: {
    color: 'error',
    icon:  'icon-error'
  }
};

const store = useStore();
const { t } = useI18n(store);

type RegistrationStatus = 'registering-online' | 'registering-offline' | 'registered-online' | 'registered-offline' | null;

/**
 * Registration code for online registration; empty if none or offline
 */
const registrationCode = ref('');

/**
 * Certificate for offline registration; empty if none or online
 */
const offlineRegistrationCertificate = ref('');

/**
 * Single source for the registration status, used to define other computed properties
 */
const registrationStatus = ref(null as RegistrationStatus);

/**
 * Expiration status for the registration, both online and offline
 */
const expirationStatus = ref(null as 'success' | 'warning' | null);

/**
 * Track both registration types
 */
const isRegistered = computed(() => registrationStatus.value === 'registered-online' || registrationStatus.value === 'registered-offline');

/**
 * Track both registering progresses as generic operation to disable all the inputs
 */
const isRegistering = computed(() => registrationStatus.value === 'registering-online' || registrationStatus.value === 'registering-offline');

const isRegisteredOnline = computed(() => registrationStatus.value === 'registered-online');
const isRegisteredOffline = computed(() => registrationStatus.value === 'registered-offline');

/**
 * Track offline registration progress, to switch between file selector and async button
 */
const isRegisteringOffline = computed(() => registrationStatus.value === 'registering-offline');

/**
 * Current error list, displayed in the banner
 */
const errors = ref([] as string[]);

/**
 * Stored expiration date, retrieved from CRD
 */
const expirationDate = computed(() => 'XX/XX/XXXX');

/**
 * Reset other inputs and errors, set current state then patch the registration
 * @param type 'online' | 'offline' | 'deregister'
 * @param setButtonStatus Async button callback
 */
const patchRegistration = (type: 'online' | 'offline' | 'deregister', setButtonStatus: () => void) => {
  errors.value = [];
  setTimeout(() => {
    console.log('Patching registration', type);
    switch (type) {
    case 'online':
      offlineRegistrationCertificate.value = '';
      registrationStatus.value = 'registered-online';
      expirationStatus.value = 'success';
      break;
    case 'offline':
      registrationCode.value = '';
      registrationStatus.value = 'registered-offline';
      expirationStatus.value = 'warning';
      break;
    case 'deregister':
      registrationStatus.value = null;
      registrationCode.value = '';
      offlineRegistrationCertificate.value = '';
      break;
    }
    setButtonStatus();
  }, 2000);
};

/**
 * Handle error
 */
const onError = () => {
  errors.value.push('An error occurred');
};

/**
 * Patch CRD for online registration
 * @param setButtonStatus Async button CD
 */
const registerOnline = (setButtonStatus: () => void) => {
  registrationStatus.value = 'registering-online';
  patchRegistration('online', setButtonStatus);
};

/**
 * Handle download offline registration request
 * @param setButtonStatus Async button CD
 */
const downloadOfflineRequest = (setButtonStatus: (status: boolean) => void) => {
  const fileName = 'rancher-offline-registration-request.json';
  const data = '';

  setTimeout(() => {
    downloadFile(fileName, JSON.stringify(data), 'application/json')
      .then(() => setButtonStatus(true))
      .catch(() => setButtonStatus(false));
  }, 1000);
};

/**
 * Set certificate from file, then patch the registration for offline
 * @param certificate base64 encoded certificate from SCC
 */
const registerOffline = (certificate: string) => {
  registrationStatus.value = 'registering-offline';
  offlineRegistrationCertificate.value = certificate;
  patchRegistration('offline', () => {});
};

/**
 * TODO: Remove after implementing the real error handling
 * @param setButtonStatus Async button CD
 */
const registerWithError = (setButtonStatus: () => void) => {
  errors.value = [];
  setTimeout(() => {
    onError();
    setButtonStatus();
  }, 1000);
};

/**
 * De-register handler
 * @param setButtonStatus Async button CD
 */
const deregister = (setButtonStatus: () => void) => {
  patchRegistration('deregister', setButtonStatus);
};
</script>

<template>
  <div style="padding: 20px;">
    <h1>{{ t('registration.title') }}</h1>
    <p
      v-clean-html="t('registration.description', {}, true)"
    />

    <Banner
      v-if="errors.length"
      :label="errors"
      color="error"
      data-testid="registration-errors"
    >
      <p
        v-for="(error, i) in errors"
        :key="i"
      >
        {{ error }}
      </p>
    </Banner>

    <!-- Registered -->
    <div class="row mt-20">
      <!-- Online registration -->
      <div class="col span-6">
        <Card :showActions="false">
          <template #title>
            <h2>{{ t('registration.online.title') }}</h2>
          </template>

          <template #body>
            <p
              v-clean-html="t('registration.online.description', {}, true)"
              class="mt-20"
            />

            <LabeledInput
              v-model:value="registrationCode"
              class="mt-20"
              :disabled="isRegistered || isRegistering"
              label-key="registration.online.input.label"
              placeholder-key="registration.online.input.placeholder"
              data-testid="registration-code"
            />

            <div
              v-if="isRegisteredOnline"
            >
              <Banner
                v-if="expirationStatus"
                :icon="EXPIRATION_STATUS[expirationStatus].icon"
                :color="EXPIRATION_STATUS[expirationStatus].color"
              >
                {{ t('registration.registered.description', { expirationDate }, true) }}
              </Banner>
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  :error-label="t('registration.registered.button-cta.label')"
                  data-testid="registration-deregister-cta"
                  :disabled="isRegistering"
                  @click="deregister"
                />
              </div>
            </div>
            <div v-else>
              <AsyncButton
                class="mt-20"
                :waitingLabel="t('registration.online.button-cta.progress')"
                :action-label="t('registration.online.button-cta.label')"
                data-testid="registration-online-cta"
                :disabled="isRegistered || isRegistering || !registrationCode"
                @click="registerOnline"
              />
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
            <p
              v-clean-html="t('registration.offline.description', {}, true)"
              class="mt-20"
            />

            <div>
              <AsyncButton
                class="mt-20"
                actionColor="role-secondary"
                successColor="role-secondary"
                :waitingLabel="t('registration.offline.button-download.progress')"
                :action-label="t('registration.offline.button-download.label')"
                :success-label="t('registration.offline.button-download.label')"
                data-testid="registration-offline-download"
                :disabled="isRegistered"
                @click="downloadOfflineRequest"
              />
            </div>

            <div
              v-if="isRegisteredOffline"
            >
              <Banner
                v-if="expirationStatus"
                :icon="EXPIRATION_STATUS[expirationStatus].icon"
                :color="EXPIRATION_STATUS[expirationStatus].color"
              >
                {{ t('registration.registered.description', { expirationDate }, true) }}
              </Banner>
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  :error-label="t('registration.registered.button-cta.label')"
                  data-testid="registration-deregister-cta"
                  :disabled="isRegistering"
                  @click="deregister"
                />
              </div>
            </div>

            <div v-else-if="isRegisteringOffline">
              <AsyncButton
                class="mt-20"
                :waitingLabel="t('registration.offline.button-cta.progress')"
                :action-label="t('registration.offline.button-cta.label')"
                data-testid="registration-offline-cta"
                :disabled="isRegistered || isRegistering"
                :currentPhase="'waiting'"
              />
            </div>

            <div v-else>
              <FileSelector
                class="role-primary mt-20"
                :label="t('registration.offline.button-cta.label')"
                :disabled="isRegistered || isRegistering"
                data-testid="registration-offline-cta"
                @selected="registerOffline"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
