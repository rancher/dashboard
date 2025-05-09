<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { BadgeState } from '@components/BadgeState';
import AsyncButton from '@shell/components/AsyncButton';
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
  registrationBanner
} = usePrimeRegistration();

/**
 * Track both registration types
 */
const isRegistered = computed(() => registrationStatus.value === 'registered-online' || registrationStatus.value === 'registered-offline');

/**
 * Track both registering progresses as generic operation to disable all the inputs
 */
const isRegistering = computed(() => registrationStatus.value === 'registering-online' || registrationStatus.value === 'registering-offline');

/**
 * Track offline registration progress, to switch between file selector and async button
 */
const isRegisteringOffline = computed(() => registrationStatus.value === 'registering-offline');
</script>

<template>
  <div style="padding: 20px;">
    <h1>{{ t('registration.title') }}</h1>

    <!-- Status Banner -->
    <Banner
      :color="registrationBanner.type"
      data-testid="registration-banner-status"
    >
      {{ t(registrationBanner.message) }}
    </Banner>

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

    <Tabbed>
      <!-- Online -->
      <Tab
        name="online"
        :label="t('registration.online.title')"
        :weight="2"
      >
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

        <AsyncButton
          class="mt-20"
          :waitingLabel="t('registration.online.button-cta.progress')"
          :action-label="t('registration.online.button-cta.label')"
          data-testid="registration-online-cta"
          :disabled="isRegistered || isRegistering || !registrationCode"
          @click="registerOnline"
        />
      </Tab>

      <!-- Offline -->
      <Tab
        name="offline"
        :label="t('registration.offline.title')"
        :weight="1"
      >
        <!-- Step 1 -->
        <p
          v-clean-html="t('registration.offline.stepone', {}, true)"
          class="mt-20"
        />
        <div>
          <AsyncButton
            class="mt-20"
            actionColor="role-secondary"
            successColor="role-secondary"
            :waitingLabel="t('registration.offline.button.download.progress')"
            :action-label="t('registration.offline.button.download.label')"
            :success-label="t('registration.offline.button.download.label')"
            data-testid="registration-offline-download"
            :disabled="isRegistered"
            @click="downloadOfflineRequest"
          />
        </div>

        <!-- Step 2 -->
        <p
          v-clean-html="t('registration.offline.steptwo', {}, true)"
          class="mt-20"
        />
        <!-- Show async button while submitting file -->
        <div v-if="isRegisteringOffline">
          <AsyncButton
            class="mt-20"
            :waitingLabel="t('registration.offline.button.register.progress')"
            :action-label="t('registration.offline.button.register.label')"
            data-testid="registration-offline-cta"
            :disabled="isRegistered || isRegistering"
            :currentPhase="'waiting'"
          />
        </div>

        <!-- Show file selector for offline registration -->
        <div v-else>
          <FileSelector
            class="role-primary mt-20"
            :label="t('registration.offline.button.register.label')"
            :disabled="isRegistered || isRegistering"
            data-testid="registration-offline-cta"
            @selected="registerOffline"
          />
        </div>
      </Tab>
    </Tabbed>

    <!-- List -->
    <div class="mt-40">
      <h3>{{ t('registration.list.title') }}</h3>

      <div class="mt-40 grid-5">
        <div class="color-disabled-text">
          {{ t('registration.list.table.header.status') }}
        </div>
        <div class="color-disabled-text">
          {{ t('registration.list.table.header.product') }}
        </div>
        <div class="color-disabled-text">
          {{ t('registration.list.table.header.expiration') }}
        </div>
        <div class="color-disabled-text">
          {{ t('registration.list.table.header.code') }}
        </div>
        <div />
        <div>
          <BadgeState
            :label="registration.message"
            :color="registration.color"
          />
        </div>
        <div>
          {{ registration.product }}
        </div>
        <div>
          {{ registration.expiration }}
        </div>
        <div>
          {{ registration.code }}
        </div>
        <div>
          <AsyncButton
            currentPhase="error"
            :waitingLabel="t('registration.list.table.button.progress')"
            :error-label="t('registration.list.table.button.label')"
            :action-label="t('registration.list.table.button.label')"
            data-testid="registration-offline-deregister-cta"
            :disabled="isRegistering || !isRegistered"
            @click="deregister"
          />
        </div>
      </div>
    </div>
  </div>
</template>
