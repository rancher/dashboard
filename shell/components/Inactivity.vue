<script>
import ModalWithCard from '@shell/components/ModalWithCard';
import { Banner } from '@components/Banner';
import PercentageBar from '@shell/components/PercentageBar.vue';
import throttle from 'lodash/throttle';
import { checkIfUIInactivityIsEnabled } from '@shell/utils/inactivity';

let globalId;

export default {
  name:       'Inactivity',
  components: {
    ModalWithCard, Banner, PercentageBar
  },
  data() {
    return {
      enabled:             null,
      isOpen:              false,
      isInactive:          false,
      showModalAfter:      null,
      inactivityTimeoutId: null,
      courtesyTimer:       null,
      courtesyTimerId:     null,
      courtesyCountdown:   null,
      trackInactivity:     throttle(this._trackInactivity, 1000),
      id:                  null,
    };
  },
  async mounted() {
    const data2 = await this.$store.dispatch('management/request', { url: '/v1/management.cattle.io.features' });

    console.error('FEATURES', data2);

    // const data1 = await this.$store.dispatch('management/request', { url: '/v1/ext.cattle.io.useractivities' });
    // console.error('USER ACTIVITIES', data1);

    const UIInactivityIsEnabled = await checkIfUIInactivityIsEnabled(this.$store);

    if (UIInactivityIsEnabled.enabled) {
      console.error('UI INACTIVITY ENABLED!');
      this.enabled = UIInactivityIsEnabled.enabled;
      this.courtesyTimer = UIInactivityIsEnabled.courtesyTimer;
      this.courtesyCountdown = UIInactivityIsEnabled.courtesyCountdown;
      this.showModalAfter = UIInactivityIsEnabled.showModalAfter;

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
      if (this.isInactive || this.isOpen || !this.showModalAfter) {
        return;
      }

      this.clearAllTimeouts();
      const endTime = Date.now() + this.showModalAfter * 1000;

      this.id = endTime;
      globalId = endTime;

      const checkInactivityTimer = () => {
        const now = Date.now();

        console.warn(`****** checkInactivityTimer diff`, Math.floor((endTime - now) / 1000));

        if (this.id !== globalId) {
          return;
        }

        if (now >= endTime) {
          this.isOpen = true;
          this.startCountdown();
        } else {
          this.inactivityTimeoutId = setTimeout(checkInactivityTimer, 1000);
        }
      };

      checkInactivityTimer();
    },
    startCountdown() {
      const endTime = Date.now() + (this.courtesyCountdown * 1000);

      const checkCountdown = () => {
        const now = Date.now();

        if (now >= endTime) {
          this.isInactive = true;
          this.unsubscribe();
          this.clearAllTimeouts();
        } else {
          this.courtesyCountdown = Math.floor((endTime - now) / 1000);
          this.courtesyTimerId = setTimeout(checkCountdown, 1000);
        }
      };

      checkCountdown();
    },
    addIdleListeners() {
      document.addEventListener('mousemove', this.trackInactivity);
      document.addEventListener('mousedown', this.trackInactivity);
      document.addEventListener('keypress', this.trackInactivity);
      document.addEventListener('touchmove', this.trackInactivity);
      document.addEventListener('visibilitychange', this.trackInactivity);
    },
    removeEventListener() {
      document.removeEventListener('mousemove', this.trackInactivity);
      document.removeEventListener('mousedown', this.trackInactivity);
      document.removeEventListener('keypress', this.trackInactivity);
      document.removeEventListener('touchmove', this.trackInactivity);
      document.removeEventListener('visibilitychange', this.trackInactivity);
    },

    resume() {
      this.isInactive = false;
      this.isOpen = false;
      this.courtesyCountdown = this.courtesyTimer;
      this.clearAllTimeouts();
    },

    refresh() {
      window.location.reload();
    },

    unsubscribe() {
      console.debug('Unsubscribing from all websocket events'); // eslint-disable-line no-console
      this.$store.dispatch('unsubscribe');
    },
    clearAllTimeouts() {
      clearTimeout(this.inactivityTimeoutId);
      clearTimeout(this.courtesyTimerId);
    }

  },
  computed: {
    isInactiveTexts() {
      return this.isInactive ? {
        title:   this.t('inactivity.titleExpired'),
        banner:  this.t('inactivity.bannerExpired'),
        content: this.t('inactivity.contentExpired'),
      } : {
        title:   this.t('inactivity.title'),
        banner:  this.t('inactivity.banner'),
        content: this.t('inactivity.content'),
      };
    },
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
    @finish="resume"
  >
    <template #title>
      {{ isInactiveTexts.title }}
    </template>
    <span>{{ courtesyCountdown }}</span>

    <template #content>
      <Banner color="info">
        {{ isInactiveTexts.banner }}
      </Banner>

      <p>
        {{ isInactiveTexts.content }}
      </p>

      <PercentageBar
        v-if="!isInactive"
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
          v-if="!isInactive"
          class="btn role-tertiary bg-primary"
          @click.prevent="resume"
        >
          <t k="inactivity.cta" />
        </button>

        <button
          v-if="isInactive"
          class="btn role-tertiary bg-primary"
          @click.prevent="refresh"
        >
          <t k="inactivity.ctaExpired" />
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
