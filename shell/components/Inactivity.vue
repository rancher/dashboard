<script>
import ModalWithCard from '@shell/components/ModalWithCard';
import { Banner } from '@components/Banner';
import PercentageBar from '@shell/components/PercentageBar.vue';
import throttle from 'lodash/throttle';
import {
  getStoredUserActivity,
  storeUserActivity,
  getSessionTokenName,
  storeSessionTokenName,
  updateUserActivityToken,
  checkUserActivityData,
  parseTTLData
} from '@shell/utils/inactivity';

import { MANAGEMENT, EXT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { allHash } from 'utils/promise';

let globalId;

export default {
  name:       'Inactivity',
  components: {
    ModalWithCard, Banner, PercentageBar
  },
  data() {
    return {
      sessionTokenName:      null,
      tokens:                [],
      isUserActive:          false,
      tenSecondToGoCheckRan: false,
      isOpen:                false,
      showModalAfter:        null,
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
    const tokenName = getSessionTokenName();

    if (tokenName) {
      this.sessionTokenName = tokenName;
    }

    await this.initializeInactivityData();
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
    userActivityExpiresAt() {
      return this.userActivityResource?.status?.expiresAt || '';
    },
    sessionToken() {
      return this.tokens.find((token) => {
        // this can be improved once https://github.com/rancher/rancher/issues/51580 is fixed
        // we should not need to store the UI session token name globally
        if (this.sessionTokenName) {
          return token.name === this.sessionTokenName;
        } else {
          return token.description === 'UI session' && token.current;
        }
      });
    },
    watcherData() {
      return {
        userActivityExpiresAt: this.userActivityExpiresAt,
        sessionTokenName:      this.sessionTokenName,
        ttlIdleValue:          this.ttlIdleValue,
        ttlValue:              this.ttlValue,
      };
    }
  },

  watch: {
    // every time the Idle setting changes, we need to update userActivity
    async ttlIdleValue(neu) {
      console.error('ttlIdleValue value updated!!!', neu);
      await updateUserActivityToken(this.$store, this.sessionTokenName );
    },
    async ttlValue(neu) {
      // this means that the feature is disabled, which should merit the update of userActivity
      if (neu === this.ttlIdleValue) {
        console.error('ttlValue value updated - feature disabled !!!', neu);
        await updateUserActivityToken(this.$store, this.sessionTokenName );
      }
    },
    watcherData: {
      async handler(neu, old) {
        console.error('watcherData RAN neu!!!', neu);
        console.error('watcherData RAN old!!!', old);
        const currDate = Date.now();
        const endDate = new Date(neu.userActivityExpiresAt || '0001-01-01 00:00:00 +0000 UTC').getTime();

        // this covers the scenario where the TTL setting have changed
        // but the userActivity hasn't updated yet because it's an async operation
        if (neu?.ttlIdleValue !== old?.ttlIdleValue && neu?.userActivityExpiresAt === old?.userActivityExpiresAt) {
          this.stopInactivity();
          // this means that all conditions are met to start the timers
        } else if (endDate > currDate && neu?.sessionTokenName) {
          console.error('watcherData passed gate 1!!!');
          console.error('neu.ttlIdleValue < neu.ttlValue', neu.ttlIdleValue < neu.ttlValue);
          // feature is considered as enabled
          if (neu.ttlIdleValue < neu.ttlValue) {
            console.error('watcherData passed gate 2!!!');
            this.clearAllTimeouts();

            console.error('LETS START THE PARTY!!!!');
            const data = parseTTLData(this.userActivityResource);

            console.error('parseTTLData data', data);

            // set all the data required for the timers to work properly
            this.courtesyTimer = data.courtesyTimer;
            this.courtesyCountdown = data.courtesyCountdown;
            this.showModalAfter = data.showModalAfter;
            this.sessionTokenName = data.sessionTokenName;
            this.expiresAt = data.expiresAt;

            const shownAfter = Math.round(((data.showModalAfter || 0) / 60) * 100) / 100;
            const shownFor = Math.round(((data.courtesyTimer || 0) / 60) * 100) / 100;

            console.debug(`UI inactivity modal (backend-based) will show after ${ shownAfter }(m) and be shown for ${ shownFor }(m)`); // eslint-disable-line no-console

            // start timers
            this.trackInactivity();
            // add event listeners for UI interaction
            this.addIdleListeners();
          } else {
            this.stopInactivity();
          }
        }
      },
      immediate: true,
      deep:      true
    }
  },

  methods: {
    async initializeInactivityData() {
      console.error('initializeInactivityData!!!');
      const canListSettings = this.$store.getters[`management/canList`](MANAGEMENT.SETTING);
      const canListUserAct = this.$store.getters[`management/canList`](EXT.USER_ACTIVITY);
      const canListTokens = this.$store.getters[`rancher/canList`](NORMAN.TOKEN);

      if (canListUserAct && canListTokens && canListSettings) {
        // fetching all resources needed to start inactivity logic
        const hash = {
          userSessionTtlIdleSetting: this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.AUTH_USER_SESSION_TTL_MINUTES }),
          userSessionTtlSetting:     this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.AUTH_USER_SESSION_TTL_MINUTES }),
          tokens:                    this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN }),
        };

        const res = await allHash(hash);

        this.tokens = res.tokens;

        // handle the fetching/storage of session token name
        if (!this.sessionTokenName) {
          const sessionToken = this.tokens.find((token) => {
            return token.description === 'UI session' && token.current;
          });

          if (sessionToken?.name) {
            console.error('SETTING TOKEN NAME', sessionToken.name);
            this.sessionTokenName = sessionToken.name;
            storeSessionTokenName(sessionToken.name);
          }
        }

        // get the latest userActivity data so that get reactivity on all this logic
        const userActivityData = await this.$store.dispatch('management/find', {
          // needs to be forced so that "this.userActivityExpiresAt" is updated and the watcher runs again (reactivity in the component)
          type: EXT.USER_ACTIVITY, id: this.sessionTokenName, opt: { force: true }
        });

        console.error('userActivityData on INIT', userActivityData);

        // is it really needed?
        storeUserActivity(userActivityData);

        const expiresAt = userActivityData?.status?.expiresAt;
        const currDate = Date.now();
        const endDate = new Date(expiresAt).getTime();

        // something is wrong with the expiration date... it isn't initialised yet '0001-01-01 00:00:00 +0000 UTC'
        // or just passed the 'now' date. We need to update/initialise the UserActivity resource
        if (currDate > endDate) {
          await updateUserActivityToken(this.$store, this.sessionTokenName );
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

        console.log(`****** checkInactivityTimer diff`, Math.floor((endTime - now) / 1000));

        if (now >= endTime) {
          console.error('OPENING MODAL');
          this.isOpen = true;
          this.startCountdown();
        } else {
          // When we have 10 seconds to go until we display the modal, check for activity on the backend flag
          // it may have come from another tab in the same browser
          if (now >= endTime - (10 * 1000) && !this.tenSecondToGoCheckRan) {
            this.tenSecondToGoCheckRan = true;

            console.error('TEN SECONDS TO GO!!!!');

            if (this.isUserActive) {
              console.error('USER IS ACTIVE, RESETTING USER ACTIVITY');
              this.resetUserActivity();
            } else {
              console.error('timer DOUBLE-CHECKING BACKEND INACTIVITY DATA');
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
    removeEventListeners() {
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
    stopInactivity() {
      this.tenSecondToGoCheckRan = false;
      this.isOpen = false;
      this.isUserActive = false;

      this.removeEventListeners();
      this.clearAllTimeouts();
    },
    resetInactivityDataAndTimers(userActivityData) {
      const data = parseTTLData(userActivityData);

      this.tenSecondToGoCheckRan = false;
      this.isOpen = false;
      this.isUserActive = false;

      this.courtesyTimer = data.courtesyTimer;
      this.courtesyCountdown = data.courtesyCountdown;
      this.showModalAfter = data.showModalAfter;
      this.sessionTokenName = data.sessionTokenName;
      this.expiresAt = data.expiresAt;

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
