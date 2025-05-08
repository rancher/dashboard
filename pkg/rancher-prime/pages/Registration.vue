<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AsyncButton from '@shell/components/AsyncButton';
import StatusBadge from '@shell/components/StatusBadge';
import Banner from '@components/Banner/Banner.vue';
import FileSelector from '@shell/components/form/FileSelector';
import { usePrimeRegistration } from './registration.composable';

const store = useStore();
const { t } = useI18n(store);
const {
  downloadOfflineRequest,
  registration,
  registrationStatus,
  registerOnline,
  registerOffline,
  deregister,
  errors,
  registrationCode,
  expirationStatus
} = usePrimeRegistration();

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
 * Stored expiration date, retrieved from CRD
 */
const expirationDate = computed(() => 'XX/XX/XXXX');

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
