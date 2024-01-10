<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import { BOTTOM, CENTER, LEFT, RIGHT } from '@shell/utils/position';

type Zone = null | typeof CENTER | typeof RIGHT | typeof BOTTOM | typeof LEFT;

export interface Drag {
  active: boolean;
  zone: Zone;
}

interface Data {
  drag: Drag;
}

export default defineComponent({
  data(): Data {
    return {
      drag: {
        active: false,
        zone:   CENTER,
      },
    };
  },

  computed: {

    ...mapState('wm', ['userPin']),

    pin: {
      get(): Zone {
        return this.userPin;
      },

      set(pin: Zone) {
        if (pin === CENTER) {
          return;
        }
        window.localStorage.setItem('wm-pin', pin as string);
        this.$store.commit('wm/setUserPin', pin);
      },
    },

  },

  methods: {

    onDragStart() {
      this.drag.active = true;
    },

    onDragOver(event: DragEvent, zone: Zone) {
      this.drag.zone = zone;
      if (zone !== CENTER) {
        event.preventDefault();
      }
    },

    onDragEnd() {
      this.pin = this.drag.zone;
      this.drag = {
        active: false,
        zone:   CENTER,
      };
    },

  }
});
</script>

<template>
  <div v-if="drag.active">
    <span
      v-if="drag.zone != pin"
      class="pin-effect-area"
      :class="drag.zone"
    />
    <span
      class="drag-area center"
      @dragover="onDragOver($event, 'center')"
    />
    <span
      class="drag-area right"
      @dragover="onDragOver($event, 'right')"
    />
    <span
      class="drag-area bottom"
      @dragover="onDragOver($event, 'bottom')"
    />
    <span
      class="drag-area left"
      @dragover="onDragOver($event, 'left')"
    />
  </div>
</template>

<style lang='scss' scoped>

  .pin-effect-area {
    position: absolute;
    z-index: 997;
    width: 0;
    height: 0;
    border-style: hidden;

    &.right {
      top: 55px;
      right: 0;
      width: 300px;
      transition: width .5s ease;
      height: 100%;
      background-image: linear-gradient(to right, var(--drag-over-outer-bg), var(--drag-over-inner-bg));
      border-left: 1px;
      border-style: hidden hidden hidden dashed;
    }

    &.left {
      top: 55px;
      left: 0;
      width: 300px;
      transition: width .5s ease;
      height: 100%;
      background-image: linear-gradient(to left, var(--drag-over-outer-bg), var(--drag-over-inner-bg));
      border-right: 1px;
      border-style: hidden dashed hidden hidden;
    }

    &.bottom {
      bottom: 0;
      height: 270px;
      transition: height .5s ease;
      width: 100%;
      background-image: linear-gradient(to top, var(--drag-over-inner-bg), var(--drag-over-outer-bg));
      border-top: 1px;
      border-style: dashed hidden hidden hidden;
    }

    &.center {
      width: 0;
      height: 0;
    }
  }

  // ToDo make height and width as input variable
  .drag-area {
    position: absolute;
    z-index: 999;
    width: 0;
    height: 0;
    opacity: 0;

    &.center {
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: 998;
    }

    &.right {
      top: 55px;
      right: 0;
      width: 300px;
      height: 100%;
    }

    &.left {
      top: 55px;
      left: 0;
      width: 300px;
      height: 100%;
    }

    &.bottom {
      bottom: 0;
      height: 270px;
      width: 100%;
    }
  }
</style>
