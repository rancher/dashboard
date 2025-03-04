<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AsyncButton from '@shell/components/AsyncButton';
import StatusBadge from '@shell/components/StatusBadge';
import Banner from '@components/Banner/Banner.vue';
import FileSelector from '@shell/components/form/FileSelector';
import { downloadFile } from '@shell/utils/download';

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
 * @param asyncButtonResolution Async button callback
 */
const patchRegistration = (type: 'online' | 'offline' | 'deregister', asyncButtonResolution: () => void) => {
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
    asyncButtonResolution();
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
 * @param asyncButtonResolution Async button callback
 */
const registerOnline = (asyncButtonResolution: () => void) => {
  registrationStatus.value = 'registering-online';
  patchRegistration('online', asyncButtonResolution);
};

/**
 * Handle download offline registration request
 * @param asyncButtonResolution Async button callback
 */
const downloadOfflineRequest = (asyncButtonResolution: (status: boolean) => void) => {
  const fileName = 'rancher-offline-registration-request.json';
  const data = '';

  setTimeout(() => {
    downloadFile(fileName, JSON.stringify(data), 'application/json')
      .then(() => asyncButtonResolution(true))
      .catch(() => asyncButtonResolution(false));
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
 * @param asyncButtonResolution Async button callback
 */
const registerWithError = (asyncButtonResolution: () => void) => {
  errors.value = [];
  setTimeout(() => {
    onError();
    asyncButtonResolution();
  }, 1000);
};

/**
 * De-register handler
 * @param asyncButtonResolution Async button callback
 */
const deregister = (asyncButtonResolution: () => void) => {
  patchRegistration('deregister', asyncButtonResolution);
};
</script>

<template>
  <div style="padding: 20px;">
    <h1>{{ t('registration.title') }}</h1>
    <p
      v-clean-html="t('registration.description', {}, true)"
    />

    <!-- Errors banner -->
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
              data-testid="registration-code-input"
            />

            <!-- Show online Certificate expiration and status -->
            <div
              v-if="isRegisteredOnline"
            >
              <StatusBadge
                v-if="expirationStatus"
                :status="expirationStatus"
                :label="t(`registration.registered.description.${expirationStatus}`, { expirationDate }, true)"
                data-testid="expiration-status-online"
              />
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  :error-label="t('registration.registered.button-cta.label')"
                  data-testid="registration-online-deregister-cta"
                  :disabled="isRegistering"
                  @click="deregister"
                />
              </div>
            </div>

            <!-- Show button to register online -->
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

            <!-- Download offline registration request -->
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

            <!-- Show Offline Certificate expiration and status -->
            <div
              v-if="isRegisteredOffline"
            >
              <StatusBadge
                v-if="expirationStatus"
                :status="expirationStatus"
                :label="t(`registration.registered.description.${expirationStatus}`, { expirationDate }, true)"
                data-testid="expiration-status-offline"
              />
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  :error-label="t('registration.registered.button-cta.label')"
                  data-testid="registration-offline-deregister-cta"
                  :disabled="isRegistering"
                  @click="deregister"
                />
              </div>
            </div>

            <!-- Show async button while submitting file -->
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

            <!-- Show file selector for offline registration -->
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
