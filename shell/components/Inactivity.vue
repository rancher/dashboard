<script>
import ModalWithCard from '@shell/components/ModalWithCard';
import { Banner } from '@components/Banner';
import PercentageBar from '@shell/components/PercentageBar.vue';
import throttle from 'lodash/throttle';
import Inactivity from '@shell/utils/inactivity';
import { MANAGEMENT, EXT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

let globalId;

const MODAL_VISIBILITY_CHECK_DELAY_SECONDS = 10;

export default {
  name:       'Inactivity',
  components: {
    ModalWithCard, Banner, PercentageBar
  },
  data() {
    return {
      sessionTokenName:        null,
      tokens:                  [],
      isUserActive:            false,
      userActivityIsoDate:     '',
      modalVisibilityCheckRan: false,
      isOpen:                  false,
      showModalAfter:          null,
      expiresAt:               null,
      inactivityTimeoutId:     null,
      courtesyTimer:           null,
      courtesyTimerId:         null,
      courtesyCountdown:       null,
      trackInactivity:         throttle(this._trackInactivity, 1000),
      id:                      null
    };
  },
  beforeUnmount() {
    this.removeEventListeners();
    this.clearAllTimeouts();
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
    userSessionTtlIdleSetting() {
      return this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUTH_USER_SESSION_IDLE_TTL_MINUTES);
    },
    userSessionTtlSetting() {
      return this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUTH_USER_SESSION_TTL_MINUTES);
    },
    userActivityResource() {
      return this.$store.getters['management/byId'](EXT.USER_ACTIVITY, this.sessionTokenName);
    },
    ttlIdleValue() {
      return parseInt(this.userSessionTtlIdleSetting?.value || 0);
    },
    ttlValue() {
      return parseInt(this.userSessionTtlSetting?.value || 0);
    },
    isFeatureEnabled() {
      return this.ttlIdleValue < this.ttlValue;
    },
    userActivityExpiresAt() {
      return this.userActivityResource?.status?.expiresAt || '';
    },
    watcherData() {
      return {
        userActivityExpiresAt: this.userActivityExpiresAt,
        sessionTokenName:      this.sessionTokenName,
        isFeatureEnabled:      this.isFeatureEnabled
      };
    }
  },

  watch: {
    // every time the Idle setting changes, we need to fetch the updated userActivity
    async ttlIdleValue() {
      await Inactivity.getUserActivity(this.$store, this.sessionTokenName);
    },
    watcherData: {
      async handler(neu, old) {
        if (!old?.isFeatureEnabled && neu?.isFeatureEnabled) {
          const tokenName = Inactivity.getSessionTokenName();

          if (tokenName) {
            this.sessionTokenName = tokenName;
          }

          await this.initializeInactivityData();
        }

        const currDate = Date.now();
        const endDate = new Date(neu.userActivityExpiresAt || '0001-01-01 00:00:00 +0000 UTC').getTime();

        if (endDate > currDate && neu?.sessionTokenName && neu?.isFeatureEnabled) {
          // feature is considered as enabled
          // make sure we always clean up first so that we don't get duplicate timers running
          this.stopInactivity();

          // resets inactivity data and timers, starting the inactivity again with the proper data
          this.resetInactivityDataAndTimers(this.userActivityResource);

          // add event listeners for UI interaction
          this.addIdleListeners();
        }

        if (!neu?.isFeatureEnabled) {
          this.stopInactivity();
        }
      },
      immediate: true,
      deep:      true
    }
  },

  methods: {
    async initializeInactivityData() {
      const canGetUserAct = this.$store.getters[`management/canGet`](EXT.USER_ACTIVITY);
      const canListTokens = this.$store.getters[`rancher/canList`](NORMAN.TOKEN);

      if (canGetUserAct && canListTokens) {
        const tokens = await this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN, opt: { watch: false } });

        this.tokens = tokens;

        // handle the fetching/storage of session token name
        if (!this.sessionTokenName) {
          const sessionToken = this.tokens.find((token) => {
            return token.description === 'UI session' && token.current;
          });

          if (sessionToken?.name) {
            this.sessionTokenName = sessionToken.name;
            Inactivity.setSessionTokenName(sessionToken.name);
          }
        }

        // get the latest userActivity data so that get reactivity on all this logic
        const userActivityData = await Inactivity.getUserActivity(this.$store, this.sessionTokenName, false);

        const expiresAt = userActivityData?.status?.expiresAt;
        const currDate = Date.now();
        const endDate = new Date(expiresAt).getTime();

        // If expiresAt isn't initialised yet '0001-01-01 00:00:00 +0000 UTC' || '', or just passed the 'now' date
        // We need to update/initialise the UserActivity resource
        if ((currDate > endDate) || !expiresAt) {
          const updatedData = await Inactivity.updateUserActivity(this.userActivityResource, this.sessionTokenName, new Date().toISOString());

          this.expiresAt = updatedData?.status?.expiresAt;
        } else if (expiresAt) {
          this.expiresAt = expiresAt;
        }
      }
    },
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
          // When we have X seconds to go until we display the modal, check for activity on the backend flag
          // it may have come from another tab in the same browser
          if (now >= endTime - (MODAL_VISIBILITY_CHECK_DELAY_SECONDS * 1000) && !this.modalVisibilityCheckRan) {
            this.modalVisibilityCheckRan = true;

            if (this.isUserActive) {
              this.resetUserActivity();
            } else {
              this.checkBackendInactivity(this.expiresAt);
            }
          }

          this.inactivityTimeoutId = setTimeout(checkInactivityTimer, 1000);
        }
      };

      checkInactivityTimer();
    },
    startCountdown() {
      const endTime = Date.now() + (this.courtesyCountdown * 1000);

      const checkCountdown = async() => {
        const now = Date.now();

        if (now >= endTime) {
          this.clearAllTimeouts();
          const isUserActive = await this.checkBackendInactivity(this.expiresAt);

          if (!isUserActive) {
            return this.$store.dispatch('auth/logout', { sessionIdle: true });
          }
        } else {
          this.courtesyCountdown = Math.floor((endTime - now) / 1000);
          this.courtesyTimerId = setTimeout(checkCountdown, 1000);
        }
      };

      checkCountdown();
    },
    async checkBackendInactivity(currExpiresAt) {
      let isUserActive = false;
      const userActivityData = await Inactivity.getUserActivity(this.$store, this.sessionTokenName);

      // this means that something updated the backend expiresAt, which means we must now reset the timers and adjust for new data
      if (userActivityData?.status?.expiresAt && (userActivityData?.status?.expiresAt !== currExpiresAt)) {
        isUserActive = true;
        this.resetInactivityDataAndTimers(userActivityData);
      }

      return isUserActive;
    },
    setUserAsActive() {
      this.isUserActive = true;
      this.userActivityIsoDate = new Date().toISOString();
    },
    addIdleListeners() {
      document.addEventListener('mousemove', this.setUserAsActive);
      document.addEventListener('mousedown', this.setUserAsActive);
      document.addEventListener('keypress', this.setUserAsActive);
      document.addEventListener('touchmove', this.setUserAsActive);
      document.addEventListener('visibilitychange', this.setUserAsActive);
    },
    removeEventListeners() {
      document.removeEventListener('mousemove', this.setUserAsActive);
      document.removeEventListener('mousedown', this.setUserAsActive);
      document.removeEventListener('keypress', this.setUserAsActive);
      document.removeEventListener('touchmove', this.setUserAsActive);
      document.removeEventListener('visibilitychange', this.setUserAsActive);
    },
    async resetUserActivity(useCurrDate = false) {
      let seenAt;

      if (useCurrDate) {
        seenAt = new Date().toISOString();
      } else {
        seenAt = this.userActivityIsoDate;
      }

      const userActivityData = await Inactivity.updateUserActivity(this.userActivityResource, this.sessionTokenName, seenAt);

      this.resetInactivityDataAndTimers(userActivityData);
    },
    stopInactivity() {
      this.modalVisibilityCheckRan = false;
      this.isOpen = false;
      this.isUserActive = false;
      this.userActivityIsoDate = '';

      this.removeEventListeners();
      this.clearAllTimeouts();
    },
    resetInactivityDataAndTimers(userActivityData) {
      const data = Inactivity.parseTTLData(userActivityData);

      this.modalVisibilityCheckRan = false;
      this.isOpen = false;
      this.isUserActive = false;
      this.userActivityIsoDate = '';

      this.courtesyTimer = data.courtesyTimer;
      this.courtesyCountdown = data.courtesyCountdown;
      this.showModalAfter = data.showModalAfter;
      this.sessionTokenName = data.sessionTokenName;
      this.expiresAt = data.expiresAt;

      const shownAfter = Math.round(((data.showModalAfter || 0) / 60) * 100) / 100;
      const shownFor = Math.round(((data.courtesyTimer || 0) / 60) * 100) / 100;

      console.debug(`UI inactivity modal (backend-based) will show after ${ shownAfter }(m) and be shown for ${ shownFor }(m)`); // eslint-disable-line no-console

      this.clearAllTimeouts();
      this.trackInactivity();
    },
    clearAllTimeouts() {
      clearTimeout(this.inactivityTimeoutId);
      clearTimeout(this.courtesyTimerId);
    }
  },
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
          @click.prevent="resetUserActivity(true)"
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
