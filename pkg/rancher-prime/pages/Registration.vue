<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { RcButton } from '@components/RcButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import { BadgeState } from '@components/BadgeState';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import FileSelector from '@shell/components/form/FileSelector';
import { usePrimeRegistration } from './registration.composable';
import Loading from '@shell/components/Loading.vue';

import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { REGISTRATION_RESOURCE_NAME } from '../config/constants';

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
  initRegistration,
  registrationCode,
  registrationBanner
} = usePrimeRegistration();

/**
 * Track both registration types
 */
const isRegistered = computed(() => registrationStatus.value === 'registered');

/**
 * Track both registering progresses as generic operation to disable all the inputs
 */
const isRegistering = computed(() => registrationStatus.value === 'registering-online' || registrationStatus.value === 'registering-offline');

/**
 * Track offline registration progress, to switch between file selector and async button
 */
const isRegisteringOffline = computed(() => registrationStatus.value === 'registering-offline');

/**
 * Map link to router configuration
 */
const registrationLink = computed(() => ({
  name:   'c-cluster-product-resource-id',
  params: {
    cluster: 'local', product: EXPLORER, resource: REGISTRATION_RESOURCE_NAME, id: registration.value.id
  }
}));

const visitScc = () => window.open('https://scc.suse.com/register-offline/rancher', '_blank');

onMounted(async() => {
  initRegistration();
});
</script>

<template>
  <Loading v-if="registrationStatus === 'loading'" />

  <div
    v-else
    style="padding: 20px;"
  >
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
          :success-label="t('registration.online.button-cta.label')"
          successColor="role-primary"
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
        <RcButton
          secondary
          class="mt-20"
          data-testid="registration-offline-visit-scc"
          :disabled="isRegistered || isRegistering"
          @click="visitScc"
        >
          {{ t('registration.offline.button.visit.label') }}
        </RcButton>

        <!-- Step 3 -->
        <p
          v-clean-html="t('registration.offline.stepthree', {}, true)"
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
            :currentPhase="isRegisteringOffline ? 'waiting' : 'success'"
          />
        </div>

        <!-- Show file selector for offline registration -->
        <div v-else>
          <FileSelector
            class="role-primary mt-20"
            :label="t('registration.offline.button.register.label')"
            :disabled="isRegistered || isRegistering"
            accept=".cert"
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
          {{ t('registration.list.table.header.mode') }}
        </div>
        <div />
        <div>
          <BadgeState
            :label="t(registration.message)"
            :color="'bg-' + registration.color"
          />
        </div>
        <div>
          <router-link
            v-if="registrationLink"
            data-testid="registration-link"
            :to="registrationLink"
          >
            {{ registration.product }}
          </router-link>
          <span v-else>{{ registration.product }}</span>
        </div>
        <div>
          {{ registration.expiration }}
        </div>
        <div>
          {{ registration.mode }}
        </div>
        <div>
          <AsyncButton
            waitingColor="bg-error"
            actionColor="bg-error"
            successColor="bg-error"
            :waitingLabel="t('registration.list.table.button.progress')"
            :error-label="t('registration.list.table.button.label')"
            :action-label="t('registration.list.table.button.label')"
            :success-label="t('registration.list.table.button.label')"
            data-testid="registration-deregister-cta"
            :disabled="isRegistering || !isRegistered"
            @click="deregister"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// TODO - #14338: Styles gets generated multiple times, but an utility should have been used
.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, auto);
  grid-template-rows: auto;
  gap: 16px;
  align-items: center;
}

.color-disabled-text {
  color: var(--disabled-text);
}
</style>
