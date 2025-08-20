<script>
import ModalWithCard from '@shell/components/ModalWithCard';
import { Banner } from '@components/Banner';
import PercentageBar from '@shell/components/PercentageBar.vue';
import throttle from 'lodash/throttle';
import {
  checkBackendBasedSessionIdle,
  checkUserActivityData,
  updateUserActivityToken,
  parseTTLData
} from '@shell/utils/inactivity';

let globalId;

export default {
  name:       'Inactivity',
  components: {
    ModalWithCard, Banner, PercentageBar
  },
  data() {
    return {
      isUserActive:          false,
      tenSecondToGoCheckRan: false,
      isOpen:                false,
      showModalAfter:        null,
      sessionTokenName:      null,
      expiresAt:             null,
      inactivityTimeoutId:   null,
      courtesyTimer:         null,
      courtesyTimerId:       null,
      courtesyCountdown:     null,
      trackInactivity:       throttle(this._trackInactivity, 1000),
      id:                    null
    };
  },
  async mounted() {
    const backendInactivityData = await checkBackendBasedSessionIdle(this.$store);

    if (backendInactivityData.enabled) {
      this.courtesyTimer = backendInactivityData.courtesyTimer;
      this.courtesyCountdown = backendInactivityData.courtesyCountdown;
      this.showModalAfter = backendInactivityData.showModalAfter;
      this.sessionTokenName = backendInactivityData.sessionTokenName;
      this.expiresAt = backendInactivityData.expiresAt;

      this.trackInactivity();
      this.addIdleListeners();
    }
  },
  beforeUnmount() {
    this.removeEventListener();
    this.clearAllTimeouts();
  },
  methods: {
    _trackInactivity() {
      if (this.isOpen || !this.showModalAfter) {
        return;
      }

      const endTime = Date.now() + this.showModalAfter * 1000;

      this.id = endTime;
      globalId = endTime;

      const checkInactivityTimer = () => {
        const now = Date.now();

        if (this.id !== globalId) {
          return;
        }

        if (now >= endTime) {
          this.isOpen = true;
          this.startCountdown();
        } else {
          // When we have 10 seconds to go until we display the modal, check for activity on the backend flag
          // it may have come from another tab in the same browser
          if (now >= endTime - (10 * 1000) && !this.tenSecondToGoCheckRan) {
            this.tenSecondToGoCheckRan = true;

            if (this.isUserActive) {
              this.resetUserActivity();
            } else {
              this.checkBackendInactivity();
            }
          }

          this.inactivityTimeoutId = setTimeout(checkInactivityTimer, 1000);
        }
      };

      checkInactivityTimer();
    },
    async checkBackendInactivity() {
      const userActivityData = await checkUserActivityData(this.$store, this.sessionTokenName);

      // this means that something updated the backend expiresAt, which means we must now reset the timers and adjust for new data
      if (userActivityData?.status?.expiresAt && (userActivityData?.status?.expiresAt !== this.expiresAt)) {
        this.resetInactivityDataAndTimers(userActivityData);
      }
    },
    startCountdown() {
      const endTime = Date.now() + (this.courtesyCountdown * 1000);

      const checkCountdown = () => {
        const now = Date.now();

        if (now >= endTime) {
          this.clearAllTimeouts();

          return this.$store.dispatch('auth/logout', { sessionIdle: true });
        } else {
          this.courtesyCountdown = Math.floor((endTime - now) / 1000);
          this.courtesyTimerId = setTimeout(checkCountdown, 1000);
        }
      };

      checkCountdown();
    },
    setUserAsActive() {
      this.isUserActive = true;
    },
    addIdleListeners() {
      document.addEventListener('mousemove', this.setUserAsActive);
      document.addEventListener('mousedown', this.setUserAsActive);
      document.addEventListener('keypress', this.setUserAsActive);
      document.addEventListener('touchmove', this.setUserAsActive);
      document.addEventListener('visibilitychange', this.setUserAsActive);
    },
    removeEventListener() {
      document.removeEventListener('mousemove', this.setUserAsActive);
      document.removeEventListener('mousedown', this.setUserAsActive);
      document.removeEventListener('keypress', this.setUserAsActive);
      document.removeEventListener('touchmove', this.setUserAsActive);
      document.removeEventListener('visibilitychange', this.setUserAsActive);
    },
    async resetUserActivity() {
      const userActivityData = await updateUserActivityToken(this.$store, this.sessionTokenName);

      this.resetInactivityDataAndTimers(userActivityData);
    },
    resetInactivityDataAndTimers(userActivityData) {
      const backendInactivityData = parseTTLData(userActivityData);

      this.tenSecondToGoCheckRan = false;
      this.isOpen = false;
      this.isUserActive = false;

      this.courtesyTimer = backendInactivityData.courtesyTimer;
      this.courtesyCountdown = backendInactivityData.courtesyCountdown;
      this.showModalAfter = backendInactivityData.showModalAfter;
      this.sessionTokenName = backendInactivityData.sessionTokenName;
      this.expiresAt = backendInactivityData.expiresAt;

      this.clearAllTimeouts();
      this.trackInactivity();
    },
    clearAllTimeouts() {
      clearTimeout(this.inactivityTimeoutId);
      clearTimeout(this.courtesyTimerId);
    }
  },
  computed: {
    timerPercentageLeft() {
      return Math.floor((this.courtesyCountdown / this.courtesyTimer ) * 100);
    },
    colorStops() {
      return {
        0: '--info', 30: '--info', 70: '--info'
      };
    },
  }
};
</script>

<template>
  <ModalWithCard
    v-if="isOpen"
    ref="inactivityModal"
    name="inactivityModal"
    save-text="Continue"
  >
    <template #title>
      {{ t('inactivity.title') }}
    </template>
    <span>{{ courtesyCountdown }}</span>

    <template #content>
      <Banner color="info">
        {{ t('inactivity.banner') }}
      </Banner>

      <p>
        {{ t('inactivity.content') }}
      </p>

      <PercentageBar
        class="mt-20"
        :modelValue="timerPercentageLeft"
        :color-stops="colorStops"
      />
    </template>

    <template
      #footer
    >
      <div class="card-actions">
        <button
          class="btn role-tertiary bg-primary"
          @click.prevent="resetUserActivity"
        >
          <t k="inactivity.cta" />
        </button>
      </div>
    </template>
  </ModalWithCard>
</template>

<style lang="scss" scoped>
.card-actions {
    display: flex;
    width: 100%;
    justify-content: flex-end;
}
</style>
