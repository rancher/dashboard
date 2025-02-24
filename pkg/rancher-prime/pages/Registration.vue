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

// Globals
// const isRegistered = computed(() => false);
const isRegistering = computed(() => false); // Generic operation to disable all the inputs
const isRegisteredOnline = ref(false);
const isRegisteredOffline = ref(false);
const isRegisteringOffline = ref(false); // Required to toggle the async button view
const isRegistered = computed(() => isRegisteredOnline.value || isRegisteredOffline.value);
const errors = ref([] as string[]);
const expirationDate = computed(() => 'XX/XX/XXXX'); // Retrieved from CRD

/**
 * Reset other inputs and errors, then patch the registration
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
      isRegisteredOnline.value = true;
      break;
    case 'offline':
      registrationCode.value = '';
      isRegisteredOffline.value = true;
      break;
    case 'deregister':
      isRegisteredOnline.value = false;
      isRegisteredOffline.value = false;
      registrationCode.value = '';
      offlineRegistrationCertificate.value = '';
      break;
    }
    setButtonStatus();
  }, 2000);
};
const onError = () => {
  errors.value.push('An error occurred');
};

// Online
const registrationCode = ref('');
const registerOnline = (setButtonStatus: () => void) => {
  patchRegistration('online', setButtonStatus);
};

// Offline
const offlineRegistrationCertificate = ref('');

/**
 * Handle download offline registration request
 * @param setButtonStatus
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
  isRegisteringOffline.value = true;
  offlineRegistrationCertificate.value = certificate;
  patchRegistration('offline', () => {
    isRegisteringOffline.value = false;
  });
};

const registerWithError = (setButtonStatus: () => void) => {
  errors.value = [];
  setTimeout(() => {
    onError();
    setButtonStatus();
  }, 1000);
};

// Deregistration
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
              :disabled="isRegistered"
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
