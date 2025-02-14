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
const isRegistered = ref(false);
const errors = ref([] as string[]);
const isRegistering = computed(() => false);
const expirationDate = computed(() => 'XX/XX/XXXX');
const patchRegistration = (value: boolean, callback: () => void) => {
  errors.value = [];
  setTimeout(() => {
    console.log('Patching registration', value);
    isRegistered.value = value;
    callback();
  }, 2000);
};
const onError = () => {
  errors.value.push('An error occurred');
};

// Online
const registrationCode = ref('');
const registerOnline = (callback: () => void) => {
  patchRegistration(true, callback);
};

// Offline
const downloadOfflineRequest = () => { };
const offlineRegistrationCertificate = ref('');
const registerOffline = (callback: () => void) => {
  // patchRegistration(true, callback);
  errors.value = [];
  setTimeout(() => {
    onError();
    callback();
  }, 1000);
};

// Deregistration
const deregister = (callback: () => void) => {
  patchRegistration(false, callback);
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

    <!-- Cards -->
    <div class="mt-20">
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
              <p
                v-clean-html="t('registration.online.description', {}, true)"
                class="mt-20"
              />

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
                    :disabled="isRegistering || !registrationCode"
                    :action-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.online.button-cta.label')"
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
              <p
                v-clean-html="t('registration.offline.description', {}, true)"
                class="mt-20"
              />

              <div>
                <button
                  class="btn role-secondary mt-20"
                  @click="downloadOfflineRequest()"
                >
                  {{ t('registration.offline.button-request.label') }}
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
                    :disabled="isRegistering || !offlineRegistrationCertificate"
                    :action-label="isRegistering ? t('registration.registered.button-cta.progress') : t('registration.offline.button-cta.label')"
                    @click="registerOffline"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
