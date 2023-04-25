<template>
  <ModalWithCard
    ref="inactivityModal"
    name="inactivityModal"
    save-text="Continue"
    width="580px"
    @finish="resume"
  >
    <template #title>
      {{ t('inactivity.title') }}
    </template>

    <template #content>
      <Banner color="info">
        {{ isInactiveTexts.banner }}
      </Banner>

      <p>
        {{ isInactiveTexts.content }}
      </p>

      <PercentageBar
        v-if="!isInactive"
        style="margin-top: 20px;"
        :value="showPercentage"
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

<script>
import ModalWithCard from '@/shell/components/ModalWithCard';
import { Banner } from '@/pkg/rancher-components/src';
import PercentageBar from '@/shell/components/PercentageBar.vue';

export default {
  name:       'Inactivity',
  components: {
    ModalWithCard, Banner, PercentageBar
  },

  props: {
    showModalAfter: {
      type:    Number,
      default: 5, // in seconds
    },
    courtesyTimer: {
      type:    Number,
      default: 15, // in seconds
    },
    enabled: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      isOpen:              false,
      isInactive:          false,
      inactivityTimeoutId: null,
      courtesyCountdown:   this.courtesyTimer,
      courtesyTimerId:     null,
    };
  },
  mounted() {
    if (!this.enabled) {
      return;
    }

    this.addIdleListeners();
  },
  beforeDestroy() {
    this.removeIdleListeners();
  },
  methods: {
    trackInactivity() {
      if (this.isInactive || this.isOpen) {
        return;
      }

      this.clearAllTimeouts();

      this.inactivityTimeoutId = setTimeout(() => {
        this.isOpen = true;
        this.startCountdown();

        this.$modal.show('inactivityModal');
      }, this.showModalAfter * 1000);
    },
    startCountdown() {
      const endDate = new Date();

      endDate.setSeconds(endDate.getSeconds() + this.courtesyCountdown);

      const checkCountdown = () => {
        const now = new Date();

        if (now >= endDate) {
          this.isInactive = true;
          // Disable pulling based on timestamps and not just intervals.
          this.disablePulling();
        } else {
          this.courtesyCountdown--;
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
    removeIdleListeners() {
      document.removeEventListener('mousemove', this.trackInactivity);
      document.removeEventListener('mousedown', this.trackInactivity);
      document.removeEventListener('keypress', this.trackInactivity);
      document.removeEventListener('touchmove', this.trackInactivity);
      document.addEventListener('visibilitychange', this.trackInactivity);
    },

    resume() {
      this.isInactive = false;
      this.courtesyCountdown = this.courtesyTimer;
      this.clearAllTimeouts();
      this.trackInactivity();

      this.isOpen = false;
      this.$modal.hide('inactivityModal');
    },

    refresh() {
      window.location.reload();
    },

    disablePulling() {
      this.$store.dispatch('rancher/unsubscribe');
      this.$store.dispatch('management/unsubscribe');
      this.$store.dispatch('cluster/unsubscribe');

      this.clearAllTimeouts();
    },
    clearAllTimeouts() {
      clearTimeout(this.inactivityTimeoutId);
      clearTimeout(this.courtesyTimerId);
    }

  },
  computed: {
    isInactiveTexts() {
      return this.isInactive ? {
        banner:  this.t('inactivity.bannerExpired'),
        content: this.t('inactivity.contentExpired'),
      } : {
        banner:  this.t('inactivity.banner'),
        content: this.t('inactivity.content'),
      };
    },
    showPercentage() {
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

<style lang="scss" scoped>
.card-actions {
    display: flex;
    width: 100%;
    justify-content: flex-end;
}
</style>
