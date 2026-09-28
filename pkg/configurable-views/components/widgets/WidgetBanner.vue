<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import BannerGraphic from '@shell/components/BannerGraphic.vue';
import { getVendor } from '@shell/config/private-label';
import type { WidgetSpec } from '../../templating/types';

// BANNER — by default, exactly the stock Home's banner (BannerGraphic: the brand picture and the
// welcome line). Give it an `image` for your own background, and a `subtitle` for a second line.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();

const bgStyle = computed(() => (props.widget.image ? { backgroundImage: `url('${ props.widget.image }')` } : {}));

// With no title of its own the banner falls back to Rancher's own welcome line — the same string
// the stock Home shows, vendor and all — so dropping a banner on the grid gives you the real thing
// rather than an untitled picture.
const title = computed(() => props.widget.title || store.getters['i18n/t']('landing.welcomeToRancher', { vendor: getVendor() }));
</script>

<template>
  <div
    v-if="widget.image"
    class="wb"
    :style="bgStyle"
  >
    <div class="wb__text">
      <h1 class="wb__title">
        {{ title }}
      </h1>
      <p
        v-if="widget.subtitle"
        class="wb__subtitle"
      >
        {{ widget.subtitle }}
      </p>
    </div>
  </div>
  <BannerGraphic
    v-else
    :title="title"
  />
</template>

<style lang="scss" scoped>
.wb {
  align-items:         center;
  background-position: center;
  background-size:     cover;
  border-radius:       var(--border-radius);
  color:               white;
  display:             flex;
  min-height:          160px;
  overflow:            hidden;
  padding:             24px 28px;
  position:            relative;

  // Legibility scrim so the title reads over any image.
  &::before {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.1));
    content:    '';
    inset:      0;
    position:   absolute;
  }

  &__text {
    position: relative;
    z-index:  1;
  }

  &__title {
    margin:      0;
    font-size:   28px;
    line-height: 1.1;
  }

  &__subtitle {
    margin:    8px 0 0;
    font-size: 15px;
    opacity:   0.9;
  }
}
</style>
