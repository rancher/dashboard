<script>
import { mapState } from 'vuex';

export default {
  data() {
    return { autoRemoveTimer: null };
  },

  computed: {
    ...mapState('growl', ['stack']),

    shouldRun() {
      return this.stack.length && this.stack.find(x => x.timeout > 0);
    }
  },

  watch: {
    stack() {
      if ( this.shouldRun ) {
        this.startAutoRemove();
      } else {
        this.stopAutoRemove();
      }
    },
  },

  methods: {
    close(growl) {
      this.$store.dispatch('growl/remove', growl.id);
    },

    closeAll() {
      this.$store.dispatch('growl/clear');
    },

    closeExpired() {
      const now = new Date().getTime();

      for ( const growl of this.stack ) {
        if ( !growl.timeout ) {
          continue;
        }

        if ( growl.started + growl.timeout < now ) {
          this.close(growl);
        }
      }
    },

    startAutoRemove() {
      if ( this.autoRemoveTimer || !this.shouldRun ) {
        return false;
      }

      this.autoRemoveTimer = setInterval(() => {
        this.closeExpired();
      }, 1000);

      return true;
    },

    stopAutoRemove() {
      if ( this.autoRemoveTimer ) {
        clearInterval(this.autoRemoveTimer);
        this.autoRemoveTimer = null;
      }
    },

    mouseEnter() {
      this.stopAutoRemove();
    },

    mouseLeave() {
      this.startAutoRemove();
    },
  }
};

</script>

<template>
  <div
    class="growl-container"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
  >
    <div class="growl-list">
      <div
        v-for="growl in stack"
        :key="growl.id"
        :class="{'growl': true, ['bg-'+growl.color]: true}"
      >
        <div
          class="growl-message"
          :class="{'growl-center': !growl.message}"
        >
          <div class="icon-container">
            <i :class="{icon: true, ['icon-'+growl.icon]: true}" />
          </div>
          <div class="growl-text">
            <div>{{ growl.title }}</div>
            <p v-if="growl.message">
              {{ growl.message }}
            </p>
          </div>
          <i
            class="close hand icon icon-close"
            @click="close(growl)"
          />
        </div>
      </div>
    </div>
    <div
      v-if="stack.length > 1"
      class="text-right mr-10 mt-10"
    >
      <button
        type="button"
        class="btn btn-sm role-primary"
        @click="closeAll"
      >
        {{ t('growl.clearAll') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .growl-container {
    z-index: 1000;
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      width: 350px;
    }
  }

  .growl-list {
    max-height: calc(100vh - 50px);
    overflow: hidden;
  }

  .growl {
    border-radius: var(--border-radius);
    margin: 10px;
    position: relative;
    word-break: break-all;

    .close {
      padding: 5px;
      font-size: 24px;
    }

    .icon-container {
      align-self: center;
    }

    .growl-message {
      display: flex;

      &.growl-center {
        align-items: center;
      }
    }

    .growl-text {
      flex-basis: 90%;
      padding: 10px 10px 10px 0;
      word-break: break-word;
      white-space: normal;

      > div {
        font-size: 16px;
      }

      > P {
        margin-top: 5px;
      }
    }

    .icon-container {
      flex-basis: 10%;
      padding: 10px;
      i {
        font-size: 24px;
      }
    }
  }
</style>
