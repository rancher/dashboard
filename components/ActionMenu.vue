<script>
import { mapGetters } from 'vuex';
import $ from 'jquery';
import { AUTO, CENTER, fitOnScreen } from '@/utils/position';

const HIDDEN = 'hide';
const CALC = 'calculate';
const SHOW = 'show';

export default {
  data() {
    return {
      phase: HIDDEN,
      style: {}
    };
  },

  computed: {
    ...mapGetters({
      targetElem:  'selection/elem',
      targetEvent: 'selection/event',
      shouldShow:  'selection/showing',
      options:     'selection/options'
    }),

    showing() {
      return this.phase !== HIDDEN;
    },

  },

  watch: {
    shouldShow: {
      handler(show) {
        if ( show ) {
          this.phase = CALC;
          this.updateStyle();
          this.$nextTick(() => {
            if ( this.phase === CALC ) {
              this.phase = SHOW;
              this.updateStyle();
            }
          });
        } else {
          this.phase = HIDDEN;
        }
      },
    }
  },

  methods: {
    hide() {
      this.$store.commit('selection/hide');
    },

    updateStyle() {
      if ( this.phase === SHOW ) {
        const menu = $('.menu', this.$el)[0];
        const event = this.targetEvent;
        const elem = this.targetElem;

        this.style = fitOnScreen(menu, event || elem, {
          overlapX:  true,
          fudgeX:    elem ? 4 : 0,
          fudgeY:    elem ? 4 : 0,
          positionX: (elem ? AUTO : CENTER),
          positionY: AUTO,
        });

        this.style.visibility = 'visible';
      } else {
        this.style = {};
      }
    },

    execute(action, args) {
      this.$store.dispatch('selection/execute', { action, args });
      this.hide();
    }
  },
};
</script>

<template>
  <div v-if="showing">
    <div class="background" @click="hide" @contextmenu.prevent></div>
    <ul class="list-unstyled menu" :style="style">
      <li v-for="opt in options" :key="opt.action" :class="{divider: opt.divider}" @click="execute(opt)">
        <i v-if="opt.icon" :class="{icon: true, [opt.icon]: true}" />
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  @import "@/assets/styles/base/_variables.scss";
  @import "@/assets/styles/base/_functions.scss";
  @import "@/assets/styles/base/_mixins.scss";

  .root {
    position: absolute;
  }

  .menu {
    position: absolute;
    visibility: hidden;
    top: 0;
    left: 0;
    z-index: z-index('dropdownContent');

    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    border: 1px solid var(--dropdown-border);

    LI {
      padding: 10px;

      &.divider {
        padding: 0;
        border-bottom: 1px solid var(--dropdown-divider);
      }

      &:not(.divider):hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        cursor: pointer;
      }
    }
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    z-index: z-index('dropdownOverlay');
  }
</style>
