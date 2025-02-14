<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';

const store = useStore();
const { t } = useI18n(store);

// Globals
// const isRegistered = computed(() => false);
const isRegisteredOnline = ref(false);
const isRegisteredOffline = ref(false);
const isRegistered = computed(() => isRegisteredOnline.value || isRegisteredOffline.value);
const errors = ref([] as string[]);
const isRegistering = computed(() => false);
const expirationDate = computed(() => 'XX/XX/XXXX');

const patchRegistration = (type: 'online' | 'offline' | 'deregister', callback: () => void) => {
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
    callback();
  }, 2000);
};
const onError = () => {
  errors.value.push('An error occurred');
};

// Online
const registrationCode = ref('');
const registerOnline = (callback: () => void) => {
  patchRegistration('online', callback);
};

// Offline
const downloadOfflineRequest = () => { };
const offlineRegistrationCertificate = ref('');
const registerOffline = (callback: () => void) => {
  // patchRegistration('offline', callback);
  errors.value = [];
  setTimeout(() => {
    onError();
    callback();
  }, 1000);
};

// Deregistration
const deregister = (callback: () => void) => {
  patchRegistration('deregister', callback);
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
              class="mt-20"
            >
              <p>
                <i class="icon icon-user-check" />
                <span v-clean-html="t('registration.registered.description', { expirationDate }, true)" />
              </p>
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  data-testid="registration-deregister-cta"
                  :disabled="isRegistering"
                  :error-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.registered.button-cta.label')"
                  @click="deregister"
                />
              </div>
            </div>
            <div v-else>
              <AsyncButton
                class="mt-20"
                :waitingLabel="t('registration.online.button-cta.progress')"
                data-testid="registration-online-cta"
                :disabled="isRegistered || isRegistering || !registrationCode"
                :action-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.online.button-cta.label')"
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
              <button
                class="btn role-secondary mt-20"
                :disabled="isRegistered"
                @click="downloadOfflineRequest()"
              >
                {{ t('registration.offline.button-request.label') }}
              </button>
            </div>

            <LabeledInput
              v-model:value="offlineRegistrationCertificate"
              class="mt-20"
              label-key="registration.offline.input.label"
              :disabled="isRegistered"
              placeholder-key="registration.offline.input.placeholder"
              data-testid="offline-registration-certificate"
            />

            <div
              v-if="isRegisteredOffline"
              class="mt-20"
            >
              <p>
                <i class="icon icon-user-check" />
                <span v-clean-html="t('registration.registered.description', { expirationDate }, true)" />
              </p>
              <div class="mt-20">
                <AsyncButton
                  currentPhase="error"
                  :waitingLabel="t('registration.registered.button-cta.progress')"
                  data-testid="registration-deregister-cta"
                  :disabled="isRegistering"
                  :error-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.registered.button-cta.label')"
                  @click="deregister"
                />
              </div>
            </div>

            <div v-else>
              <AsyncButton
                class="mt-20"
                :waitingLabel="t('registration.offline.button-cta.progress')"
                data-testid="registration-offline-cta"
                :disabled="isRegistered || isRegistering || !offlineRegistrationCertificate"
                :action-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.offline.button-cta.label')"
                @click="registerOffline"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
